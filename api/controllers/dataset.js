'use strict';

//contrib
const express = require('express');
const router = express.Router();
const winston = require('winston');
const jwt = require('express-jwt');
const async = require('async');
const request = require('request');

//mine
const config = require('../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');
const common = require('../common');
const prov = require('../prov');

function canedit(user, rec, canwrite_project_ids) {
    if(!rec.user_id) return false; //get doesn't require jwt
    if(user) {
        if(user.scopes.warehouse && ~user.scopes.warehouse.indexOf('admin')) return true;
        if(rec.user_id == user.sub.toString()) return true;
        let canwrite_project_ids_str = canwrite_project_ids.map(id=>id.toString());
        let project_id = rec.project._id || rec.project; //could be populated
        if(~canwrite_project_ids_str.indexOf(project_id.toString())) return true;
    }
    console.log("can't edit");
    return false;
}

/**
 * @apiGroup Dataset
 * @api {get} /dataset          Query Datasets
 * @apiDescription              Returns all dataset entries accessible to the user
 *
 * @apiParam {Object} [find]    Optional Mongo query to perform (you need to JSON.stringify)
 * @apiParam {Object} [sort]    Mongo sort object - defaults to _id. Enter in string format like "-name%20desc"
 * @apiParam {String} [select]  Fields to load - multiple fields can be entered with %20 as delimiter (default all)
 * @apiParam {String[]} [datatype_tags]  
 *                              List of datatype tags to filter (you can use exlusion tags also)
 * @apiParam {Number} [limit]   Maximum number of records to return - defaults to 100
 * @apiParam {Number} [skip]    Record offset for pagination (default to 0)
 * @apiParam {String} [populate] Fields to populate - default to "project datatype"
 * 
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         List of datasets (maybe limited / skipped) and total count
 */
router.get('/', jwt({secret: config.express.pubkey, credentialsRequired: false}), (req, res, next)=>{
    var ands = [];
    if(req.query.find) ands.push(JSON.parse(req.query.find));
    if(req.query.datatype_tags) {
        req.query.datatype_tags.forEach(tag=>{ 
            if(tag[0] == "!") {
                ands.push({datatype_tags: {$ne: tag.substring(1)}});
            } else {
                ands.push({datatype_tags: tag});
            }
        });
    }

    common.getprojects(req.user, function(err, canread_project_ids, canwrite_project_ids) {
        if(err) return next(err);
        ands.push({project: {$in: canread_project_ids}});

        var limit = 100;
        if(req.query.limit) limit = parseInt(req.query.limit);
        var skip = 0;
        if(req.query.skip) skip = parseInt(req.query.skip);

        //then look for dataset
        db.Datasets.find({ $and: ands })
        .populate(req.query.populate || '') //all by default
        .select(req.query.select)
        .limit(limit)
        .skip(skip)
        .sort(req.query.sort || '_id')
		.lean()
		.exec((err, datasets)=>{
            if(err) return next(err);
            db.Datasets.count({$and: ands}).exec((err, count)=>{
                if(err) return next(err);
                datasets.forEach(function(rec) {
                    rec._canedit = canedit(req.user, rec, canwrite_project_ids);
                });
                res.json({datasets: datasets, count: count});
            });
        });
    });
});

/**
 * @apiGroup Dataset
 * @api {get} /dataset/distinct Query distinct values
 * @apiDescription              Returns all dataset entries accessible to the user has access
 *
 * @apiParam {String} distinct  Field(s) to pull distinct values
 * @apiParam {Object} [find]    Optional Mongo query to perform (you need to JSON.stringify)
 * 
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         List of distinct values
 */
router.get('/distinct', jwt({secret: config.express.pubkey, credentialsRequired: false}), (req, res, next)=>{
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);
    common.getprojects(req.user, function(err, canread_project_ids, canwrite_project_ids) {
        if(err) return next(err);
        db.Datasets
        .find({
            $and: [
                {project: {$in: canread_project_ids}},
                find
            ]
        })
        .distinct(req.query.distinct)
		.exec((err, values)=>{
            if(err) return next(err);
            res.json(values);
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
        if(!dataset) return res.status(404).end();

        res.set('Content-Type', 'application/x-bibtex');
        res.write("@misc{https://brain-life.org/warehouse/#/dataset/"+dataset._id+",\n")
        //res.write(" doi = {11.1111/b.ds."+dataset._id+"},\n");
        res.write(" author = {Hayashi, Soichi},\n");
        res.write(" keywords = {},\n");
        res.write(" title = {brainlife dataset "+dataset._id+"},\n");
        res.write(" publisher = {BrainLife},\n");
        res.write(" year = {"+(dataset.create_date.getYear()+1900)+"},\n");
        res.write("}");
        res.end();
    });
});

/**
 * @apiGroup Dataset
 * @api {get} /dataset/prov/:id     Get provenance
 * @apiDescription                  Get provenance graph info
 *
 */
router.get('/prov/:id', (req, res, next)=>{
    db.Datasets.findById(req.params.id, function(err, dataset) {
        if(err) return next(err);
        if(!dataset) return res.status(404).end();
        prov.query(dataset, (err, _prov)=>{
            if(err) return next(err);
            res.json(_prov);
        });
    });
});

/**
 * @apiGroup Dataset
 * @api {post} /dataset                 Create new dataset from wf service task
 * @apiDescription                      Make a request to create a new dataset from wf service taskdir
 *
 * @apiParam {String} project           Project ID used to store this dataset under
 * @apiParam {String} task_id           WF service Task ID (of output task)
 * @apiParam {Object} [app_id]          Application used to generate this dataset (don't set if it's uploaded)
 * @apiParam {String} [output_id]       Output ID of the app_id (not set if uploaded)
 * @apiParam {String} [subdir]          Subdirectory where all files are actually stored under the task output
 *
 * @apiParam {String} datatype          Data type ID for this dataset (from Datatypes)
 * @apiParam {String[]} datatype_tags   Datatype tags to set
 * @apiParam {Object} [files]           File mapping to override default file path given by datatype
 *
 * @apiParam {Object} [meta]            Metadata - as prescribed in datatype.meta
 * @apiParam {String} [desc]            Description for this crate
 * @apiParam {String[]} [tags]          List of tags associated with this dataset
 *
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}                 Dataset created
 *                              
 */
router.post('/', jwt({secret: config.express.pubkey}), (req, res, cb)=>{
    if(!req.body.project) return cb("project id not set");
    if(!req.body.datatype) return cb("datatype id not set");
    if(!req.body.task_id) return cb("task_id not set");
	if(!req.body.files) req.body.files = {};
    
	//TODO - files (especially file.dirname) must be well validated.

    var task = null;
    var datatype = null;
    var dataset = null;
	var tmpdir = null;
	var cleantmp = null;

    async.series([
        next=>{
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
            }, (err, _res, ret)=>{
                if(ret.tasks.length != 1) return next("couldn't find task");
                var _task = ret.tasks[0];
                if(_task.user_id != req.user.sub) return next("you don't own this instance");
                if(!_task.resource_id) return next("resource_id not set");
                if(_task.status != "finished") return next("task not in finished state");
                
                //make sure user is member of the project selected
                db.Projects.findById(req.body.project, (err, project)=>{
                    if(err) return next(err);
                    if(!project) return next("couldn't find the project");
                    //TODO should I only allow members but not admin?
                    if(!~project.admins.indexOf(req.user.sub) && !~project.members.indexOf(req.user.sub)) 
                        return next("you are not member of this project");
                    logger.debug("task loaded", _task);
                    task = _task;
                    next();
                });
            });
        },

        next=>{
			logger.debug("registering new dataset record");
            new db.Datasets({
                user_id: req.user.sub,

                project: req.body.project,
                datatype: req.body.datatype,
                datatype_tags: req.body.datatype_tags,

                desc: req.body.desc,
                tags: req.body.tags||[],

                //should be deprecate with neo4j, but still used by UI
                //also used by event_handler to see if the task output is archived already or not
                prov: {
                    instance_id: task.instance_id,
                    task_id: task._id,
                    app: req.body.app_id, //deprecated
                    output_id: req.body.output_id,
                    subdir: req.body.subdir,
                },
                meta: req.body.meta||{},
            }).save((err, _dataset)=>{
        		dataset = _dataset;
                res.json(dataset); //not respond back to the caller - but processing has just began
                next(err);
            });
        },

        next=>{
            logger.debug("transfering data");
            common.archive_task(task, dataset, req.body.files, req.headers.authorization, next);
        },

    ], err=>{
        if(err) logger.error(err);
        else logger.debug("all done archiving");    
	});
});

/**
 * @apiGroup Dataset
 * @api {put} /dataset/:id      Update Dataset
 *                              
 * @apiDescription              Update Dataset
 *
 * @apiParam {String} [desc]    Description for this dataset 
 * @apiParam {String[]} [tags]  List of tags to classify this dataset
 * @apiParam {Object} [meta]    Metadata
 * @apiParam {String[]} [admins]  List of new admins (auth sub)
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Updated Dataset
 */
router.put('/:id', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    var id = req.params.id;
    common.getprojects(req.user, function(err, canread_project_ids, canwrite_project_ids) {
        db.Datasets.findById(id, (err, dataset)=>{
            if(err) return next(err);
            if(!dataset) return res.status(404).end();
            if(canedit(req.user, dataset, canwrite_project_ids)) {
                //types are checked by mongoose
                if (req.body.desc) dataset.desc = req.body.desc;
                if (req.body.tags) dataset.tags = req.body.tags;
                if (req.body.meta) dataset.meta = req.body.meta;
                if (req.body.admins) dataset.admins = req.body.admins;
                dataset.save((err)=>{
                    if(err) return next(err);
                    dataset = JSON.parse(JSON.stringify(dataset));
                    dataset._canedit = canedit(req.user, dataset, canwrite_project_ids); //need to recompute with new admin/members list
                    res.json(dataset);
                });
            } else return res.status(401).end("you are not administartor of this dataset");
        });
    });
});

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
    common.getprojects(req.user, function(err, canread_project_ids, canwrite_project_ids) {
        if(err) return next(err);
        db.Datasets.findById(id).populate('datatype').exec(function(err, dataset) {
            if(err) return next(err);
            if(!dataset) return res.status(404).json({message: "couldn't find the dataset specified"});
            if(!dataset.storage) return next("dataset:"+dataset._id+" doesn't have storage field set");

            canread_project_ids = canread_project_ids.map(id=>id.toString());
            
            //logger.debug("user has access to", canread_project_ids);
            if(!~canread_project_ids.indexOf(dataset.project.toString())) {
                return res.status(403).json({message: "you don't have access to the project that the dataset belongs"});
            } 
            
            //open stream
            var system = config.storage_systems[dataset.storage];
            var stat_timer = setTimeout(function() {
                logger.debug("timeout while calling stat on "+dataset.storage);
                next("stat timeout - filesystem maybe offline today:"+dataset.storage);
            }, 1000*15);
            system.stat(dataset, (err, stats)=>{
                clearTimeout(stat_timer);
                logger.debug(JSON.stringify(stats, null, 4));
                if(err) return next(err);

                system.download(dataset, (err, readstream, filename)=>{
                    if(err) return next(err);

                    //file .. just stream using sftp stream
                    //npm-mime uses filename to guess mime type, so I can use this locally
                    //var mimetype = mime.lookup(fullpath);
                    //logger.debug("mimetype:"+mimetype);

                    //without attachment, the file will replace the current page
                    res.setHeader('Content-disposition', 'attachment; filename='+filename);
                    if(stats) res.setHeader('Content-Length', stats.size);
                    logger.debug("sent headers.. commencing download");
                    readstream.pipe(res);   
                    readstream.on('error', err=>{
                        logger.error("failed to pipe", err);
                    });
                    readstream.on('close', err=>{
                        //close won't fire if user cancel download mid-way
                        if(!dataset.download_count) dataset.download_count = 1;
                        else dataset.download_count++;
                        dataset.save();
                        //logger.debug("incremented download_count", dataset.download_count);
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
    common.getprojects(req.user, function(err, canread_project_ids, canwrite_project_ids) {
        db.Datasets.findById(req.params.id, function(err, dataset) {
            if(err) return next(err);
            if(!dataset) return next(new Error("can't find the dataset with id:"+req.params.id));
            if(canedit(req.user, dataset, canwrite_project_ids)) {
                dataset.removed = true;
                dataset.save(function(err) {
                    if(err) return next(err);
                    res.json({status: "ok"});
                }); 
            } else return res.status(401).end();
        });
    });
});

module.exports = router;
