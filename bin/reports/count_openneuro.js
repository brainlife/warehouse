#!/usr/bin/env node
//cronjob script to ingest openneuro datasets as brainlife projects

const mongoose = require("mongoose");
const winston = require("winston");
const rp = require('request-promise-native');
const async = require('async');

const config = require("../api/config");
const logger = winston.createLogger(config.logger.winston);
const db = require('../api/models');

db.init(async err=>{
    if(err) throw err;
    //query all openneuro project ids
    let projects = await db.Projects.find({openneuro: {$exists: true}}).select('_id');
    let project_ids = projects.map(project=>project._id.toString());
    console.dir(project_ids.length, "projects");

    //query all tasks that used datasets from openneuro project ids
    let res = await rp.get({
        url: config.amaretti.api+"/task", json: true,
        headers: { authorization: "Bearer "+config.warehouse.jwt},
        qs: {
        find: JSON.stringify({
            "config.datasets.project": {$in: project_ids},
            "user_id": {$nin: [1, 41]},
        }),
        limit: 20000,
        select: 'user_id service config.datasets.project',
        },
    });
    res.tasks.forEach(task=>{
        console.log(task._id, task.user_id, task.service, task.config);
    });
});
