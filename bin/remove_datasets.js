#!/usr/bin/env node

const async = require('async');
const request = require('request');
const fs = require('fs');
const tar = require('tar');
const winston = require('winston');
const ssh2 = require('ssh2');

const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');

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

    //list storage system that we need to backup
    let storages = [];
    for(var id in config.storage_systems) {
        if(config.storage_systems[id].remove) storages.push(id);
    }
    logger.debug("removable storage:", storages);

    let month_ago = new Date();
    month_ago.setMonth(month_ago.getMonth() - 1);
    
    //find datasets that are removed (long ago) and not published
    db.Datasets.find({
        status: "stored",
        removed: true,
        storage: {$in: storages}, 
        $and: [
            {$or:[ 
                {publications: {$exists: false}}, //for old datasets?
                {publications: {$size: 0}},
            ]},
            {$or: [
                {remove_date: {$exists: false}}, //for old datasets removed but didn't get remove_date set
                {remove_date: {$lt: month_ago}},  
            ]},
        ]
    })
    .sort('create_date') //oldest first (give published datasets precedencde)
    .limit(1000) 
    .exec((err,datasets)=>{
        if(err) return cb(err);
        logger.debug("datasets needs removed:",datasets.length);
        let count = 0;
        async.eachSeries(datasets, (dataset, next_dataset)=>{
            count++;
            logger.debug("removing dataset", count, dataset.toString());
            var system = config.storage_systems[dataset.storage];
            system.remove(dataset, err=>{
                if(err) return next_dataset(err);
                dataset.status = "removed";
                dataset.save(next_dataset);
            });
        }, cb);
    });
}


