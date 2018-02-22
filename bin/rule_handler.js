#!/usr/bin/env node

const winston = require('winston');
const async = require('async');
const request = require('request');
const fs = require('fs');
const redis = require('redis');

const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');

// TODO Disable rule if failurer rate is too high?

var rcon = null;

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

var _counts = {
    rules: 0,
}

function health_check() {
    var report = {
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

function run() {
	db.Rules.find({
        active: true,
        removed: false,
    })
    .populate('app project')
    .exec((err, rules)=>{
		if(err) throw err;
        async.eachSeries(rules, (rule, next_rule)=>{
            handle_rule(rule, next_rule);
        }, err=>{
            if(err) logger.error(err);
            logger.debug("done with all rules - sleeping for a while");
            setTimeout(run, 1000*30);
        });
	});
}

function handle_rule(rule, cb) {
    _counts.rules++;

    var jwt = null;
    var subjects = null;
    var running = null; //number of currently running tasks for this rule
    var rule_tasks = null; //tasks submitted for this rule (grouped by subject name)

    if(!rule.input_tags) rule.input_tags = {};
    if(!rule.output_tags) rule.output_tags = {};

    logger.info("handling rule ----------------------- ", rule._id.toString(), rule.name);
    
    //prepare for stage / app / archive
    async.series([

        //validate
        next=>{
            if(!rule.project) return next("project not specified");
            if(!rule.app) return next("app not specified");
            next();
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

                logger.debug(body.tasks.length+" tasks submitted for this rule");
                if(body.tasks.length == limit) {
                    return next("too many tasks submitted for this rule");
                }

                logger.debug("running/requested tasks", running);
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
        if(running >= config.rule.max_task_per_rule) {
            logger.info("reached max running task.. skipping the rest of subjects", subject, running);
            return next_subject();
        }

        if(rule.subject_match && !subject.match(rule.subject_match)) {
            //logger.debug("subject", subject, "doesn't match", rule.subject_match);
            return next_subject();
        }

        if(rule_tasks[subject]) {
            logger.debug("task already submitted for subject:", subject, rule_tasks[subject]._id, rule_tasks[subject].status);
            return next_subject();
        }

        logger.debug("handling subject", subject);

        //find all outputs from the app with tags specified in rule.output_tags[output_id]
        var missing = false;
        async.eachSeries(rule.app.outputs, (output, next_output)=>{
            var query = {
                project: rule.project._id,
                datatype: output.datatype,
                "meta.subject": subject,
                storage: { $exists: true },
                removed: false,
            }
            if(output.datatype_tags.length > 0) query.datatype_tags = { $all: output.datatype_tags };
            if(rule.output_tags[output.id]) query.tags = { $all: rule.output_tags[output.id] }; 
            db.Datasets.findOne(query)
            .populate('datatype')
            .exec((err, dataset)=>{
                if(err) return next_output(err);
                if(!dataset) {
                    logger.debug("output dataset not yet created", output.id);
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
                    logger.info("output missing, and we have all inputs! submitting tasks");
                    submit_tasks(subject, inputs, next_subject);
                }
            });
        });
    }

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
            if(rule.input_selection[input.id]) selection_method = rule.input_selection[input.id];
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
                    logger.debug("no matching input", input.id);
                } 

                inputs[input.id] = matching_dataset;
                next_input(); 
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
        var tasks = {};

        //var instance_name = "brainlife.rule project:"+rule.project._id+" subject:"+subject;
        var instance_name = "brainlife.rule subject:"+subject;
        //var instance_desc = "rule:"+rule.name+" for project:"+rule.project.name+" subject:"+subject;
        var instance_desc = "rule:"+rule.name+" subject:"+subject;
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

            //submit input staging task for datasets that aren't staged yet
            next=>{
                //var did = next_tid*10;
                var _outputs = [];
                var downloads = [];
                for(var input_id in inputs) {
                    var input = inputs[input_id];
                    input.id = input_id;

                    function canuse_source() {
                        var task = null;
                        if(input.prov && input.prov.task_id) task = tasks[input.prov.task_id];
                        if(task && task.status != 'removed'/* && task.instance_id == instance._id*/) {
                            logger.debug("found the task generated the input dataset");

                            //find output from task
                            let output_detail = task.config._outputs.find(it=>it.id == input.prov.output_id);
                            deps.push(task._id); 
                            _app_inputs.push(Object.assign({}, input, {
                                datatype: input.datatype._id, //unpopulate datatype to keep it clean
                                //did: did++,
                                task_id: task._id,
                                app_id: input.prov.app, //dataset stored app_id under "app" because it's meant to be populated (task_id is from other service)
                                subdir: input.prov.subdir,
                                output_id: input.prov.output_id,
                                files: output_detail.files,
                                prov: null, //remove dataset prov
                            }));
                            return true;
                        }
                        return false;
                    }

                    function canuse_staged() {
                        //see if there are input task that has the dataset already staged
                        var task = null;
                        var output = null;
                        //logger.debug("looking for sca-product-raw tasks", tasks);
                        for(var task_id in tasks) {
                            task = tasks[task_id];
                            if(task.service == "soichih/sca-product-raw" && task.status != 'removed') {
                                logger.debug("checking for already staged output", input.id, input._id.toString());
                                output = task.config._outputs.find(o=>o._id == input._id);
                                if(output) {
                                    logger.debug("found it", output);
                                    break;
                                }
                            }
                        }
                        if(output) {
                            logger.debug("found the input dataset already staged previously");
                            deps.push(task._id); 
                            _app_inputs.push(Object.assign({}, input, {
                                datatype: input.datatype._id, //unpopulate datatype to keep it clean
                                //did: did++,
                                task_id: task._id,
                                subdir: output.subdir, 
                                dataset_id: output.dataset_id,
                                output_id: output.id, 
                                prov: null, //remove dataset prov
                            }));
                            return true;
                        }
                        return false;
                    }
                    
                    if(!canuse_source() && !canuse_staged()) {
                        //we don't have it.. we need to stage from warehouse
                        logger.debug("couldn't find staged dataset.. need to load from warehouse");
                        downloads.push({
                            url: config.warehouse.api+"/dataset/download/"+input._id+"?at="+jwt,
                            untar: "auto",
                            dir: input._id,
                        });
                        var output = Object.assign({}, input, {
                            datatype: input.datatype._id, //unpopulate datatype to keep it clean
                            //did: did++,
                            subdir: input._id,
                            dataset_id: input._id, 
                            prov: null, //remove dataset prov
                        });
                        _outputs.push(output);
                        _app_inputs.push(Object.assign({output_id: input.id}, output)); 
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
                //var did = next_tid*10;
                var _config = Object.assign(
                    rule.config||{}, 
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
                        //did: did++,
                        datatype: output.datatype,
                        datatype_tags: output.datatype_tags,
                        desc: output.desc,
                        meta: meta,
                        tags: rule.output_tags[output.id], 
                        files: output.files,
                        archive: {
                            project: rule.project._id,  
                            desc: rule.name,
                            //tags: rule.output_tags[output.id], //deprecated by parent's tags.. (remove this eventually)
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
                        nice: config.rule.nice,

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

        ], cb);
    }
}

function process_input_config(config, inputs, datasets, task_stage) {
    //logger.debug("process_input_config");
    //logger.debug(JSON.stringify(datasets, null, 4));
    var out = {};
    for(var k in config) {
        var v = config[k];
        switch(v.type) {
        case "input":
            var input = inputs[v.input_id];
            var dataset = datasets.find(d=>d.id == v.input_id);
            if(!dataset) continue; //optional input that's ignored?
            var base = "../"+dataset.task_id;
            if(dataset.subdir) base+="/"+dataset.subdir;

            var file = input.datatype.files.find(file=>file.id == v.file_id);
            out[k] = base+"/"+(file.filename||file.dirname);

            //override if datasets.files exists.. which points to non-default input file location
            if(dataset.files && dataset.files[v.file_id]) {
                out[k] = base+"/"+dataset.files[v.file_id];
            }
            break;
        case "integer":
        case "string":
            //scalar configs are handled by the user
        }
    }
    return out;
}

