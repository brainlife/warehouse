
//contrib
const express = require('express');
const router = express.Router();
const winston = require('winston');
const jwt = require('express-jwt');
const jsonwebtoken = require('jsonwebtoken');
const async = require('async');
const axios = require('axios');
const meter = require('stream-meter');
const mongoose = require('mongoose');
const archiver = require('archiver');

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

//same code in ui::/src/modals/dataset.js
function isimporttask(task) {
    if(task.service) {
        if(~task.service.indexOf("brainlife/validator-")) return true;
        if(~task.service.indexOf("brain-life/validator-")) return true;
    }

    //if no input, then must be import
    if(!task.deps && !task.deps_config) return true;
    if((task.deps && task.deps.length == 0) &&
        (task.deps_config && task.deps_config.length == 0)) return true;

    return false;
}

function construct_dataset_query(body/*, project_ids*/) {
    let query = Object.assign({}, body.find);
    
    //handle datatype_tags query
    //TODO - deprecate this? let client take care of this themselves?
    if(body.datatype_tags) {
        let all = [];
        let nin = [];
        body.datatype_tags.forEach(tag=>{ 
            if(tag[0] == "!") {
                nin.push(tag.substring(1));
            } else {
                all.push(tag);
            }
        });
        query.datatype_tags = {};
        if(all.length > 0) query.datatype_tags["$all"] = all;
        if(nin.length > 0) query.datatype_tags["$nin"] = nin;
    }
    return query;
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
 * @apiParam {Boolean} [single] Return a single dataset content without wrapping in datasets:[] with counts, etc..
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
        let query = construct_dataset_query(req.query/*, canread_project_ids*/);
        db.Datasets.find(query)
        .populate(populate)
        .select(req.query.select)
        .limit(+limit)
        .skip(+skip)
        .sort(req.query.sort)
        .lean()
        .exec((err, datasets)=>{
            if(err) return next(err);
            
            //check project access
            let canread_project_ids_str = canread_project_ids.map(id=>id.toString());
            datasets = datasets.filter(d=>{
                if(d.publications && d.publications.length > 0) return true; //published datasets can be ready by anyone
                return canread_project_ids_str.includes(d.project._id.toString());
            });

            //set _canedit flags
            datasets.forEach(rec=>{
                rec._canedit = canedit(req.user, rec, canwrite_project_ids);
            });

            //count and get total size
            common.cast_mongoid(query);
            db.Datasets.aggregate()
            .match(query)
            .group({_id: null, count: {$sum: 1}, size: {$sum: "$size"} })
            .exec((err, stats)=>{
                if(err) return next(err);
                let count = 0;
                let size = 0;
                if(stats.length == 1) {
                    count = stats[0].count;
                    size = stats[0].size;
                }

                if(req.query.single) {
                    return res.json(datasets[0]);
                } else {
                    res.json({ datasets, count, size, });
                }
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
 * @apiParam {Object} find      Mongo query to perform (you need to JSON.stringify) - must include project
 * 
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         List of distinct values
 */
router.get('/distinct', jwt({secret: config.express.pubkey, credentialsRequired: false}), (req, res, next)=>{
    const find = JSON.parse(req.query.find);
    if(!find.project) return next("please specify project query");
    common.cast_mongoid(find);
    common.getprojects(req.user, function(err, canread_project_ids, canwrite_project_ids) {
        if(err) return next(err);
        canread_project_ids = canread_project_ids.map(id=>id.toString());
        if(!canread_project_ids.includes(find.project.toString())) return next("no read access to specified project:"+find.project);
        db.Datasets.find(find)
        .distinct(req.query.distinct)
        .exec((err, values)=>{
            if(err) return next(err);
            res.json(values);
        });
    });
});

/**
 * @apiGroup Dataset
 * @api {get} /dataset/inventory
 * @apiParam {Object} find      Mongo query to perform (you need to JSON.stringify) - project field must be set
 *                              Get counts of unique subject/datatype/datatype_tags. 
 * @apiSuccess {Object}         Object containing counts
 * 
 */
//warning.. similar code in pub.js
router.get('/inventory', jwt({secret: config.express.pubkey, credentialsRequired: false}), (req, res, next)=>{
    const find = JSON.parse(req.query.find);
    if(!find.project) return next("please specify project query");
    common.cast_mongoid(find);
    common.getprojects(req.user, function(err, canread_project_ids, canwrite_project_ids) {
        if(err) return next(err);
        canread_project_ids = canread_project_ids.map(id=>id.toString());
        if(!canread_project_ids.includes(find.project.toString())) return next("no read access to specified project:"+find.project);
        db.Datasets.aggregate()
        .match(find)
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
 * @api {get} /dataset/prov/:id     Get provenance (edges/nodes)
 * @apiDescription                  Get provenance graph info (Public API)
 *
 */
router.get('/prov/:id', (req, res, next)=>{
    let dataset_id = req.params.id;
    generate_prov(dataset_id, (err, nodes, edges)=>{
        if(err) return next(err);
        res.json({nodes, edges});
    });
});

/**
 * @apiGroup Dataset
 * @api {get} /dataset/product/:id  Download dataobject product
 *
 */
router.get('/product/:id', jwt({secret: config.express.pubkey}),  (req, res, next)=>{
    let id = req.params.id;
    common.getprojects(req.user, function(err, canread_project_ids, canwrite_project_ids) {
        if(err) return next(err);
        db.Datasets.findById(id, (err, dataset)=>{
            if(err) return next_id(err);
            if(!dataset) return next_id(new Error("can't find the dataset with id:"+id));
            canread_project_ids = canread_project_ids.map(id=>id.toString());
            if(!~canread_project_ids.indexOf(dataset.project.toString())) return next("can't access this dataset");

            //now load products
            db.DatasetProducts.findOne({dataset_id: id}, (err, rec)=>{
                if(err) return next(err);
                if(!rec) return res.json({product: null});
                res.json({product: rec.product});
            });
        });
    });
});


/**
 * @apiGroup Dataset
 * @api {get} /dataset/provscript/:id     Get provenance (.tar.gz)
 * @apiDescription                  Get provenance scripts
 *
 */
router.get('/provscript/:id', (req, res, next)=>{
    let dataset_id = req.params.id;
    let debug_config = "";
    if(config.debug) debug_config = "BLHOST=dev1.soichi.us ";
    generate_prov(dataset_id, (err, nodes, edges)=>{
        if(err) return next(err);
        let stage = "";
        let run = "";

        //use edges to update links in source datasets to task config input
        edges.forEach(edge=>{
            let node = nodes.find(node=>node.id == edge.to);
            if(!node) return;
            function replace_path(obj) {
                for(let key in obj) {
                    let value = obj[key];
                    if(typeof value == "object") {
                        //need to recurse into an object
                        replace_path(value);
                        continue;
                    } 
                    if(typeof value != "string") continue;
                    if(edge._archived_dataset_id) { 
                        let did = edge._archived_dataset_id;
                        let pos = value.indexOf(did);
                        if(~pos) {
                            obj[key] = "../"+edge.from+value.substring(pos+did.length);
                        }
                    } else {
                        let id_parts = edge.from.split(".");
                        let pos = value.indexOf(id_parts[1]);
                        if(~pos) {
                            obj[key] = "../"+id_parts[0]+"."+value.substring(pos);
                        }
                    }
                }
            }
            replace_path(node._config);
        });

        //output scrips
        while(nodes.length) { 
            let node = nodes.pop();
            if(!node.label) continue; //"This Dataset" doesn't have label, and we don't need it (TODO make output link?)
            let id_parts = node.id.split(".");
            if(id_parts[0] == "dataset") {
                stage += "echo \"staging "+node.id+" ("+node.label.replace(/\n/g, ' ')+")\"\n";
                stage += "[ ! -d "+node.id+" ] && "+debug_config+"bl dataset download -i "+id_parts[1]+" -d "+node.id+"\n\n";
            } else if(id_parts[0] == "task") {
                stage += "echo \"staging "+node.id+" ("+node._service+")\"\n";
                stage += "[ ! -d "+node.id+" ] && curl -L https://github.com/"+node._service+"/archive/"+node._commit_id+".zip > "+node.id+".zip && unzip "+node.id+".zip && mv *"+node._commit_id+" "+node.id+" && rm "+node.id+".zip\n\n"; 

                //install config.json and run main
                run += "echo \"running task "+node.id+" ("+node._service+")\"\n";
                run += "(\n\tcd "+node.id+"\n";
                run += "\techo '"+JSON.stringify(node._config, null, 4)+"' > config.json\n";
                run += "\ttime ./main\n"; 
                run += ")\n\n";
            }
        }

        res.setHeader('Content-disposition', 'attachment; filename=reproduce.sh');
        res.setHeader('Content-Type', 'text/plain');
        res.send(`#!/bin/bash

# By running this script, you can reproduce the output dataset id:${dataset_id}
    
set -e
set -x

${stage}
${run}
`);
    });
});

/**
 * @apiGroup Dataset
 * @api {get} /dataset/boutique/:id Generate boutique package
 * @apiDescription                  Generate .tar containing boutique descriptor, and run.sh
 *
 */
router.get('/boutique/:id', (req, res, next)=>{
    let dataset_id = req.params.id;
    generate_prov(dataset_id, async (err, nodes, edges)=>{
        if(err) return next(err);

        //README
        let readme = `
This boutique descriptor that can be used to run the workflow used to generate the brainlife dataset: ${dataset_id}
        `;
        let archive = archiver('tar');
        archive.append(readme, {name: "README"});

        let config_jsons = [];
        let b_inputs = [];
        let b_files = [];
        let input_dataset_ids = [];

        //load all app details
        let app_ids = [];
        nodes.forEach(node=>{
            if(node._app && !app_ids.includes(node._app)) app_ids.push(node._app);
        });
        app_ids.map(id=>new mongoose.Types.ObjectId(id));
        let apps = await db.Apps.find({_id: {$in: app_ids}}).lean();

        //let output_datatype = nodes[0]._datatype;
        let b_test = {
            name: "test1",
            invocation: {},
            assertions: {
                "exit-code": 0,
                "output-files": [
                    {
                        "id": "output",
                    }
                ]
            },
        };

        let output_node = nodes[0];

        //generate various content
        let run = "#!/bin/bash\n\n";
        run += "set -e\n";
        run += "set -x\n\n";
        while(nodes.length) { 
            let node = nodes.pop(); //nodes are stored in "reverse" order.. to go from the bottom
            if(!node.label) continue; //"This Dataset" doesn't have label, and we don't need it (TODO make output link?)

            let app = apps.find(app=>app._id == node._app);
            let id_parts = node.id.split(".");
            if(id_parts[0] == "dataset") {
                input_dataset_ids.push(id_parts[1]);
            } else if(id_parts[0] == "task") {
                run += "echo \"staging "+node.id+" ("+node._service+")\"\n";
                run += "mkdir -p "+node.id+" && curl -L https://github.com/"+node._service+"/archive/"+node._commit_id+".zip > app.zip && unzip app.zip && mv *"+node._commit_id+"/* "+node.id+" && rm app.zip\n\n"; 

                //install config.json and run main
                run += "echo \"running task "+node.id+" ("+node._service+")\"\n";
                run += "(\n\tcd "+node.id+"\n";
                run += "\ttime ./main\n"; 
                run += ")\n\n";

                let app_config = {};
                let task_id = id_parts[1];
                for(let k in node._config) {
                    let vkey = "["+node.id+"."+k+"]";
                    let v = node._config[k];
                    let b_id = task_id+"_"+k;
                    if(typeof v == "string" && v.startsWith("../")) { //TODO - we need a better to detect if this is parameter input or not..
                        //see if the input belongs to staged input
                        let pos = null;
                        input_dataset_ids.forEach(id=>{
                            pos = v.indexOf(id);
                        });
                        if(pos !== null && ~pos) {
                            //using staged input!

                            //setup b_inputs for input dataset if we haven't already
                            if(!b_inputs.find(input=>input.id == k)) {
                                if(!app.config[k]) {
                                    console.error(k+" is not defined in the app.config.. maybe config changed?");
                                } else {
                                    let input_config = app.inputs.find(input=>input.id == app.config[k].input_id);
                                    if(!input_config) {
                                        console.error("couldn't find input config for "+k);
                                    } else {
                                        b_inputs.push({
                                            id: b_id,
                                            name: node.id+"."+k+" "+v.substr(pos+25), //skip instance name (but keep task id)
                                            optional: input_config.optional,
                                            type: "File",  //TODO - pull from app config?
                                            "value-key": vkey,
                                        });
                                        b_test.invocation[b_id] = "/testdata/"+v.substr(pos+53); //skip instance and task_id
                                    }
                                }
                            }
                            app_config[k] = vkey;
                        } else {
                            //must be using output from other app
                            app_config[k] = v;
                        }
                    } else {
                        //must be parameter input
                        let b_input = {
                            id: b_id,
                            name: node.label+" "+k,
                            optional: true,
                            "value-key": vkey,
                        }

                        //app.config might not exist anymore
                        if(app.config[k]) {
                            b_input["default-value"] = app.config[k].default;
                            let unwrap = false;
                            switch(app.config[k].type) {
                            case "string": b_input.type = "String"; break;
                            case "enum": b_input.type = "String"; break;
                            case "boolean": 
                                b_input.type = "String"; 
                                b_input["value-choices"] = ["true", "false"];
                                b_input["default-value"] = app.config[k].default.toString();
                                b_input["value-key"] = b_input["value-key"];
                                unwrap = true;
                                break;
                            case "number": 
                            case "integer": 
                                b_input.type = "Number"; 
                                break;
                            }
                            b_inputs.push(b_input);
                            app_config[k] = vkey;
                            if(unwrap) app_config[k] = "__unwrap__"+vkey;

                            //convert default value to string - boutique invocation value needs to be string accordint to tristan
                            let def = app.config[k].default;
                            if(def === null) def = "null";
                            if(def.toString) def = def.toString();

                            b_test.invocation[b_id] = def;
                        } else {
                            logger.error("no app.config for "+k);
                        }
                    }
                }

                let lines = JSON.stringify(app_config, null, 4).split("\n");
                let filtered_json = "";
                lines.forEach(line=>{
                    pos = line.indexOf("__unwrap__");
                    if(~pos) {
                        let end = line.indexOf("\"", pos+10);
                        let newline = ""
                        newline = line.substring(0, pos-1); //grab before __unwrap
                        newline += line.substring(pos+10, end); //grab after __unwrap__" until end quote
                        newline += line.substring(end+1); //grab the rest
                        filtered_json += newline;
                    } else filtered_json += line;
                }); 
            
                b_files.push({
                    id: task_id+"_config",
                    name: "config.json for "+node.label,
                    "path-template": node.id+"/config.json",
                    "file-template": filtered_json.split("\n"), //can't I just enter string?
                });
            }
        }

        b_files.push({
            id: "run",
            name: "run.sh",
            "path-template": "run.sh",
            "file-template": run.split("\n"), //can't I just enter string?
        });

        let output = {
            id: "output",
            name: "Dataset output"+dataset_id,
            "path-template": "task."+output_node._prov.task._id,
        }
        if(output_node._prov.subdir) output["path-template"] += "/"+output_node._prov.subdir;
        b_files.push(output);

        let author = common.deref_contact(output_node._user_id);
        
        //ship it!
        res.setHeader('Content-disposition', 'attachment; filename=boutique.'+dataset_id+'.json');
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            "command-line": "bash run.sh",
            name: "workflow generated from dataset:"+dataset_id, //TODO
            author: author.fullname,
            description: "TODO - workflow description?", //TODO
            "schema-version": "0.5",
            "suggested-resources": { "cpu-cores": 8, "ram": 16, "walltime-estimate": 120 }, //TODO
            "error-codes": [{code: 1, description: "failed"}],
            "tags": { 
                "source": "brainlife", 
                "dataset_id": dataset_id, //nobody uses this yet
            }, //only works for the new version of boutique
            "tool-version": "v1", //TODO
            inputs: b_inputs,
            "output-files": b_files,
            tests: [ b_test ],
        }, null, 4));
    });
});

let datatypes_cache = {};
mongoose.connection.once('open', ()=>{
    //TODO - invalidate eventually? or listen to update events?
    db.Datatypes.find({})
    .exec((err, _datatypes)=>{
        if(err) return cb(err);
        _datatypes.forEach(_datatype=>{
            datatypes_cache[_datatype._id.toString()] = _datatype;
        });
    });
});

//TODO - I should split the algorithms to 2 parts 
//DEPRECATE by api.provGraph?
//first part to generate a full provenance graph which might be too verbose - noisy but a complete picture (no defer)
//second part to simplify the graph so that users can make sense of it (it could even be done at the UI side)
function generate_prov(origin_dataset_id, cb) {
    let nodes = [];
    let edges = [];
    let this_dataset;

    //starting from the dataset ID specified, walk back through dataset prov & task deps all the way to the 
    //original input datasets
    function load_task(id, cb) {
        axios.get(config.amaretti.api+"/task/"+id).then(res=>{
            let task = res.data;
            if(!task.config || !task.config._app) return cb(null, task); //no _app set.. can't load app info
            db.Apps.findById(task.config._app, 'config', (err, app)=>{
                if(err) return cb(err);
                task._app_config = app.config;
                cb(null, task);
            });
        }).catch(cb);
    }

    function compose_label(task) {
        let label = task.service; //task.name is sometime like "brainlife.process"..
        if(task.service_branch) label += "("+task.service_branch+")";
        return label;
    }
    
    function compose_dataset_label(dataset) {
        //datatype should never be missing.. but it happened during testing
        let datatype_name = dataset.datatype;
        let datatype = datatypes_cache[dataset.datatype.toString()];
        if(datatype) datatype_name = datatype.name;
        if(dataset.datatype_tags) datatype_name += " "+dataset.datatype_tags.join(":")
        
        let label = "";
        if(dataset.project) {
            label += dataset.project.name+" / ";
        } else {
            //some project records were removed... and now it's possible to have null project
            label += "(removed project) / ";
        }
        label += dataset.meta.subject;
        if(dataset.meta.session) label += " / "+dataset.meta.session;
        if(dataset.meta.run) label += " / "+dataset.meta.run;
        label += "\n";

        label += datatype_name + "\n";
        label += dataset.tags.join(" ");
        return label.trim(); 
    }

    //remove all keys that starts with _
    function filterConfig(task) {
        let _config = {};
        for(let key in task.config) {
            if(key.startsWith("_")) continue;
            _config[key] = task.config[key];
        }
        return _config;
    }

    function filterDefaultConfig(task) {
        if(!task._app_config) return null;
        let _config = {};
        for(let key in task._app_config) {
            let config = task._app_config[key];
            if(config.type == "input") continue; 
            _config[key] = config.default;
        }
        return _config;
    }

    function taskInfo(task) {
        let info = {
            _app: (task.config?task.config._app:null),
            _service: task.service,
            _commit_id : (task.commit_id||"master"),
            _config: filterConfig(task),
            _config_default: filterDefaultConfig(task),
            _finish_date: task.finish_date,
        }
        return info;
    }

    let datasets_analyzed = [];
    function load_dataset_prov(dataset, defer, cb) {
        let to = "dataset."+dataset._id;
        if(defer) to = defer.to;
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

        //skip validation task by starting at follow_task_id if it's set
        let task_id = dataset.prov.task.follow_task_id || dataset.prov.task._id;
        load_task(task_id, (err, task)=>{
            if(err) return cb(err);
            if(!task.service) task.service = "unknown"; //only happens for dev/test? (TODO.. maybe I should cb()?)
            if(isimporttask(task)) {
                if(defer) {
                    add_node(defer.node);
                    datasets_analyzed.push(dataset._id.toString());
                    if(defer.edge.to != defer.edge.from) edges.push(defer.edge);
                    to = defer.node.id;
                }
                load_stage(to, null, (dataset._id||dataset.prov.subdir), cb);
            } else {
                //should be a normal task..
                add_node(Object.assign({
                    id: "task."+task_id, 
                    label: compose_label(task),
                }, taskInfo(task)));


                let edge_label = datatypes_cache[dataset.datatype].name+" "+dataset.datatype_tags.join(",");
                let archived_dataset_id = null;
                if(defer) {
                    let label_parts = defer.node.label.split("\n");
                    if(label_parts[2]) edge_label += "\n"+label_parts[2];//tags
                    archived_dataset_id = defer.node.id.split(".")[1];
                    if(defer.input_name) edge_label += " ("+defer.input_name+")";
                }
                edges.push({
                    to,
                    from: "task."+task_id,
                    arrows: "to",
                    label: edge_label,
                    _archived_dataset_id: archived_dataset_id,
                });
                load_task_prov(task, cb);
            }
        });
    }

    function load_stage(to, input_name, dataset_id, cb) {
        //staging task should be shown as dataset input.. 
        if(~datasets_analyzed.indexOf(dataset_id.toString())) {
            //dataset already analyzed.. just add edge
            var found = false;
            var from = "dataset."+dataset_id;
            var found = edges.find(e=>(e.from == from && e.to == to));
            if(to != from && !found) edges.push({ from, to, arrows: "to", label: input_name});
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
            let label = "";
            //if(to.indexOf("dataset.") === 0) label += "copy"; //I don't think we need to show "copy".. it's obvsious?
            if(input_name) label += " ("+input_name+")";

            let defer = {
                node: {
                    id: "dataset."+dataset_id, 
                    label: compose_dataset_label(dataset),
                    _datatype: dataset.datatype,
                },
                edge: {
                    from: "dataset."+dataset_id,
                    to,
                    arrows: "to",
                    label,
                },
                to,
                input_name,
            };
            load_dataset_prov(dataset, defer, cb);
        });
    }

    let tasks_analyzed = [];
    function load_task_prov(task, cb) {
        if(~tasks_analyzed.indexOf(task._id)) return cb();
        tasks_analyzed.push(task._id);

        //if(!task.deps_config) return cb(); //just in case?
        if(!task.config) return cb(); 
        async.each(task.config._inputs, (input, next_dep)=>{
            if(!input.task_id) return next_dep(); //old task didn't have this set?
            load_task(input.task_id, (err, dep_task)=>{
                if(err) return next_dep(err);

                //process uses app-stage to load input datasets
                //instead of showing that, let's *skip* this node back to datasets that it loaded
                //and load their tasks
                if( dep_task.service == "soichih/sca-product-raw" ||  //for prevenance
                    dep_task.service == "brainlife/app-stage" ) { 
                    let input_name = null;
                    if(task.config._inputs.length > 1) input_name = input.id;
                    load_stage("task."+task._id, input_name, input.dataset_id||input._id||input.subdir, next_dep);
                } else {
                    //task2task
                    let datatype = datatypes_cache[input.datatype];
                    if(!datatype) datatype = {name: "unknown "+input.datatype};
                    add_node(Object.assign({
                        id: "task."+input.task_id,
                        label: compose_label(dep_task),
                    }, taskInfo(dep_task)));
                    edges.push({
                        from: "task."+input.task_id,
                        to: "task."+task._id,
                        arrows: "to",
                        label: input.id+": "+datatype.name+" "+input.datatype_tags.join(","),
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
   
    //start by loading *this dataset*
    db.Datasets
    .findOne({ _id: origin_dataset_id })
    .populate('prov.app')
    .exec((err, dataset)=>{
        if(err) return cb(err);
        if(!dataset) return cb("no such dataset");
        this_dataset = dataset;
        nodes.push({
            id: "dataset."+dataset._id, 
            _datatype: dataset.datatype,
            _prov: dataset.prov,
            _user_id: dataset.user_id,
        });
        load_dataset_prov(dataset, null, err=>{
            //order nodes by id to make them ordered chronologically - which prevents violating DAG
            nodes.sort((a,b)=>{
                if(a._finish_date < b._finish_date) return 1;
                if(a._finish_date > b._finish_date) return -1;
                return 0;
            });
            cb(err, nodes, edges);
        });
    });
}

/**
 * @apiGroup Dataset
 * @api {post} /dataset                 Create new dataset from wf service task
 * @apiDescription                      Make a request to create a new dataset from wf service taskdir
 *
 * @apiParam {String} project           Project ID used to store this dataset under
 * @apiParam {String} task_id           WF service Task ID (of output task)
 * @apiParam {String} output_id         output_id to archive
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
    let dataset = null;

    async.series([
        //get the task to archive and check project
        next=>{
            axios.get(config.amaretti.api+"/task/"+req.body.task_id, {
                headers: { authorization: req.headers.authorization, }
            }).then(_res=>{
                task = _res.data;
                if(_res.status != 200) return next("failed to load task "+req.body.task_id);
                const gids = req.user.gids||[];
                if(task.user_id != req.user.sub && !~gids.indexOf(task._group_id)) return next("you don't own this task or member of a group "+task._group_id);
                if(!task.resource_id) return next("resource_id not set");
                if(task.status != "finished") return next("task not in finished state");
                next();
            }).catch(next);
        },

        //request archive
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
            common.archive_task_outputs(req.user.sub.toString(), task, [output], (err, datasets, archive_task)=>{
                if(err) return next(err);
                res.json(datasets[0]); //there should be only 1 dataset being archived via this API, so return [0]
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

    let unique_dataset_ids = [...new Set(req.body.dataset_ids)];

    async.series([
        //load dataset info (and check access)
        cb=>{
            common.getprojects(req.user, (err, canread_project_ids, canwrite_project_ids)=>{
                if(err) return cb(err);
                db.Datasets.find({_id: {$in: unique_dataset_ids}}).exec((err, _datasets)=>{
                    if(err) return cb(err);
                    //find dataset ids that user have access to
                    datasets = _datasets.filter(dataset=>{
                        if(!dataset) return false;
                        if(!dataset.storage) return false; //not stored yet

                        if(dataset.publications && dataset.publications.length > 0) {
                            //published dataset can be staged by anyone
                        } else {
                            canread_project_ids = canread_project_ids.map(id=>id.toString());
                            if(!~canread_project_ids.indexOf(dataset.project.toString())) {
                                //user doesn't have read access to this project
                                return false;
                            } 
                        }
                        return true;
                    });
                    if(unique_dataset_ids.length != datasets.length) {
                        return cb("you don't have access to all requested datasets or not stored yet");
                    }

                    cb();
                });
            });
        },

        cb=>{
            async.forEach(datasets, async dataset=>{
                inc_download_count(dataset);
                await dataset.save();
            }, cb);
        },

        //TODO - shouldn't we check for user agreement?

        cb=>{
            axios.get(config.amaretti.api+'/task', {
                headers: {
                    authorization: req.headers.authorization, 
                },
                params: {
                    find: JSON.stringify({
                        instance_id: req.body.instance_id,
                        status: {$ne: "removed"},
                        'config._tid': {$exists: true}, //use _tid to know that it's meant for process view
                    }),
                    select: 'config._tid', //I just need max _tid
                    limit: 1000, //should be enough.. for now 
                },
            }).then(res=>{
                next_tid = res.data.tasks.reduce((m,v)=>{ 
                    if(v.config._tid && v.config._tid > m) return v.config._tid;
                    return m;
                }, 0) + 1;
                cb();
            }).catch(cb);
        },

        //submit!
        async cb=>{
            let jwt = await common.issue_archiver_jwt(req.user.sub);

            let _config = {
                datasets: datasets.map(d=>{
                    if(d.storage == "copy") {
                        return {
                            //this dataset is a copy of an original dataset.
                            //we need to stage the original, but output to this dataset id (outdir)
                            id: d.storage_config.dataset_id, //(TODO - is this really set?)
                            outdir: d._id,

                            project: d.storage_config.project,
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
            }

            let postres = await axios({
                method: "post",
                url: config.amaretti.api+"/task",
                data: {
                    name : "Staging",
                    service : "brainlife/app-stage",
                    instance_id : req.body.instance_id,
                    config: _config,
                    max_runtime: 1000*3600, //1 hour should be enough?
                },
                headers: {
                    authorization: "Bearer "+jwt,
                }
            });
            console.log("submitted stage request");
            res.json(postres.data);
        },

    ], err=>{
        if(err) return next(err);
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
 * @apiParam {String[]} [datatype_tags]  List of datatype_tags
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
                if (req.body.desc !== undefined) dataset.desc = req.body.desc;
                if (req.body.tags) dataset.tags = req.body.tags;
                if (req.body.datatype_tags) dataset.datatype_tags = req.body.datatype_tags;
                if (req.body.meta) dataset.meta = req.body.meta;
                if (req.body.admins) dataset.admins = req.body.admins;
                dataset.save((err)=>{
                    if(err) return next(err);
                    dataset = JSON.parse(JSON.stringify(dataset));
                    dataset._canedit = canedit(req.user, dataset, canwrite_project_ids); //need to recompute with new admin/members list
                    common.publish("dataset.update."+req.user.sub+"."+dataset.project+"."+dataset._id,{
                        _id: dataset._id,
                        desc: dataset.desc,
                        tags: dataset.tags,
                        datatype_tags: dataset.datatype_tags,
                        meta: dataset.meta,
                        admins: dataset.admins,
                    });
                    res.json(dataset);
                });
            } else return res.status(401).end("you are not administartor of this dataset");
        });
    });
});

function stream_dataset(dataset, req, res, next) {
    var system = config.storage_systems[dataset.storage];
    if(!system) return next("no such storage:"+dataset.storage);
    var stat_timer = setTimeout(function() {
        logger.debug("timeout while calling stat on "+dataset.storage);
        next("stat timeout - filesystem maybe offline today:"+dataset.storage);
    }, 1000*15);
    system.stat(dataset, (err, stats)=>{
        clearTimeout(stat_timer);
        if(err) return next(err);
        logger.debug("obtaining download stream "+dataset.storage);
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

                inc_download_count(dataset);
                let sub = "guest";
                if(req.user) sub = req.user.sub;
                common.publish("dataset.download."+sub+"."+dataset.project+"."+dataset._id, {headers: req.headers});
                dataset.save();
            });
        });
    });
}

function inc_download_count(dataset) {
    if(!dataset.download_count) dataset.download_count = 1;
    else dataset.download_count++;
    //dataset.download_date = new Date(); //redundant with update_date
    logger.debug("download_count %d", dataset.download_count);
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

let cache = {};
//listen to user profile update event
common.get_amqp_connection((err, conn)=>{
    if(err) {
        logger.error("failed to obtain amqp connection");
    }
    logger.info("amqp connection ready.. subscribing to auth user.update events");
    conn.queue('', q=>{
        q.bind("auth", "user.update.*", ()=>{ //no err..
            q.subscribe((message, header, deliveryInfo, messageObject)=>{
                let sub = deliveryInfo.routingKey.split(".")[2];
                //console.debug("user.update event", sub);
                cache[sub] = message.profile.private.agreements;
            });
        });
    });
});

function get_user_agreements(sub, authorization, cb) { 
    //check cache
    if(cache[sub]) return cb(null, cache[sub]);

    //need to load from the source..
    axios.get(config.auth.api+"/profile/"+sub, {
        headers: { authorization }
    }).then(res=>{
        let user = res.data;
        let obj = user.profile.private.agreements;
        cache[sub] = obj;
        cb(null, obj);
    }).catch(cb);
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
            logger.debug("no such dataset:"+id);
            res.status(404).json({message: "couldn't find the dataset specified"});
            return;
        }
        if(!dataset.storage) return next("dataset:"+dataset._id+" doesn't have storage field set");

        //app-stage can access any dataset
        if(req.user && req.user.scopes.warehouse && ~req.user.scopes.warehouse.indexOf('stage')) {
            return stream_dataset(dataset, req, res, next);
        }

        //access control (I could do this in parallel?)
        async.series([
            
            //check project access
            cb=>{
                //we don't need to check project access if it's a published dataset
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
            stream_dataset(dataset, req, res, next);
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
    credentialsRequired: false, //TODO why?
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
    if(!req.user || !req.user.scopes || !req.user.scopes.datasets) return res.status(404).json({message: "no datasets scope"});
    if(!~req.user.scopes.datasets.indexOf(id)) return res.status(404).json({message: "not authorized"});
    logger.debug("token check ok.. loading dataset info");
    db.Datasets.findById(id).populate('datatype').exec((err, dataset)=>{
        if(err) return next(err);
        if(!dataset) return res.status(404).json({message: "couldn't find the dataset specified"});
        if(!dataset.storage) return next("dataset:"+dataset._id+" doesn't have storage field set");
        stream_dataset(dataset, req, res, next);
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
        async.eachSeries(ids, (id, next_id)=>{
            db.Datasets.findById(id, (err, dataset)=>{
                if(err) return next_id(err);
                if(!dataset) return next_id(new Error("can't find the dataset with id:"+id));
                if(!canedit(req.user, dataset, canwrite_project_ids)) return next_id("can't edit:"+id);
                dataset.remove_date = new Date();
                dataset.removed = true;
                dataset.save(next_id);
                common.publish("dataset.update."+req.user.sub+"."+dataset.project+"."+dataset._id, dataset);
            });
        }, err=>{
            if(err) return next(err);
            res.json({status: "ok", removed: ids.length});
        });
    });
});

/**
 * @apiGroup Dataset
 * @api {post} /dataset/downscript 
 *                              Generate dataset download script
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
        db.Datasets.find(construct_dataset_query(req.body/*, canread_project_ids*/))
        .populate('datatype project', 'name desc admins members bids') //mixed in with datatype/project model fields...
        .skip(+skip)
        .limit(+limit)
        .sort('meta.subject')
        .lean()
        .exec((err, datasets)=>{
            if(err) return next(err);

            let script = `#!/bin/bash\n
set +x #show all commands running
set +e #stop the script if anything fails

`;
            if(req.headers.authorization) script += "auth=\"Authorization: "+req.headers.authorization+"\"\n"

            //check project access
            let canread_project_ids_str = canread_project_ids.map(id=>id.toString());
            datasets = datasets.filter(d=>{
                if(d.publications && d.publications.length > 0) return true; //published datasets can be ready by anyone
                return canread_project_ids_str.includes(d.project._id.toString());
            });
            
            //find unique projects
            let projects = {};
            datasets.forEach(d=>{
                if(!projects[d.project._id]) projects[d.project._id] = d.project;
            });
            
            //construct project info
            for(let project_id in projects) {
                let p = projects[project_id];
                let authors = [...p.admins, ...p.members];
                authors = authors.filter((v,idx,self)=>self.indexOf(v) === idx); //uniq
                authors = authors.map(id=>common.deref_contact(id)).filter(a=>!!a).map(a=>a.fullname||a.email);

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
                path+=common.dataset_to_filename(dataset);
                script += "mkdir -p \""+path+"\"\n";
                script += "echo downloading dataset:"+dataset._id+" to "+path+"\n";
                script += "curl ";
                if(req.headers.authorization) script += "-H \"$auth\" ";
                script += config.warehouse.api+"/dataset/download/"+dataset._id+" | tar -C \""+path+"\" -x\n";

                //download info.json
                script += "curl ";
                if(req.headers.authorization) script += "-H \"$auth\" ";
                script += config.warehouse.api+"/dataset?single=true\\&find='\\{\"_id\":\""+dataset._id+"\"\\}' > "+path+"/_info.json\n";

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
                            script += "[ -f "+path+"/"+map.src+" ] && ln -sf "+bidspath_exit+"$(ls -d \""+path+"/"+map.src+"\") \""+bidspath+"/"+dest+"\"\n";
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
                dataset.desc = dataset.desc; //could be undefined
            });

            db.Datasets.insertMany(datasets,(err, docs)=>{
                if(err) return next(err);
                //docs.map(db.dataset_event);
                docs.map(doc=>{
                    common.publish("dataset.create."+req.user.sub+"."+doc.project+"."+doc._id, doc);
                });
                res.json(docs);
            });
        });
    });
});
 
module.exports = router;

