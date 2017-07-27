#!/usr/bin/env node

const amqp = require('amqp');
const winston = require('winston');
const mongoose = require('mongoose');
const async = require('async');
const request = require('request');

const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');
const common = require('../api/common');

db.init(err=>{
    if(err) throw err;

    const acon = amqp.createConnection(config.event.amqp, {reconnectBackoffTime: 1000*10});
    acon.on('error', err=>{
        throw err;
    });
    acon.on('ready', ()=>{
        logger.info("amqp connection ready");

        //ensure queues/binds and subscribe
        async.series([

            next=>{
                acon.queue('warehouse.task', {durable: true, autoDelete: false}, task_q=>{
                    logger.debug("binding wf.task > warehouse.task");
                    task_q.bind('wf.task', '#');
                    task_q.subscribe({ack: true}, (task, head, dinfo, ack)=>{
                        handle_task(task, err=>{
                            if(err) logger.error(err)
                            else task_q.shift();
                        });
                    });

                    next();
                });
            },

            next=>{
                acon.queue('warehouse.instance', {durable: true, autoDelete: false}, instance_q=>{
                    logger.debug("binding wf.instance > warehouse.instance");
                    instance_q.bind('wf.instance', '#');
                    instance_q.subscribe({ack: true}, (instance, head, dinfo, ack)=>{
                        handle_instance(instance, err=>{
                            if(err) logger.error(err)
                            else instance_q.shift();
                        });
                    });

                    next();
                });
            },

        ], err=>{
            if(err) throw err;
            logger.info("queues ready");
        });
    });

});


function handle_task(task, cb) {
    //console.dir(task);
    //handle task archival request
    if( task.status == "finished" && 
        task.name == "brainlife.stage_output" &&
        task.config._prov) {
        logger.info("handling task", task._id, task.status, task.name);
        //console.dir(task.config._prov);  

        async.eachOfSeries(task.config._prov.output_datasets, (dataset, output_id, next_dataset)=>{
            //logger.debug(output_id, dataset);
            if(!dataset.archive) return next_dataset();
            archive_dataset(task, output_id, dataset, next_dataset);
        }, cb);
    } else {
        logger.debug("ignoring task", task._id, task.status, task.name);
        cb();
    }
}

function archive_dataset(task, output_id, dataset, cb) {
    logger.debug("archive request made", dataset);
    
    //see if this dataset is already archived
    //logger.debug("before----------------------------");
    db.Datasets.findOne({
        "prov.task_id": task._id,
        "prov.dirname": output_id,
    }).exec((err,_dataset)=>{
        logger.debug(err, _dataset);
        if(err) return cb(err);
        if(_dataset) {
            logger.info("already archived");
            return cb();
        }
        logger.debug("not yet archived.. archciving");

        //looks like we haven't archive this dataset yet.. create a dataset record!
		var _dataset = new db.Datasets({
			user_id: task.user_id,

			project: dataset.archive.project,
			datatype: dataset.datatype,
			datatype_tags: dataset.datatype_tags,

            tags: dataset.archive.tags,

			desc: "",
			prov: {
				app: dataset.app_id,
				task_id: task._id,
				dirname: output_id,
			},
			meta: dataset.meta||{},
		});

        /*
        //"tags" is optional
        if(dataset.archive.tags && dataset.archive.tags[output_id]) {
            _dataset.tags = dataset.archive.tags[output_id];
        }
		console.dir(_dataset.toString());
        */

		//issue jwt to download dataset
		request.get({
			url: config.auth.api+"/jwt/"+task.user_id, json: true,
			headers: { authorization: "Bearer "+config.auth.jwt },
		}, (err, res, body)=>{
			if(err) return next(err);
			if(res.statusCode != 200) return cb("couldn't obtain user jwt code:"+res.statusCode);
			var auth = "Bearer "+body.jwt;

			//now create dataset and start data transfer
			logger.debug("saving dataset record and archiving");
			_dataset.save(err=>{
				if(err) return cb(err);
				common.archive(task, _dataset, auth, output_id, cb);
			});
		});
    });
}

function handle_instance(instance, cb) {
    console.dir(instance);
    //cb();
}
