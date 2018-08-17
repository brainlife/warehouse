#!/usr/bin/env node

const winston = require('winston');

const config = require('../api/config');
config.logger.winston.transports[0].level = 'error';
const db = require('../api/models');

const graphite_prefix = process.argv[2];
if(!graphite_prefix) {
    console.error("usage: bl_metrics.js <graphite_prefix>");
    process.exit(1);
}

function count_apps(d) {
    return new Promise((resolve, reject)=>{
        db.Apps.count({create_date: {$lt: d}, removed: false}, (err, count)=>{
            if(err) return reject(err);
            const time = Math.round(d.getTime()/1000);
            console.log(graphite_prefix+".app.count "+count+" "+time);
            resolve();
        });
    });
}

function count_dataset(d) {
    return new Promise((resolve, reject)=>{
        db.Datasets.count({create_date: {$lt: d}, removed: false}, (err, count)=>{
            if(err) return reject(err);
            const time = Math.round(d.getTime()/1000);
            console.log(graphite_prefix+".dataset.count "+count+" "+time);
            resolve();
        });
    });
}

db.init(async function(err) {
    if(err) throw err;
    /*
    let d = new Date("2017-01-01");
    let today = new Date();
    while(d.getTime() < today.getTime()) {
        await count_apps(d); 
        d.setDate(d.getDate()+7);
    }
    */
    let today = new Date();
    await count_apps(today); 
    await count_dataset(today); 
    db.disconnect();
});

