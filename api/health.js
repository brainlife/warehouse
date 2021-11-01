const winston = require('winston');
const async = require('async');
const fs = require('fs');
const config = require('./config');
const db = require('./models');
const common = require('./common');

const r = common.connectRedis();

exports.health_check = function() {
    console.debug("running api health check");
    var report = {
        status: "ok",
        messages: [],
        storages: {},
        date: new Date(),
        maxage: 1000*60*15, //15 min should be long enough..
    }

    //check for storage system status
    async.forEachOf(config.storage_systems, (system, system_id, next)=>{
        console.debug("testing storage", system_id);
        var system = config.storage_systems[system_id];
        system.test(err=>{
            if(err) {
                console.error("storage system:"+system_id+" failing "+err);
                if(system_id != "dcwan/hcp" && system_id != "nki") report.status = "failed"; //ignore dcwan issue..
                report.messages.push(system_id+" "+err);
                report.storages[system_id] = "failed";
            } else {
                report.storages[system_id] = "ok";
            }
            next();
        }); //, 10*000)); //8 not enough for js often
    }, err=>{

        //check amqp queue size (from rabbitmqctl output - needs to be fed via cron or something)
        if(config.event.amqp.queues) {
            try {
                console.log("checking amqp queue size");
                const queuestat = fs.statSync(config.event.amqp.queues);
                const queues = JSON.parse(fs.readFileSync(config.event.amqp.queues));
                report.messages.push("amqp queue json date:"+queuestat.mtime);
                queues.forEach(queue=>{
                    if(queue.messages > 100) {
                        report.status = "failed";
                        report.messages.push("rabbitmq queue: "+queue.name+" is too big.. size:"+queue.messages);
                    }
                });
            } catch(err) {
                //ignore.. maybe non warehouse-api trying to access it
            }
        }

        //publish report
        r.set("health.warehouse.api."+process.env.HOSTNAME+"-"+process.pid, JSON.stringify(report));
    });
}

console.log("starting health check");
exports.health_check();
setInterval(exports.health_check, 1000*60*5); //post health status every minutes

exports.get_reports = function(cb) {
    r.keys("health.warehouse.*", (err, keys)=>{
        if(err) return cb(err);
        if(!keys.length) return cb(null, {});
        r.mget(keys, (err, _reports)=>{
            if(err) return cb(err);
            var reports = {};
            _reports.forEach((report, idx)=>{
                reports[keys[idx]] = JSON.parse(report);
            });
            cb(null, reports);
        });
    });
}

