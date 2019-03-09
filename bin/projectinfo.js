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
        setInterval(health_check, 1000*60*2); //start checking health 
        setTimeout(health_check, 1000*10); //run shortly after start
        run();
    });
});

var report = {
    status: "ok",
    maxage: 1000*60*10,
    projects_counts: 0,
}

function health_check() {
    report.date = new Date();
    rcon.set("health.warehouse.projectinfo", JSON.stringify(report));
}

function run() {
	db.Projects.find({
        removed: false,
    })
    .exec((err, projects)=>{
		if(err) throw err;
        report.projects_counts = projects.length;
        async.eachSeries(projects, handle_project, err=>{
            if(err) logger.error(err);
            logger.info("done with all projects - sleeping for 5 minutes");
            setTimeout(run, 1000*60*5);
        });
	});
}

function handle_project(project, cb) {
    logger.debug("...................................... %s %s", project.name, project._id.toString());

    let stats = {
        //count of instances for each status
        instances: {
            //others: 0,
        },

        datasets: 0, //total number of datasets
        subjects: 0, //total number of subjects

        //count of pipeline rules
        rules: {
            active: 0,
            inactive: 0,
        },
    }

    async.series([

        //count number of instances
        next=>{
            request.get({
                url: config.amaretti.api+"/instance/count", json: true,
                headers: { authorization: "Bearer "+config.warehouse.jwt },  //config.auth.jwt is deprecated
                qs: {
                    find: JSON.stringify({status: {$ne: "removed"}, group_id: project.group_id}),
                }
            }, (err, res, counts)=>{
                if(res.statusCode != 200) return next(counts);
                //console.dir(counts);
                /*
                [ { _id: 'requested', count: 1 },
                  { _id: 'empty', count: 1 },
                  { _id: null, count: 4 },
                  { _id: 'finished', count: 18 },
                  { _id: 'failed', count: 1 } ]
                */
                counts.forEach(count=>{
                    switch(count._id) {
                    case "requested": 
                    case "finished": 
                    case "running": 
                    case "stopped": 
                    case "failed": 
                        stats.instances[count._id] = count.count;
                        break;
                    default:
                        //stats.instances["others"] += count.count;
                    }
                });

                next(err);
            });
        },
        
        //count number of subjects
        next=>{
            /*
            request.get({
                url: config.warehouse.api+"/dataset/distinct", json: true,
                headers: { authorization: "Bearer "+config.warehouse.jwt },  //config.auth.jwt is deprecated
                qs: {
                    find: JSON.stringify({removed: false, project: project._id}),
                    distinct: 'meta.subject',
                }
            }, (err, res, subjects)=>{
                if(res.statusCode != 200) return next(subjects);
                //TODO - should I do something with the list of subjects?
                console.dir(subjects.slice(0, 5));
                stats.subjects = subjects.length;
                next(err);
            });
            */
            db.Datasets.find().distinct('meta.subject', {removed: false, project}, function(err, subjects) {
                //console.dir(subjects.slice(0, 5));
                stats.subjects = subjects.length;
                next(err);
            });
        },
        
        //count number of datasets
        next=>{
            db.Datasets.find().count({removed: false, project}, function(err, count) {
                //console.dir(count);
                stats.datasets = count;
                next(err);
            });
            /*
            request.get({
                url: config.warehouse.api+"/dataset", json: true,
                headers: { authorization: "Bearer "+config.warehouse.jwt },  //config.auth.jwt is deprecated
                qs: {
                    find: JSON.stringify({removed: false, project: project._id}),
                    limit: 1, //I just need a count (0 means all)
                }
            }, (err, res, datasets)=>{
                if(res.statusCode != 200) return next(datasets);
                //TODO - should I do something with the list of subjects?
                stats.datasets = datasets.count;
                next(err);
            });
            */
        },
        
        //count number of rules
        next=>{
            db.Rules.aggregate()
            .match({removed: false, project: project._id})
            .group({_id: { "active": "$active" }, count: {$sum: 1}})
            .exec((err, ret)=>{
                /*
[ { _id: { active: true }, count: 3 },
  { _id: { active: false }, count: 2 } ]
                */
                ret.forEach(rec=>{
                    if(rec._id.active) stats.rules.active = rec.count;
                    else stats.rules.inactive = rec.count;
                });
                next();
            });
        },

        //now save the project
        next=>{
            logger.debug("saving stats");
            console.log(JSON.stringify(stats, null, 4));
            project.stats = stats;
            project.save(next);
        },

    ], cb);
}


