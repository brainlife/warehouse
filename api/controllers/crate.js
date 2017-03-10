'use strict';

//contrib
const express = require('express');
const router = express.Router();
const winston = require('winston');
const jwt = require('express-jwt');
const async = require('async');
const request = require('request');
const fs = require('fs');

//mine
const config = require('../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');
//const common = require('../common');

/**
 * @apiGroup Crate
 * @api {get} /crate            Query Crates 
 * @apiDescription              Returns all crates accessible to the user
 *
 * @apiParam {Object} [find]    Optional Mongo query to perform (you need to JSON.stringify)
 * @apiParam {Object} [sort]    Mongo sort object - defaults to _id. Enter in string format like "-name%20desc"
 * @apiParam {String} [select]  Fields to load - multiple fields can be entered with %20 as delimiter
 * @apiParam {Number} [limit]   Maximum number of records to return - defaults to 100
 * @apiParam {Number} [skip]    Record offset for pagination (default to 0)
 * 
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         List of crate (maybe limited / skipped) and total count
 */
//TODO - make jwt optional
router.get('/', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);

    var project_ids = [];
    //firt, find all public projects
    var project_query = {access: "public"};
    //if user is logged in, look for private ones also
    if(req.user) {
        project_query = {
            $or: [
                project_query,
                {"members": req.user.sub},
            ]
        };
    }
    db.Projects.find(project_query);
    .exec(err, projects) {
        if(err) return next(err);
        project_ids = projects.map(function(p) { return p._id; });

        //then look for crates
        db.Crate.find({
            $and: [
                {project_id: {$in: project_ids}},
                find
            ]
        })
        .select(req.query.select)
        .limit(req.query.limit || 100)
        .skip(req.query.skip || 0)
        .sort(req.query.sort || '_id')
        .exec((err, crates)=>{
            if(err) return next(err);
            db.Crate.count(find).exec((err, count)=>{
                if(err) return next(err);
                res.json({crates: crates, count: count});
            });
        });
    });
});

/**
 * @apiGroup Crate
 * @api {post} /crate                   Create new crate
 * @apiDescription                      Make a request to create a new crate from wf service workdir
 *
 * @apiParam {String} instance_id       WF service Instance ID to create the crate from
 * @apiParam {String} project_id        Project used to store this crate under
 * @apiParam {String} [name]            Name for this crate
 * @apiParam {String} [desc]            Description for this crate
 *
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}                 Crate created
 *                              
 */
router.post('/', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    if(!req.body.instance_id) return next("instance_id not set");
    if(!req.body.project_id) return next("project_id not set");
        
    //query the instance (relay jwt from user) 
    request.get({
        url: config.wf.api+"/instance",
        qs: {
            find: JSON.stringify({"_id": req.body.instance_id}),
        },
        json: true,
        //TODO - I need to deal with cookie based jwt also?
        headers: {
            authorization: req.headers.authorization, 
        }
    }, (e, r, ret)=>{
        if(e) return next(e);
        
        //make sure user owns this instance
        if(ret.instances.length != 1) return next("couldn't find such instance");
        var instance = ret.instances[0];
        if(instance.user_id != req.user.sub) return next("you don't own this instance ");

        //make sure user is member of the project selected
        db.Projects.findById(req.body.project_id, (err, project)=>{
            if(err) return next(err);
            if(!project) return next("couldn't find the project");
            //TODO should I only allow members but not admin?
            if(!~project.admins.indexOf(req.user.sub) && !~project.members.indexOf(req.user.sub)) return next("you are not member of this project");
            
            //query tasks under the instance and figure out where task directories are (and if they are finished?)
            request.get({
                url: config.wf.api+"/task",
                qs: {
                    find: JSON.stringify({"instance_id": instance._id}),
                },
                json: true,
                //TODO - I need to deal with cookie based jwt also?
                headers: {
                    authorization: req.headers.authorization, 
                }
            }, (e, r, ret)=>{
                if(e) return next(e);
                var tasks = ret.tasks;

                //now create crate record
                var crate = new db.Crates({
                    user_id: req.user.sub,
                    project_id: project._id,
                    name: req.body.name,
                    desc: req.body.desc,
                    status: "archiving",

                    system: choose_storage(tasks),
                    instance: instance,
                    tasks: tasks,
                });
                crate.save((e, _crate)=>{
                    if(e) return next(e);
                    res.json(_crate);
                    //asynchrnously archive content
                    archive(crate, req);
                });
            })
        });
    });
});

function archive(crate, req) {
    //now we are going to asynchronously transfer content one task at a time..
    //the simplest thing to do is to use wf/download capability for each 
    //task directory (from wherever the resource it's stored..) and post it to 
    //data stroage system. (although that means a lot of data have to travel
    //through warehouse service..
    async.eachSeries(crate.tasks, (task, next_task)=>{
        if(!task.resource_id) {
            logger.warn('task '+task._id+' has no resource_id set');
            return next_task(); 
        }

        //should I not copy if status is not finished?
        if(task.status != 'finished') logger.warn('task '+task._id+' status is not finished');

        var system = config.storage_systems[crate.system];
        system.archive_stream(crate, task, (err, writestream)=>{
            logger.info("downloading "+task._id);
            var stream = request.get({
                url: config.wf.api+"/resource/download",
                qs: {
                    r: task.resource_id,
                    p: task.instance_id+"/"+task._id,
                },
                headers: {
                    authorization: req.headers.authorization, 
                }
            }, function(e, r, body) {
                if(r.statusCode != 200) {
                    next_task("/resource/download failed "+r.statusCode);
                } else {
                    //success..
                    logger.debug("download request success");
                    next_task();
                }
            }).pipe(writestream);
        });
    
    }, (err)=>{
        if(err) {
            crate.status = "failed";
            crate.status_msg = err;
        } else {
            crate.status = "archived";
        }
        crate.save();
    });
}

//decide which storage system to use to store the instance
function choose_storage(tasks) {
    //TODO.. analyze tasks and see where data is currently stored..
    return "dc2";
}

module.exports = router;
