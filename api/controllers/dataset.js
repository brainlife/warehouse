'use strict';

//contrib
const express = require('express');
const router = express.Router();
const winston = require('winston');
const jwt = require('express-jwt');
const async = require('async');
const request = require('request');

const mongoose = require('mongoose');

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

    common.getprojects(req.user, (err, canread_project_ids, canwrite_project_ids)=>{
        if(err) return next(err);
        ands.push({project: {$in: canread_project_ids}});

        var skip = req.query.skip||0;
        let limit = req.query.limit||100;

        //logger.debug(JSON.stringify(ands, null, 4));

        //then look for dataset
        db.Datasets.find({ $and: ands })
        .populate(req.query.populate || '') //all by default
        .select(req.query.select)
        .limit(+limit)
        .skip(+skip)
        .sort(req.query.sort || '_id')
		.lean()
		.exec((err, datasets)=>{
            if(err) return next(err);
            db.Datasets.count({$and: ands}).exec((err, count)=>{
                if(err) return next(err);
                datasets.forEach(rec=>{
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
 * @apiParam {String} distinct  A field to pull distinct values (can't do multiple)
 * @apiParam {Object} [find]    Optional Mongo query to perform (you need to JSON.stringify)
 * 
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         List of distinct values
 */
router.get('/distinct', jwt({secret: config.express.pubkey, credentialsRequired: false}), (req, res, next)=>{
    var find = {};
    if(req.query.find) {
        find = JSON.parse(req.query.find);
        //cast_mongoid(find);
    }
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

//mongoose doesn't cast object id on aggregate pipeline .. https://github.com/Automattic/mongoose/issues/1399
//somewhat futile attempt to convert all string that looks like objectid to objectid.
function cast_mongoid(node) {
    for(var k in node) {
        var v = node[k];
        if(v === null) continue;
        if(typeof v == 'string' && mongoose.Types.ObjectId.isValid(v)) node[k] = mongoose.Types.ObjectId(v);
        if(typeof v == 'object') cast_mongoid(v); //recurse
    }
}

/**
 * @apiGroup Dataset
 * @api {get} /dataset/inventory
 * @apiParam {Object} [find]    Optional Mongo query to perform (you need to JSON.stringify)
 *                              Get counts of unique subject/datatype/datatype_tags. 
 * @apiSuccess {Object}         Object containing counts
 * 
 */
//similar code in pub.js
router.get('/inventory', jwt({secret: config.express.pubkey, credentialsRequired: false}), (req, res, next)=>{
    var find = {};
    if(req.query.find) {
        find = JSON.parse(req.query.find);
        cast_mongoid(find);
    }
    common.getprojects(req.user, function(err, canread_project_ids, canwrite_project_ids) {
        if(err) return next(err);
        db.Datasets.aggregate()
        .match({ 
            $and: [
                {project: {$in: canread_project_ids}},
                find,
                //{removed: false, project: mongoose.Types.ObjectId("592dcc5b0188fd1eecf7b4ec")},
            ]
        })
        .group({_id: {"subject": "$meta.subject", "datatype": "$datatype", "datatype_tags": "$datatype_tags"}, 
            count: {$sum: 1}, size: {$sum: "$size"} })
        .sort({"_id.subject":1})
        .exec((err, stats)=>{
            if(err) return next(err);
            res.json(stats);
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
        res.write("@misc{https://brainlife.io/warehouse/#/dataset/"+dataset._id+",\n")
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

    //test view ... 
    //http://localhost:8080/warehouse/dataset/59dfc38205925425a3a08928
    //http://localhost:8080/warehouse/dataset/5a125376378e992ee16390f7

    //broken - need to fix
    //http://localhost:8080/warehouse/dataset/59970202b36ae423d9fecf03

    let datatypes = {};
    let nodes = [];
    let edges = [];

    function load_task(id, cb) {
        request.get({
            url: config.wf.api+"/task/"+id,
            //qs: { find: JSON.stringify({"_id": id, user_id: null}) },
            json: true,
            headers: {
                //authorization: "Bearer "+config.wf.jwt, //pass admin jwt to query all tasks
                authorization: req.headers.authorization, 
            }
        }, (err, _res, task)=>{
            if(err) return cb(err);
            //if(ret.tasks.length != 1) return cb("couldn't find task:"+id);
            //let task = ret.tasks[0];
            cb(null, task);
        });
    }

    function compose_label(task) {
        let label = task.service; //task.name is sometime like "brainlife.process"..
        if(task.service_branch) label += "("+task.service_branch+")";
        label+="\n"; //task.name is sometime like "brainlife.process"..
        for(let id in task.config) {
            if(id[0] == "_") continue;
            let v = task.config[id];
            let vs = v.toString();
            //TODO - better way to grab only the non-dataset inputs?
            if(vs.indexOf("..") != 0) label += id+":"+vs+"\n";
        }
        return label;
    }

    let datasets_analyzed = [];
    function load_dataset_prov(dataset, defer, cb) {
        let to = "dataset."+dataset._id;
        if(!dataset.prov.task_id) {
            logger.debug("no dataset.prov.task_id", to);
            if(defer) {
                add_node(defer.node);
                edges.push(defer.edge);
            }
            return cb();
        } 
        
        if(defer) {
            logger.debug("has defer", defer.to);
            to = defer.to;
        }

        logger.debug("on dataset", dataset._id.toString());
        logger.debug("loading task", dataset.prov.task_id);
        load_task(dataset.prov.task_id, (err, task)=>{
            if(err) return cb(err);
            if(!dataset.prov || !dataset.prov.app) { //TODO - do I really need to check for prov.app?
                if(task.service == "soichih/sca-product-raw") { //TODO might change in the future
                    if(defer) {
                        add_node(defer.node);
                        edges.push(defer.edge);
                    }
                    load_product_raw(to, dataset._id, cb);
                } else if(task.service.indexOf("brain-life/validator-") === 0) { 
                    if(defer) {
                        add_node(defer.node);
                        edges.push(defer.edge);
                    }
                    cb(); //ignore validator
                } else {
                    add_node({
                        id: "task."+task._id, 
                        label: compose_label(task),
                    });
                    logger.debug("debug------------------------------------------");
                    //logger.debug(JSON.stringify(task, null, 4));
                    //logger.debug(JSON.stringify(dataset, null, 4));
                    edges.push({
                        from: "task."+task._id,
                        to,
                        arrows: "to",
                        label: datatypes[dataset.datatype].name,
                    });
                    load_task_prov(task, cb);
                }
            } else {
                add_node({
                    id: "task."+task._id, 
                    label: compose_label(task),
                });
                //dataset created by another *app*
                let output = dataset.prov.app.outputs.find(output=>{ return output.id == dataset.prov.output_id });
                let label = dataset.prov.output_id+"?";
                if(output) {
                    label = datatypes[output.datatype].name;
                    if(output.datatype_tags && output.datatype_tags.length>0) label += "\n"+output.datatype_tags.toString();
                }
                edges.push({
                    from: "task."+task._id,
                    to,
                    arrows: "to",
                    label,
                });
                load_task_prov(task, cb);
            }
            //load_task_prov(task, cb);
        });
    }

    function load_product_raw(to, dataset_id, cb) {
        //staging task should be shown as dataset input.. 
        /*
        if(!dep_task.config._outputs) {
            logger.debug("load_product_raw - missing _outputs");
            return cb();
        }
        */
        if(~datasets_analyzed.indexOf(dataset_id.toString())) return cb();
        datasets_analyzed.push(dataset_id.toString());
        
        //load all datasets that sca-product-raw has loaded
        db.Datasets
        .findById(dataset_id)
        .populate('prov.app project')
        .exec((err, dataset)=>{
            if(err) return cb(err);
            
            //but.. we don't want to show this dataset node yet.. it might be generated by other tasks
            //so, let's create "defer" object and pass it to load_dataset_prov. If it is indeed the edge,
            //then load_dataset_prov will display
            let defer = {
                node: {
                    id: "dataset."+dataset_id, 
                    color: "#159957",
                    font: {size: 12, color: "#fff"},
                    label:dataset.project.name+" / "+ dataset.meta.subject + "\n" +datatypes[dataset.datatype].name,
                },
                edge: {
                    from: "dataset."+dataset_id,
                    to,
                    arrows: "to",
                    color: "#ccc",
                },
                to,
            };
            logger.debug("defer", defer);
            load_dataset_prov(dataset, defer, cb);
        });
    }

    let tasks_analyzed = [];
    function load_task_prov(task, cb) {
        if(~tasks_analyzed.indexOf(task._id)) return cb();
        tasks_analyzed.push(task._id);

        if(!task.deps) return cb(); //just in case?
        if(!task.config) return cb(); 
        async.eachSeries(task.config._inputs, (input, next_dep)=>{
            //logger.debug("loading input");
            //logger.debug(JSON.stringify(input, null, 4));
            if(!input.task_id) return next_dep(); //old task didn't have this set?
            load_task(input.task_id, (err, dep_task)=>{
                if(err) return next_dep(err);
                
                //process uses sca-product-raw to load input datasets
                //instead of showing that, let's *skip* this node back to datasets that it loaded
                //and load their tasks
                if(dep_task.service == "soichih/sca-product-raw") { //TODO might change in the future
                    console.log(JSON.stringify(input, null, 4));
                    load_product_raw("task."+task._id, input.dataset_id||input._id||input.subdir, next_dep);
                } else {
                    //task2task
                    add_node({
                        id: "task."+input.task_id,
                        label: compose_label(dep_task),
                    });
                    edges.push({
                        from: "task."+input.task_id,
                        to: "task."+task._id,
                        arrows: "to",
                        label: datatypes[input.datatype].name, //+"\n"+(dataset.desc||''),
                    });
                    load_task_prov(dep_task, next_dep); //recurse to its deps
                }
            });
        }, cb);
    }

    function add_node(newnode) {
        let ex = nodes.find(node=>{return (node.id == newnode.id);});
        if(!ex) nodes.push(newnode);
    }

    //TODO cache datatype?
    db.Datatypes.find({})
    .exec((err, _datatypes)=>{
        if(err) return cb(err);
        _datatypes.forEach(_datatype=>{
            datatypes[_datatype._id] = _datatype;
        });
        
        //start by loading dest datasource
        db.Datasets
        .findOne({ _id: req.params.id })
        .populate('prov.app')
        .exec((err, dataset)=>{
            if(err) return cb(err);
            if(!dataset) return res.status(404).end();
            nodes.push({
                //"this dataset"
                id: "dataset."+dataset._id, 
            });
            load_dataset_prov(dataset, null, err=>{
                if(err) return next(err);
                res.json({nodes, edges});
            });
        })
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
            //get the task to archive
            request.get({
                url: config.wf.api+"/task/"+req.body.task_id, json: true,
                headers: { authorization: req.headers.authorization, }
            }, (err, _res, _task)=>{
                //if(ret.tasks.length != 1) return next("couldn't find task");
                //var _task = ret.tasks[0];
                console.dir(_task);
                if(_task.user_id != req.user.sub) return next("you don't own this task");
                if(!_task.resource_id) return next("resource_id not set");
                if(_task.status != "finished") return next("task not in finished state");
                
                //make sure user is member of the project selected
                db.Projects.findById(req.body.project, (err, project)=>{
                    if(err) return next(err);
                    if(!project) return next("couldn't find the project");
                    if(!~project.members.indexOf(req.user.sub)) return next("you are not member of this project");
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
                //actually, I might keep this as source of truth and neo4j as tool to query similar information
                prov: {
                    //always set
                    instance_id: task.instance_id,
                    task_id: task._id,
                    //app: req.body.app_id, //deprecated

                    //optional
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
    credentialsRequired: false,
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
    //logger.debug("requested to download dataset "+id);
    common.getprojects(req.user, function(err, canread_project_ids, canwrite_project_ids) {
        if(err) return next(err);
        db.Datasets.findById(id).populate('datatype').exec(function(err, dataset) {
            if(err) return next(err);
            if(!dataset) return res.status(404).json({message: "couldn't find the dataset specified"});
            if(!dataset.storage) return next("dataset:"+dataset._id+" doesn't have storage field set");
            
            if(dataset.publications && dataset.publications.length > 0) {
                //this dataset is published .. no need for access control
                //TODO - maybe I should still limit download without correct publication id? (what's the point?)
            } else {
                //unpublished -- need to do access control
                canread_project_ids = canread_project_ids.map(id=>id.toString());
                if(!~canread_project_ids.indexOf(dataset.project.toString())) {
                    return res.status(403).json({message: "you don't have access to the project that the dataset belongs"});
                } 
            }
            
            //open stream
            var system = config.storage_systems[dataset.storage];
            var stat_timer = setTimeout(function() {
                logger.debug("timeout while calling stat on "+dataset.storage);
                next("stat timeout - filesystem maybe offline today:"+dataset.storage);
            }, 1000*15);
            system.stat(dataset, (err, stats)=>{
                clearTimeout(stat_timer);
                if(err) return next(err);
                logger.debug("obtaining download stream", dataset.storage);
                system.download(dataset, (err, readstream, filename)=>{
                    if(err) return next(err);
                    //without attachment, the file will replace the current page
                    res.setHeader('Content-disposition', 'attachment; filename='+filename);
                    if(stats) res.setHeader('Content-Length', stats.size);
                    else if(dataset.size) res.setHeader('Content-Length', dataset.size);
                    logger.debug("sent headers.. commencing download");
                    readstream.pipe(res);   
                    readstream.on('error', err=>{
                        //is this getting called at all?
                        logger.error("failed to pipe", err);
                    });

                    //TODO - "end" seems to work on both jetstream and ssh(dcwan), but is it truely universal? 
                    //or do we need to switch to use Promise like upload?
                    readstream.on('end', ()=>{
                        logger.debug("updating download_count");
                        if(!dataset.download_count) dataset.download_count = 1;
                        else dataset.download_count++;
                        dataset.save();
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
    const id = req.params.id;
    common.getprojects(req.user, function(err, canread_project_ids, canwrite_project_ids) {
        db.Datasets.findById(id, function(err, dataset) {
            if(err) return next(err);
            if(!dataset) return next(new Error("can't find the dataset with id:"+id));
            if(canedit(req.user, dataset, canwrite_project_ids)) {
                dataset.remove_date = new Date();
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
