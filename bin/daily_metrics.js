#!/usr/bin/env node

const config = require('../api/config');
const db = require('../api/models');
const influx = require('@influxdata/influxdb-client');

const mongoose = require("mongoose");
mongoose.set("debug", false); //suppress log

let graphite_prefix = process.argv[2];
if(!graphite_prefix) graphite_prefix = "dev";

function count_apps(d) {
    return new Promise((resolve, reject)=>{
        db.Apps.count({create_date: {$lt: d}, removed: false}, (err, count)=>{
            if(err) return reject(err);
            const time = Math.round(d.getTime()/1000);
            console.log(graphite_prefix+".app.count "+count+" "+time);
            resolve(count);
        });
    });
}

function count_dataset(d) {
    return new Promise((resolve, reject)=>{

        //ignore removed projects
        db.Projects.find({removed: true}, {_id: 1}, (err, removed_projects)=>{
            if(err) return reject(err);

            //TODO - I should include published datasets that are in removed project?
            db.Datasets.estimatedDocumentCount({
                create_date: {$lt: d}, 
                project: {$nin: removed_projects},
                removed: false,
            }, (err, count)=>{
                if(err) return reject(err);
                const time = Math.round(d.getTime()/1000);
                console.log(graphite_prefix+".dataset.count "+count+" "+time);
                resolve(count);
            });
        });
    });
}

function count_project(d) {
    return new Promise((resolve, reject)=>{
        db.Projects.count({create_date: {$lt: d}, removed: false }, (err, count)=>{
            if(err) return reject(err);
            const time = Math.round(d.getTime()/1000);
            console.log(graphite_prefix+".project.count "+count+" "+time);
            resolve(count);
        });
    });
}


function count_public_project(d) {
    return new Promise((resolve, reject)=>{
        db.Projects.count({create_date: {$lt: d}, removed: false, access: "public", "stats.datasets.count": {$gt: 0 } }, (err, count)=>{
            if(err) return reject(err);
            const time = Math.round(d.getTime()/1000);
            console.log(graphite_prefix+".project.public "+count+" "+time);
            resolve(count);
        });
    });
}

function count_private_project(d) {
    return new Promise((resolve, reject)=>{
        db.Projects.count({create_date: {$lt: d}, removed: false, access: "private", "stats.datasets.count": {$gt: 0} }, (err, count)=>{
            if(err) return reject(err);
            const time = Math.round(d.getTime()/1000);
            console.log(graphite_prefix+".project.private "+count+" "+time);
            resolve(count);
        });
    });
}

db.init(async function(err) {
    if(err) throw err;
    let today = new Date();

    const writeApi = new influx.InfluxDB(config.influxdb.connection)
        .getWriteApi(config.influxdb.org, config.influxdb.bucket, 'ns')
    writeApi.useDefaultTags({location: config.influxdb.location})
    const point = new influx.Point("warehouse");
    point.timestamp(today);
    point.intField("app", await count_apps(today));
    point.intField("dataset", await count_dataset(today));
    point.intField("all_project", await count_project(today));
    point.intField("public_project", await count_public_project(today));
    point.intField("private_project", await count_private_project(today));
    writeApi.writePoint(point);
    writeApi.close();

    db.disconnect();
});

