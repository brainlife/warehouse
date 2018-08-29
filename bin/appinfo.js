#!/usr/bin/env node

const winston = require('winston');
const async = require('async');
const request = require('request');
const fs = require('fs');
const redis = require('redis');
const jsonwebtoken = require('jsonwebtoken');

const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
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

let app_counts = 0;

function health_check() {
    var report = {
        status: "ok",
        date: new Date(),
        maxage: 1000*60*30,
        app_counts,
    }

    rcon.set("health.warehouse.appinfo.0", JSON.stringify(report));
}

function run() {
	db.Apps.find({
        removed: false,
    })
    //.populate('app project')
    .exec((err, apps)=>{
		if(err) throw err;
        app_counts = 0;
        async.eachSeries(apps, handle_app, err=>{
            if(err) logger.error(err);
            logger.debug("done with all apps - sleeping for an hour");
            setTimeout(run, 1000*60*60);
        });
	});
}

function handle_app(app, cb) {
    app_counts++;
    logger.debug("......................................", app.name, app._id.toString());

    logger.debug("querying service stats");
    request.get({
        url: config.wf.api+"/task/stats", json: true,
        headers: { authorization: "Bearer "+config.auth.jwt },
        qs: {
            service: app.github,
            //service_branch: app.github_branch,  //let's not group by branch for now.
        }
    }, (err, res, service)=>{
        if(err) return cb(err);
        if(res.statusCode != 200) return cb("couldn't obtain service stats "+res.statusCode);

        //compute success rate
        let finished = service.counts.finished||0;
        let failed = service.counts.failed||1;
        let success_rate = (finished / (failed+finished))*100;

        common.populate_github_fields(app.github, app, err=>{
            if(err) return cb(err);
            //app.stats = {service, success_rate, stars: app.stats.stars}
            app.stats.service = service;
            app.stats.success_rate = success_rate;
            //done.. save it
            console.dir(app.stats);
            app.markModified('stats');
            app.save(cb);
        });
    });
}


