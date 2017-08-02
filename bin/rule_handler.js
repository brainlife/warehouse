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
	db.Rules.find({
        active: true,
        removed: false,
    })
    .populate('app output_project input_project')
    .exec((err, rules)=>{
		if(err) throw err;
        async.eachSeries(rules, (rule, next_rule)=>{
            handle_rule(rule, next_rule);
        }, err=>{
            if(err) logger.error(err);
            logger.debug("done with all rules - sleeping for a while");
            setTimeout(run, 1000*60);
        });
	});
}

function handle_rule(rule, cb) {

    var jwt = null;
    var subjects = null;
    var running = null; //number of currently running tasks for this rule

    logger.info("handling rule", JSON.stringify(rule, null, 4));

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

        //get number of tasks currently running for this rule
        next=>{
            request.get({
                url: config.wf.api+"/task", json: true,
                headers: { authorization: "Bearer "+jwt },
                qs: {
                    find: JSON.stringify({
                        "config._rule.id": rule._id,
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

        //enumerate all subjects under rule's project
        next=>{
            logger.debug("enum subjects");
            db.Datasets.find({
                project: rule.input_project._id,
                storage: { $exists: true },
                removed: false,
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
        if(running >= config.max_task_per_rule) {
            logger.info("reached max running task.. skipping the rest of subjects", subject, running);
            return next_subject();
        }

        if(rule.subject_match && !subject.match(rule.subject_match)) {
            logger.info("subject", subject, "doesn't match", rule.subject_match);
            return next_subject();
        }

        logger.debug("handling subject", subject, running);

        //find all outputs from the app with tags specified in rule.output_tags[output_id]
        var missing = false;
        async.eachSeries(rule.app.outputs, (output, next_output)=>{
            var query = {
                project: rule.output_project._id,
                datatype: output.datatype._id,
                "meta.subject": subject,
                storage: { $exists: true },
                removed: false,
            }
            if(output.datatype_tags.length > 0) query.datatype_tags = { $all: output.datatype_tags };
            if(rule.output_tags[output.id]) query.tags = { $all: rule.output_tags[output.id] }; //TODO - test me
            db.Datasets.findOne(query)
            .populate('datatype')
            .exec((err, dataset)=>{
                if(err) return next_output(err);
                if(!dataset) {
                    //logger.debug("found missing output datasest ", JSON.stringify(query, null, 4));
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
                    logger.info("found all inputs.. submitting task");
                    
                    //see if we've already submitted task for this output
                    get_submitted_task(subject, (err, submitted)=>{
                        if(err) return next_subject(err);
                        if(submitted) {
                            logger.debug("task already submitted:",submitted._id, submitted.status);
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
                    "config._rule.id": rule._id,
                    "config._rule.subject": subject,
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
        async.eachSeries(rule.app.inputs, (input, next_input)=>{
            //logger.debug("looking for input ", JSON.stringify(input, null, 4));
            var query = {
                project: rule.input_project._id,
                datatype: input.datatype,
                "meta.subject": subject,
                storage: { $exists: true },
                removed: false,
            }

            //allow user to override which project to load input datasets from
            if(rule.input_project_override && rule.input_project_override[input.id]) {
                query.project = rule.input_project_override[input.id];
            } 

            db.Datasets.findOne(query)
            .populate('datatype')
            .sort('-create_date') //find the latest one
            .lean()
            .exec((err, dataset)=>{
                if(err) return next_input(err);

                if(!dataset) {
                    logger.debug("input missing", input.id, JSON.stringify(query, null, 4));
                    missing = true;
                    return next_input();
                }
                
                //apply tags
                var match = true;
                input.datatype_tags.forEach(tag=>{
                    if(tag[0] == "!") {
                        //negative: make sure tag doesn't exist
                        if(~dataset.datatype_tags.indexOf(tag.substring(1))) match = false;
                    } else {
                        //positive: make sure tag exists
                        if(!~dataset.datatype_tags.indexOf(tag)) match = false;
                    }
                });
                if(!match) {
                    logger.debug("tag mismatch", input.id);
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
                        dataset.prov._task = body.tasks[0]; //only used while we process this dataset
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
        var next_tid = null;

        var _app_inputs = []; 
        var deps = [];

        var instance_name = "brainlife.rule project:"+rule.output_project._id+" subject:"+subject;
        var instance_desc = "rule:"+rule.name+" for project:"+rule.output_project.name+" subject:"+subject;

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
                            "config.removing": {$exists: false},
                            "config.status": {$ne: "removed"},
                        }),
                    },
                }, (err, res, body)=>{
                    if(err) return next(err);
                    instance = body.instances[0];
                    if(instance) {
                        logger.debug("using instance id:", instance._id);
                        logger.debug(JSON.stringify(instance, null, 4));
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
                        desc: instance_desc,
                        config: {
                            brainlife: true,
                            type: "v2",
                        }
                    },
                }, (err, res, body)=>{
                    instance = body;
                    next(err);
                });
            },
            
            //find next tid by counting number of tasks (including removed)
            next=>{
                request.get({
                    url: config.wf.api+"/task", json: true,
                    headers: { authorization: "Bearer "+jwt },
                    qs: {
                        find: JSON.stringify({
                            "instance_id": instance._id,
                        }),
                        limit: 1, //I am interested in just count
                    },
                }, (err, res, body)=>{
                    if(err) return next(err);
                    next_tid = body.count;
                    next();
                });
            },

            //submit input staging task for datasets that aren't staged yet
            next=>{
                var did = next_tid*10;
                var _outputs = [];
                var downloads = [];
                for(var input_id in inputs) {
                    var input = inputs[input_id];
                    input.input_id = input_id;
                    if(input.prov && input.prov._task && input.prov._task.status == 'finished'
                        //I should be able to use task from other instance if I update process_input_config
                        //but for now, let's just use dataset from the same process
                        //so that UI will make more sense (won't show data from other instance)
                        && input.prov._task.instance_id == instance._id 
                    ) {
                        //we still have the datasets staged (most likely from this process) use it..
                        deps.push(input.prov._task._id);
                        _app_inputs.push(Object.assign({}, input, {
                            datatype: input.datatype._id, //unpopulate datatype to keep it clean
                            did: did++,
                            //dataset_id: input._id,
                            task_id: input.prov._task._id,
                            prov: null, //remove dataset prov
                        }));
                    } else {
                        //we don't have it.. need to stage from warehouse
                        downloads.push({
                            url: config.warehouse.api+"/dataset/download/"+input._id+"?at="+jwt,
                            untar: "auto",
                            dir: input._id,
                        });
                        var output = Object.assign({}, input, {
                            datatype: input.datatype._id, //unpopulate datatype to keep it clean
                            did: did++,
                            subdir: input._id,
                            prov: null, //remove dataset prov
                        });
                        _outputs.push(output);
                        _app_inputs.push(output);
                    }
                }

                //nothing to download, then proceed to submitting the app
                if(downloads.length == 0) {
                    next();
                }

                //need to submit download task first.
                request.post({
                    url: config.wf.api+'/task', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body: {
                        instance_id: instance._id,
                        name: "Staging Input",
                        //desc: "staging input for rule:"+rule._id+" subject:"+subject,
                        service: "soichih/sca-product-raw",

                        config: {
                            download: downloads,
                            _outputs,
                            _tid: next_tid++,
                        },
                        deps: [],
                    },
                }, (err, res, _body)=>{
                    if(err) return next(err);
                    task_stage = _body.task;

                    //reset task_id 
                    _app_inputs.forEach(input=>{
                        if(!input.task_id) input.task_id = task_stage._id;
                    });
                    deps.push(task_stage._id);

                    logger.debug("submitted staging task");//, task_stage);
                    console.log(JSON.stringify(_body, null, 4));
                    next();
                });
            },

            //aggregate metadata (TODO - I really need just subject?)
            next=>{
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
                var did = next_tid*10;

                //console.log("dumping _app_inputs");
                //console.dir(_app_inputs);

                var _config = Object.assign(
                    rule.config, 
                    process_input_config(rule.app.config, inputs, _app_inputs, task_stage), 
                    {
                        _app: rule.app._id,
                        _rule: {
                            id: rule._id,
                            subject,
                        },
                        _inputs: _app_inputs,
                        _outputs: [],
                        _tid: next_tid++,
                    }
                );

				rule.app.outputs.forEach(output=>{
                    _config._outputs.push({
                        id: output.id,
                        did: did++,
                        datatype: output.datatype,
                        datatype_tags: output.datatype_tags,
                        desc: output.desc,
                        meta: meta,
                        archive: {
                            project: rule.output_project._id,  
                            desc: "dataset archived by rule handler",
                            tags: rule.output_tags[output.id],  //??
                        }
                    });
                });

                request.post({
                    url: config.wf.api+'/task', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body: {
                        instance_id: instance._id,
                        name: "brainlife.process",
                        desc: "running application:"+rule.app.name+" for rule:"+rule.name+" for subject:"+subject,
                        service: rule.app.github,
                        service_branch: rule.app.github_branch,
                        retry: rule.app.retry,

                        config: _config,
                        deps,
                    }
                }, (err, res, _body)=>{
                    task_app = _body.task;
                    logger.debug("submitted app task", task_app);
                    console.log(JSON.stringify(_body, null, 4));

                    next(err);
                });
            },

            /*
            //submit output organize task
            next=>{
                var symlink = [];
                var _outputs = [];
                //console.log("---------------------------------------------------------------------");
                //console.log(JSON.stringify(app.outputs, null, 4));
                //console.log("---------------------------------------------------------------------");
				rule.app.outputs.forEach(output=>{
					if(output.files) {
						//app has output file mapping.. organize symlink file/dir
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

					_outputs.push(Object.assign({}, output, {
                        meta,
                        datatype: output.datatype._id, //override to unpopulate
                        
                        //if this is set, handle_task will auto-archive output datasets
                        archive: {
                            project: rule.output_project._id,  
                            tags: rule.output_tags[output.id],  //??
                        }
                    })); 
				});

                //submit task
                request.post({
                    url: config.wf.api+'/task', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body: {
                        instance_id: instance._id,
                        name: "brainlife.stage_output",
                        desc: "staging output for rule:"+rule._id+" subject:"+subject,
                        service: "soichih/sca-product-raw",
                        config: { symlink, _app: rule.app._id, _outputs},
                        deps: [ task_app._id ],
                    },
                }, (err, res, _body)=>{
                    task_out = _body.task;
                    logger.debug("submitted out task", task_out);
                    console.log(JSON.stringify(_body, null, 4));

                    //debug..terminate after one
                    //process.exit(1);

                    next(err);
                });
            },
            */

        ], cb);
    }
}

function process_input_config(config, inputs, datasets, task_stage) {
    function walk(node, out) {
        for(var k in node) {
            var v = node[k];
            if(v.type === undefined) {
                //must be grouping object.. traverse to child 
                //console.log("groupingn ", k);
                out[k] = {};
                walk(v, out[k]);
                continue;
            }
            switch(v.type) {
            case "input":
                var input = inputs[v.input_id];
                var dataset = datasets.find(d=>d.input_id == v.input_id);

                var base = "../"+dataset.task_id;
                if(dataset.subdir) base+="/"+dataset.subdir;

                //console.log("looking for ",v.input_id, dataset);
                //find file specified in datatype..
                var file = input.datatype.files.find(file=>file.id == v.file_id);
                out[k] = base+"/"+(file.filename||file.dirname);
                //but override it if filemaping from the input dataset is specified.
                if(dataset.files && dataset.files[node.input_id]) {
                    out[k] = base+"/"+dataset.files[node.file_id];
                }
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

