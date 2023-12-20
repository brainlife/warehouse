#!/usr/bin/env node

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;
const async = require('async');
const request = require('request');
const fs = require('fs');
const redis = require('redis');
const amqp = require('amqp');
const mongoose = require("mongoose");

const config = require('../api/config');
const db = require('../api/models');
const common = require('../api/common');

const pkg = require('../package.json');

let acon;
let rule_ex;
db.init(function(err) {
    if(err) throw err;

    common.connectAMQP((err, conn)=>{
        acon = conn;
        console.log("connected to amqp.. now setting up warehouse.rule exchange");
        acon.exchange("warehouse.rule", {autoDelete: false, durable: true, type: 'topic', confirm: true}, (ex)=>{
            rule_ex = ex; 
        });

        common.connectRedis(err=>{
            if(err) throw err;
            console.log("connected to redis");
            setInterval(health_check, 1000*60*2); //start checking health 
            run();
        });
    });

});

let _counts = {
    rules: 0,
}

function health_check() {
    let report = {
        status: "ok",
        version: pkg.version,
        messages: [],
        counts: _counts,
        date: new Date(),
        maxage: 1000*60*4,
    }

    if(_counts.rules == 0) {
        report.status = "failed";
        report.messages.push("no rules handled");
    }

    common.redisClient.set("health.warehouse.rule."+process.env.HOSTNAME+"-"+process.pid, JSON.stringify(report));
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
    .exec((err, rules)=>{
        if(err) throw err;

        if(!rules || rules.length == 0) {
            console.debug("no rules to handle - sleeping for a bit");
            setTimeout(run, 1000*5);
        } else {
            async.eachSeries(rules, handle_rule, err=>{
                if(err) console.error(err);
                console.debug("done handling "+rules.length+" rules - sleeping for a bit");
                rule_ex.publish("done", {count: rules.length});
                setTimeout(run, 1000*5);
            });
        }
    });
}

function isalive(task) {
    if(!task) return false;
    let dead_states = ["failed", "stop_requested", "stopped", "removed"];
    if(~dead_states.indexOf(task.status)) return false;

    //TODO - maybe I should consider task with up-coming remove_date to be dead? 
    //I will try to see if I can prevent task from being removed if it has deps that hasn't finished yet

    return true;    
}

function createRuleLogger(rule) {
    const groups = {};
    const root = {state: null, logs: []};

    function getGroup(groupkey) {
        if(!groupkey) return root;
        if(!groups[groupkey]) groups[groupkey] = {state: null, logs: []};
        return groups[groupkey];
    }

    function add(type, groupkey, message) {
        const group = getGroup(groupkey);
        group.logs.push({type, message, /*time: new Date().getTime()*/});
    }

    //group - group key that this log belongs to set it to null if it's for the entire rule
    //message: string
    return {
        info(message, groupkey) {
            add('info', groupkey, message);
        },
        debug(message, groupkey) {
            add('debug', groupkey, message);
        },
        warning(message, groupkey) {
            add('debug', groupkey, message);
        },
        error(message, groupkey) {
            add('debug', groupkey, message);
        },

        set(obj, groupkey) {
            const group = getGroup(groupkey);
            Object.assign(group, obj);
        },

        //save logs to disk
        close(cb) {
            const logpath = config.warehouse.rule_logdir+"/"+rule._id.toString()+".json";
            fs.writeFile(logpath, JSON.stringify({root, groups}), cb);
        },
    }
}

function handle_rule(rule, cb) {
    _counts.rules++;

    let jwt = null;
    let groups = null; //[{subject: .. session: }]
    let rule_tasks = null; //tasks submitted for this rule (grouped by subject name)
    //let rlogger = null;

    const log = createRuleLogger(rule);

    if(!rule.input_tags) rule.input_tags = {};
    if(!rule.input_subject) rule.input_subject = {};
    if(!rule.output_tags) rule.output_tags = {};

    const counts = {
        waiting: 0, //waiting for inputs
        running: 0, //running jobs to produce the output ("submitted" is a better name?)
        archived: 0, //output already archived
    };

    //prepare for stage / app / archive
    async.series([

        //validate
        next=>{
            if(!rule.project) {
                return next("project not specified -- rule id:"+rule._id+" proj:"+rule.project);
            }
            if(!rule.app) {
                return next("app not specified -- for rule id:"+rule._id);
            }

            //TODO - load project and check to make sure it's not removed
            //I should probably do this check in some house keeping script somewhere else? go through remove project, and disable pipeline rules

            next();
        },

        //see if we need to process this rule or not
        //by finding the latest update_date of all input datasets
        next=>{
            //if not handled yet, go ahead and handle it
            if(!rule.handle_date) return next();

            //if updated, go ahead and handle it
            if(rule.update_date > rule.handle_date) return next();

            //see if any datasets that this rule uses as input got updates recently
            let projects = [ rule.project._id ];
            if(rule.input_project_override) {
                for(const input_id in rule.input_project_override) {
                    projects.push(rule.input_project_override[input_id]); 
                }
            }
            db.Datasets.findOne({
                project: { $in: projects }, 
                update_date: { $exists: true } , 
                removed: false, //don't care about removed ones
            })
            .sort("-update_date") //we need to find the max update_date
            .select("update_date")
            .exec((err, dataset)=>{
                if(err) return next(err);
                if(!dataset) return cb(); //no dataset, nothing to do
                if(rule.handle_date > dataset.update_date) return cb(); //no new dataset to handle

                //has new input dataset to handle.. proceed
                next();
            });
        },
            
        //update handle_date
        next=>{
            console.log("handling project:"+rule.project.name+" rule:"+rule.name+" "+rule._id.toString());
            //I can't use save() as it will unpopulate app (why does it do that!?)
            db.Rules.findOneAndUpdate({_id: rule._id}, {$set: {handle_date: new Date()}}).exec(next);
        },

        //issue user jwt
        next=>{
            request.get({
                url: config.auth.api+"/jwt/"+rule.user_id, json: true,
                headers: { authorization: "Bearer "+config.warehouse.jwt },
            }, (err, res, body)=>{
                if(err) return next(err);
                if(res.statusCode != 200) return cb("couldn't obtain user jwt code:"+res.statusCode);
                jwt = body.jwt;
                next();
            });
        },

        /*
        //initialize rlogger (deprecated by json log)
        next=>{
            if(config.warehouse.rule_logdir) {
                let logpath = config.warehouse.rule_logdir+"/"+rule._id.toString()+".log";
                try {
                    fs.truncateSync(logpath);
                } catch (err) {
                    console.log("failed to truncate.. maybe first time "+logpath);
                }
                rlogger = createLogger({
                    format: combine(
                        timestamp(),
                        format.splat(),
                        format.printf(info=>{
                            return `${info.timestamp} ${info.message}`;
                        }),
                    ),
                    transports: [
                        new transports.File({
                            filename: logpath,
                            level: "debug",
                        }),
                    ]
                });
            }
            next();
        },
        */

        //get all tasks submitted for this rule
        next=>{
            const limit = 5000;
            request.get({
                url: config.amaretti.api+"/task", json: true,
                headers: { authorization: "Bearer "+jwt },
                qs: {
                    find: JSON.stringify({
                        "config._rule.id": rule._id,
                        "config._app": {$exists: true}, //don't want staging task
                        status: {$ne: "removed"},
                    }),
                    select: 'status config._rule.subject config._rule.session',
                    limit,
                },
            }, (err, res, body)=>{
                if(err) return next(err);
                if(res.statusCode != "200") return next(res.statusCode);
                rule_tasks = {};
                body.tasks.forEach(task=>{
                    rule_tasks[get_group_id(task.config._rule)] = task;
                });

                log.debug(body.tasks.length+" tasks submitted for this rule");
                if(body.tasks.length == limit) {
                    log.set({state:"toomanytasks"});
                    return next("too many tasks submitted for this rule");
                }

                next();
            });
        },

        //enumerate all subjects/session under rule's project (and all input_project_overrides)
        next=>{
            let projects = [ rule.project._id ];
            if(rule.input_project_override) {
                for(const input_id in rule.input_project_override) {
                    projects.push(mongoose.Types.ObjectId(rule.input_project_override[input_id])); 
                }
            }

            let find = {
                project: { $in: projects },
                removed: false,
            };

            if(rule.subject_match) find["meta.subject"] = {$regex: rule.subject_match};
            if(rule.session_match) find["meta.session"] = {$regex: rule.session_match};

            db.Datasets.aggregate().match(find).group({_id: {
                subject: "$meta.subject", 
                session: "$meta.session"
            }}).exec((err, _groups)=>{
                if(err) return next(err);
                groups = _groups.map(group=>{
                    return group._id;
                }).filter(g=>!!g.subject).sort((a,b)=>{
                    if(a.subject > b.subject) return 1;
                    if(a.subject < b.subject) return -1;
                    if(a.session > b.session) return 1;
                    if(a.session < b.session) return -1;
                    return 0;
                });
                log.debug("number of subject/sessions to process:"+groups.length);
                log.set({state:"processing", groupCount: groups.length});
                next();
            });
        },

        //find all output datasets that this rule is looking for
        next=>{
            async.eachSeries(rule.app.outputs, (output, next_output)=>{
                const query = {
                    project: rule.project._id,
                    datatype: output.datatype,

                    //TODO - does this exist in case archiving fails? 
                    //I thought this could cause duplicate submission if there is an output dataset that's currently archived?
                    //but I think already submitted task should prevent it from re-submitted.. so it's ok?
                    //if I do remove this, remove it from ui>components/ruleform also.
                    storage: { $exists: true },

                    removed: false,
                }
                if(output.datatype_tags.length > 0) query.datatype_tags = { $all: output.datatype_tags };
                const tags = rule.output_tags[output.id];
                if(tags && tags.length > 0) query.tags = { $all: tags };

                db.Datasets.find(query)
                .select('meta')
                .lean()
                .exec((err, datasets)=>{
                    if(err) return next_output(err);
                    output._groups = datasets.map(dataset=>get_group_id(dataset.meta));
                    next_output();
                });
            }, next);
        },

        //find all input datasets that this rule can use
        next=>{
            async.eachSeries(rule.app.inputs, (input, next_input)=>{
                //keyed by subject array of matchind datasets 
                //(should be sorted by "selection_method")
                input._datasets = {};

                //defaults
                const query = {
                    project: rule.project._id,
                    datatype: input.datatype,
                    storage: { $exists: true },
                    removed: false,
                }

                //allow user to override which project to load input datasets from
                if(rule.input_project_override && rule.input_project_override[input.id]) {
                    query.project = rule.input_project_override[input.id];
                }

                let tag_query = [];
                let pos_tags = [];
                let neg_tags = [];

                //handle dataset tags
                if(rule.input_tags[input.id]) {
                    rule.input_tags[input.id].forEach(tag=>{
                        if(tag[0] != "!") pos_tags.push(tag);
                        else neg_tags.push(tag.substring(1));
                    });
                    if(pos_tags.length > 0) tag_query.push({tags: {$all: pos_tags}});
                    if(neg_tags.length > 0) tag_query.push({tags: {$nin: neg_tags}});
                }

                if(rule.input_subject && rule.input_subject[input.id]) {
                    query["meta.subject"] = rule.input_subject[input.id];
                } 
                if(rule.input_session && rule.input_session[input.id]) {
                    query["meta.session"] = rule.input_session[input.id];
                } 

                //handle datatype_tags
                let datatype_tags = input.datatype_tags;
                if(rule.extra_datatype_tags && rule.extra_datatype_tags[input.id]) datatype_tags = datatype_tags.concat(rule.extra_datatype_tags[input.id]);
                pos_tags = [];
                neg_tags = [];
                datatype_tags.forEach(tag=>{
                    if(tag[0] != "!") pos_tags.push(tag);
                    else neg_tags.push(tag.substring(1));
                });
                if(pos_tags.length > 0) tag_query.push({datatype_tags: {$all: pos_tags}});
                if(neg_tags.length > 0) tag_query.push({datatype_tags: {$nin: neg_tags}});
                if(tag_query.length > 0) query.$and = tag_query;

                //now ready to find inputs!
                db.Datasets.find(query)
                .populate('datatype')
                //.sort("-create_date") //this add whopping 4 seconds to the query sometimes
                .select("create_date project prov.task._id prov.output_id prov.subdir datatype meta datatype_tags tags")
                .lean()
                .exec((err, datasets)=>{
                    if(err) return next_input(err);

                    /* we don't need to sort this anymore (we no longer pick the "latest")
                    //sorting myself is *much* faster than letting mongo do it.. I am not sure why.. maybe -create_date index was broken?
                    datasets.sort((a,b)=>{
                        if(a.create_date > b.create_date) return -1;
                        if(a.create_date < b.create_date) return 1;
                        return 0;
                    })
                    */

                    //group by group_id
                    datasets.forEach(dataset=>{
                        let group_id = get_group_id(dataset.meta);
                        if(!input._datasets[group_id]) input._datasets[group_id] = [];
                        input._datasets[group_id].push(dataset);
                    });

                    next_input();
                });
            }, next);
        },

        //now handle all subjects
        next=>{
            async.eachSeries(groups, handle_group, err=>{
                if(err) return next(err);

                //store counts
                console.log("done handling");
                console.dir(counts);
                db.Rules.findOneAndUpdate({_id: rule._id}, {$set: {"stats.counts": counts}}).exec(next);
            });
        },

    ], err=>{
        if(err) {
            log.set({state: "failed"});
            log.error(err);
        }
        log.debug("done processing rule");
        log.close(()=>{
            cb(err);
        });
    });

    function get_group_id(obj) {
        let id = obj.subject;
        if(obj.session) id += "/"+obj.session;
        return id;
    }

    function handle_group(group, next_group) {
        const group_id = get_group_id(group);
        log.debug("handling group", group_id);

        //find all outputs from the app with tags specified in rule.output_tags[output_id]
        let output_missing = false;
        rule.app.outputs.forEach(output=>{
            //I should ignore missing output if user doesn't want to archive it?
            if(!rule.archive || !rule.archive[output.id] || !rule.archive[output.id].do) {
                log.debug(output.id+" not archived - skip", group_id);
                return;
            }

            if(!~output._groups.indexOf(group_id)) {
                log.debug("output dataset not yet created for id:"+output.id, group_id);
                output_missing = true;
            }
        });
        if(!output_missing) {
            log.info("all output data created", group_id);
            counts.archived++;
            log.set({
                state: "archived",
            }, group_id);

            return next_group();
        }

        //if we are already running task.. then leave it alone
        if(rule_tasks[group_id]) {
            const t = rule_tasks[group_id];
            log.debug("task already submitted for group:"+group_id+" "+t._id+" "+t.status, group_id);
            counts.running++;
            log.set({
                state: "submitted",
                taskStatus: t.status,
                taskId: t._id,
            }, group_id);
            return next_group();
        }

        //make sure we have all input datasets we need
        let inputs = {};
        let missing = false;
        let ambiguous = false;
        rule.app.inputs.forEach(input=>{
            if(rule.input_selection && rule.input_selection[input.id]) {
                let selection_method = rule.input_selection[input.id];
                if(selection_method == "ignore") return; //we don't need this input
            }

            let input_group = Object.assign({}, group);
            if(rule.input_subject && rule.input_subject[input.id]) {
                input_group.subject = rule.input_subject[input.id]; //override to look for different subject
            }
            if(rule.input_session && rule.input_session[input.id]) {
                input_group.session = rule.input_session[input.id]; //override to look for different session
            }
            let input_group_id = get_group_id(input_group);
            if(!input._datasets[input_group_id]) {
                missing = true;
                log.info("Found the output data that need to be generated, but we can't identify all required inputs and can't submit the app. missing input for "+input.id, group_id);
            } else {
                const candidates = input._datasets[input_group_id]; 

                //check count
                if(input.multi && rule.input_multicount) {
                    //make sure we have exactly the expected number of candidates
                    if(candidates.length != rule.input_multicount[input.id]) {
                        log.info("We found "+candidates.length +" candidates objects for input:"+input.id+", but the rule is expecting "+rule.input_multicount[input.id]+" objects", group_id);
                        ambiguous = true;
                    }
                } else {
                    //let's not submit jobs if there are more than 1 candidates
                    if(candidates.length > 1) {
                        log.info("We found "+candidates.length +" candidates objects for input:"+input.id+". Please increase input specificity by adding tags.", group_id);
                        ambiguous = true;
                    }
                }

                inputs[input.id] = candidates;
                inputs[input.id]._inputSpec = input; //TODO weird place to put it..
            }
        });
        if(missing) {
            counts.waiting++;
            log.set({state: "waiting"}, group_id);
            return next_group();
        }
        if(ambiguous) {
            counts.waiting++; //it's not really waiting here.. but don't have a better state to mark it
            log.set({state: "ambiguous"}, group_id);
            return next_group();
        }

        //we need to and can submit new task!
        log.info("Found the output data that need to be generated, and we have all the inputs also! submitting tasks", group_id);
        submit_tasks(group, inputs, err=>{
            if(!err) {
                counts.running++;
            }
            next_group(err);
        });
    }

    function submit_tasks(group, inputs, cb) {
        let group_id = get_group_id(group);

        let instance = null;
        let task_stage = null;
        let task_app = null;
        let task_out = null;
        const meta = {}; //metadata to store for archived dataset
        let next_tid = null;
        let stage_jwt = null;

        const _app_inputs = [];  //list of input data objects
        const deps_config = [];
        const tasks = {};

        //running++;

        //prepare for stage / app / archive
        async.series([
            //look for instance that we can use
            next=>{
                request.get({
                    url: config.amaretti.api+"/instance", json: true,
                    headers: { authorization: "Bearer "+jwt },
                    qs: {
                        find: JSON.stringify({
                            "config.rule_subject": group.subject,
                            "config.rule_session": group.session,
                            group_id: rule.project.group_id,  //aka. project id
                            "config.removing": {$exists: false},
                            "config.status": {$ne: "removed"},
                        }),
                    },
                }, (err, res, body)=>{
                    if(err) return next(err);
                    if(!body.instances) {
                        console.error("instance api didn't return an instances array");
                        return next(body)
                    }
                    instance = body.instances[0];
                    if(instance) {
                        log.debug("using instance id:"+instance._id, group_id);
                    }
                    next();
                });
            },

            //if we don't have the instance, create one
            next=>{
                if(instance) return next();
                log.debug("creating a new instance", group_id);
                request.post({
                    url: config.amaretti.api+'/instance', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body: {
                        //name: instance_name, //is this necessary?
                        desc: get_group_id(group),
                        group_id: rule.project.group_id, 
                        config: {
                            brainlife: true, //TODO is this still used?
                            rule_subject: group.subject,
                            rule_session: group.session,
                        }
                    },
                }, (err, res, body)=>{
                    instance = body;
                    next(err);
                });
            },
            
            //get tasks submitted.. and compute next _tid
            next=>{
                request.get({
                    url: config.amaretti.api+"/task", json: true,
                    headers: { authorization: "Bearer "+jwt },
                    qs: {
                        find: JSON.stringify({
                            instance_id: instance._id,
                            //service: { $not: { $regex: "^brainlife/validator-"} }, //don't use validator task output
                            //need to include removed ones for correct tid
                        }),
                        limit: 1000, //big enough right?
                    },
                }, (err, res, body)=>{
                    if(err) return next(err);
                    if(!body.tasks) {
                        return next(body);
                    }
                    body.tasks.forEach(task=>{
                        tasks[task._id] = task;
                    });

                    //find max + 1
                    next_tid = body.tasks.reduce((m,v)=>{ 
                        if(v.config._tid && v.config._tid > m) return v.config._tid;
                        return m;
                    }, 0) + 1; 

                    next();
                });
            },

            //create safe dataset download jwt (I can do this synchrnously.. but)
            next=>{
                common.issue_archiver_jwt(rule.user_id).then(jwt=>{
                    stage_jwt = jwt;
                    next();
                });
            },

            //submit input staging task for datasets that aren't staged yet
            next=>{
                const _outputs = [];
                const downloads = [];
                let subdirs = [];
                for(let input_id in inputs) {
                    const inputSpec = inputs[input_id]._inputSpec;
                    inputs[input_id].forEach(input=>{
                        log.debug("looking for source/staged data "+input._id+" for input "+input_id, group_id);

                        console.log(input);
                        //although we need to construct _outputs for product_raw, we are reusing most of the info
                        //for the main app's input. since product-raw doesn't really have id anyway, so let's just use
                        //app's input id as product_raw's id
                        input.id = input_id;
                        
                        //enumerate json keys for this input
                        let keys = [];
                        for(const key in rule.app.config) {
                            if(rule.app.config[key].input_id == input_id) keys.push(key);
                        }

                        function canuse_source() {
                            let task = null;
                            if(input.prov && input.prov.task && input.prov.task._id) task = tasks[input.prov.task._id];
                            if(!isalive(task)) return false;

                            log.debug("found the task generated the input data for output:"+input.prov.output_id, group_id);
                            //find output from task
                            let output_detail = task.config._outputs.find(it=>it.id == input.prov.output_id);
                            let dep_config = {task: task._id};
                            if(input.prov.subdir) { //most app should use subdir by now?
                                if(inputSpec.includes) dep_config.subdirs = appendIncludes(input.prov.subdir, inputSpec.includes);
                                else dep_config.subdirs = [input.prov.subdir];
                            }
                            deps_config.push(dep_config);

                            //TODO I should only put stuff that I need output input..
                            _app_inputs.push(Object.assign({}, input, {
                                datatype: input.datatype._id, //unpopulate datatype to keep it clean
                                task_id: task._id,
                                subdir: input.prov.subdir,
                                dataset_id: input._id,
                                keys,

                                files: output_detail.files, //needed by process_input_config to map to correct output
                            }));

                            return true;
                        }

                        function canuse_staged() {
                            //see if there are input task that has the dataset already staged
                            let task = null;
                            let output = null;
                            for(const task_id in tasks) {
                                task = tasks[task_id];
                                if(task.service == "soichih/sca-product-raw" || task.service == "brainlife/app-stage") {
                                    if(isalive(task)) {
                                        output = task.config._outputs.find(o=>o.dataset_id == input._id);
                                        if(output) break;
                                    }
                                }
                            }
                            if(!output) return false;

                            log.debug("found the input data already staged previously", group_id);

                            let dep_config = {task: task._id};
                            if(output.subdir) {  //most app should use subdir by now..
                                if(inputSpec.includes) dep_config.subdirs = appendIncludes(output.subdir, inputSpec.includes);
                                else dep_config.subdirs = [output.subdir];
                            }
                            deps_config.push(dep_config);

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
                        
                        if(!canuse_source() && !canuse_staged()) {
                            //we don't have it.. we need to stage from warehouse
                            log.debug("couldn't find source task/staged data .. need to load from warehouse", group_id);
                            downloads.push(input);

                            //handle subdirs
                            if(inputSpec.includes) subdirs = [...subdirs, ...appendIncludes(input._id, inputSpec.includes)];
                            else subdirs.push(input._id);
                            
                            //TODO I should only put stuff that I need output input..
                            const output = Object.assign({}, input, {
                                datatype: input.datatype._id, //unpopulate datatype to keep it clean
                                subdir: input._id,
                                dataset_id: input._id, 
                                prov: null, //remove dataset prov
                            });
                            _outputs.push(output);
                            _app_inputs.push(Object.assign({keys}, output)); 
                        }
                    });
                }

                //nothing to download, then proceed to submitting the app
                if(downloads.length == 0) return next();

                request.post({
                    url: config.warehouse.api+'/dataset/stage', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body: {
                        instance_id: instance._id,
                        dataset_ids: downloads.map(d=>d._id),
                    }
                }, (err, res, _body)=>{
                    if(err) return next(err);
                    task_stage = _body.task;
                    if(!task_stage) return next("failed to submit staging task");
                    next_tid++;

                    //reset task_id  (TODO - what is this for?)
                    _app_inputs.forEach(_input=>{
                        if(!_input.task_id) _input.task_id = task_stage._id;
                    });

                    deps_config.push({
                        task: task_stage._id,
                        subdirs,
                    });

                    log.debug("submitted staging task", group_id);
                    next();
                });
            },

            //set metadata
            //similar code in ui/modal/appsubmit
            //similar code in ui/newtask.vue
            next=>{
                //copy some hierarchical metadata from input
                for(const input_id in inputs) {
                    inputs[input_id].forEach(input=>{
                        //let's copy hierarchical metadata only
                        ["subject", "session", "run"].forEach(k=>{
                            if(!meta[k]) meta[k] = input.meta[k]; //use first one
                        });
                    });
                }

                //we need to use the subject/session for the current group as input might have come from other subject/session
                meta.subject = group.subject;
                if(group.session) meta.session = group.session; //don't set if it's empty

                next();
            },

            //submit the app task!

            //Similar code alert...
            //modals/newtask.vue::submit()
            //modals/appsubmit.vuew::submit()
            //(bin)/rule_handler.js
            //cli
            next=>{
                const _config = Object.assign(
                    rule.config||{}, 
                    process_input_config(rule.app, inputs, _app_inputs), 
                    {
                        _app: rule.app._id,
                        _rule: {
                            id: rule._id,
                            subject: group.subject,
                            session: group.session,
                        },
                        _inputs: _app_inputs,
                        _outputs: [],
                        _tid: next_tid++,
                    }
                );

                rule.app.outputs.forEach(output=>{
                    const output_req = {
                        id: output.id,
                        datatype: output.datatype,
                        desc: output.desc,
                        meta,
                        tags: rule.output_tags[output.id], 
                    }

                    if(rule.archive === undefined) {
                        //for backward compatibility.. assume do == true
                        output_req.archive = {
                            project: rule.project._id,  
                            desc: rule.name,
                        }
                    } else if(rule.archive[output.id] && rule.archive[output.id].do) {
                        output_req.archive = {
                            project: rule.project._id,  
                            desc: rule.archive[output.id].desc||rule.name,
                        }
                    }

                    if(output.output_on_root) {
                        //old apps used to store things under workdir.. files can be used to avoid file conflicts
                        output_req.files = output.files; //optional
                    } else {
                        //all new Apps should create subdirectory matching output.id and store all outputs there (no more .files needed)
                        output_req.subdir = output.id; 
                    }

                    //handle tag passthrough (and meta)
                    let tags = [];
                    if(output.datatype_tags_pass) {
                        const datasets = inputs[output.datatype_tags_pass];
                        if(!datasets) {
                            console.error("datatype_tags_pass set but can't find the input:"+output.datatype_tags_pass);
                            console.log("inputs dump");
                            console.dir(inputs);
                        } else {
                            //for multi inputs.. let's just aggregate all meta for now
                            datasets.forEach(dataset=>{
                                if(dataset.datatype_tags) dataset.datatype_tags.forEach(tag=>{
                                    if(!tags.includes(tag)) tags.push(tag);
                                });
                                Object.assign(output_req.meta, dataset.meta);
                            });
                        }
                    }

                    //.. and add app specified output tags at the end
                    if(output.datatype_tags) tags = tags.concat(output.datatype_tags);
                    output_req.datatype_tags = uniq(tags);
                    _config._outputs.push(output_req);
                });

                //figure out gids
                const gids = [rule.project.group_id];
                if(!rule.project.noPublicResource) gids.push(1);
                
                //now submit the app task!
                request.post({
                    url: config.amaretti.api+'/task', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body: {
                        instance_id: instance._id,
                        gids, 
                        name: rule.app.name,
                        desc: "Submitted by pipeline rule: "+rule.app.name+" - "+rule.name,
                        service: rule.app.github,
                        
                        //rule.app.github_branch is no longer used, but rule.branch might not be set for old rules
                        service_branch: rule.branch||rule.app.github_branch,

                        retry: rule.app.retry,
                        nice: config.rule.nice,

                        config: _config,
                        deps_config,
                    }
                }, (err, res, _body)=>{
                    task_app = _body.task;
                    log.debug("submitted app task "+task_app._id, group_id);
                    log.set({
                        state: "submitted", 
                        taskStatus: "requested",
                        taskId: task_app._id,
                    }, group_id);
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
    const out = {};
    for(const k in app.config) {
        const node = app.config[k];
        if(node.type && node.type == "input") {
            const input = app.inputs.find(it=>it.id == node.input_id);
            if(input.multi) out[k] = [];

            //TODO - multi could have more than 1 dataset... (let's just process first one for now?)
            const datasets = _app_inputs.filter(d=>d.id == node.input_id);
            if(!datasets.length) continue; //optional input that's ignored?

            datasets.forEach(dataset=>{
                let base = "../"+dataset.task_id;
                if(dataset.subdir) base+="/"+dataset.subdir;

                const info = input_info[node.input_id][0]; //using first one - should be all the same datatype info
                const file = info.datatype.files.find(file=>file.id == node.file_id);
                if(!file) {
                    console.error("referencing to missing file "+node.file_id);
                    return;
                }
                let path = base+"/"+(file.filename||file.dirname);
                if(dataset.files && dataset.files[node.file_id]) {
                    path = base+"/"+dataset.files[node.file_id];
                }
                if(input.multi) out[k].push(path);
                else out[k] = path;
            });
        }
    }
    return out;
}

function appendIncludes(subdir, includes) {
    return includes.split("\n").map(include=>{
        return "include:"+subdir+"/"+include;
    });
}


