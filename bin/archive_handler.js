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

logger.info("starting event handler");

setInterval(health_check, 1000*60*10); 
setTimeout(health_check, 1000*5); //check after 5 secs

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
        //ensure queues/binds and subscribe to task events
        next=>{
            logger.debug("subscribing to archive requests");
            acon.queue('warehouse.archive', {durable: true, autoDelete: false}, task_q=>{
                logger.debug("binding wf.task > warehouse.task");
                task_q.bind('warehouse.archive');
                task_q.subscribe({ack: true}, (msg, head, dinfo, ack)=>{
                    logger.debug("handling ardchive request", msg);
                    archive_dataset(msg, err=>{
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

function health_check() {
    let report = {
        status: "ok",
        messages: [],
        date: new Date(),
        //counts: _counts,
        maxage: 1000*60*20,  //should be double the check frequency to avoid going stale while development
    }

    acon.queue('warehouse.archive', {passive: true}, (q, message_count, consumer_count)=>{
        if(message_count > 50) {
            report.status = "failed";
            report.messages.push("too many archive request:"+message_count);
        }
        rcon.set("health.warehouse.archive."+(process.env.NODE_APP_INSTANCE||'0'), JSON.stringify(report));
    });
}

function archive_dataset(msg, cb) {
    let { dataset_id } = msg;

    let dataset = null;
	let auth = null;

    async.series([
        next=>{
            logger.debug("querying dataset");
            db.Datasets.findById(dataset_id, (err, _dataset)=>{
                if(err) return next(err);
                if(!_dataset) return next("no such dataset id");
                if(_dataset.removed) {
                    logger.warn("archive requested..  but dataset is already removed..");
                    return cb(); //skip
                }
                dataset = _dataset;
                next();
            });
        },

		next=>{
			logger.debug("issue jwt to download dataset");
			request.get({
				url: config.auth.api+"/jwt/"+dataset.user_id, json: true,
				headers: { authorization: "Bearer "+config.auth.jwt },
			}, (err, res, body)=>{
				if(err) return next(err);
				if(res.statusCode != 200) return next("couldn't obtain user jwt code:"+res.statusCode);
				auth = "Bearer "+body.jwt;
				next();
			});
		},

		next=>{
            logger.debug("running archive_task ");
            common.archive_task(dataset, auth, next);
		},
    ], cb);
}
