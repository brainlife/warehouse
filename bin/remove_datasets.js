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

let limit = 1000;
if(config.debug) limit = 100;

//console.log(["connecting to db", "yay"]);
db.init(function(err) {
    if(err) throw err;
    async.series([remove_from_removed_projects, free_storage, remove_failed], err=>{
        if(err) throw err;
        logger.info("all done.. disconnecting");
        db.disconnect(()=>{
            process.exit(0);
        });
    });
});

//remove datasets stored in removed projects
function remove_from_removed_projects(cb) {
    let month_ago = new Date();
    month_ago.setMonth(month_ago.getMonth() - 1);

    //TODO mark already handled project so that I don't have to keep querying them?
    db.Projects.find({
        removed: true,
    }).exec((err, projects)=>{
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
            logger.debug("orphaned datasets needs removed: "+datasets.length);
            let count = 0;
            async.eachSeries(datasets, (dataset, next_dataset)=>{
                count++;
                logger.debug("removing orphaned dataset %d %s"+count+dataset._id.toString());
                dataset.remove_date = new Date();
                dataset.removed = true;
                dataset.save(next_dataset);
                next_dataset();
            }, cb);
        });

    });
}

function free_storage(cb) {
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


