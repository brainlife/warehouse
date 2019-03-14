#!/usr/bin/env node

const winston = require('winston');
const async = require('async');
const request = require('request');
const fs = require('fs');
const redis = require('redis');
const jsonwebtoken = require('jsonwebtoken');

const config = require('../api/config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../api/models');
const common = require('../api/common');

db.init(function(err) {
    if(err) throw err;
    rcon = redis.createClient(config.redis.port, config.redis.server);
    rcon.on('error', err=>{throw err});
    rcon.on('ready', ()=>{
        logger.info("connected to redis");
        run();
    });
});

function run() {
    logger.info("querying projects");
	db.Projects.find({ removed: false, }).exec((err, projects)=>{
		if(err) throw err;
        async.eachSeries(projects, handle_project, err=>{
            if(err) logger.error(err);
            db.disconnect(()=>{
                logger.debug("all done");
                process.exit(0);//disconnecting won't kill all event loops!
            });
        });
	});
}

function handle_project(project, cb) {
    logger.debug("...................................... %s %s", project.name, project._id.toString());
    async.series([
        next=>{
            common.update_project_stats(project.group_id, next);
        },
        next=>{
            common.update_dataset_stats(project._id, next);
        },
        /*
        next=>{
            common.update_rule_stats(project._id, next);
        },
        */
    ], cb);
}


