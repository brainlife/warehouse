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

/**
 * @apiGroup Dataset
 * @api {get} /dataset          Query Datasets
 * @apiDescription              Returns all dataset entries accessible to the user
 *
 * @apiParam {Object} [find]    Optional Mongo query to perform (you need to JSON.stringify)
 * @apiParam {Object} [sort]    Mongo sort object - defaults to _id. Enter in string format like "-name%20desc"
 * @apiParam {String} [select]  Fields to load - multiple fields can be entered with %20 as delimiter
 * @apiParam {Number} [limit]   Maximum number of records to return - defaults to 100
 * @apiParam {Number} [skip]    Record offset for pagination (default to 0)
 * 
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         List of datasets (maybe limited / skipped) and total count
 */
router.get('/', jwt({secret: config.express.pubkey, credentialsRequired: false}), (req, res, next)=>{
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
    db.Projects
    .find(project_query)
    .exec(function(err, projects) {
        if(err) return next(err);
        project_ids = projects.map(function(p) { return p._id; });

        //then look for dataset
        db.Datasets.find({
            $and: [
                {project_id: {$in: project_ids}},
                find
            ]
        })
        .select(req.query.select)
        .limit(req.query.limit || 100)
        .skip(req.query.skip || 0)
        .sort(req.query.sort || '_id')
        .exec((err, datasets)=>{
            if(err) return next(err);
            db.Datasets.count(find).exec((err, count)=>{
                if(err) return next(err);
                res.json({datasets: datasets, count: count});
            });
        });
    });
});

/**
 * @apiGroup Dataset
 * @api {post} /dataset                 Create new dataset from wf service task
 * @apiDescription                      Make a request to create a new dataset from wf service taskdir
 *
 * @apiParam {String} project_id        Project used to store this dataset under
 * @apiParam {String} instance_id       WF service Instance ID
 * @apiParam {String} task_id           WF service Task ID 
 * @apiParam {String} datatype_id       Data type ID for this dataset (from Datatypes)
 * @apiParam {String} [name]            Name for this dataset
 * @apiParam {String} [desc]            Description for this crate
 * @apiParam {String[]} [tags]          List of tags associated with this dataset
 *
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}                 Dataset created
 *                              
 */
router.post('/', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    if(!req.body.project_id) return next("project_id not set");
    if(!req.body.instance_id) return next("instance_id not set");
    if(!req.body.task_id) return next("task_id not set");
    if(!req.body.datatype_id) return next("datatype_id not set");
        
    //query task (relay jwt from user) 
    request.get({
        url: config.wf.api+"/task",
        qs: {
            find: JSON.stringify({"_id": req.body.task_id}),
        },
        json: true,
        //TODO - I need to deal with cookie based jwt also?
        headers: {
            authorization: req.headers.authorization, 
        }
    }, (e, r, ret)=>{
        if(e) return next(e);
        
        //make sure user owns this instance
        if(ret.tasks.length != 1) return next("couldn't find task");
        var task = ret.tasks[0];
        if(task.user_id != req.user.sub) return next("you don't own this instance");

        //make sure user is member of the project selected
        db.Projects.findById(req.body.project_id, (err, project)=>{
            if(err) return next(err);
            if(!project) return next("couldn't find the project");
            //TODO should I only allow members but not admin?
            if(!~project.admins.indexOf(req.user.sub) && !~project.members.indexOf(req.user.sub)) return next("you are not member of this project");
            
            //now create a dataset record
            var dataset = new db.Datasets({
                user_id: req.user.sub,

                project_id: project._id,
                datatype_id: req.body.datatype_id,

                product: req.body.product, //describe what's in this dataset

                name: req.body.name,
                desc: req.body.desc,
                tags: req.body.tags,

                //uri: storage+"://"+path,
            });
            dataset.save((e, _dataset)=>{
                if(e) return next(e);
                res.json(_dataset);
                //then, asynchrnously copy content to the storage
                archive(task, _dataset, req, function(err) {
                    if(err) logger.error(err);
                    //TODO now what?
                });
            });
        });
    });
});

function archive(task, dataset, req, cb) {
    if(!task.resource_id) {
        return cb('task '+task._id+' has no resource_id set');
    }

    //TODO should I error if task status is not finished?
    if(task.status != 'finished') logger.warn('task '+task._id+' status is not finished');

    var storage = "dc2";
    var system = config.storage_systems[storage];
    system.archive_stream(dataset, task, (err, writestream)=>{
        logger.info("downloading "+task._id);
        request.get({
            url: config.wf.api+"/resource/download",
            qs: {
                r: task.resource_id,
                p: task.instance_id+"/"+task._id,
            },
            headers: {
                authorization: req.headers.authorization, 
            }
        })
        .on('response', function(r) {
            console.log("stream response received");
            if(r.statusCode != 200) {
                cb("/resource/download failed "+r.statusCode);
            } else {
                //success.. set storage
                logger.info("done!");
                dataset.storage = "dc2"; 
                dataset.save(cb);
            }
        }).pipe(writestream);
    });
}

/*
//decide which storage system to use to store the instance
function choose_storage(tasks) {
    //TODO.. analyze tasks and see where data is currently stored..
    return "dc2";
}
*/

module.exports = router;
