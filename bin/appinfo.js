#!/usr/bin/env node

const winston = require('winston');
const async = require('async');
const axios = require('axios');
const fs = require('fs');
const redis = require('redis');

const config = require('../api/config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../api/models');
const common = require('../api/common');

const provenance = require('../api/lib/provenance');

console.log("running appinfo");

db.init(err=>{
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
    rcon.set("health.warehouse.appinfo."+process.env.HOSTNAME+"-"+process.pid, JSON.stringify(report));
}

function run() {

    //cache contact info first
    common.cacheContact(err=>{
        if(err) console.error(err);

        //then load apps 
        db.Apps.find({
            removed: false,
        })
        .exec((err, apps)=>{
            if(err) throw err;
            report.app_counts = apps.length;
            async.eachSeries(apps, handle_app, err=>{
                if(err) logger.error(err);
                console.log("done going through all apps sleeping.....");
                setTimeout(run, 1000*3600*3);
            });
        });
    });
}

function handle_app(app, cb) {
    logger.debug("....................... %s %s", app.name, app._id.toString());

    async.series([
        //caching serviceinfo
        next=>{
            axios.get(config.amaretti.api+"/service/info", {
                headers: { authorization: "Bearer "+config.warehouse.jwt },  //config.auth.jwt is deprecated
                params: {
                    service: app.github,
                }
            }).then(res=>{
                if(res.status != 200) return next("couldn't obtain service stats "+res.status);
                let info = res.data;
                if(!info) {
                    console.error("service info not set for ", app.github);
                    return next();
                }

                //cache things from serviceinfo..
                app.stats.success_rate = info.success_rate;
                app.stats.users = info.users;
                app.stats.runtime_mean = info.runtime_mean;
                app.stats.runtime_std = info.runtime_std;
                app.stats.requested =  info.counts.requested,

                next();
            }).catch(next);
        },
      
        //cache example workflow
        async ()=>{
            const cachefname = "/tmp/example.app-"+app.id+".json"; //needs to match the path used in controller/app.js

            const provs = await provenance.sampleTerminalTasks(app.id);
            provs.map(provenance.setupShortcuts);

            console.log("clustering app example workflows", provs.length);
            const commonProvs = [];
            if(provs.length) {
                const clusters = provenance.cluster(provs);
                clusters.forEach(cluster=>{
                    //grab the first one from each cluster
                    const prov = provs[cluster[0]];
                    prov._prob = cluster.length / provs.length;
                    commonProvs.push(prov);
                });
            }

            //remove things we don't want to show to the user
            commonProvs.forEach(prov=>{
                prov.nodes.forEach(node=>{
                    delete node.project;
                    delete node.desc;
                    delete node.userId;
                    delete node.user;
                    delete node.meta;
                    delete node.datasetId;
                    delete node.storage;
                    delete node.storageLocation;
                    node.tags = [];
                });
            });

            //populate things we should populate
            for await (const prov of commonProvs) {
                await provenance.populate(prov);
            }

            //then store this on disk..
            console.log("saving at", cachefname);
            fs.writeFileSync(cachefname, JSON.stringify(commonProvs));

            app.stats.examples = commonProvs.length;
            app.markModified('stats');
        },
  
        //list shared resources that are registered to this app
        next=>{
            axios.get(config.amaretti.api+"/resource", {
                headers: { authorization: "Bearer "+config.warehouse.jwt },  //config.auth.jwt is deprecated
                params: {
                    find: JSON.stringify({
                        gids: 1, //shared globally
                        active: true,
                        status: "ok",
                        //"config.maxtask": {$gt: 0},
                        "config.services.name": app.github,
                        "config.services.score": {$gt: 0},
                    }),
                    select: '_id name',
                }
            }).then(res=>{
                if(res.status != 200) return next("couldn't obtain service stats "+res.status);
                app.stats.resources = res.data.resources.map(resource=>{
                    return {
                        resource_id: resource._id,
                        name: resource.name,
                    }
                });
                app.markModified('stats');

                common.update_appinfo(app, next);
            }).catch(next);
        },

        //issue doi
        next=>{
            if(app.doi) return next();
            logger.debug("minting doi");
            common.get_next_app_doi((err, doi)=>{
                if(err) return next(err);
                app.doi = doi;
                let metadata = common.compose_app_datacite_metadata(app);
                common.doi_post_metadata(metadata, err=>{
                    if(err) return next(err);
                    let url = config.warehouse.url+"/app/"+app._id;  
                    common.doi_put_url(app.doi, url, next);
                });
            });
        },

        //check doi
        next=>{
            let url = "https://doi.org/"+app.doi;
            console.log("checking doi", url);
            //if(config.debug) url = "https://doi.org/10.25663/brainlife.app.448";
            axios.get(url).then(res=>{
                if(!res.status == 200) return next(app.doi+" "+res.status)
                console.log(app.doi+" is good");
                next();
            }).catch(err=>{
                console.error(err.message);
                console.error(err.status);
                //what if we have temporarly glitch on doi.org? this is too dangerous
                //TODO - I should set the *last* date that doi worked, and if it's been too long, then we should reset it (or notify us to manually reset it)
                //app.doi = undefined
                next();
            });
        },

        //now save the app
        next=>{
            app.save(next);
        },

    ], err=>{
        if(err) console.error(err);
        cb(); //let it continue
    });
}


