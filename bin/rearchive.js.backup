#!/usr/bin/env node

const amqp = require('amqp');
const winston = require('winston');
const mongoose = require('mongoose');
const async = require('async');
const request = require('request');
const redis = require('redis');

const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');
const common = require('../api/common');

const pkgcloud = require('pkgcloud');
const js_config = require('../api/config/jetstream');
const js_storage = pkgcloud.storage.createClient(js_config);

db.init(err=>{
    //find datasets that we want to re-archive
    db.Datasets.find({
        //project: "58bfa5d07a92c43c7d9e5484", //dev project
        //datatype: "58cb234be13a50849b25882f",//dtiinit
        datatype: "58d15eaee13a50849b258844",//lifelife
        storage: "jetstream",
        //status: "stored", //TODO - should also look for archived?
        "storage_config.contname": {$exists: false}, //don't rearchive new data
    })
    .sort('meta.subject')
    .exec((err, datasets)=>{
        if(err) throw err;
        
        //for each datasets,
        async.eachSeries(datasets, (dataset, next_dataset)=>{
            var jwt = null;
            var task = null;
            async.series([
                subnext=>{
                    if(!dataset.prov || !dataset.prov.task_id) return next_dataset();
                    if(!dataset.storage) return next_dataset();
                    subnext();
                },
                subnext=>{
                    //logger.debug(JSON.stringify(dataset, null, 4)); 

                    //issue jwt to access the task
                    request.get({
                        url: config.auth.api+"/jwt/"+dataset.user_id, json: true,
                        headers: { authorization: "Bearer "+config.auth.jwt },
                    }, (err, res, body)=>{
                        if(err) return subnext(err);
                        if(res.statusCode != 200) return subnext("couldn't obtain user jwt code:"+res.statusCode);
                        jwt = body.jwt;
                        subnext();
                    });
                },
                subnext=>{
                    //check to see if the task still has resource
                    request.get({
                        url: config.wf.api+"/task", json: true,
                        headers: { authorization: "Bearer "+jwt },
                        qs: {
                            find: JSON.stringify({
                                "_id": dataset.prov.task_id,
                            }),
                        },
                    }, (err, res, body)=>{
                        if(err) return next(err);
                        task = body.tasks[0];
                        console.dir(body);
                        if(task.status != "finished") return next_dataset();
                        if(!task.config._outputs) return next_dataset(); //not produced by v2/rule?
                        subnext();
                    });
                },
                subnext=>{
                    //archive!
                    //logger.debug(JSON.stringify(dataset, null, 4)); 
                    //console.log("task detail", JSON.stringify(task, null, 4));
                    //console.log("TODO .. archive");
                    console.log("attemping to rearchive projectid:", dataset.project, "datasetid:", dataset._id, "from taskid:", task._id);
                    var output = task.config._outputs.find(out=>out.id == dataset.prov.output_id);
                    if(!output) {
                        console.error("can't find output", dataset.prov.output_id);
                        return next_dataset();
                    }
                    common.archive_task(task, dataset, output.files, "Bearer "+jwt, err=>{
                        if(err) return subnext(err);
                        console.log("good .. removing old data (only supports jetstream)");
                        js_storage.removeFile(dataset.project.toString(), dataset._id+".tar.gz", function(err, result) { 
                            if(err) console.error(err); //continue
                            subnext();
                        });
                    });
                },
            ], next_dataset);
        }, err=>{
            if(err) throw err;
            console.log("all done");
        });
    });
});
