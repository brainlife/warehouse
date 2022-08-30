#!/usr/bin/env node
const winston = require('winston');
const async = require('async');

const config = require('../api/config');
const db = require('../api/models');
const common = require('../api/common');

common.connectRedis(async err=>{
    console.log("removing health.warehouse.*");
    const keys = await common.redisClient.keys("health.warehouse.*");
    if(keys.length == 0) {
        console.log("no keys to remove");
    } else {
        const rep = await common.redisClient.del(keys);
        console.log("removed values");
        console.debug(rep);
    }
    process.exit(0);
    
});
