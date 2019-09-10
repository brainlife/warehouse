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
    maxage: 1000*60*30,
    app_counts: 0,
}

function health_check() {
    report.date = new Date();
    rcon.set("health.warehouse.appinfo.0", JSON.stringify(report));
}

function run() {
	db.Apps.find({
        removed: false,
    })
    //.populate('app project')
    .exec((err, apps)=>{
		if(err) throw err;
        report.app_counts = apps.length;
        async.eachSeries(apps, handle_app, err=>{
            if(err) logger.error(err);
            logger.info("done with all apps - sleeping for 3 hours");
            setTimeout(run, 1000*3600*3);
        });
	});
}

function handle_app(app, cb) {
    logger.debug("....................... %s %s", app.name, app._id.toString());

    async.series([
        //caching serviceinfo
        next=>{
            request.get({
                url: config.amaretti.api+"/service/info", json: true,
                headers: { authorization: "Bearer "+config.warehouse.jwt },  //config.auth.jwt is deprecated
                qs: {
                    service: app.github,
                    //service_branch: app.github_branch,  //let's not group by branch for now.
                }
            }, (err, res, info)=>{
                if(err) return next(err);
                if(res.statusCode != 200) return next("couldn't obtain service stats "+res.statusCode);
                app.stats.serviceinfo = info;
                app.markModified('stats');
                common.update_appinfo(app, next);
            });
        },

        //make sure doi is issued (shouldn't be needed anymore..)
        next=>{
            if(app.doi) return next();
            logger.debug("minting doi");
            common.get_next_app_doi((err, doi)=>{
                if(err) return next(err);
                app.doi = doi;
                let metadata = common.compose_app_datacite_metadata(app);
                //console.log(JSON.stringify(metadata, null, 4));
                common.doi_post_metadata(metadata, err=>{
                    if(err) return next(err);
                    let url = config.warehouse.url+"/app/"+app._id;  
                    common.doi_put_url(app.doi, url, next);
                });
            });
        },

        //now save the app
        next=>{
            logger.debug("saving app");
            app.save(next);
        },

    ], cb);
}


