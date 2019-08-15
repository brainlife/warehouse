#!/usr/bin/env node

const amqp = require('amqp');
const winston = require('winston');
const mongoose = require('mongoose');
const async = require('async');
const request = require('request-promise-native');
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

        //handle other misc events all together..
        next=>{
            acon.queue('warehouse', {durable: true, autoDelete: false}, q=>{
                q.bind('auth', 'user.create.*');
                q.bind('auth', 'user.login.*');
                q.subscribe({ack: true}, (msg, head, dinfo, ack)=>{
                    handle_event(msg, head, dinfo, err=>{
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
        inc_count("task.user."+task.user_id+"."+task.status);  
        //number of task change for each app
        if(task.config && task.config._app) inc_count("task.app."+task.config._app+"."+task.status); 
        //number of task change for each resource
        if(task.resource_id) inc_count("task.resource."+task.resource_id+"."+task.status); 
        //number of task change events for each project
        if(task._group_id) inc_count("task.group."+task._group_id+"."+task.status); 

        if(task.config && task.config._rule) {
            logger.debug("rule task status changed");
            debounce("update_rule_stats."+task.config._rule.id, ()=>{
                common.update_rule_stats(task.config._rule.id);
            }, 1000); 
        }
    }

    //handle event
    async.series([
        next=>{
            if(task.status == "finished" && task.config && task.config._outputs) {
                logger.info("handling task outputs");
                let outputs = [];

                async.eachSeries(task.config._outputs, (output, next_output)=>{
                    //check to make sure that the output is not already registered
                    db.Datasets.findOne({
                        "prov.task_id": task._id,
                        "prov.output_id": output.id,
                        //ignore failed and removed ones
                        $or: [
                            { removed: false }, 
                            //or.. if archived but removed and not failed, user must have a good reason to remove it.. (don't rearchive)
                            { removed: true, status: {$ne: "failed"} }, 
                        ]
                    }).exec((err,_dataset)=>{
                        if(!_dataset) outputs.push(output);
                        else logger.info("already archived or removed by user. output_id:"+output.id+" dataset_id:"+_dataset._id.toString());
                        next_output(err);
                    });
                }, err=>{
                    if(err) return next(err);

                    //archive outputs not yet archived
                    common.archive_task_outputs(task, outputs, next);
                });
            } else next();
        },

        next=>{
            if(task.service == "brainlife/app-archive") {
                logger.info("handling app-archive envets");
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
                        if(task.product) { //app-archive didn't create task.product before
                            let dataset_product = task.product[dataset_config.dataset._id];
                            if(dataset_product) _set.size = dataset_product.size;
                        }
                        break;
                    case "failed":
                        _set.status = "failed";
                        _set.desc = task.status_msg;
                        break;
                    }
                    //console.log(JSON.stringify(dataset_config, null, 4));
                    db.Datasets.findByIdAndUpdate(dataset_config.dataset._id, {$set: _set}, next_dataset);
                    //db.Datasets.findByIdAndUpdate(dataset_config.id, {$set: _set}, next_dataset);
                }, next);
            } else next();
        },

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

        debounce("update_project_stats."+instance.group_id, ()=>{
            common.update_project_stats(instance.group_id);
        }, 1000); 
    }
    //console.log(JSON.stringify(instance, null, 4));

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

function handle_event(msg, head, dinfo, cb) {
    logger.debug(JSON.stringify(msg, null, 4));
    let exchange = dinfo.exchange;
    let keys = dinfo.routingKey.split(".");
    if(dinfo.exchange == "auth" && dinfo.routingKey.startsWith("user.create.")) {
        let sub = keys[2];
        let email = msg.email;
        let fullname = msg.fullname;
        invite_slack_user(email, fullname);
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


