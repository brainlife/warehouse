#!/usr/bin/env node
//cronjob script to ingest openneuro datasets as brainlife projects

const mongoose = require("mongoose");
//const async = require('async');

const config = require("../../api/config");
const db = require('../../api/models');

db.init(async err=>{
    if(err) throw err;
    //query all openneuro project ids
    let dldatasets = await db.DLDatasets.find({removed: false, import_count: {$gt: 0}}).select('path import_count stats.subjects');
    console.log(`path,import_count`);
    dldatasets.forEach(d=>{
        console.log(`${d.path},${d.import_count}`);
    });
});
