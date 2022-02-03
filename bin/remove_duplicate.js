#!/usr/bin/env node

const async = require('async');
const request = require('request');
const fs = require('fs');
const tar = require('tar');

const config = require('../api/config');
const db = require('../api/models');
const mongoose = require("mongoose");

//console.log(["connecting to db", "yay"]);
db.init(function(err) {
    if(err) throw err;
    remove_dup(err=>{
        if(err) console.dir(err);
        console.log("done");
        db.disconnect();
    });
});

//remove datasets stored in removed projects
function remove_dup(cb) {
    //find dataset with follow_task_id set
    db.Datasets.find({
        removed: false,
        "prov.task.follow_task_id": {$exists: true},
    })
    .limit(10000) 
    .exec((err,datasets)=>{
        if(err) return cb(err);
        if(!datasets) return cb(); //no datasets to clean up
        let count = 0;
        async.eachSeries(datasets, (dataset, next_dataset)=>{
            count++;
            console.debug(count, dataset._id.toString());

            db.Datasets.findOne({removed: false, "prov.task._id": dataset.prov.task.follow_task_id}).exec((err, dup_dataset)=>{
                if(!dup_dataset) return next_dataset();
                console.log("duplicate found... removing", dup_dataset._id);
                dataset.remove_date = new Date();
                dataset.removed = true;
                dataset.save(next_dataset);
                //next_dataset();
            });
        }, cb);
    });
}

