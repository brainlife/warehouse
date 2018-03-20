const winston = require('winston');
const timeout = require('callback-timeout');
const async = require('async');

const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');
const common = require('../api/common');

common.redis.on('ready', ()=>{
    logger.info("removing health.warehouse.*");
    common.redis.keys("health.warehouse.*", (err, keys)=>{
        if(err) throw err;
        common.redis.del(keys, (err, reps)=>{
            if(err) throw err;
            logger.debug(reps);
            process.exit(1);
        });
    });
});

