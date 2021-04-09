#!/usr/bin/env node

const winston = require('winston');

const config = require('../api/config');
config.logger.winston.transports[0].level = 'error';
const db = require('../api/models');

const mongoose = require("mongoose");
mongoose.set("debug", false); //suppress log

let graphite_prefix = process.argv[2];
if(!graphite_prefix) {
    //console.error("usage: bl_metrics.js <graphite_prefix>");
    graphite_prefix = "dev"
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
                resolve();
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
            resolve();
        });
    });
}


function count_public_project(d) {
    return new Promise((resolve, reject)=>{
        db.Projects.count({create_date: {$lt: d}, removed: false, access: "public", "stats.datasets.count": {$gt: 0 } }, (err, count)=>{
            if(err) return reject(err);
            const time = Math.round(d.getTime()/1000);
            console.log(graphite_prefix+".project.public "+count+" "+time);
            resolve();
        });
    });
}

function count_private_project(d) {
    return new Promise((resolve, reject)=>{
        db.Projects.count({create_date: {$lt: d}, removed: false, access: "private", "stats.datasets.count": {$gt: 0} }, (err, count)=>{
            if(err) return reject(err);
            const time = Math.round(d.getTime()/1000);
            console.log(graphite_prefix+".project.private "+count+" "+time);
            resolve();
        });
    });
}

db.init(async function(err) {
    if(err) throw err;
    let today = new Date();
    await count_apps(today); 
    await count_dataset(today); 
    await count_project(today); 
    await count_public_project(today); 
    await count_private_project(today); 
    db.disconnect(err=>{
        process.exit(0);
    });
});

