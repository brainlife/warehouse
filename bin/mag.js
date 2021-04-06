#!/usr/bin/env node
const winston = require('winston');
const async = require('async');
const axios = require('axios');
const fs = require('fs');
const redis = require('redis');
const config = require('../api/config');
const logger = winston.createLogger(config.logger.winston);
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
    .exec((err, projects)=>{
	    projects.forEach(project => handleProject(project));
	});

}

function handleProject(project) {
    console.log("....................... %s %s", project.name, project._id.toString());
    common.updateProjectMag(project);
}


