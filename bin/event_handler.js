#!/usr/bin/env node

const amqp = require('amqp');
const winston = require('winston');
const mongoose = require('mongoose');
const async = require('async');
const request = require('request-promise-native'); //TODO switch to rp
const rp = require('request-promise-native');
const redis = require('redis');
const fs = require('fs');

const config = require('../api/config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../api/models');
const common = require('../api/common');

// TODO  Look for failed tasks and report to the user/dev?

var acon, rcon;

logger.info("connected to mongo");
db.init(err=>{
    
    //init and start 
    /*
    acon = amqp.createConnection(config.event.amqp, {reconnectBackoffTime: 1000*10});
    acon.on('error', logger.error);
    acon.on('ready', ()=>{
        logger.info("connected to amqp");
        subscribe();
    });
    */
    common.get_amqp_connection((err, conn)=>{
        acon = conn;
        logger.info("connected to amqp");
        subscribe();
    });

    rcon = redis.createClient(config.redis.port, config.redis.server);
    rcon.on('error', logger.error);
    rcon.on('ready', ()=>{
        logger.info("connected to redis");
    });

    setInterval(emit_counts, 1000*config.metrics.counts.interval); 
});

function subscribe() {
    async.series([
        //ensure queues/binds and subscribe to instance events
        next=>{
            logger.debug("subscribing to instance event");
            //let's create permanent queue so that we don't miss event if event handler goes down
            //TODO - why can't I use warehouse queue for this?
            acon.queue('warehouse.instance', {durable: true, autoDelete: false}, instance_q=>{
                instance_q.bind('wf.instance', '#');
                instance_q.subscribe({ack: true}, (instance, head, dinfo, ack)=>{
                    handle_instance(instance, err=>{
                        //logger.debug("done handling instance");
                        if(err) {
                            logger.error(err)
                            //continue .. TODO - maybe I should report the failed event to failed queue?
                        }
                        instance_q.shift();
                    });
                });
                next();
            });
        },
     
        //ensure queues/binds and subscribe to task events
        next=>{
            //TODO - why can't I use warehouse queue for this?
            acon.queue('warehouse.task', {durable: true, autoDelete: false}, task_q=>{
                task_q.bind('wf.task', '#');
                task_q.subscribe({ack: true}, (task, head, dinfo, ack)=>{
                    handle_task(task, err=>{
                        //logger.debug("done handling task");
                        if(err) {
                            logger.error(err)
                            //TODO - maybe I should report the failed event to failed queue?
                        }
                        task_q.shift();
                    });
                });
                next();
            });
        },

        //dataset create events
        next=>{
            //TODO - why can't I use warehouse queue for this?
            acon.queue('warehouse.dataset', {durable: true, autoDelete: false}, dataset_q=>{
                dataset_q.bind('warehouse.dataset', '#');
                dataset_q.subscribe({ack: true}, (dataset, head, dinfo, ack)=>{
                    handle_dataset(dataset, err=>{
                        if(err) {
                            logger.error(err)
                            //TODO - maybe I should report the failed event to failed queue?
                        }
                        dataset_q.shift();
                    });
                });
                next();
            });
        },
        
        next=>{
            //TODO - why can't I use warehouse queue for this?
            acon.queue('warehouse.rule', {durable: true, autoDelete: false}, q=>{
                q.bind('warehouse', 'rule.update.#');
                q.subscribe({ack: true}, (rule, head, dinfo, ack)=>{
                    let exchange = dinfo.exchange;
                    let keys = dinfo.routingKey.split(".");
                    let project_id = keys[2];
                    let rule_id = keys[3];

                    debounce("update_project_stats.p_"+project_id, async ()=>{
                        let project = await db.Projects.findOne({_id: project_id});
                        common.update_project_stats(project);
                    }, 1000); 

                    q.shift();
                });
                next();
            });
        },

        next=>{
            acon.queue('auth', {durable: true, autoDelete: false}, q=>{
                q.bind('auth', 'user.create.*');
                q.bind('auth', 'user.login.*');
                q.subscribe({ack: true}, (msg, head, dinfo, ack)=>{
                    handle_auth_event(msg, head, dinfo, err=>{
                        if(err) {
                            logger.error(err)
                            //TODO - maybe I should report the failed event to failed queue?
                        }
                        q.shift();
                    });
                });
                next();
            });
        },

    ], err=>{
        if(err) throw err;
        logger.info("done subscribing");
    });
}

let counts = {};
function inc_count(path) {
    if(counts[path] === undefined) counts[path] = 0;
    counts[path]++;
}

function emit_counts() {
    health_check();

    //emit graphite metrics
    let out = "";
    for(let key in counts) {
        out += config.metrics.counts.prefix+"."+key+" "+counts[key]+" "+new Date().getTime()/1000+"\n";
    }
    fs.writeFileSync(config.metrics.counts.path, out);

    counts = {}; //reset all counters
}

function health_check() {
    var report = {
        status: "ok",
        messages: [],
        date: new Date(),
        counts: {
            tasks: counts["health.tasks"],
            instances: counts["health.instances"],
        },
        maxage: 1000*60*20,  //should be double the check frequency to avoid going stale while development
    }

    if(counts["health.tasks"] == 0) {
        report.status = "failed";
        report.messages.push("task event counts is low");
    }

    rcon.set("health.warehouse.event."+(process.env.NODE_APP_INSTANCE||'0'), JSON.stringify(report));
}

function handle_task(task, cb) {
    logger.debug("%s task:%s %s %s %s", (task._status_changed?"+++":"---"), task._id, task.service, task.status, task.status_msg);

    //handle counters
    inc_count("health.tasks");

    //event counts to store on graphite. these numbers can be aggregated to show various bar graphs
    if(task._status_changed) {
        
        //number of task change for each user
        //inc_count("task.user."+task.user_id+"."+task.status); //too much data
        
        //number of task change for each app
        if(task.config && task.config._app) inc_count("task.app."+task.config._app+"."+task.status); 
        
        //number of task change for each resource
        if(task.resource_id) inc_count("task.resource."+task.resource_id+"."+task.status); 
        
        //number of task change events for each project
        //if(task._group_id) inc_count("task.group."+task._group_id+"."+task.status);  //too much data

        if(task.config && task.config._rule) {
            logger.debug("rule task status changed");
            debounce("update_rule_stats."+task.config._rule.id, ()=>{
                common.update_rule_stats(task.config._rule.id);
            }, 1000); 
        }
    }

    let task_product = task.product; //fallback for old task (task.product is deprecated)

    //handle event
    async.series([

        //submit output validators
        next=>{
            //if(!config.debug) return next(); //this is experimental

            if(task.status != "finished" || !task.config || !task.config._outputs ||  
                //don't run on staging tasks
                task.deps_config.length == 0 || 
                //don't run on validator task output!
                task.name == "__dtv") {
                return next();
            } 

            //let products = common.split_product(task.product, task.config._outputs);

            //handle validator submission
            async.eachSeries(task.config._outputs, async (output)=>{

                let datatype = await db.Datatypes.findById(output.datatype);
                if(!datatype.validator) return; //no validator for this datatype..
                
                //see if we already submitted validator for this output
                //task can be resubmitted, and if it does, amaretti will
                //automatically rerun it
                //TODO - even if it's failed?
                let find = {
                    "name": "__dtv",
                    "deps_config.task": task._id,
                    "config._outputs.id": output.id,

                    instance_id: task.instance_id,
                
                    service: datatype.validator, //"brain-life/validator-neuro-anat", 
                    service_branch: datatype.validator_branch, //"master",
                };

                let subdirs;
                if(output.subdir) {
                    //find['deps_config.subdir'] = [output.subdir];
                    subdirs = [output.subdir];
                }
                let tasks = await rp.get({
                    url: config.amaretti.api+"/task?find="+JSON.stringify(find)+"&limit=1",
                    json: true,
                    headers: {
                        authorization: "Bearer "+config.warehouse.jwt,
                    }
                });

                if(tasks.tasks.length) {
                    console.log("validator already submitted");
                    return;
                }

                let validator_config = {
                    _app: task.config._app,
                    _outputs: [Object.assign({}, output, {
                        subdir: "output", //validator should always output under "output"
                    })],

                    //I decided to handle this at the loading time
                    //pass the followed task's product to validator so it can analyze / merge it!
                    //product: products[output.id],
                    //product: "../"+task._id, //let validator find it by itself
                };
                datatype.files.forEach(file=>{
                    if(output.subdir) {
                        validator_config[file.id] = "../"+task._id+"/"+output.subdir+"/"+file.filename;
                    } else {
                        //deprecated output uses file mapping
                        if(output.files && output.files[file.id]) {
                            validator_config[file.id] = "../"+task._id+"/"+output.files[file.id];
                        } else {
                            //use default path
                            validator_config[file.id] = "../"+task._id+"/"+file.filename;
                        }
                    }
                });
                
                //submit datatype validator - if not yet submitted
                let remove_date = new Date();
                remove_date.setDate(remove_date.getDate()+7); //remove in 7 days(?)
                let dtv_task = await rp.post({
                    url: config.amaretti.api+"/task",
                    json: true,
                    body: Object.assign(find, {
                        deps_config: [ {task: task._id, subdirs} ],
                        config: validator_config,
                        max_runtime: 1000*3600, //1 hour should be enough for most..
                        remove_date,

                        //we want to run on the same resource that task has run on
                        follow_task_id: task._id,

                        //we need to submit with admin jwt so we can set follow_task_id, 
                        //but the task itself needs to be owned by the user so that user
                        //can archive output
                        user_id: task.user_id, 
                        //gids: task.gids, 
                    }),
                    headers: {
                        //authorization: "Bearer "+user_jwt,

                        //use warehouse as submitter so we can run validator on as follow up
                        authorization: "Bearer "+config.warehouse.jwt,
                    }
                });
                console.log("submitted new validator------------------------------");
                console.dir(dtv_task);
            }, err=>{
                if(err) return next(err);
                next();
            });
        },
        
        //handle validator output
        next=>{
            if(task.status != "finished" || task.name != "__dtv" || !task.follow_task_id) {
                return next();
            }

            //TODO transfer secondary content to a dedicated storage (TBD..)
            //also.. product is stored in taskproduct collection.. copy it somewhere else?

            next();
        },

        //load task product
        next=>{
            rp.get({
                url: config.amaretti.api+"/task/product", json: true,
                qs: {
                    ids: [task._id],
                },
                headers: {
                    authorization: "Bearer "+config.warehouse.jwt,
                }
            }).then(res=>{
                if(res.data && res.data.length == 1) {
                    task_product = res.data[0].product;
                }
                next();
            }).catch(err=>{
                next(err);
            });
       },
        
        //submit output archivers
        next=>{
            if(task.status == "finished" && task.config && task.config._outputs) {

                if(task.name == "__dtv" && task_product.errors.length > 0) {
                    console.log("validator reports error .. skipping archive");
                    return next();
                }

                logger.info("handling task outputs - archiver");
                let outputs = [];

                //check to make sure that the output is not already registered
                async.eachSeries(task.config._outputs, async (output)=>{
                    let datatype = await db.Datatypes.findById(output.datatype);
                    if(task.name != "__dtv" && datatype.validator) return; //validator will handle archiving

                    let _dataset = await db.Datasets.findOne({
                        "prov.task._id": task._id,
                        "prov.output_id": output.id,
                        //ignore failed and removed ones
                        $or: [
                            { removed: false }, //already archived!
                            //or.. if archived but removed and not failed, user must have a good reason to remove it.. (don't rearchive)
                            //or.. removed while being stored (maybe got stuck storing?)
                            { removed: true, status: {$nin: ["storing", "failed"]} }, 
                        ]
                    });
                    if(_dataset) {
                        logger.info("already archived or removed by user. output_id:"+output.id+" dataset_id:"+_dataset._id.toString());
                        return;
                    } 

                    outputs.push(output);

                }, err=>{
                    if(err) return next(err);

                    //archive outputs not yet archived
                    common.archive_task_outputs(task.user_id, task, outputs, next);
                });
            } else next();
        },

        //report archive status back to user through dataset_config
        next=>{
            if(task.service == "brainlife/app-archive") {
                logger.info("handling app-archive events");
                async.eachSeries(task.config.datasets, (dataset_config, next_dataset)=>{
                    let _set = {
                        status_msg: task.status_msg,
                    };
                    switch(task.status) {
                    case "requested":
                        _set.archive_task_id = task._id;
                        break;
                    case "finished":
                        _set.status = "stored";
                        if(dataset_config.storage) _set.storage = dataset_config.storage;
                        if(dataset_config.storage_config) _set.storage_config = dataset_config.storage_config; //might not be set
                        if(task_product) { //app-archive didn't create task.product before
                            let dataset_product = task_product[dataset_config.dataset._id];
                            if(dataset_product) _set.size = dataset_product.size;
                        }
                        break;
                    case "failed":
                        _set.status = "failed";
                        break;
                    }
                    common.publish("dataset.update."+task.user_id+"."+dataset_config.project+"."+dataset_config.dataset._id, _set);
                    db.Datasets.findByIdAndUpdate(dataset_config.dataset._id, {$set: _set}, next_dataset);
                }, next);
            } else next();
        },

        //poke rule to trigger re-evaluation
        next=>{
            if(task.status == "removed" && task.config && task.config._rule) {
                logger.info("rule submitted task is removed. updating update_date:"+task.config._rule.id);
                db.Rules.findOneAndUpdate({_id: task.config._rule.id}, {$set: {update_date: new Date()}}, next);
            } else next();
        },
    ], cb);
}

let debouncer = {};

//run a given action as frequently as the specified delay
function debounce(key, action, delay) {
    let now = new Date().getTime();
    let d = debouncer[key];
    if(!d) {
        d = {
            lastrun: 0,
            timeout: null,
        };
        debouncer[key] = d;
    }

    //logger.debug("debounc check %d %d", d.lastrun, now);
    if(d.lastrun+delay < now) {
        //hasn't run (for a while).. run it immediately
        d.lastrun = now;
        //logger.debug("hasn't run (a while).. running immediately");
        action();
    } else {
        //debounce
        //logger.debug("debouncing");
        if(d.timeout) {
            logger.debug("already scheduled.. skipping");
            //clearTimeout(d.timeout);
        } else {
            let need_delay = d.lastrun + delay - now;
            //logger.debug("recently ran.. delaying");
            d.timeout = setTimeout(action, need_delay);
            d.lastrun = now + need_delay;
            setTimeout(()=>{
                d.timeout = null;
            }, need_delay);
        }
    }
}

function handle_instance(instance, cb) {
    logger.debug("%s instance:%s %s", (instance._status_changed?"+++":"---"), instance._id, instance.status);

    inc_count("health.instances");
    
    //event counts to store on graphite. these numbers can be aggregated to show various bar graphs
    if(instance._status_changed) {
        //number of instance events for each resource
        inc_count("instance.user."+instance.user_id+"."+instance.status); 
        //number of instance events for each project
        if(instance.group_id) inc_count("instance.group."+instance.group_id+"."+instance.status); 
        debounce("update_project_stats."+instance.group_id, async ()=>{
            let project = await db.Projects.findOne({group_id: instance.group_id});
            common.update_project_stats(project);
        }, 1000); 
    }
    cb();
}

function handle_dataset(dataset, cb) {
    logger.debug("dataset:%s", dataset._id);
    //logger.debug(JSON.stringify(dataset, null, 4));

    let pid = dataset.project._id||dataset.project; //unpopulate project if necessary
    debounce("update_dataset_stats."+pid, ()=>{
        common.update_dataset_stats(pid);
    }, 1000*10);  //counting datasets are bit more expensive.. let's debounce longer

    cb();
}

function handle_auth_event(msg, head, dinfo, cb) {
    logger.debug(JSON.stringify(msg, null, 4));
    let exchange = dinfo.exchange;
    let keys = dinfo.routingKey.split(".");
    if(dinfo.exchange == "auth" && dinfo.routingKey.startsWith("user.create.")) {
        let sub = keys[2];
        let email = msg.email;
        let fullname = msg.fullname;
        if(config.slack) invite_slack_user(email, fullname);
    }
    cb();
}

function invite_slack_user(email, real_name) {
    //https://github.com/ErikKalkoken/slackApiDoc/blob/master/users.admin.invite.md
    //TODO - I can't get first_name / last_name to work
    logger.debug("sending slack invite to "+email);
    request({
        method: "POST",
        uri: "https://brainlife.slack.com/api/users.admin.invite",
        form:{
            token: config.slack.token, email, real_name, resend: true, //channels: "general,apps",
        },  
    }).then(res=>{
        console.dir(res);
    }); 
}


