#!/usr/bin/env node

const async = require('async');
const request = require('request');
const fs = require('fs');
const tar = require('tar');
const ssh2 = require('ssh2');

const config = require('../api/config');
const db = require('../api/models');
const mongoose = require("mongoose");

let limit = 1000;
if(config.debug) limit = 100;
console.log("limit to ", limit);

//console.log(["connecting to db", "yay"]);
db.init(function(err) {
    if(err) throw err;
    async.series([
        //move_removed, //maybe we need to keep all removed datasets for provenance?
        remove_from_removed_projects, 
        free_storage, 
        remove_failed,
    ], err=>{
        if(err) throw err;
        console.info("all done.. disconnecting");
        db.disconnect();
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
    }).select('_id').lean().exec((err, projects)=>{
        if(err) return cb(err);
        if(!projects) return cb(); // no project removed?

        async.eachSeries(projects, (project, next_project)=>{
            //now query datasets that are not removed on removed projects
            console.log(".... querying for old data not removed in removed project", project._id);
            db.Datasets.find({
                removed: false,
                project,
                create_date: {$lt: month_ago }, //only remove if it's old enough
            })
            .select('_id')
            .sort('create_date') //oldest first
            .limit(limit) 
            .exec((err,datasets)=>{
                if(err) return next_project(err);
                if(!datasets) return next_project(); //no datasets to clean up
                //console.debug("orphaned datasets needs removed "+datasets.length);
                async.eachSeries(datasets, (dataset, next_dataset)=>{
                    console.debug("removing orphaned dataset "+dataset._id.toString());
                    dataset.remove_date = new Date();
                    dataset.removed = true;
                    dataset.save(next_dataset);
                }, next_project);
            });
            
        }, err=>{
            if(err) return cb(err);
            console.log("done processing removed projects");
            cb();
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
    console.debug("removable storage:");
    console.debug(JSON.stringify(storages, null, 4));

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
    //.sort('create_date') //oldest first (give published datasets precedencde) - runs out of memory
    .limit(limit) 
    .exec((err,datasets)=>{
        if(err) return cb(err);
        console.debug("datasets to be freed: %d",datasets.length);
        let count = 0;
        async.eachSeries(datasets, (dataset, next_dataset)=>{
            count++;

            //don't remove if it's used by copied datasets
            //TODO - I think we are lucking index for this query..
            console.log("checking", dataset._id);
            db.Datasets.findOne({storage: "copy", "storage_config.dataset_id": dataset._id, removed: false}).exec((err, copy)=>{
                if(err) return next_dataset(err);
                if(copy) {
                    console.debug("has a copied dataset. we can't remove this");
                    return next_dataset(); 
                }

                console.debug("freeing storage for dataset %d %s", count, dataset._id.toString(), dataset.storage);
                var system = config.storage_systems[dataset.storage];
                system.remove(dataset, err=>{
                    if(err) return next_dataset(err);
                    console.debug("physically removed..");
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
        console.debug("failed to store datasets needs removed "+datasets.length);
        let count = 0;
        async.eachSeries(datasets, (dataset, next_dataset)=>{
            count++;
            console.debug("removing failed dataset "+count+" "+dataset._id.toString());
            dataset.status = "failed"; //in case it's "storing*.. event_handler only re-archive if dataset is failed & removed
            dataset.removed = true;
            dataset.save(next_dataset);
        }, cb);
    });
}


