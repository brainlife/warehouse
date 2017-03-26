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

//return all projects that user has access
function getprojects(user, cb) {
    //firt, find all public projects
    var project_query = {access: "public"};
    //if user is logged in, look for private ones also
    if(user) {
        project_query = {
            $or: [
                project_query,
                {"members": user.sub},
            ]
        };
    }
    db.Projects
    .find(project_query)
    .exec(cb);
}

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
 * @apiParam {String} [populate] Fields to populate - default to "project datatype"
 * 
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         List of datasets (maybe limited / skipped) and total count
 */
router.get('/', jwt({secret: config.express.pubkey, credentialsRequired: false}), (req, res, next)=>{
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);
    getprojects(req.user, function(err, projects) {
        if(err) return next(err);
        var project_ids = projects.map(function(p) { return p._id; });

        //then look for dataset
        db.Datasets
        .find({
            $and: [
                {project: {$in: project_ids}},
                find
            ]
        })
        .populate(req.query.populate || 'project datatype')
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
 * @apiParam {String} project           Project ID used to store this dataset under
 * @apiParam {String} instance_id       WF service Instance ID
 * @apiParam {String} task_id           WF service Task ID 
 * @apiParam {String} datatype          Data type ID for this dataset (from Datatypes)
 * @apiParam {Object} [prov]            Provenane info {app, deps, config}
 * @apiParam {String[]} datatype_tags   Data type ID for this dataset (from Datatypes)
 * @apiParam {String} [name]            Name for this dataset
 * @apiParam {String} [desc]            Description for this crate
 * @apiParam {String[]} [tags]          List of tags associated with this dataset
 *
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}                 Dataset created
 *                              
 */
router.post('/', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    if(!req.body.project) return next("project id not set");
    if(!req.body.datatype) return next("datatype id not set");
    if(!req.body.instance_id) return next("instance_id not set");
    if(!req.body.task_id) return next("task_id not set");
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
        db.Projects.findById(req.body.project, (err, project)=>{
            if(err) return next(err);
            if(!project) return next("couldn't find the project");
            //TODO should I only allow members but not admin?
            if(!~project.admins.indexOf(req.user.sub) && !~project.members.indexOf(req.user.sub)) return next("you are not member of this project");
            
            //now create a dataset record
            var dataset = new db.Datasets({
                user_id: req.user.sub,

                project: project._id,
                datatype: req.body.datatype,
                datatype_tags: req.body.datatype_tags,

                name: req.body.name,
                desc: req.body.desc,
                tags: req.body.tags,

                prov: req.body.prov,
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
    system.upload(dataset, (err, writestream)=>{
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

//this API allows user to download any files under user's workflow directory
//TODO - since I can't let <a> pass jwt token via header, I have to expose it via URL.
//doing so increases the chance of user misusing the token, but unless I use HTML5 File API
//there isn't a good way to let user download files..
//getToken() below allows me to check jwt token via "at" query.
//Another way to mitigate this is to issue a temporary jwt token used to do file download (or permanent token that's tied to the URL?)
/**
 * @apiGroup Dataset
 * @api {get} /dataset/download/:id Download .tar.gz from dataset archive 
 * @apiDescription              Allows user to download any files from user's resource
 *
 * @apiParam {String} [at]      JWT token - if user can't provide it via authentication header
 *
 * @apiHeader {String} [authorization] A valid JWT token "Bearer: xxxxx"
 *
 */
router.get('/download/:id', jwt({
    secret: config.express.pubkey,
    getToken: function(req) { 
        //load token from req.headers as well as query.at
        if(req.query.at) return req.query.at; 
        if(req.headers.authorization) {
            var auth_head = req.headers.authorization;
            if(auth_head.indexOf("Bearer") === 0) return auth_head.substr(7);
        }
        return null;
    }
}), function(req, res, next) {
    var id = req.params.id;
    logger.debug("requested for downloading dataset "+id);
    getprojects(req.user, function(err, projects) {
        if(err) return next(err);
        var project_ids = projects.map(function(p) { return p._id.toString(); });
        db.Datasets.findById(id, function(err, dataset) {
            if(err) return next(err);
            if(!dataset) return res.status(404).json({message: "couldn't find the dataset specified"});
            logger.debug("user is accessing p", dataset.project);
            logger.debug("user has access to", project_ids);
            if(!~project_ids.indexOf(dataset.project.toString())) 
                return res.status(404).json({message: "you don't have access to the project that the dataset belongs"});
            
            logger.debug("commencing download");
            //open stream
            var system = config.storage_systems[dataset.storage];
            system.download(dataset, (err, readstream)=>{
                if(err) return next(err);
                
                //file .. just stream using sftp stream
                //npm-mime uses filename to guess mime type, so I can use this locally
                //var mimetype = mime.lookup(fullpath);
                //logger.debug("mimetype:"+mimetype);

                //without attachment, the file will replace the current page
                res.setHeader('Content-disposition', 'attachment; filename='+dataset._id+'.tar.gz');
                //res.setHeader('Content-Length', stat.size);
                //res.setHeader('Content-Type', mimetype);
                readstream.pipe(res);             
            });
        });
    });

});

module.exports = router;
