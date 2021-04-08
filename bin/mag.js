#!/usr/bin/env node
const async = require('async');
const axios = require('axios');
const fs = require('fs');
const redis = require('redis');
const config = require('../api/config');
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
	   async.eachSeries(projects,function(project,outCb){
            console.log("....................... %s %s", project.name, project._id.toString());
            common.updateProjectMag(project,outCb);
        }, function(err) {
            // Finished
            console.log("Finished writing MAG papers");
            process.exit(1);
          })
	});
}



