#!/usr/bin/env node

const async = require('async');
const request = require('request');
const fs = require('fs');
const tar = require('tar');
const winston = require('winston');
const ssh2 = require('ssh2');

const config = require('../../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../../api/models');

console.log("connecting to db");
db.init(err=>{
    if(err) throw err;
    run(err=>{
        if(err) throw err;
        logger.info("all done.. disconnecting");
        db.disconnect();
    });
});

function run(cb) {
    //find project that we need to set group_id
    db.Datasets.find({
        removed: false, //don't care if its removed? (TODO remove it?)
    })
    .populate("project")
    .exec((err,datasets)=>{
        if(err) return cb(err);
        async.eachSeries(datasets, (dataset, next_dataset)=>{

            if(!dataset.project) {
                logger.error("no project set on dataset:"+dataset._id);
                dataset.removed = true;
                dataset.save(next_dataset);
                return;
            }

            if(!dataset.project.removed) {
                return setTimeout(()=>{
                    next_dataset();
                }, 0);
            }
            console.log("project is removed - removing dataset", dataset._id);
            dataset.removed = true;
            dataset.save(next_dataset);
        }, cb);
    });
}


