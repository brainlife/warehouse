const winston = require('winston');
const timeout = require('callback-timeout');
const async = require('async');

const config = require('./config');
const logger = new winston.Logger(config.logger.winston);
const db = require('./models');
const common = require('./common');

common.redis.on('ready', ()=>{
    logger.info("health api");
    exports.health_check();
    setInterval(exports.health_check, 1000*60); //post health status every minutes
});

exports.health_check = function() {
	logger.debug("running api health check");
	var report = {
		status: "ok",
		messages: [],
		storages: {},
		date: new Date(),
	}

    //check for storage system status
    async.forEachOf(config.storage_systems, function(system, system_id, next) {
        var system = config.storage_systems[system_id];
        system.test(timeout(err=>{
            if(err) {
				report.status = "failed";
				report.messages.push(system_id+" "+err);
				report.storages[system_id] = "failed";
			} else {
				report.storages[system_id] = "ok";
			}
            next();
        }, 10*000)); //8 not enough for js often
    }, err=>{
		common.redis.set("health.warehouse.api."+(process.env.NODE_APP_INSTANCE||'0'), JSON.stringify(report));
    });
}

exports.get_reports = function(cb) {
    common.redis.keys("health.warehouse.*", (err, keys)=>{
        if(err) return cb(err);
        common.redis.mget(keys, (err, _reports)=>{
            if(err) return cb(err);
            var reports = {};
            _reports.forEach((report, idx)=>{
                reports[keys[idx]] = JSON.parse(report);
            });
            cb(null, reports);
        });
    });
}

