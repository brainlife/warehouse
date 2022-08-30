#!/usr/bin/env node
const winston = require('winston');
const async = require('async');

const config = require('../api/config');
const db = require('../api/models');
const common = require('../api/common');

common.connectRedis(err=>{
    console.log("removing health.warehouse.*");
    common.redisClient.keys("health.warehouse.*", (err, keys)=>{
        if(err) throw err;
        if(keys.length == 0) {
            console.log("no keys to remove");
            r.quit();
        }
        common.redisClient.del(keys, (err, reps)=>{
            if(err) throw err;
            console.log("removed values");
            console.log(reps);
            r.quit();
        });
    });
});
