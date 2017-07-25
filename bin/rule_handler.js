#!/usr/bin/env node
const winston = require('winston');
const async = require('async');
const request = require('request');
const fs = require('fs');

const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// TODOs
//
// * Look for finished tasks and archive data
// * Look for failed tasks and report to the user / disable rule?
//

db.init(function(err) {
    if(err) throw err;

    run();
});

function run() {
	db.Rules.find().exec((err, rules)=>{
		if(err) throw err;

        async.eachSeries(rules, (rule, next_rule)=>{
            handle_rule(rule, next_rule);
        }, err=>{
            if(err) throw err;
            logger.debug("done with all rules - sleeping for a while");
            //db.disconnect();
            setTimeout(run, 1000*60);
        });
	});
}

function handle_rule(rule, cb) {

    var jwt = null;
    var app = null;
    var subjects = null;
    var running = null; //number of currently running tasks for this rule

    logger.info("handling rule", JSON.stringify(rule, null, 4));

    /* 
    //DEBUG----------------------------------------------------------------------------------------------------------------------------
    //this lets me rerun rule that I just handled
    process_date = new Date("2017-05-01");
    //DEBUG----------------------------------------------------------------------------------------------------------------------------
    */

    //prepare for stage / app / archive
    async.series([
            
        //issue user jwt
        next=>{
            request.get({
                url: config.auth.api+"/jwt/"+rule.user_id, json: true,
                headers: { authorization: "Bearer "+config.auth.jwt },
            }, (err, res, body)=>{
                if(err) return next(err);
                if(res.statusCode != 200) return cb("couldn't obtain user jwt code:"+res.statusCode);
                jwt = body.jwt;
                next();
            });
        },

        /*
        //update process date
        next=>{
            //update process_date so that we don't process this again (even if rest of processing fails)
            rule.process_date = new Date();
            rule.save(next);
        },
        */

        //get number of tasks currently running for this rule
        next=>{
            request.get({
                url: config.wf.api+"/task", json: true,
                headers: { authorization: "Bearer "+jwt },
                qs: {
                    find: JSON.stringify({
                        "config._prov.rule": rule._id,
                        status: {$in : ["running", "requested"]},
                    }),
                    limit: 1, //I just need count but can't be 0
                },
            }, (err, res, body)=>{
                if(err) return next(err);
                running = body.count;
                logger.debug("running tasks", running);
                next();
            });
        },

        //first load the app we might be submitting
        next=>{
            db.Apps.findById(rule.app)
			.populate('outputs.datatype')
            .lean() // so that I can set meta?
			.exec((err, _app)=>{
                if(err) return next(err);
                console.log(_app.name);
                console.dir(_app.config);  
                app = _app;
                //console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
                //console.log(JSON.stringify(app.outputs, null, 4));
                //console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
                next();
            });
        },

        //enumerate all subjects under rule's project
        next=>{
            logger.debug("enum subjects");
            db.Datasets.find({
                project: rule.input_project,
            })
            .distinct("meta.subject", (err, _subjects)=>{
                if(err) return next(err);
                subjects = _subjects;        
                next();
            });
        },

        //handle all subjects
        next=>{
            async.eachSeries(subjects, handle_subject, next);
        },
    ], err=>{
        if(err) return cb(err);
        logger.debug("done processing all rules");
        cb();
    });

    function handle_subject(subject, next_subject) {
        if(running > config.max_task_per_rule) {
            logger.info("reached max running task.. skipping the rest of subjects", subject, running);
            return next_subject();
        }

        ////////////////////////////////////////////////////////////
        //debug (only handle subjects that starts with 10)
        if(subject.toString().search(/^10/)) {
            logger.debug("skipping subjects that doesn't start with 10..", subject);
            return next_subject();
        }

        logger.debug("handling subject", subject);//, running);

        //debug
        //fs.writeFileSync("app."+new Date().getTime(), JSON.stringify(app, null, 4));

        //find all outputs from the app with tags specified in rule.output_tags[output_id]
        var missing = false;
        async.eachSeries(app.outputs, (output, next_output)=>{
            var query = {
                project: rule.output_project,
                removed: false,
                datatype: output.datatype._id,
                "meta.subject": subject,
            }
            if(output.datatype_tags.length > 0) query.datatype_tags = { $all: output.datatype_tags };
            if(rule.output_tags[output.id]) query.tags = { $all: rule.output_tags[output.id] }; //TODO - test me
            db.Datasets.findOne(query)
            .populate('datatype')
            //.sort('-create_date')
            //.lean()
            .exec((err, dataset)=>{
                if(err) return next_output(err);
                if(!dataset) {
                    //logger.debug("found missing datasest", JSON.stringify(query, null, 4));
                    missing = true;
                }
                next_output();
            });
        }, err=>{
            if(err) return next_subject(err);
            if(!missing) {
                logger.info("all datasets accounted for.. skipping to next subject");
                return next_subject();
            }

            //output datasets missing.. see if we can find all inputs
            find_inputs(subject, (err, input_missing, inputs)=>{
                if(err) return next_subject(err);
                if(input_missing) {
                    logger.info("outputs missing, but so are inputs.. skipping");
                    next_subject();
                } else {
                    logger.info("found inputs.. submitting task");
                    
                    //see if we've already submitted task for this output
                    get_submitted_task(subject, (err, submitted)=>{
                        if(err) return next_subject(err);
                        if(submitted) {
                            logger.debug("task already submitted");
                            return next_subject();
                        }
                        running++;
                        submit_tasks(subject, inputs, next_subject);
                    });
                }
            });
        });
    }

    function get_submitted_task(subject, next) {
        request.get({
            url: config.wf.api+"/task", json: true,
            headers: { authorization: "Bearer "+jwt },
            qs: {
                find: JSON.stringify({
                    "config._prov.rule": rule._id,
                    "config._prov.subject": subject,
                    status: { $ne: "removed" },
                }),
            },
        }, (err, res, body)=>{
            if(err) return next(err);
            return next(null, body.tasks[0]);
        });
    }

    function find_inputs(subject, next) {
        var missing = false;
        var inputs = {};
        async.eachSeries(app.inputs, (input, next_input)=>{
            //logger.debug("looking for input ", JSON.stringify(input, null, 4));
            var query = {
                project: rule.input_project,
                removed: false,
                datatype: input.datatype,
                "meta.subject": subject,
            }
            if(input.datatype_tags.length > 0) query.datatype_tags = { $all: input.datatype_tags };
            //logger.debug(JSON.stringify(query, null, 4));
            db.Datasets.findOne(query)
            .populate('datatype')
            .sort('-create_date') //find the latest one
            .lean()
            .exec((err, dataset)=>{
                if(err) return next_input(err);
                if(!dataset) {
                    //logger.debug("input missing", input.id);
                    missing = true;
                    return next_input();
                }
                inputs[input.id] = dataset;
                
                //load status of task that produced this dataset
                if(dataset.prov && dataset.prov.task_id) {
                    //logger.debug("loading task status", dataset.prov.task_id);
                    request.get({
                        url: config.wf.api+"/task", json: true,
                        headers: { authorization: "Bearer "+jwt },
                        qs: {
                            find: JSON.stringify({_id: dataset.prov.task_id}),
                        },
                    }, (err, res, body)=>{
                        if(err) return next_input(err);
                        dataset.prov._task = body.tasks[0];
                        next_input();
                    });
                } else {
                    //no prov.. probably uploaded / imported
                    next_input();
                }
            });
        }, err=>{
            if(err) return next(err);
            else next(null, missing, inputs);
        });
    }

    function submit_tasks(subject, inputs, cb) {
        var instance = null;
        var task_stage = null;
        var task_app = null;
        var task_out = null;
		var meta = {}; //metadata to store for archived dataset

        //console.log(JSON.stringify(inputs, null, 4));

        var instance_name = "brainlife.rule."+rule._id+"."+subject;

        //prepare for stage / app / archive
        async.series([

            //look for instance that we can use
            next=>{
                request.get({
                    url: config.wf.api+"/instance", json: true,
                    headers: { authorization: "Bearer "+jwt },
                    qs: {
                        find: JSON.stringify({
                            name: instance_name,
                            //status: {$ne: "removed"},
                            "config.removing": {$exists: false},
                        }),
                    },
                }, (err, res, body)=>{
                    if(err) return next(err);
                    instance = body.instances[0];
                    if(instance) {
                        logger.debug("using instance id:", instance._id);
                        //logger.debug(JSON.stringify(instance, null, 4));
                    }
                    next();
                });
            },

            //if we don't have the instance, create one
            next=>{
                if(instance) return next();
                logger.debug("creating a new instance");
                request.post({
                    url: config.wf.api+'/instance', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body: {
                        name: instance_name,
                        desc: "process for "+instance_name,
                        
                        //TODO let's show under process page so I can debug
                        config: {
                            brainlife: true,
                        }
                    },
                }, (err, res, body)=>{
                    instance = body;
                    next(err);
                });
            },

            //submit input staging task
            next=>{
                //process UI prov..
                var datasets = {};
                for(var input_id in inputs) {
                    var input = inputs[input_id];
                    datasets[input._id] = Object.assign({}, input);
                    datasets[input._id].datatype = datasets[input._id].datatype._id; //unpopulate datatype to keep it clean
                }

                var body = {
                    instance_id: instance._id,
                    name: "brainlife.stage_input",
                    desc: "staging input for rule:"+rule._id+" subject:"+subject,
                    service: "soichih/sca-product-raw",

                    config: {
                        symlink: [], //for datasets that we have tasks for
                        download: [], //for datasets that produced task no longer exists
                        datasets,
                    },
                    deps: [],
                }

                for(var input_id in inputs) {
                    var input = inputs[input_id];
                    if(input.prov && input.prov._task && input.prov._task.status == 'finished') {
                        //we still have the datasets staged.. just use that
                        body.config.symlink.push({ 
                            src: "../../"+task.instance_id+"/"+task._id+"/"+input.prov.dirname, //TODO - not sure if this is the right path?
                            dest: input_id 
                        }); 
                        body.deps.push(task._id);
                    } else {
                        body.config.download.push({
                            url: config.warehouse.api+"/dataset/download/"+input._id+"?at="+jwt,
                            untar: "auto",
                            dir: input_id,
                        });
                    }
                }

                request.post({
                    url: config.wf.api+'/task', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body,
                }, (err, res, _body)=>{
                    task_stage = _body.task;
                    logger.debug("submitted staging task");//, task_stage);
                    console.log(JSON.stringify(_body, null, 4));
                    next(err);
                });
            },

            next=>{
                //aggregate metadata (TODO - I really need just subject?)
				for(var input_id in inputs) {
					var input = inputs[input_id];
					for(var k in input.meta) {
						meta[k] = input.meta[k];
					}
				}
                next();
            },

            //submit the app task!
            next=>{
                var _config = Object.assign(rule.config, resolve_config(app.config, inputs, task_stage));

                //set some process ui _prov
                _config._prov = {
                    app: app._id,
                    rule: rule._id,
                    subject: subject,
                    inputs: {},
                }
                for(var input_id in inputs) {
                    var input = inputs[input_id];
                    _config._prov.inputs[input_id] = input._id;
                }
                
                var body = {
                    instance_id: instance._id,
                    name: "brainlife.process",
                    desc: "running applicaiton "+app.name+" for subject:"+rule._id+" subject:"+subject,
                    service: app.github,
                    service_branch: app.github_branch,
                    retry: app.retry,

                    config: _config,
                    deps: [ task_stage._id ], 
                }
                request.post({
                    url: config.wf.api+'/task', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body,
                }, (err, res, _body)=>{
                    task_app = _body.task;
                    logger.debug("submitted app task", task_app);
                    console.log(JSON.stringify(_body, null, 4));
                    next(err);
                });
            },

            //submit output organize task
            next=>{
                var symlink = [];
                var output_datasets = {}; //for prov
                console.log("---------------------------------------------------------------------");
                console.log(JSON.stringify(app.outputs, null, 4));
                console.log("---------------------------------------------------------------------");
				app.outputs.forEach(output=>{
					if(output.files) {
						//has output file mapping.. organize symlink file/dir
                        for(var file_id in output.files) {
                            //find datatype file id in datatype definition
                            output.datatype.files.forEach(datatype_file=>{
                                if(datatype_file.id == file_id) {
                                    var name = datatype_file.filename||datatype_file.dirname;
                                    symlink.push({ 
                                        "src": "../"+task_app._id+"/"+output.files[file_id], 
                                        "dest": output.id+"/"+name 
                                    });
                                }
                            });
                        }
					} else {
						//copy everything under taskdir
						symlink.push({"src": "../"+task_app._id, "dest": output.id});
					}

					output_datasets[output.id] = Object.assign({}, output, {
                        meta,
                        datatype: output.datatype._id, //override to unpopulate
                        
                        //if this is set, handle_task will auto-archive output datasets
                        archive: {
                            project: rule.output_project,  
                            tags: rule.output_tags[output.id], 
                        }
                    }); 
                    //console.log(JSON.stringify(output_datasets, null, 4));
				});

                //for process ui _prov
                var _prov = {
                    app: app._id,
                    output_datasets,
                };
                    
                //submit task
                request.post({
                    url: config.wf.api+'/task', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body: {
                        instance_id: instance._id,
                        name: "brainlife.stage_output",
                        desc: "staging output for subject:"+rule._id+" subject:"+subject,
                        service: "soichih/sca-product-raw",
                        config: { symlink, _prov },
                        deps: [ task_app._id ],
                    },
                }, (err, res, _body)=>{
                    task_out = _body.task;
                    logger.debug("submitted out task", task_out);
                    console.log(JSON.stringify(_body, null, 4));
                    next(err);
                });
            },
        ], cb);
    }
}

function resolve_config(config, inputs, task_stage) {
    function walk(node, out) {
        for(var k in node) {
            var v = node[k];
            if(v.type === undefined) {
                //must be grouping object.. traverse to child 
                console.log("groupingn ", k);
                out[k] = {};
                walk(v, out[k]);
                continue;
            }
            switch(v.type) {
            case "input":
                var dataset = inputs[v.input_id];
                //find file
                dataset.datatype.files.forEach(file=>{
                    if(file.id == v.file_id) {
                        out[k] = "../"+task_stage._id+"/"+v.input_id+"/"+(file.filename||file.dirname);
                    }
                });
                break;
            case "integer":
            case "string":
                //scalar configs are handled by the user
            }
        }
        return out;
    }
    return walk(config, {});
}

