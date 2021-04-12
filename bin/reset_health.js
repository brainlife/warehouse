#!/usr/bin/env node
const winston = require('winston');
const async = require('async');

const config = require('../api/config');
const db = require('../api/models');
const common = require('../api/common');

const r = common.connectRedis();
r.on('ready', ()=>{
    console.log("removing health.warehouse.*");
    r.keys("health.warehouse.*", (err, keys)=>{
        if(err) throw err;
        if(keys.length == 0) {
            console.log("no keys to remove");
            r.quit();
        }
        r.del(keys, (err, reps)=>{
            if(err) throw err;
            console.log("removed values");
            console.log(reps);
            r.quit();
        });
    });
});
