#!/usr/bin/env node
const async = require('async');
const db = require('../api/models');
const common = require('../api/common');

console.log("running mag.js");

db.init(function(err) {
    if(err) throw err;
    run();
});

function run() {
    db.Projects.find({
        removed: false,
    })
    .exec((err,projects)=>{
        async.eachSeries(projects, common.updateProjectMag, err=>{
            if (err) throw err;
            console.log("all projects processed successfully");
        });
    });
}



