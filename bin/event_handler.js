#!/usr/bin/env node

const amqp = require('amqp');
const winston = require('winston');
const mongoose = require('mongoose');
const async = require('async');
const request = require('request');
const redis = require('redis');

const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');
const common = require('../api/common');

// TODO  Look for failed tasks and report to the user/dev?

logger.info("starting event handler");

setInterval(health_check, 1000*60*10); //It has to be long enough - when it needs to transfer data

db.init(err=>{
    logger.info("connected to mongo");
});

//init and start 
var acon = amqp.createConnection(config.event.amqp, {reconnectBackoffTime: 1000*10});
acon.on('error', logger.error);
acon.on('ready', ()=>{
    logger.info("connected to amqp");
    subscribe();
});

var rcon = redis.createClient(config.redis.port, config.redis.server);
rcon.on('error', logger.error);
rcon.on('ready', ()=>{
    logger.info("connected to redis");
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

var _counts = {
    tasks: 0,
    instances: 0,
}

function health_check() {
    var report = {
        status: "ok",
        messages: [],
        date: new Date(),
        counts: _counts,
        maxage: 1000*60*20,  //should be double the check frequency to avoid going stale while development
    }

    if(_counts.tasks == 0) {
        report.status = "failed";
        report.messages.push("task event counts is low");
    }

    rcon.set("health.warehouse.event."+(process.env.NODE_APP_INSTANCE||'0'), JSON.stringify(report));

    //reset counter
    _counts.tasks = 0;
    _counts.instances = 0;
}

function handle_task(task, cb) {
    _counts.tasks++;

    if(task.status == "finished" && task.config && task.config._outputs) {
        logger.info("handling finished task (archive)", task._id, task.status, task.name);
        let products = common.split_product(task.product||{}, task.config._outputs);
        async.eachSeries(task.config._outputs, (output, next_output)=>{
            if(!output.archive) return next_output();
            //archive_dataset(task, output, products[output.id], next_output);
            acon.publish('warehouse.archive', {task, output, product: products[output.id]}, next_output);
        }, cb);

    } else if(task.status == "removed" && task.config && task.config._rule) {
        logger.info("rule submitted task is removed. updating update_date:"+task.config._rule.id);
        db.Rules.findOneAndUpdate({_id: task.config._rule.id}, {$set: {update_date: new Date()}}, cb);
    } else {
        logger.debug("ignoring task", task._id, task.status, task.name);
        cb();
    }
}

function handle_instance(instance, cb) {
    _counts.instances++;

    logger.debug("instance evevnt handling TODO",instance);
    cb();
}

