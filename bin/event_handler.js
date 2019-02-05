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
db.init(err=>{
    logger.info("connected to mongo");
    
    //init and start 
    acon = amqp.createConnection(config.event.amqp, {reconnectBackoffTime: 1000*10});
    acon.on('error', logger.error);
    acon.on('ready', ()=>{
        logger.info("connected to amqp");
        subscribe();
    });

    rcon = redis.createClient(config.redis.port, config.redis.server);
    rcon.on('error', logger.error);
    rcon.on('ready', ()=>{
        logger.info("connected to redis");
    });

    setInterval(emit_counts, 1000*config.metrics.interval); 
});

function subscribe() {
    async.series([
        //ensure queues/binds and subscribe to instance events
        next=>{
            logger.debug("subscribing to instance event");
            acon.queue('warehouse.instance', {durable: true, autoDelete: false}, instance_q=>{
                logger.debug("binding wf.instance > warehouse.instance");
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
            logger.debug("subscribing to task event");
            acon.queue('warehouse.task', {durable: true, autoDelete: false}, task_q=>{
                logger.debug("binding wf.task > warehouse.task");
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
        
    ], err=>{
        if(err) throw err;
        logger.info("done subscribing");
    });
}

let counts = {};
function inc_count(path) {
    if(counts[path] === undefined) counts[path] = 0;
    counts[path]++;
    //logger.debug("counter: %s = %d", path, counts[path]);
}

function emit_counts() {
    health_check();

    //emit graphite metrics
    let out = "";
    for(let key in counts) {
        out += config.metrics.prefix+"."+key+" "+counts[key]+" "+new Date().getTime()/1000+"\n";
    }
    fs.writeFileSync(config.metrics.path, out);

    logger.debug("----------- "+config.metrics.path+" --------------");
    logger.debug(out);

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
    if(task._status_changed) {
        //number of task change for each user
        inc_count("task.user."+task.user_id+"."+task.status);  
        //number of task change for each app
        if(task.config && task.config._app) inc_count("task.app."+task.config._app+"."+task.status); 
        //number of task change for each resource
        if(task.resource_id) inc_count("task.resource."+task.resource_id+"."+task.status); 
        //number of task change events for each resource
        if(task._group_id) inc_count("task.group."+task._group_id+"."+task.status); 
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

function handle_instance(instance, cb) {
    logger.debug("%s instance:%s %s", (instance._status_changed?"+++":"---"), instance._id, instance.status);

    inc_count("health.instances");
    if(instance._status_changed) {
        //number of instance events for each resource
        inc_count("instance.user."+instance.user_id+"."+instance.status); 
        //number of instance events for each resource
        if(instance.group_id) inc_count("instance.group."+instance.group_id+"."+instance.status); 
    }

    cb();
}

