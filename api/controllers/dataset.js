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

function canedit(user, rec) {
    if(user) {
        if(user.scopes.warehouse && ~user.scopes.warehouse.indexOf('admin')) return true;
        //if(~rec.admins.indexOf(user.sub.toString())) return true;
        if(rec.user_id == user.sub.toString()) return true;
    }
    return false;
}

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

    var select = null;
    if(req.query.select) {
        select = req.query.select;
        //always load user_id so that we can compute canedit properly
        if(!~select.indexOf("user_id")) select+=" user_id";
    }

    getprojects(req.user, function(err, projects) {
        if(err) return next(err);
        var project_ids = projects.map(function(p) { return p._id; });

        var limit = 100;
        if(req.query.limit) limit = parseInt(req.query.limit);
        var skip = 0;
        if(req.query.skip) limit = parseInt(req.query.skip);
    
        //then look for dataset
        db.Datasets
        .find({
            $and: [
                {project: {$in: project_ids}},
                find
            ]
        })
        .populate(req.query.populate || '') //all by default
        .select(select)
        .limit(limit)
        .skip(skip)
        .sort(req.query.sort || '_id')
        .lean()
        .exec((err, datasets)=>{
            if(err) return next(err);
            db.Datasets.count(find).exec((err, count)=>{
                if(err) return next(err);
                
                //adding some derivatives
                datasets.forEach(function(rec) {
                    rec._canedit = canedit(req.user, rec);
                });
                
                res.json({datasets: datasets, count: count});
            });
        });
    });
});

/**
 * @apiGroup Dataset
 * @api {get} /dataset/bibtex/:id   Download BibTex JSON
 * @apiDescription              Output BibTex JSON content for specified dataset ID
 *
 */
router.get('/bibtex/:id', (req, res, next)=>{
    db.Datasets.findById(req.params.id, function(err, dataset) {
        if(err) return next(err);
        res.set('Content-Type', 'application/x-bibtex');
        res.write("@misc{https://doi.org/11.1111/b.ds."+dataset._id+",\n")
        res.write(" doi = {11.1111/b.ds."+dataset._id+"},\n");
        res.write(" author = {Hayashi, Soichi},\n");
        res.write(" keywords = {},\n");
        res.write(" title = {"+dataset.name+"},\n");
        res.write(" publisher = {BrainLife},\n");
        res.write(" year = {"+(dataset.create_date.getYear()+1900)+"},\n");
        res.write("}");
        res.end();
    });
});


/**
 * @apiGroup Dataset
 * @api {post} /dataset                 Create new dataset from wf service task
 * @apiDescription                      Make a request to create a new dataset from wf service taskdir
 *
 * @apiParam {String} instance_id       WF service Instance ID
 * @apiParam {String} task_id           WF service Task ID (of output task)
 *
 * @apiParam {String} project           Project ID used to store this dataset under
 * @apiParam {String} datatype          Data type ID for this dataset (from Datatypes)
 * @apiParam {Object} [prov]            Provenane info {app, deps, config} - don't set if it's uploaded
 * @apiParam {Object} [meta]            Metadata - as prescribed in datatype.meta
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
    
    async.waterfall([
        cb=>{
            //get task
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
            }, cb);
        },

        (_res, ret, cb)=>{
            //make sure user owns this instance
            if(ret.tasks.length != 1) return cb("couldn't find task");
            var task = ret.tasks[0];
            if(task.user_id != req.user.sub) return cb("you don't own this instance");
            
            //make sure user is member of the project selected
            db.Projects.findById(req.body.project, (err, project)=>{
                if(err) return cb(err);
                if(!project) return cb("couldn't find the project");
                //TODO should I only allow members but not admin?
                if(!~project.admins.indexOf(req.user.sub) && !~project.members.indexOf(req.user.sub)) return cb("you are not member of this project");
                cb(null, task);
            });
        },

        (task, cb)=>{
            //now create a dataset record
            var dataset = new db.Datasets({
                user_id: req.user.sub,

                project: req.body.project,
                datatype: req.body.datatype,
                datatype_tags: req.body.datatype_tags,

                name: req.body.name,
                desc: req.body.desc,
                tags: req.body.tags||[],

                prov: req.body.prov||{},
                meta: req.body.meta||{},
            });

            logger.debug("creating dataset");
            //logger.debug(dataset);
            
            dataset.save((e, _dataset)=>{
                if(e) return next(e);
                res.json(_dataset);
                
                //then, asynchrnously copy content to the storage
                archive(task, _dataset, req, function(err) {
                    if(err) logger.error(err);
                    //TODO post event?
                });
            });
        },

    ], next); //end-waterfall
});

function archive(task, dataset, req, cb) {
    if(!task.resource_id) {
        return cb('task '+task._id+' has no resource_id set');
    }

    //TODO should I error if task status is not finished?
    if(task.status != 'finished') logger.warn('task '+task._id+' status is not finished');

    //TODO pick the best storage based on project?
    var storage = config.storage_default();
    var system = config.storage_systems[storage];
    logger.debug("obtaining upload stream");
    system.upload(dataset, (err, writestream)=>{
        if(err) return cb(err);
        logger.debug("uploading");

        //download the entire .tar.gz from sca-wf service
        request.get({
            url: config.wf.api+"/resource/download",
            qs: {
                r: task.resource_id,
                p: task.instance_id+"/"+task._id+"/"+(req.body.dirname||''),
            },
            headers: {
                authorization: req.headers.authorization, 
            }
        })
        //and pipe it directly to the storage
        .on('response', function(r) {
            console.log("stream response received");
            if(r.statusCode != 200) {
                cb("/resource/download failed "+r.statusCode);
            } else {
                //success.. set storage
                logger.info("done!");
                dataset.storage = storage;
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
            if(!dataset.storage) return next("dataset:"+dataset._id+" doesn't have storage field set");
            logger.debug("user is accessing p", dataset.project);
            logger.debug("user has access to", project_ids);
            if(!~project_ids.indexOf(dataset.project.toString())) {
                return res.status(404).json({message: "you don't have access to the project that the dataset belongs"});
            } 
            
            //open stream
            var system = config.storage_systems[dataset.storage];
            var stat_timer = setTimeout(function() {
                logger.debug("stat timer called");
                next("filesystem maybe offline today");
            }, 1000*3);
            system.stat(dataset, (err, stats)=>{
                clearTimeout(stat_timer);
                logger.debug("post stats", err, stats);
                if(err) return next(err);

                system.download(dataset, (err, readstream)=>{
                    if(err) return next(err);

                    //file .. just stream using sftp stream
                    //npm-mime uses filename to guess mime type, so I can use this locally
                    //var mimetype = mime.lookup(fullpath);
                    //logger.debug("mimetype:"+mimetype);

                    //without attachment, the file will replace the current page
                    res.setHeader('Content-disposition', 'attachment; filename='+dataset._id+'.tar.gz');
                    res.setHeader('Content-Length', stats.size);
                    //res.setHeader('Content-Type', mimetype); //TODO?
                    logger.debug("commencing download");
                    readstream.pipe(res);   
                    readstream.on('error', err=>{
                        logger.error("failed to pipe", err);
                        //next(err); //this doen't really abort download and emit error message to the user..
                    });
                });
                    
            });

        });
    });
});

/**
 * @apiGroup Dataset
 * @api {delete} /dataset/:id
 *                              Hide dataset from dataset results
 * @apiDescription              Logically remove dataset by setting "removed" to true
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 */
router.delete('/:id', jwt({secret: config.express.pubkey}), function(req, res, next) {
    var id = req.params.id;
    db.Datasets.findById(req.params.id, function(err, dataset) {
        if(err) return next(err);
        if(!dataset) return next(new Error("can't find the dataset with id:"+req.params.id));
        if(canedit(req.user, dataset)) {
            dataset.removed = true;
            dataset.save(function(err) {
                if(err) return next(err);
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

module.exports = router;
