#!/usr/bin/env node

const winston = require('winston');
const async = require('async');
const request = require('request');
const fs = require('fs');
const redis = require('redis');
const jsonwebtoken = require('jsonwebtoken');

const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');

let rcon = null;
db.init(function(err) {
    if(err) throw err;
    rcon = redis.createClient(config.redis.port, config.redis.server);
    rcon.on('error', err=>{throw err});
    rcon.on('ready', ()=>{
        logger.info("connected to redis");
        setInterval(health_check, 1000*60*2); //start checking health 
        run();
    });
});

let _counts = {
    rules: 0,
}

function health_check() {
    let report = {
        status: "ok",
        messages: [],
        counts: _counts,
        date: new Date(),
        maxage: 1000*60*4,
    }

    if(_counts.rules == 0) {
        report.status = "failed";
        report.messages.push("no rules handled");
    }

    rcon.set("health.warehouse.rule."+(process.env.NODE_APP_INSTANCE||'0'), JSON.stringify(report));

    //reset counter
    _counts.rules = 0;
}


//dedupe an array
//https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
function uniq(a) {
    let seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}

function run() {
	db.Rules.find({
        active: true,
        removed: false,
    })
    .populate('app project')
    //.sort('-create_date')  //I have to go through all rules for each loops anyway..
    .exec((err, rules)=>{
		if(err) throw err;
        async.eachSeries(rules, handle_rule, err=>{
            if(err) logger.error(err);
            logger.debug("done with all rules - sleeping for a while");
            setTimeout(run, 1000*3);
        });
	});
}

function handle_rule(rule, cb) {
    _counts.rules++;

    let jwt = null;
    let subjects = null;
    let running = null; //number of currently running tasks for this rule
    let rule_tasks = null; //tasks submitted for this rule (grouped by subject name)
    let rlogger = logger;

    if(!rule.input_tags) rule.input_tags = {};
    if(!rule.output_tags) rule.output_tags = {};
    
    //prepare for stage / app / archive
    async.series([
        
        //validate
        next=>{
            if(!rule.project) return next("project not specified");
            if(!rule.app) return next("app not specified");
            next();
        },
        
        //find the latest update_date of all input datasets
        next=>{
            //if not handled yet, go ahead and handle it
            if(!rule.handle_date) return next();

            //if updated, go ahead and handle it
            if(rule.update_date > rule.handle_date) return next();

            //see if any datasets that this rule uses as input got updates recently
            let projects = [ rule.project._id ];
            if(rule.input_project_override) {
                for(var input_id in rule.input_project_override) {
                    projects.push(rule.input_project_override[input_id]); 
                }
            }                
            db.Datasets.findOne({
                project: { $in: projects }, 
                update_date: { $exists: true } , 
                removed: false, //don't care about removed ones
            })
            .sort("-update_date") //give me the max
            .select("update_date")
            .exec((err, dataset)=>{
                if(err) return next(err);
                if(!dataset) return cb(); //no dataset, nothing to do
                if(rule.handle_date > dataset.update_date) return cb(); //no new dataset to handle

                //has new input dataset to handle.. proceed
                //logger.debug("processinng", rule.handle_date, dataset.update_date, dataset._id.toString());
                next();
            });
        },
            
        //update handle_date
        next=>{
            logger.info("handling project:", rule.project.name, "rule:", rule.name, rule._id.toString());
            rule.handle_date = new Date();
            rule.save(next);
        },

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

        //initialize rlogger
        next=>{
            if(config.warehouse.rule_logdir) {
                let logpath = config.warehouse.rule_logdir+"/"+rule._id.toString()+".log";
                try {
                    fs.truncateSync(logpath);
                } catch (err) {
                    logger.info("failed to truncate.. maybe first time", logpath);
                }
                rlogger = new winston.Logger({
                    transports: [
                        new (winston.transports.File)({
                            filename: logpath,
                            json: false,
                            level: "debug",
                        })
                    ]
                });
            }
            next();
        },

        //get all tasks submitted for this rule
        next=>{
            var limit = 5000;
            request.get({
                url: config.wf.api+"/task", json: true,
                headers: { authorization: "Bearer "+jwt },
                qs: {
                    find: JSON.stringify({
                        "config._rule.id": rule._id,
                        "config._app": {$exists: true}, //don't want staging task
                        status: {$ne: "removed"},
                    }),
                    select: 'status config._rule.subject',
                    limit,
                },
            }, (err, res, body)=>{
                if(err) return next(err);
                if(res.statusCode != "200") return next(res.statusCode);
                rule_tasks = {};
                running = 0;
                body.tasks.forEach(task=>{
                    if(task.status == "running" || task.status == "requested") running++;
                    rule_tasks[task.config._rule.subject] = task;
                });

                rlogger.debug(body.tasks.length+" tasks submitted for this rule");
                if(body.tasks.length == limit) {
                    return next("too many tasks submitted for this rule");
                }

                rlogger.debug("running/requested tasks", running);
                next();
            });
        },

        //enumerate all subjects under rule's project (and all input_project_overrides)
        next=>{
            let projects = [ rule.project._id ];
            if(rule.input_project_override) {
                for(var input_id in rule.input_project_override) {
                    projects.push(rule.input_project_override[input_id]); 
                }
            }                

            db.Datasets.find({
                project: { $in: projects }, 
                removed: false,
            })
            //.sort("meta.subject") //sort can't be used with distinct
            .distinct("meta.subject", (err, _subjects)=>{
                if(err) return next(err);
                subjects = _subjects;        
                next();
            });
        },

        //find all output datasets that this rule is looking for
        next=>{
            async.eachSeries(rule.app.outputs, (output, next_output)=>{
                var query = {
                    project: rule.project._id,
                    datatype: output.datatype,
                    //"meta.subject": subject,
                    storage: { $exists: true },
                    removed: false,
                }
                if(output.datatype_tags.length > 0) query.datatype_tags = { $all: output.datatype_tags };
                if(rule.output_tags[output.id]) query.tags = { $all: rule.output_tags[output.id] }; 
                db.Datasets.find(query)
                .select('meta') 
                .lean()
                .exec((err, datasets)=>{
                    if(err) return next_output(err);
                    output._subjects = datasets.map(dataset=>dataset.meta.subject);
                    next_output();
                });
            }, next);
        },

        //find all input datasets that this rule can use
        next=>{
            //var missing = false;
            //var inputs = {};
            logger.debug("finding inputs");
            async.eachSeries(rule.app.inputs, (input, next_input)=>{
                input._datasets = {}; //keyed by subject array of matchind datasets (should be sorted by "selection_method")

                //defaults
                var sort = "create_date";
                var query = {
                    project: rule.project._id,
                    datatype: input.datatype,
                    //"meta.subject": subject,
                    storage: { $exists: true },
                    removed: false,
                }

                /*
                //see which selection method to usee
                var selection_method = "latest";
                if(rule.input_selection && rule.input_selection[input.id]) selection_method = rule.input_selection[input.id];
                switch(selection_method) {
                case "latest":
                    sort = "create_date"; //find the latest
                    break;
                case "ignore": 
                    //don't need to look for this input
                    return next_input();
                }
                */
                
                //allow user to override which project to load input datasets from
                if(rule.input_project_override && rule.input_project_override[input.id]) {
                    query.project = rule.input_project_override[input.id];
                } 
                if(rule.input_tags[input.id]) {
                    query.tags = { $all: rule.input_tags[input.id] }; 
                }

                db.Datasets.find(query)
                .populate('datatype')
                .sort(sort)
                .lean()
                .exec((err, datasets)=>{
                    if(err) return next_input(err);

                    //find first dataset that matches all tags
                    //var matching_dataset = null;
                    datasets.forEach(dataset=>{

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
                        
                        if(match) {
                            if(!input._datasets[dataset.meta.subject]) input._datasets[dataset.meta.subject] = [];
                            input._datasets[dataset.meta.subject].push(dataset);
                        }
                    });

                    next_input(); 
                });
            }, next);
        },

        //handle all subjects
        next=>{
            subjects.sort();
            async.eachSeries(subjects, handle_subject, next);
        },

        next=>{
            logger.debug("done with this rule");
            next();
        },
    ], err=>{
        if(err) return cb(err);
        rlogger.debug("done processing all rules");
        cb();
    });

    function handle_subject(subject, next_subject) {
        /* disabling this now because we are only running rule when datasets or rule is updated
        if(running >= config.rule.max_task_per_rule) {
            rlogger.info("reached max running task.. skipping the rest of subjects", subject, running);
            return next_subject();
        }
        */

        if(rule.subject_match && !subject.match(rule.subject_match)) {
            return next_subject();
        }

        if(rule_tasks[subject]) {
            rlogger.debug("task already submitted for subject:", subject, rule_tasks[subject]._id, rule_tasks[subject].status);
            return next_subject();
        }

        rlogger.debug("handling subject", subject);
        
        //find all outputs from the app with tags specified in rule.output_tags[output_id]
        var output_missing = false;
        rule.app.outputs.forEach(output=>{
            if(!~output._subjects.indexOf(subject)) {
                rlogger.debug("output dataset not yet created for id:", output.id);
                output_missing = true;
            }
        });
        if(!output_missing) {
            rlogger.info("all datasets accounted for.. skipping to next subject");
            return next_subject();
        }

        //output datasets missing.. see if we can find all inputs
        /*
        find_inputs(subject, (err, input_missing, inputs)=>{
            if(err) return next_subject(err);
            if(input_missing) {
                rlogger.info("Found the output datasets that need to be generated, but we can't find input datasets with specified datatype / tags to submit the task with.. skipping");
                next_subject();
            } else {
                rlogger.info("Found the output datasets that need to be generated, and we have all the inputs! submitting tasks");
                submit_tasks(subject, inputs, next_subject);
            }
        });
        */

        //make sure we have all datasets we need
        let inputs = {};
        let missing = false;
        rule.app.inputs.forEach(input=>{
            if(rule.input_selection && rule.input_selection[input.id]) {
                let selection_method = rule.input_selection[input.id];
                if(selection_method == "ignore") return; //we don't need this input
            }
            if(!input._datasets[subject]) {
                missing = true;
            } else {
                inputs[input.id] = input._datasets[subject][0]; //use the first one for now.. (TODO for multiinput, we could grab all?)
            }
        });
        if(missing) {
            rlogger.info("Found the output datasets that need to be generated, but we can't find input datasets with specified datatype / tags to submit the task with.. skipping");
            return next_subject();
        }

        //all good! 
        rlogger.info("Found the output datasets that need to be generated, and we have all the inputs also! submitting tasks");
        //console.dir(inputs);
        submit_tasks(subject, inputs, next_subject);
    }

    /*
    function find_inputs(subject, next) {
        var missing = false;
        var inputs = {};
        async.eachSeries(rule.app.inputs, (input, next_input)=>{

            //defaults
            var sort = "create_date";
            var query = {
                project: rule.project._id,
                datatype: input.datatype,
                "meta.subject": subject,
                storage: { $exists: true },
                removed: false,
            }

            //see which selection method to usee
            var selection_method = "latest";
            if(rule.input_selection && rule.input_selection[input.id]) selection_method = rule.input_selection[input.id];
            switch(selection_method) {
            case "latest":
                sort = "create_date"; //find the latest
                break;
            case "ignore": 
                //don't need to look for this input
                return next_input();
            }
            
            //allow user to override which project to load input datasets from
            if(rule.input_project_override && rule.input_project_override[input.id]) {
                query.project = rule.input_project_override[input.id];
            } 
            if(rule.input_tags[input.id]) {
                query.tags = { $all: rule.input_tags[input.id] }; 
            }

            db.Datasets.find(query)
            .populate('datatype')
            .sort(sort)
            .lean()
            .exec((err, datasets)=>{
                if(err) return next_input(err);

                //find first dataset that matches all tags
                var matching_dataset = null;
                datasets.forEach(dataset=>{
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
                    if(match) matching_dataset = dataset;
                });

                if(!matching_dataset) {
                    missing = true;
                    rlogger.debug("no matching input", input.id);
                } 

                inputs[input.id] = matching_dataset;
                next_input(); 
            });
        }, err=>{
            if(err) return next(err);
            else next(null, missing, inputs);
        });
    }
    */

    function submit_tasks(subject, inputs, cb) {
        var instance = null;
        var task_stage = null;
        var task_app = null;
        var task_out = null;
		var meta = {}; //metadata to store for archived dataset
        var next_tid = null;
        var safe_jwt = null;

        var _app_inputs = []; 
        var deps = [];
        var tasks = {};

        var instance_name = "brainlife.rule subject:"+subject;
        var instance_desc = "rule submission for subject "+subject;
        running++;

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
                            group_id: rule.project.group_id, 
                            "config.removing": {$exists: false},
                            "config.status": {$ne: "removed"},
                        }),
                    },
                }, (err, res, body)=>{
                    if(err) return next(err);
                    instance = body.instances[0];
                    if(instance) {
                        rlogger.debug("using instance id:", instance._id);
                    }
                    next();
                });
            },

            //if we don't have the instance, create one
            next=>{
                if(instance) return next();
                rlogger.debug("creating a new instance");
                request.post({
                    url: config.wf.api+'/instance', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body: {
                        name: instance_name,
                        desc: instance_desc,
                        group_id: rule.project.group_id, 
                        config: {
                            brainlife: true,
                            //type: "v2",
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
                            //need to include removed ones for correrct tid
                        }),
                    },
                }, (err, res, body)=>{
                    if(err) return next(err);
                    next_tid = body.count;
                    body.tasks.forEach(task=>{
                        tasks[task._id] = task;
                    });
                    next();
                });
            },

            //create safe dataset download jwt (I can do this synchrnously.. but)
            next=>{
				let ids = [];
				for(var input_id in inputs) {
                    var input = inputs[input_id];
					ids.push(input._id);	
				}
				safe_jwt = jsonwebtoken.sign({
					sub: rule.user_id,
					iss: "warehouse",
					exp: (Date.now() + 1000*3600*24*30)/1000, //30 days should be enough..
					scopes: {
						datasets: ids,
					},
				}, config.warehouse.private_key, {algorithm: 'RS256'});
                next();
            },

            //submit input staging task for datasets that aren't staged yet
            next=>{
                var _outputs = [];
                var downloads = [];
                for(var input_id in inputs) {
                    var input = inputs[input_id];

                    //although we need to construct _outputs for product_raw, we are reusing most of the info
                    //for the main app's input. since product-raw doesn't really have id anyway, so let's just use
                    //app's input id as product_raw's id
                    input.id = input_id;
                    
                    //enumerate json keys for this input
                    let keys = [];
                    for(var key in rule.app.config) {
                        if(rule.app.config[key].input_id == input_id) keys.push(key);
                    }

                    function canuse_source() {
                        var task = null;
                        if(input.prov && input.prov.task_id) task = tasks[input.prov.task_id];
                        if(task && task.status != 'removed') {
                            rlogger.debug("found the task generated the input dataset");

                            //find output from task
                            let output_detail = task.config._outputs.find(it=>it.id == input.prov.output_id);
                            deps.push(task._id); 

                            //console.log(JSON.stringify(output_detail, null, 4));

                            //TODO I should only put stuff that I need output input..
                            _app_inputs.push(Object.assign({}, input, {
                                datatype: input.datatype._id, //unpopulate datatype to keep it clean
                                task_id: task._id,
                                subdir: input.prov.subdir,
                                dataset_id: input._id, //TODO not sure if this is right?
                                prov: null, //remove dataset prov
                                keys,

                                files: output_detail.files, //needed by process_input_config to map to correct output
                            }));
                            return true;
                        }
                        return false;
                    }

                    function canuse_staged() {
                        //see if there are input task that has the dataset already staged
                        var task = null;
                        var output = null;
                        for(var task_id in tasks) {
                            task = tasks[task_id];
                            if(task.service == "soichih/sca-product-raw" && task.status != 'removed') {
                                rlogger.debug("checking for already staged output", input.id, input._id.toString());
                                output = task.config._outputs.find(o=>o._id == input._id);
                                if(output) {
                                    rlogger.debug("found it", output);
                                    break;
                                }
                            }
                        }
                        if(output) {
                            rlogger.debug("found the input dataset already staged previously");
                            deps.push(task._id); 
                            //TODO I should only put stuff that I need output input..
                            _app_inputs.push(Object.assign({}, input, {
                                datatype: input.datatype._id, //unpopulate datatype to keep it clean
                                task_id: task._id,
                                subdir: output.subdir, 
                                dataset_id: output.dataset_id,
                                prov: null, //remove dataset prov
                                keys,
                            }));
                            return true;
                        }
                        return false;
                    }
                    
                    if(!canuse_source() && !canuse_staged()) {
                        //we don't have it.. we need to stage from warehouse
                        rlogger.debug("couldn't find staged dataset.. need to load from warehouse");
                        downloads.push({
                            url: config.warehouse.api+"/dataset/download/safe/"+input._id+"?at="+safe_jwt,
                            untar: "auto",
                            dir: input._id,
                        });
                        
                        //TODO I should only put stuff that I need output input..
                        var output = Object.assign({}, input, {
                            datatype: input.datatype._id, //unpopulate datatype to keep it clean
                            subdir: input._id,
                            dataset_id: input._id, 
                            prov: null, //remove dataset prov
                        });
                        _outputs.push(output);
                        _app_inputs.push(Object.assign({/*output_id: input.id,*/ keys}, output)); 
                    }
                }

                //nothing to download, then proceed to submitting the app
                if(downloads.length == 0) return next();

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
                            _rule: {
                                id: rule._id,
                                subject,
                            },
                            _outputs,
                            _tid: next_tid++,
                        },
                        deps: [],
                        nice: config.rule.nice,
                    },
                }, (err, res, _body)=>{
                    if(err) return next(err);
                    task_stage = _body.task;

                    //reset task_id 
                    _app_inputs.forEach(input=>{
                        if(!input.task_id) input.task_id = task_stage._id;
                    });
                    deps.push(task_stage._id);

                    rlogger.debug("submitted staging task");//, task_stage);
                    //console.log(JSON.stringify(_body, null, 4));
                    next();
                });
            },

            //aggregate metadata (TODO - I really need just subject?)
            next=>{
				for(var input_id in inputs) {
					var input = inputs[input_id];
					for(var k in input.meta) {
						if(!meta[k]) meta[k] = input.meta[k]; //use first encounter
					}
				}
                next();
            },

            //submit the app task!
            next=>{
                var _config = Object.assign(
                    rule.config||{}, 
                    process_input_config(rule.app, inputs, _app_inputs), 
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
                    var output_req = {
                        id: output.id,
                        datatype: output.datatype,
                        desc: output.desc,
                        meta: meta,
                        tags: rule.output_tags[output.id], 
                        files: output.files,
                        archive: {
                            project: rule.project._id,  
                            desc: rule.name,
                        }
                    }

                    //handle tag passthrough
                    var tags = [];
                    if(output.datatype_tags_pass) {
						//TODO - how is multi input handled here?
            			var dataset = inputs[output.datatype_tags_pass];
						tags = tags.concat(tags, dataset.datatype_tags);
                    }
                    //.. and add app specified output tags at the end
                    tags = tags.concat(tags, output.datatype_tags);
                    output_req.datatype_tags = uniq(tags);

                    _config._outputs.push(output_req);
                });

                request.post({
                    url: config.wf.api+'/task', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body: {
                        instance_id: instance._id,
                        name: rule.app.name,
                        //desc: "running application:"+rule.app.name+" for rule:"+rule.name+" for subject:"+subject,
                        service: rule.app.github,
                        service_branch: rule.app.github_branch,
                        retry: rule.app.retry,
                        nice: config.rule.nice,

                        config: _config,
                        deps,
                    }
                }, (err, res, _body)=>{
                    task_app = _body.task;
                    rlogger.debug("submitted app task", task_app._id);
                    //logger.debug("submitted app task", task_app);
                    //console.log(JSON.stringify(_body, null, 4));
                    next(err);
                });
            },

        ], cb);
    }
}

//app - rule.app
//input_info - input datasets that can be used for app (datatype populated)
//_app_inputs ... similar to input_info.. selected to submit?
function process_input_config(app, input_info, _app_inputs) {
    var out = {};
    for(var k in app.config) {
        var node = app.config[k];
        if(node.type && node.type == "input") {
            var input = app.inputs.find(it=>it.id == node.input_id);
            if(input.multi) out[k] = [];

			//TODO - multi could have more than 1 dataset... (let's just process first one for now?)
            var dataset = _app_inputs.find(d=>d.id == node.input_id);
            if(!dataset) continue; //optional input that's ignored?

            var base = "../"+dataset.task_id;
            if(dataset.subdir) base+="/"+dataset.subdir;

            var info = input_info[node.input_id];
            var file = info.datatype.files.find(file=>file.id == node.file_id);
                
            var path = base+"/"+(file.filename||file.dirname);
            if(dataset.files && dataset.files[node.file_id]) {
                path = base+"/"+dataset.files[node.file_id];
            }
            if(input.multi) out[k].push(path);
            else out[k] = path;
        }
    }
    return out;
}

