#!/usr/bin/env node

const async = require('async');
const request = require('request');
const fs = require('fs');
const tar = require('tar');
const winston = require('winston');
const ssh2 = require('ssh2');

const config = require('../../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../../api/models');

console.log("connecting to db");
db.init(function(err) {
    if(err) throw err;
    run(err=>{
        if(err) throw err;
        logger.info("all done.. disconnecting");
        db.disconnect();
    });
});

function run(cb) {
    //find project that we need to set group_id
    db.Projects.find({
        group_id: {$exists: false}, 
        removed: false, //don't care if its removed?
    })
    .exec((err,projects)=>{
        if(err) return cb(err);
        logger.debug("projects to reset", projects.length);

        async.eachSeries(projects, (project, next_project)=>{

            logger.debug("creating new group");
            request.post({ url: config.auth.api+"/group", headers: { authorization: "Bearer "+config.auth.jwt }, json: true,
                body: {
                    name: "warehouse: "+project.name,
                    desc: "For project "+project._id,
                    admins: project.admins,
                    members: project.members,
                }
            }, (err, _res, body)=>{
                if(err) return next(err);
                logger.debug("done creating new group", body);
                project.group_id = parseInt(body.group.id);
                project.save(next_project);
            });
        }, cb);
    });
}


