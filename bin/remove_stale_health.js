#!/usr/bin/env node
const winston = require('winston');
const async = require('async');

const config = require('../api/config');
//const db = require('../api/models');
const common = require('../api/common');

const r = common.connectRedis();
r.on('ready', ()=>{
    console.log("removing stale health.*");
    r.keys("health.*", (err, keys)=>{
        if(err) throw err;
        if(keys.length == 0) {
            console.log("no keys");
            process.exit(0);
        }
        r.mget(keys, (err, values)=>{
            if(err) throw err;
            async.eachOfSeries(values, (json, idx, next)=>{
                const key = keys[idx];
                const value = JSON.parse(json); 
                const old = new Date(Date.now() - 1000*3600); 
                console.log("checking", key, value.date);
                if(value.date && new Date(value.date) < old) {
                    console.log("older than "+old+" removing!");
                    console.log(key, value);
                    r.del(key, next);
                } else {
                    console.log("fresh!")
                    next();
                }
            }, err=>{
                console.log("done");
                r.quit();
            });
        });
    });
});

