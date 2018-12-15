#!/usr/bin/env node

const amqp = require('amqp');
const winston = require('winston');
const mongoose = require('mongoose');
const async = require('async');
const request = require('request-promise-native');
const redis = require('redis');

const config = require('../api/config');
const logger = winston.createLogger(config.logger.winston);
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

    /* 
    if(_counts.instances == 0) {
        report.status = "failed";
        report.messages.push("instance event counts is low");
    }
    */

    rcon.set("health.warehouse.event."+(process.env.NODE_APP_INSTANCE||'0'), JSON.stringify(report));

    //reset counter
    _counts.tasks = 0;
    _counts.instances = 0;
}

function handle_task(task, cb) {
    _counts.tasks++;
    logger.debug(["task", task._id, task.status, task.status_msg]);

    if(task.status == "finished") {
        logger.info("handling finished task");
        handle_task_finished(task, cb);
    } else if(task.status == "removed" && task.config && task.config._rule) {
        logger.info("rule submitted task is removed. updating update_date:"+task.config._rule.id);
        db.Rules.findOneAndUpdate({_id: task.config._rule.id}, {$set: {update_date: new Date()}}, cb);
    } else {
        cb();
    }
}

function handle_task_finished(task, cb) {
    if(task.config && task.config._outputs) handle_task_output(task, cb);
    if(task.service == "brainlife/app-archive") {
        //TODO - finalize the dataset
    }
}

function handle_task_output(task, cb) {

    logger.debug("handling task outputs");
    if(!Array.isArray(task.config._outputs)) {
        return cb("task.config._outputs is not array "+JSON.stringify(task.config, null, 4));
    }
    let products = common.split_product(task.product||{}, task.config._outputs);

    //get all project ids set by user
    let project_ids = [];
    task.config._outputs.forEach(output=>{
        if(output.archive) project_ids.push(output.archive.project);
    });
    
    //check project access
    common.validate_projects(task.user_id, project_ids, err=>{
        if(err) return cb(err);
        
        //register datasets
        let datasets = []; 
        async.eachSeries(task.config._outputs, (output, next_output)=>{
            if(!output.archive) return next_output();
            register_dataset(task, output, products[output.id], (err, dataset)=>{
                if(err || !dataset) return next_output(); //couldn't register, or already registered

                if(!output.subdir) {
                    //if output doesn't have subdir set, we need to use the old archiving method...
                    logger.debug("requesting for archive_handler to archive it");
                    acon.publish('warehouse.archive', {dataset_id: dataset._id});
                } else {
                    //for new archiver
                    logger.debug("new archive");
                    datasets.push({
                        project: output.archive.project,
                        id: dataset._id,
                        dir: "../"+task._id+"/"+output.subdir,
                    });
                }
                next_output();
            });
        }, async err=>{
            if(err) return cb(err);
            if(datasets.length == 0) return cb();

            try {
                //load user's gids so that we can add warehouse group id (authorized to access archive)
                let gids = await request.get({
                    url: config.auth.api+"/user/groups/"+task.user_id,
                    json: true,
                    headers: {
                        authorization: "Bearer "+config.warehouse.jwt,
                    }
                });

                ///add warehouse group that allows user to submit
                gids = gids.concat(config.archive.gid);  

                //issue user token 
                let {jwt: user_jwt} = await request.get({
                    url: config.auth.api+"/jwt/"+task.user_id,
                    json: true,
                    qs: {
                        claim: JSON.stringify({gids}),
                    },
                    headers: {
                        authorization: "Bearer "+config.warehouse.jwt,
                    }
                });

                logger.debug("submitting app-archive");
                let archive_task = await request.post({
                    url: config.amaretti.api+"/task",
                    json: true,
                    body: {
                        deps : [ task._id ],
                        //name : "archiving",
                        //desc : "archiving",
                        service : "brainlife/app-archive",
                        instance_id : task.instance_id,
                        config: {
                            datasets,
                        },
                    },
                    headers: {
                        authorization: "Bearer "+user_jwt,
                    }
                });
                logger.debug(archive_task);
                cb();
            } catch(err) {
                cb(err);
            }
        });
    });
}

function register_dataset(task, output, product, cb) {

    //first check to make sure the dataset is already registered
    db.Datasets.findOne({
        "prov.task_id": task._id,
        "prov.output_id": output.id,
        
        //ignore failed and removed ones
        //TODO - very strange query indeed.. but it should work
        $or: [
            { removed: false }, //already archived!
            
            //or.. if archived but removed and not failed, user must have a good reason to remove it.. (don't rearchive)
            { removed: true, status: {$ne: "failed"} }, 
        ]
        
    }).exec((err,_dataset)=>{
        if(err) return cb(err);
        if(_dataset) {
            logger.info("already archived or removed by user. output_id:"+output.id+" dataset_id:"+_dataset._id.toString());
            return cb();
        }

        logger.debug("not yet archived.. registering new dataset");
        new db.Datasets({
            user_id: task.user_id,
            desc: output.archive.desc,

            project: output.archive.project,
            datatype: output.datatype,

            datatype_tags: product.datatype_tags,
            tags: product.tags,
            meta: product.meta,

            product,

            //status: "waiting",
            status_msg: "Waiting for the archiver ..",
            
            prov: {
                task, 
                output_id: output.id, 
                subdir: output.subdir, //optional

                instance_id: task.instance_id, //deprecated use prov.task.instance_id
                task_id: task._id, //deprecated. use prov.task._id

            },
        }).save(cb); 
    });
}

function handle_instance(instance, cb) {
    _counts.instances++;
    //logger.debug("instance handling TODO",instance);
    cb();
}

