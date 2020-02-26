#!/usr/bin/env node

const async = require('async');
const request = require('request');
const fs = require('fs');
const tar = require('tar');
const winston = require('winston');
const ssh2 = require('ssh2');

const config = require('../api/config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../api/models');
const mongoose = require("mongoose");

let limit = 1000;
if(config.debug) limit = 100;
console.log("limit to ", limit);

//console.log(["connecting to db", "yay"]);
db.init(function(err) {
    if(err) throw err;
    async.series([
        remove_from_removed_projects, 
        free_storage, 
        remove_failed,
        move_removed,
    ], err=>{
        if(err) throw err;
        logger.info("all done.. disconnecting");
        db.disconnect(()=>{
            process.exit(0);
        });
    });
});

//remove datasets stored in removed projects
function remove_from_removed_projects(cb) {
    console.log("remove_from_removed_projects");
    let month_ago = new Date();
    month_ago.setMonth(month_ago.getMonth() - 1);

    //TODO mark already handled project so that I don't have to keep querying them?
    db.Projects.find({
        removed: true,
    }).exec((err, projects)=>{
        if(err) return cb(err);
        if(!projects) return cb(); // no project removed?
        logger.debug("removed projects "+projects.length);
        
        //now query datasets that are not removed on removed projects
        db.Datasets.find({
            removed: false,
            project: {$in: projects}, //TODO could be huuuge..
            update_date: {$lt: month_ago }, //only remove if it's old enough
        })
        .sort('create_date') //oldest first
        .limit(limit) 
        .exec((err,datasets)=>{
            if(err) return cb(err);
            if(!datasets) return cb(); //no datasets to clean up
            logger.debug("orphaned datasets needs removed: %d", datasets.length);
            let count = 0;
            async.eachSeries(datasets, (dataset, next_dataset)=>{
                count++;
                logger.debug("removing orphaned dataset %d %s", count, dataset._id.toString());
                dataset.remove_date = new Date();
                dataset.removed = true;
                dataset.save(next_dataset);
            }, cb);
        });

    });
}

function free_storage(cb) {
    console.log("free_storage");
    //list removable storages
    let storages = [];
    for(var id in config.storage_systems) {
        if(config.storage_systems[id].remove) storages.push(id);
    }
    logger.debug("removable storage:");
    logger.debug(JSON.stringify(storages, null, 4));

    let month_ago = new Date();
    month_ago.setMonth(month_ago.getMonth() - 3);
    
    //find stored datasets that are removed (long ago) and not published
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
    .limit(limit) 
    .exec((err,datasets)=>{
        if(err) return cb(err);
        logger.debug("datasets to be freed: %d",datasets.length);
        let count = 0;
        async.eachSeries(datasets, (dataset, next_dataset)=>{
            count++;
            //don't remove if it's used by copied datasets
            db.Datasets.findOne({storage: "copy", "storage_config.dataset_id": dataset._id, removed: false}).exec((err, copy)=>{
                if(err) return cb(err);
                if(copy) return cb(); //has copy.. we can't remove this

                logger.debug("freeing storage for dataset %d %s", count, dataset._id.toString());
                var system = config.storage_systems[dataset.storage];
                system.remove(dataset, err=>{
                    if(err) return next_dataset(err);
                    dataset.status = "removed"; // I wish I chose "freed"
                    dataset.save(next_dataset);
                });
            });
        }, cb);
    });
}

function remove_failed(cb) {
    console.log("remove_failed");
    let week_ago = new Date();
    week_ago.setDate(week_ago.getDate()-7);
    
    //find datasets that failed to archive
    db.Datasets.find({
        status: {$in: ["storing", "failed"]},
        removed: false,
        update_date: {$lt: week_ago }, //only remove if it's old enough
    })
    .limit(limit) 
    .exec((err,datasets)=>{
        if(err) return cb(err);
        if(datasets.length == 0) return cb(); //no record to remove
        logger.debug("failed to store datasets needs removed "+datasets.length);
        let count = 0;
        async.eachSeries(datasets, (dataset, next_dataset)=>{
            count++;
            logger.debug("removing failed dataset "+count+" "+dataset._id.toString());
            dataset.status = "failed"; //in case it's "storing*.. event_handler only re-archive if dataset is failed & removed
            dataset.removed = true;
            dataset.save(next_dataset);
        }, cb);
    });
}

function move_removed(cb) {
    let month_ago = new Date();
    month_ago.setDate(month_ago.getDate()-30);
    
    //find datasets that failed to archive
    db.Datasets.find({
        removed: true,
        remove_date: {$lt: month_ago }, //only remove if it's old enough
    })
    .limit(limit) 
    .exec((err,datasets)=>{
        if(err) return cb(err);
        if(datasets.length == 0) return cb();
        logger.debug("removing old removed recoreds to datasets_removed:"+datasets.length);
        mongoose.connection.db.collection('datasets_removed').insertMany(datasets,(err,success)=>{
            if(err) return cb(err);
            logger.debug("permanently puring records");
            //console.dir(datasets[0]);
            db.Datasets.remove({
                removed: true,
                remove_date: {$lt: month_ago }, //only remove if it's old enough
            })
            .limit(limit)
            .exec((err, res)=>{
                if(err) return cb(err);
                logger.debug("removed");
                cb();
            });
        });
    });
}

