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

//init and start 
var acon = null;
var rcon = null;
async.series([
        
    //connect to mongo
    db.init,
   
    //connect to amqp
    next=>{
        //logger.debug("connecting amqp");
        acon = amqp.createConnection(config.event.amqp, {reconnectBackoffTime: 1000*10});
        acon.on('error', next);
        acon.on('ready', ()=>{
            logger.info("amqp connection ready");
            next();
        });
    },

    //connect to redis
    next=>{
        //logger.debug("connecting redis");
        rcon = redis.createClient(config.redis.port, config.redis.server);
        rcon.on('error', next);
        rcon.on('ready', ()=>{
            logger.info("redis connection ready");
            next();
        });
    },

    //start health check
    next=>{
        setInterval(health_check, 1000*60);
        next();
    },
    
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
    logger.info("application started");
});

/*
var _health = {
    last_task_date: new Date(), //when the last task task was handled
}
*/
var _counts = {
    tasks: 0,
    instances: 0,
}

function health_check() {
    //logger.debug("health check");
    var report = {
        status: "ok",
        messages: [],
        date: new Date(),
        counts: _counts,
        //_health,
        maxage: 1000*60*3, 
    }

    if(_counts.tasks == 0) {
        report.status = "failed";
        report.messages.push("task event counts is low");
    }

    /*
    if(Date.now() - _health.last_task_date > 1000*60*15) {
        report.status = "failed";
        report.messages.push("it's been a while since last task was handled");
    }
    */

    rcon.set("health.warehouse.event."+(process.env.NODE_APP_INSTANCE||'0'), JSON.stringify(report));

    //reset counter
    _counts.tasks = 0;
    _counts.instances = 0;
}

function handle_task(task, cb) {
    _counts.tasks++;
    //_health.last_task_date = new Date();

    if(task.status == "finished" && task.config && task.config._outputs) {
        logger.info("handling task", task._id, task.status, task.name);
        async.eachSeries(task.config._outputs, (output, next_output)=>{
            if(!output.archive) return next_output();
            archive_dataset(task, output, next_output);
        }, cb);
    } else {
        logger.debug("ignoring task", task._id, task.status, task.name);
        cb();
    }
}

function archive_dataset(task, output, cb) {
    logger.debug("archive request made", output);

    var dataset = null;
    var datatype = null;
	var auth = null;

    async.series([
        next=>{
            logger.debug("see if this dataset is already archived");
            db.Datasets.findOne({
                "prov.task_id": task._id,
                "prov.output_id": output.id,
                //removed: false, //archive again if user removes the dataset
            }).exec((err,_dataset)=>{
                if(err) return cb(err);
                if(_dataset) {
                    logger.info("already archived");
                    return cb();
                }
                logger.debug("not yet archived.. proceeding", task._id, output.id);
                next();
            });
        },

        next=>{
            logger.debug("registering dataset now");
            new db.Datasets({
                user_id: task.user_id,

                project: output.archive.project,
                datatype: output.datatype,
                datatype_tags: output.datatype_tags,

                desc: output.archive.desc,
                tags: output.tags||output.archive.tags||[], //output.archive.tags is deprecated (remove it eventually)

                prov: {
                    instance_id: task.instance_id,
                    task_id: task._id,
                    app: task.config._app,
                    output_id: output.id,
                    subdir: output.subdir,
                },
                meta: output.meta||{},
            }).save((err, _dataset)=>{
                dataset = _dataset;
                next(err);
            });
        },

		next=>{
			logger.debug("issue jwt to download dataset");
			request.get({
				url: config.auth.api+"/jwt/"+task.user_id, json: true,
				headers: { authorization: "Bearer "+config.auth.jwt },
			}, (err, res, body)=>{
				if(err) return next(err);
				if(res.statusCode != 200) return cb("couldn't obtain user jwt code:"+res.statusCode);
				auth = "Bearer "+body.jwt;
				next();
			});
		},

		next=>{
            logger.debug("transfering data from task");
            common.archive_task(task, dataset, output.files, auth, next);
		},
    ], cb);
}

function handle_instance(instance, cb) {
    _counts.instances++;

    logger.debug("TODO",instance);
    cb();
}

