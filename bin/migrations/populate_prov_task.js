#!/usr/bin/env node

const async = require('async');
const request = require('request');
const fs = require('fs');
const tar = require('tar');
const winston = require('winston');
const ssh2 = require('ssh2');

const config = require('../../api/config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../../api/models');

console.log("connecting to db");
db.init(function(err) {
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
        "prov.task_id": {$exists: true},
        "prov.task": {$exists: false},
        removed: false, //don't care if its removed? (TODO remove it?)
    })
    .exec((err,datasets)=>{
        if(err) return cb(err);
        logger.debug("datasets needs to be populated", datasets.length);
        async.eachSeries(datasets, (dataset, next_dataset)=>{
            console.log(JSON.stringify(dataset, null, 4));

            //load task detail from amaretti
            request.get(config.amaretti.api+"/task/"+dataset.prov.task_id, (err, res, body)=>{
                if(err) return next_dataset(err);
                dataset.prov.task = JSON.parse(body);
                dataset.prov.task_id = undefined;
                dataset.prov.instance_id = undefined;
                dataset.save(next_dataset);
            })
        }, cb);
    });
}


