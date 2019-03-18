'use strict';

//contrib
const express = require('express');
const router = express.Router();
const winston = require('winston');
const jwt = require('express-jwt');
const jsonwebtoken = require('jsonwebtoken');
const async = require('async');
const request = require('request');
const rp = require('request-promise-native');
const meter = require('stream-meter');
const mongoose = require('mongoose');

//mine
const config = require('../config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../models');
const common = require('../common');

function canedit(user, rec, canwrite_project_ids) {
    if(!rec.user_id) return false;  //TODO - can this really happen?
    if(user) {
        if(rec.user_id == user.sub.toString()) return true;
        let canwrite_project_ids_str = canwrite_project_ids.map(id=>id.toString());
        let project_id = rec.project._id || rec.project; //could be populated.. 
        if(~canwrite_project_ids_str.indexOf(project_id.toString())) return true;
    }
    return false;
}

function isimporttask(task) {
    return ( 
        task.service == "soichih/sca-product-raw" ||  //deprecated
        task.service == "soichih/sca-service-noop" || //deprecated
        task.service == "brainlife/app-stage" || 
        task.service == "brainlife/app-noop" ||
        ~task.service.indexOf("brainlife/validator-") ||
        ~task.service.indexOf("brain-life/validator-")
    );
}

function construct_dataset_query(query, canread_project_ids) {
    var ands = [];
    if(query.find) ands.push(query.find);

    //handle datatype_tags
    //TODO DEPRECATE! - I should use {$all: []} and {$nin: []}?
    if(query.datatype_tags) {
        query.datatype_tags.forEach(tag=>{ 
            if(tag[0] == "!") {
                ands.push({datatype_tags: {$ne: tag.substring(1)}});
            } else {
                ands.push({datatype_tags: tag});
            }
        });
    }
    
    //put things together
    ands.push({$or: [
        {project: {$in: canread_project_ids}},
        {publications: {$gt:[]}}, //allow access for published dataset
    ]});
    return { $and: ands };
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
 *                              (Deprecate) List of datatype tags to filter (you can use exclusion tags also).
 *                              as this is not too difficult to construct
 * @apiParam {Number} [limit]   Maximum number of records to return - defaults to 100
 * @apiParam {Number} [skip]    Record offset for pagination (default to 0)
 * @apiParam {String} [populate] Fields to populate
 * 
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         List of datasets (maybe limited / skipped) and total count
 */
router.get('/', jwt({secret: config.express.pubkey, credentialsRequired: false}), (req, res, next)=>{
    let skip = req.query.skip||0;
    let limit = req.query.limit||100; //this means if user set it to "0", no limit
    if(req.query.find) req.query.find = JSON.parse(req.query.find);

    let populate = ''; //'all' by default?
    if(req.query.populate) {
        try {
            //try object
            populate = JSON.parse(req.query.populate);
        } catch(err) {
            //treat it as string
            populate = req.query.populate; 
        }
    }

    common.getprojects(req.user, (err, canread_project_ids, canwrite_project_ids)=>{
        if(err) return next(err);
        let query = construct_dataset_query(req.query, canread_project_ids);
        //console.log(JSON.stringify(query, null, 4));
        db.Datasets.find(query)
        .populate(populate)
        .select(req.query.select)
        .limit(+limit)
        .skip(+skip)
        .sort(req.query.sort || '_id')
		.lean()
		.exec((err, datasets)=>{
            if(err) return next(err);
            db.Datasets.countDocuments(query).exec((err, count)=>{
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
//warning.. similar code in pub.js
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
            ]
        })
        .group({_id: {
            "subject": "$meta.subject", 
            "datatype": "$datatype", 
            "datatype_tags": "$datatype_tags"
        }, count: {$sum: 1}, size: {$sum: "$size"} })
        .sort({"_id.subject":1})
        .exec((err, stats)=>{
            if(err) return next(err);
            res.json(stats);
        });
    });
});

/**
 * @apiGroup Dataset
 * @api {get} /dataset/prov/:id     Get provenance
 * @apiDescription                  Get provenance graph info
 *
 */
router.get('/prov/:id', (req, res, next)=>{
    let datatypes = {};
    let nodes = [];
    let edges = [];
    let this_dataset;

    //starting from the dataset ID specified, walk back through dataset prov & task deps all the way to the 
    //original input datasets
    function load_task(id, cb) {
        request.get({
            url: config.amaretti.api+"/task/"+id,
            json: true,
            /*
            //task/:id api is now public.. 
            headers: q authorization: req.headers.authorization, 
            }
            */
        }, (err, _res, task)=>{
            if(err) return cb(err);
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
            let vs = v?v.toString():'(null)';
            //TODO - better way to grab only the non-dataset inputs?
            if(vs.indexOf("..") != 0) label += id+":"+vs+"\n";
        }
        return label;
    }
    
    function compose_dataset_label(dataset) {
        //datatype should never be missing.. but it happened during testing
        let datatype_name = dataset.datatype;
        let datatype = datatypes[dataset.datatype.toString()];
        if(datatype) datatype_name = datatype.name;
        if(dataset.datatype_tags) datatype_name += " "+dataset.datatype_tags.join(":")
        
        let label = "";
        label += dataset.project.name+" / ";
        label += dataset.meta.subject + "\n";
        label += datatype_name + "\n";
        label += dataset.tags.join(" ");
        return label; 
    }

    let datasets_analyzed = [];
    function load_dataset_prov(dataset, defer, cb) {
        let to = "dataset."+dataset._id;
        if(defer) to = defer.to;

        //console.log("loading dataset prov", dataset._id.toString()); 
        if(!dataset.prov.task) {
            //leaf dataset.. we are done!
            if(defer) {
                //but we have defer.. so add it for the last time
                add_node(defer.node);
                edges.push(defer.edge);
            }
            datasets_analyzed.push(dataset._id.toString());
            return cb();
        }

        load_task(dataset.prov.task._id, (err, task)=>{
            if(err) return cb(err);
            if(!task.service) task.service = "unknown"; //only happens for dev/test? (TODO.. maybe I should cb()?)
            if(isimporttask(task)) {
                if(defer) {
                    add_node(defer.node);
                    datasets_analyzed.push(dataset._id.toString());
                    if(defer.edge.to != defer.edge.from) edges.push(defer.edge);
                    to = defer.node.id;
                }
                if(dataset.prov.subdir) load_stage(to, dataset.prov.subdir, cb);
                else load_stage(to, dataset._id, cb);
            } else {
                //should be a normal task..
                add_node({
                    id: "task."+task._id, 
                    label: compose_label(task),
                    _app: (task.config?task.config._app:null),
                });

                let edge_label = datatypes[dataset.datatype].name+" "+dataset.datatype_tags.join(",");
                let archived_dataset_id = null;
                if(defer) {
                    let label_parts = defer.node.label.split("\n");
                    if(label_parts[2]) edge_label += "\n"+label_parts[2];//tags
                    archived_dataset_id = defer.node.id.split(".")[1];
                }
                /*
                if(defer) {
                    let label_parts = defer.node.label.split("\n");
                    edges.push({
                        from: "task."+task._id,
                        to: defer.node.id,
                        arrows: "to",
                        label: label_parts[1],
                    });
                    defer.node.label = label_parts[0]+"\n"+label_parts[2];
                    defer.node._archive = true;
                    add_node(defer.node);
                    edges.push({
                        from: defer.node.id,
                        to,
                        arrows: "to",
                    });
                } else {*/

                edges.push({
                    to,
                    from: "task."+task._id,
                    arrows: "to",
                    label: edge_label,
                    _archived_dataset_id: archived_dataset_id,
                });
                load_task_prov(task, cb);
            }
        });
    }

    function load_stage(to, dataset_id, cb) {
        //staging task should be shown as dataset input.. 
        if(~datasets_analyzed.indexOf(dataset_id.toString())) {
            //dataset already analyzed.. just add edge
            var found = false;
            var from = "dataset."+dataset_id;
            var found = edges.find(e=>(e.from == from && e.to == to));
            if(to != from && !found) edges.push({ from, to, arrows: "to", });
            return cb();
        }

        db.Datasets
        .findById(dataset_id)
        .populate('prov.app project')
        .exec((err, dataset)=>{
            if(err) return cb(err);
            if(!dataset) {
                logger.warn("no such dataset .. removed?", dataset_id);
                return cb();
            }

            //but.. we don't want to show this dataset node yet.. it might be generated by other tasks
            //so, let's create "defer" object and pass it to load_dataset_prov. If it is indeed the edge,
            //then load_dataset_prov will display
            
            //dataset to dataset links are formed when user *copy* dataset to another project
            let label = null;
            if(to.indexOf("dataset.") === 0) label = "copy";

            let defer = {
                node: {
                    id: "dataset."+dataset_id, 
                    label: compose_dataset_label(dataset),
                    /*
                    label:  dataset.project.name+" / "+ 
                            dataset.meta.subject + "\n"+
                            datatype_name + "\n"+
                            dataset.tags.join(" ")
                    */
                },
                edge: {
                    from: "dataset."+dataset_id,
                    to,
                    arrows: "to",
                    label,
                },
                to,
            };
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
            if(!input.task_id) return next_dep(); //old task didn't have this set?
            load_task(input.task_id, (err, dep_task)=>{
                if(err) return next_dep(err);
                
                //process uses app-stage to load input datasets
                //instead of showing that, let's *skip* this node back to datasets that it loaded
                //and load their tasks
                if(dep_task.service == "soichih/sca-product-raw" || dep_task.service == "brainlife/app-stage") { 
                    load_stage("task."+task._id, input.dataset_id||input._id||input.subdir, next_dep);
                } else {
                    //task2task
                    let datatype = datatypes[input.datatype];
                    if(!datatype) datatype = {name: "unknown "+input.datatype};
                    add_node({
                        id: "task."+input.task_id,
                        label: compose_label(dep_task),
                        _app: dep_task.config._app,
                    });
                    edges.push({
                        from: "task."+input.task_id,
                        to: "task."+task._id,
                        arrows: "to",
                        label: datatype.name+" "+input.datatype_tags.join(","),
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
            datatypes[_datatype._id.toString()] = _datatype;
        });
        
        //start by loading *this dataset*
        db.Datasets
        .findOne({ _id: req.params.id })
        .populate('prov.app')
        .exec((err, dataset)=>{
            if(err) return cb(err);
            if(!dataset) return res.status(404).end();
            this_dataset = dataset;
            nodes.push({
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
 * @apiParam {String} output_id         output_id to archive
 * @apiParam {String} [subdir]          Subdirectory where all files are actually stored under the task output
 *
 * @apiParam {Object} [meta]            Metadata - to override
 * @apiParam {String[]} [tags]          List of tags to add
 * @apiParam {String} [desc]            Description for archived dataset
 *
 * @apiHeader {String} authorization 
 *                                      A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}                 Dataset created
 *                              
 */
router.post('/', jwt({secret: config.express.pubkey}), (req, res, cb)=>{
    if(!req.body.project) return cb("project id not set");
    if(!req.body.task_id) return cb("task_id not set");
    if(!req.body.output_id) return cb("output_id not set");

    //to be loaded..
    let task = null;
    let archive_task = null;
    let dataset = null;

    async.series([
        //get the task to archive and check project
        next=>{
            request.get({
                url: config.amaretti.api+"/task/"+req.body.task_id, json: true,
                headers: { authorization: req.headers.authorization, }
            }, (err, _res, _task)=>{
                if(err) return next(err);
                task = _task;
                if(_res.statusCode != 200) return next("failed to load task "+req.body.task_id);
                const gids = req.user.gids||[];
                if(task.user_id != req.user.sub && !~gids.indexOf(task._group_id)) return next("you don't own this task or member of a group "+task._group_id);
                if(!task.resource_id) return next("resource_id not set");
                if(task.status != "finished") return next("task not in finished state");
                
                next();
            });
        },

        //request archvie
        next=>{
            if(!task.config) task.config = {};
            
            //find output
            let output;
            if(task.config._outputs) {
                output = task.config._outputs.find(o=>o.id == req.body.output_id);
                output.archive = {
                    project: req.body.project,
                    desc: req.body.desc,
                }
            }
            if(!output) {
                return next("no config._outputs for id:"+req.body.output_id);
            }

            //let user override meta/tags
            if(!output.meta) output.meta = {};
            if(req.body.meta) Object.assign(output.meta, req.body.meta);
            if(!output.tags) output.tags = [];
            if(req.body.tags) output.tags = output.tags.concat(req.body.tags).unique();

            logger.debug("submitting archive task");
            common.archive_task_outputs(task, [output], (err, _archive_task)=>{
                if(err) return next(err);
                archive_task = _archive_task;
                dataset = archive_task.config.datasets[0].dataset;
                res.json(dataset); 
            });
        },

    ], cb);
});


/**
 * @apiGroup Dataset
 * @api {put} /dataset/stage        Stage datasets
 *                              
 * @apiDescription                  Stage datasets on specified instance
 *
 * @apiParam {String} instance_id   Instance to stage the datasets
 * @apiParam {String[]} dataset_ids Dataset IDs to stage
 *
 * @apiHeader {String} authorization 
 *                                  A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}             Submitted brainlife/stage task
 */
router.post('/stage', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    if(!req.body.instance_id) return next("instance_id is not set");
    if(!req.body.dataset_ids && !Array.isArray(req.body.dataset_ids)) return next("dataset_ids are not set");

    let datasets;
    let next_tid;
    let stage_task; 

    //logger.debug("staging request");
    //console.dir(req.body.dataset_ids);

    let unique_dataset_ids = [...new Set(req.body.dataset_ids)];

    async.series([
        //load dataset info (and check access)
        cb=>{
            common.getprojects(req.user, (err, canread_project_ids, canwrite_project_ids)=>{
                if(err) return cb(err);
                db.Datasets.find({_id: {$in: unique_dataset_ids}}).exec((err, _datasets)=>{
                    if(err) return cb(err);
                    //find dataset ids that user have access to
                    datasets = [];
                    _datasets.forEach(dataset=>{
                        if(!dataset) return;
                        if(!dataset.storage) return;

                        canread_project_ids = canread_project_ids.map(id=>id.toString());
                        if(!~canread_project_ids.indexOf(dataset.project.toString())) {
                            //user doesn't have read access to this project
                            return;
                        } 

                        datasets.push(dataset);
                    });

                    if(unique_dataset_ids.length != datasets.length) {
                        return cb("you don't have access to all requested datasets");
                    }
                    cb();
                });
            });
        },

        //find next tid
        cb=>{
            request.get({
                url: config.amaretti.api+'/task', 
                json: true,
                headers: {
                    authorization: req.headers.authorization, 
                },
                qs: {
                    find: JSON.stringify({
                        instance_id: req.body.instance_id,
                        status: {$ne: "removed"},
                        'config._tid': {$exists: true}, //use _tid to know that it's meant for process view
                    }),
                    select: 'config._tid', //I just need max _tid
                    limit: 1000, //should be enough.. for now 
                    //sort: 'create_date',
                },
            }, (err, _res, body)=>{
                next_tid = body.tasks.reduce((m,v)=>{ 
                    if(v.config._tid && v.config._tid > m) return v.config._tid;
                    return m;
                }, 0) + 1;
                cb();
            });
        },

        //submit!
        async cb=>{
            let jwt = await common.issue_archiver_jwt(req.user.sub);

            /*
            //TODO - we can't remove it too soon - the same staged job might be used by other task
            //stage task is used as input to real *first* app that uses the data, so I believe we can 
            //remove it shortly after it's stage.. remove in 7 days(?)
            //TODO - if it's already staged, and another user request for the same datazet, should I just reuse it?
            let remove_date = new Date();
            remove_date.setDate(remove_date.getDate()+7); 
            */

            stage_task = await rp.post({
                url: config.amaretti.api+"/task",
                json: true,
                body: {
                    name : "Staging Out Of Archive",
                    //desc : "archiving",
                    service : "brainlife/app-stage",
                    instance_id : req.body.instance_id,
                    config: {
                        datasets: datasets.map(d=>{
                            if(d.storage == "copy") {
                                //this dataset is a copy of an original dataset.
                                //we need to state the original, but output to this dataset id (outdir)
                                return {
                                    id: d.storage_config.dataset_id,
                                    project: d.storage_config.project,
                                    outdir: d._id,
                                    storage: d.storage_config.storage,
                                    storage_config: d.storage_config.storage_config,
                                }
                            } else {
                                return {
                                    id: d.id,
                                    project: d.project,
                                    storage: d.storage,
                                    storage_config: d.storage_config,
                                }
                            }
                        }),
                        _tid: next_tid,
                        _outputs: datasets.map(d=>{
                            let subdir = d._id;
                            return {
                                id: d._id,
                                datatype: d.datatype,
                                meta: d.meta,
                                tags: d.tags,
                                datatype_tags: d.datatype_tags,
                                
                                subdir,
                                dataset_id: d._id, //TODO - id or dataset_id.. what's the difference? which one should I use?

                                project: d.project,
                            }
                        }),
                    },
                    max_runtime: 1000*3600, //1 hour should be enough?
                    //remove_date,
                },
                headers: {
                    authorization: "Bearer "+jwt,
                }
            });

            //don't need to call cb() as this is an async function
        },

    ], err=>{
        if(err) return next(err);
        res.json(stage_task);
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

function stream_dataset(dataset, res, next) {
    var system = config.storage_systems[dataset.storage];
    var stat_timer = setTimeout(function() {
        logger.debug("timeout while calling stat on "+dataset.storage);
        next("stat timeout - filesystem maybe offline today:"+dataset.storage);
    }, 1000*15);
    system.stat(dataset, (err, stats)=>{
        clearTimeout(stat_timer);
        if(err) return next(err);
        logger.debug("obtaining download stream %s", dataset.storage);
        system.download(dataset, (err, readstream, filename)=>{
            if(err) return next(err);
            //without attachment, the file will replace the current page (why?)
            res.setHeader('Content-disposition', 'attachment; filename='+filename);
            if(stats) res.setHeader('Content-Length', stats.size);
            else if(dataset.size) res.setHeader('Content-Length', dataset.size);
            logger.debug("sent headers.. commencing download");
            let m = meter();
            readstream.pipe(m).pipe(res);   
            readstream.on('error', err=>{
                //like.. when sftp failed to find a file
                logger.error("failed to pipe", err);
                //this seems to terminate the pipe, but I still can't tell the client that
                //transfer went wrong.. especially if dataset.size is not set..
                readstream.end(); 
            });

            //TODO - "end" seems to work on both jetstream and ssh(dcwan), but is it truely universal? 
            //or do we need to switch to use Promise like upload?
            //readstream.on('end', ()=>{

            /* not getting called?
            res.on('error', err=>{
                logger.error(err);
            });
            */

            res.on('finish', ()=>{
                logger.debug("done piping.. meter count:%s dataset.size %d", m.bytes, dataset.size);
                if(!dataset.size) {
                    /* this is not good idea.. as .tar file size might change if versionn of tar get updates
                    logger.debug("updating dataset size based on m.bytes");
                    dataset.size = m.bytes;
                    */
                } else { 
                    if(dataset.size != m.bytes) logger.warn("dataset.size doesn't match bytes transferred..");
                }
                if(m.bytes == 0) logger.warn("meter count is 0... something went wrong?");

                if(!dataset.download_count) dataset.download_count = 1;
                else dataset.download_count++;
                logger.debug("download_count %d", dataset.download_count);

                dataset.save();
            });
        });
    });
}

//caches agreements for each project
let project_agreement_cache = {};
function get_project_agreements(project_id, cb) {
    let now = new Date().getTime();
    let cache = project_agreement_cache[project_id];
    if(cache && cache.timeout > now) return cb(null, cache.agreements);
    
    //load project agreements
    db.Projects.findById(project_id, (err, project)=>{
        if(err) return cb(err);
        cache = {
            agreements: project.agreements,
            timeout: now + 1000*3600,
        }
        project_agreement_cache[project_id] = cache;
        cb(null, cache.agreements);
    });
}

/*
//caches agreements for each user
let user_agreement_cache = {};
function get_user_agreements(sub, authorization, cb) {
    let now = new Date().getTime();
    let cache = user_agreement_cache[sub];
    if(cache && cache.timeout > now) return cb(null, cache.agreements);
    
    //load user profile
    console.log("loading profile agagin", cache);
    request.get({ 
        url: config.profile.api+"/private/"+sub, json: true, 
        headers: { authorization }
    }, (err, _res, profile)=>{
        if(err) return cb(err);
        //console.dir(profile);
        cache = {
            agreements: profile.agreements,
            timeout: now + 1000*3600,
        }
        user_agreement_cache[sub] = cache;
        cb(null, cache.agreements);
    });
}
*/

let cache;
function get_user_agreements(sub, authorization, cb) { 

    if(!cache) {
        //initialize cache
        cache = {};

        //listen to update event
        common.get_amqp_connection((err, conn)=>{
            if(err) {
                logger.error("failed to obtain amqp connection");
            }
            logger.info("amqp connection ready.. subscribing to profile updates");
            conn.queue('', q=>{
                q.bind("profile", "*.private", ()=>{ //no err..
                    q.subscribe((message, header, deliveryInfo, messageObject)=>{
                        let sub = deliveryInfo.routingKey.split(".")[0];
                        console.dir(message);
                        cache[sub] = message.agreements;
                    });
                });
            });
        });
    }

    //check cache
    if(cache[sub]) return cb(null, cache[sub]);

    //need to load from the source..
    request.get({ 
        url: config.profile.api+"/private/"+sub, json: true, headers: { authorization }
    }, (err, _res, profile)=>{
        let obj = profile.agreements;
        cb(err, obj);
        cache[sub] = obj;
    });
}


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

    logger.debug("download requested for %s", id);
    if(!req.user) logger.warn("no auth request");
    db.Datasets.findById(id).populate('datatype').exec(function(err, dataset) {
        if(err) return next(err);
        if(!dataset) {
            res.status(404).json({message: "couldn't find the dataset specified"});
            return;
        }
        if(!dataset.storage) return next("dataset:"+dataset._id+" doesn't have storage field set");
        
        //app-stage can access any dataset
        if(req.user && req.user.scopes.warehouse && ~req.user.scopes.warehouse.indexOf('stage')) {
            return stream_dataset(dataset, res, next);
        }

        //access control (I could do this in parallel?)
        async.series([
            //
            //check project access
            cb=>{
                //we don't need to check project access if it's a published dataset
                //TODO - maybe I should still limit download without correct publication id? (what's the point?)
                if(dataset.publications && dataset.publications.length > 0) return cb();

                common.getprojects(req.user, (err, canread_project_ids, canwrite_project_ids)=>{
                    if(err) return next(err);
                    canread_project_ids = canread_project_ids.map(id=>id.toString());
                    if(!~canread_project_ids.indexOf(dataset.project.toString())) {
                        return cb("you don't have access to the project that the dataset belongs");
                    } 

                    //all good!
                    cb();
                });
            },

            //check aggreements
            cb=>{
                //load project agreements
                get_project_agreements(dataset.project, (err, project_agreements)=>{
                    if(err) return next(err);

                    if(project_agreements.length == 0) return cb(); //no required agreements
                    if(!req.user) return cb("you must be logged in to access this dataset");
                    
                    //load user agreements
                    let authorization = req.headers.authorization;
                    if(req.query.at) authorization = "Bearer "+req.query.at;
                    get_user_agreements(req.user.sub, authorization, (err, user_agreements)=>{
                        if(err) return next(err);

                        //console.log("checking", user_agreements);

                        //make sure user has agreed to all agreements
                        let agreed = true;
                        project_agreements.forEach(agreement=>{
                            if(!user_agreements[agreement._id]) agreed = false;
                        });
                        if(!agreed) {
                            return cb("You must agree to all data access agreements at "+
                                config.warehouse.url+"/project/"+dataset.project);
                        }

                        cb();
                    });
                });
            },

        ], err=>{
            if(err) return res.status(403).json({err});
            stream_dataset(dataset, res, next);
        });
    });
});

//TODO - isn't this deprecated by app-stage/token based access control?
//TODO - since I can't let <a> pass jwt token via header, I have to expose it via URL.
//doing so increases the chance of user misusing the token, but unless I use HTML5 File API
//there isn't a good way to let user download files..
//getToken() below allows me to check jwt token via "at" query.
//Another way to mitigate this is to issue a temporary jwt token used to do file download (or permanent token that's tied to the URL?)
/**
 * @apiGroup Dataset
 * @api {get} /dataset/download/safe/:id Download .tar.gz from dataset archive 
 * @apiDescription              Allows user to download any files from user's resource
 *
 * @apiParam {String} [at]      Token generated by this service via /dataset/token with scopes with list of dataset IDs
 *
 * @apiHeader {String} [authorization] A valid JWT token "Bearer: xxxxx"
 *
 */
router.get('/download/safe/:id', jwt({
    secret: config.warehouse.public_key,
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
    //console.dir(req.user);
    if(!req.user || !req.user.scopes || !req.user.scopes.datasets) return res.status(404).json({message: "no datasets scope"});
    if(!~req.user.scopes.datasets.indexOf(id)) return res.status(404).json({message: "not authorized"});
    logger.debug("token check ok.. loading dataset info");
    db.Datasets.findById(id).populate('datatype').exec((err, dataset)=>{
        if(err) return next(err);
        if(!dataset) return res.status(404).json({message: "couldn't find the dataset specified"});
        if(!dataset.storage) return next("dataset:"+dataset._id+" doesn't have storage field set");
        stream_dataset(dataset, res, next);
    });
});

/**
 * @apiGroup Dataset 
 * @api {delete} /dataset/:id?   Hide dataset from dataset results 
 * @apiDescription               Logically remove dataset by setting "removed" to true 
 *
 * @apiParam {Integer[]} [ids]   List of dataset IDs to remove (ids or url param should be set)
 *
 * @apiHeader {String} authorization 
 *                               A valid JWT token "Bearer: xxxxx"
 */
router.delete('/:id?', jwt({secret: config.express.pubkey}), function(req, res, next) {
    let ids = req.body.ids||req.params.id;
    if(!Array.isArray(ids)) ids = [ ids ];
    common.getprojects(req.user, function(err, canread_project_ids, canwrite_project_ids) {
        if(err) return next(err);
        //logger.debug("getting dataset");
        async.eachSeries(ids, (id, next_id)=>{
            db.Datasets.findById(id, (err, dataset)=>{
                if(err) return next_id(err);
                if(!dataset) return next_id(new Error("can't find the dataset with id:"+id));
                if(!canedit(req.user, dataset, canwrite_project_ids)) return next_id("can't edit:"+id);
                dataset.remove_date = new Date();
                dataset.removed = true;
                //logger.debug("updating %s", id);
                dataset.save(next_id);
            });
        }, err=>{
            if(err) return next(err);
            res.json({status: "ok", removed: ids.length});
        });
    });
});

/**
 * @apiGroup Dataset
 * @api {post} /dataset/ds/:id  Generate dataset download script
 * @apiDescription              Generate shell script that can download specified set of datasets.
 *
 * @apiParam {Object} [find]    Optional Mongo query to perform (you need to JSON.stringify)
 * @apiParam {Number} [limit]   Maximum number of records to return - defaults to 100
 * @apiParam {Number} [skip]    Record offset for pagination (default to 0)
 * @apiParam {String[]} [datatype_tags]  
 *                              (deprecated) List of datatype tags to filter (you can use exclusion tags also)
 *
 * @apiSuccess {String}         generated bash shell script
*/
router.post('/downscript', jwt({secret: config.express.pubkey, credentialsRequired: false}), (req, res, next)=>{
    let skip = req.query.skip||0;
    let limit = req.query.limit||100; //this means if user set it to "0", no limit (it's string)
    common.getprojects(req.user, (err, canread_project_ids, canwrite_project_ids)=>{
        if(err) return next(err);
        db.Datasets.find(construct_dataset_query(req.body, canread_project_ids))
        .populate('datatype project', 'name desc admins members bids') //mixed in with datatype/project model fields...
        .skip(+skip)
        .limit(+limit)
		.lean()
		.exec((err, datasets)=>{
            if(err) return next(err);

            let script = `#!/bin/bash\n
set +x #show all commands running
set +e #stop the script if anything fails

`;
            if(req.headers.authorization) script += "auth=\"Authorization: "+req.headers.authorization+"\"\n"
            
            //find unique projects
            let projects = {};
            datasets.forEach(d=>{
                if(!projects[d.project._id]) projects[d.project._id] = d.project;
            });
            
            //construct dataset_description.json
/*{
"Name": "The mother of all experiments",
"BIDSVersion":  "1.0.1",
"License": "CC0",
"Authors": ["Paul Broca", "Carl Wernicke"],
"Acknowledgements": "Special thanks to Korbinian Brodmann for help in formatting this dataset in BIDS. We thank Alan Lloyd Hodgkin and Andrew Huxley for helpful comments and discussions about the experiment and manuscript; Hermann Ludwig Helmholtz for administrative support; and Claudius Galenus for providing data for the medial-to-lateral index analysis.",
"HowToAcknowledge": "Please cite this paper: https://www.ncbi.nlm.nih.gov/pubmed/001012092119281",
"Funding": ["National Institute of Neuroscience Grant F378236MFH1", "National Institute of Neuroscience Grant 5RMZ0023106"],
"ReferencesAndLinks": ["https://www.ncbi.nlm.nih.gov/pubmed/001012092119281", "Alzheimer A., & Kraepelin, E. (2015). Neural correlates of presenile dementia in humans. Journal of Neuroscientific Data, 2, 234001. http://doi.org/1920.8/jndata.2015.7"],
"DatasetDOI": "10.0.2.3/dfjj.10"
}*/

            //construct project info
            for(let project_id in projects) {
                let p = projects[project_id];
                let authors = [...p.admins, ...p.members];
                authors = authors.filter((v,idx,self)=>self.indexOf(v) === idx); //uniq
                authors = authors.map(id=>common.deref_contact(id)).map(a=>a.fullname||a.email);

                //write README and bids/dataset_description.json
                let root = "./proj-"+project_id;
                script += "mkdir -p "+root+"/bids\n";
                script += "cat << '__ENDREADME__' > "+root+"/README\n";
                script += `${p.name}

${config.warehouse.url}/project/${project_id}

${p.desc}`;
                
                script += "\n__ENDREADME__\n";

                let dataset_description = {
                    BIDSVersion:  "1.0.1",
                    Name: p.name,
                    //License: "",
                    Authors: authors,
                    //Acknowledgements: "",
                    //HowToAcknowledge: "Please cite this paper: ",
                    //Funding: [],
                    ReferencesAndLinks: [
                        config.warehouse.url+"/project/"+project_id
                    ],
                    //DatasetDOI: "",
                };
                script += "echo \""+JSON.stringify(dataset_description).replace().replace(/\"/g, '\\"')+"\" > "+root+"/bids/dataset_description.json\n";
            }
            
            datasets.forEach(dataset=>{
                //construct a path to put the datasets in
                let root = "./proj-"+dataset.project._id;

                let path = root;
                if(dataset.meta.subject) path += "/sub-"+dataset.meta.subject;
                if(dataset.meta.session) path += ".ses-"+dataset.meta.session;

                path+="/";
                path+="dt-"+dataset.datatype.name.replace(/\//g, '-');
                dataset.datatype_tags.forEach(tag=>{
                    //null is getting injected into datatype_tags.. until I find where it's coming from, 
                    //I need to patch this by ignoring this
                    if(!tag) return; 

                    path+=".tag-"+tag.replace(/\./g, '-'); //'.' is used as delimiter
                });
                if(dataset.meta.run) path += ".run-"+dataset.meta.run;
                path+= ".id-"+dataset._id;

                script += "mkdir -p \""+path+"\"\n";
                script += "echo downloading dataset:"+dataset._id+" to "+path+"\n";
                script += "curl ";
                if(req.headers.authorization) script += "-H \"$auth\" ";
                script += config.warehouse.api+"/dataset/download/"+dataset._id+" | tar -C \""+path+"\" -x\n";

                if(dataset.datatype.bids) {
                    //Create BIDS symlinks
                    let bidspath = root+"/bids/derivatives";
                    let pipeline = "upload"; //assumed by default..
                    if(dataset.prov && dataset.prov.task && !isimporttask(dataset.prov.task)) {
                        //use service name as the pipeline name
                        pipeline = dataset.prov.task.service.replace(/\//g, '.');

                        //if different runs are processed under different version, we will end up having different directory name for the same app
                        //since branch_name is part of .brainlife.json, let's drop this for now.
                        //add branch at the end of pipeline name
                        //if(dataset.prov.task.service_branch) pipeline += "."+dataset.prov.task.service_branch;
                    }

                    bidspath += "/"+pipeline;
                    if(dataset.meta.subject) bidspath += "/sub-"+dataset.meta.subject;
                    if(dataset.meta.session) bidspath += "/ses-"+dataset.meta.session;
                    bidspath+="/"+dataset.datatype.bids.derivatives;
                    script += "mkdir -p \""+bidspath+"\"\n";
                    dataset.datatype.bids.maps.forEach(map=>{
                        //construct source keywords
                        let source_keywords = "sub-"+dataset.meta.subject;
                        if(dataset.meta.session) source_keywords += "_ses-"+dataset.meta.session;
                        if(dataset.meta.Space) source_keywords += "_space-"+dataset.meta.Space; 
                        if(dataset.meta.run) source_keywords += "_run-"+dataset.meta.run;
                        if(dataset.meta.acq) source_keywords += "_acq-"+dataset.meta.acq;

                        //franco/paolo wants to add tags to desc
                        dataset.datatype_tags.forEach(tag=>{
                            if(!tag) return;  //patch for null tag injected
                            source_keywords+="_tag-"+tag.replace(/_/g, ''); //_ is delimiter
                        });
                        /* dataset tags are entered by user, so there is higher risk of invalid char corrupting the filename..
                        dataset.tags.forEach(tag=>{
                            source_keywords+="_tag-"+tag.replace(/_/g, '');
                        });
                        */

                        //func has TaskName as part of source keywords..
                        if(dataset.meta.TaskName) {
                            let taskname = dataset.meta.TaskName.replace(/[^0-9a-zA-Z]/gi, '');
                            source_keywords += "_task-"+taskname;
                        }

                        source_keywords += "_desc-"+dataset._id; //not sure if this is BIDS.. but this makes it all dataset unique

                        let dest = source_keywords+"_"+map.dest;
                        if(map.src == "_meta_") {
                            //request for metadata!
                            if(dataset.prov) {
                                dataset.meta.BrainlifeURL = config.warehouse.url+"/project/"+dataset.project._id+"/dataset/"+dataset._id;
                                script += "echo \""+JSON.stringify(dataset.meta).replace().replace(/\"/g, '\\"')+"\" > \""+bidspath+"/"+dest+"\"\n";
                            } else {
                                //can't output json.. as we have no prov
                            }
                        } else {
                            //normal file / dir (will this work on windows?)
                            //figure out how to get out of bids directory and point back to the root
                            let bidspath_exit = "";
                            for(let i = 0; i < bidspath.split("/").length-1;i++) {
                                bidspath_exit += "../";
                            }
                            //then resolve the src(could be glob pattern) and link it to bidspath
                            script += "ln -sf "+bidspath_exit+"$(ls -d \""+path+"/"+map.src+"\") \""+bidspath+"/"+dest+"\"\n";
                        }
                    });
                } else script+="#no bids mapping\n";

                script+="\n";
            });
            res.send(script);
        });
    });
});

/**
 * @apiGroup Dataset
 * @api {post} /dataset/copy    Copy datasets
 * @apiDescription              Copy specified datasets to another project by creating new dataset records 
 *
 * @apiParam {String} project   Project ID to copy datasets to
 * @apiParam {String[]} dataset_ids 
 *                              Dataset IDs to  copy
 *
 * @apiHeader {String} authorization 
 *                                  A valid JWT token "Bearer: xxxxx"
*/
router.post('/copy', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    if(!req.body.project) return next("project(id) is not set");
    if(!req.body.dataset_ids && !Array.isArray(req.body.dataset_ids)) return next("dataset_ids are not set");

    common.getprojects(req.user, (err, canread_project_ids, canwrite_project_ids)=>{
        if(err) return next(err);
        db.Datasets.find({_id: {$in: req.body.dataset_ids}}).lean().exec((err, _datasets)=>{
            if(err) return next(err);
            
            //find dataset ids that user have access to
            let datasets = [];
            _datasets.forEach(dataset=>{
                if(!dataset) return;
                if(!dataset.storage) return;

                canread_project_ids = canread_project_ids.map(id=>id.toString());
                if(!~canread_project_ids.indexOf(dataset.project.toString())) {
                    //user doesn't have read access to this project
                    return;
                } 
                datasets.push(dataset);
            });

            //update to create list of new datasets
            datasets.forEach(dataset=>{
                if(dataset.storage != "copy") {
                    dataset.storage_config = {
                        dataset_id: dataset._id,
                        project: dataset.project,
                        storage: dataset.storage,
                        storage_config: dataset.storage_config,
                    };
                    dataset.storage = "copy";
                }
                dataset.project = req.body.project;
                delete dataset._id;
                dataset.publications = [];
                dataset.desc = "(copy) "+dataset.desc;
            });

            db.Datasets.insertMany(datasets,(err, docs)=>{
                if(err) return next(err);
                docs.map(db.dataset_event);
                res.json(docs);
            });
        });
    });
});
 
module.exports = router;


