'use strict';

const express = require('express');
const router = express.Router();
const winston = require('winston');
const async = require('async');
const request = require('request');
const axios = require('axios');
const fs = require('fs');

const config = require('../config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../models');
const common = require('../common');
const provenance = require('../lib/provenance');

function canedit(user, rec) {
    if(user) {
        if(user.scopes.warehouse && ~user.scopes.warehouse.indexOf('admin')) return true;
        if(rec.admins && ~rec.admins.indexOf(user.sub.toString())) return true;
    }
    return false;
}

//TODO - do we still need this now that we have /query api?
/**
 * @apiGroup App
 * @api {get} /app              Query apps
 * @apiDescription              Query registered apps
 *
 * @apiParam {Object} [find]    Optional Mongo find query - defaults to {}
 * @apiParam {Object} [sort]    Optional Mongo sort object - defaults to {}
 * @apiParam {String} [select]  Fields to load - multiple fields can be entered with %20 as delimiter
 * @apiParam {String} [populate] Relational fields to populate
 * @apiParam {Number} [limit]   Optional Maximum number of records to return
 * @apiParam {Number} [skip]    Optional Record offset for pagination
 *
 * @apiHeader {String} [authorization]
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         List of apps (maybe limited / skipped) and total count
 */
router.get('/', common.jwt({credentialsRequired: false}), (req, res, next)=>{
    var skip = req.query.skip||0;
    let limit = req.query.limit||100;
    var ands = [];
    if(req.query.find) ands.push(JSON.parse(req.query.find));
    
    common.getprojects(req.user, (err, project_ids)=>{
        if(err) return next(err);
        ands.push({$or: [ 
            //if projects is set, user need to have access to it
            {projects: {$in: project_ids}},

            {projects: []}, //if projects is empty array, it's available to everyone

            //for backward compatibility
            {projects: null}, //if projects is set to null, it's avalable to everyoone
            {projects: {$exists: false}}, //if projects not set, it's availableo to everyone
        ]});

        db.Apps.find({$and: ands})
        .select(req.query.select)
        .limit(+limit)
        .skip(+skip)
        .sort(req.query.sort || '_id')
        .populate(req.query.populate || '')
        .lean()
        .exec((err, recs)=>{
            if(err) return next(err);
            db.Apps.countDocuments({$and: ands}).exec((err, count)=>{
                if(err) return next(err);
                //adding some derivatives
                if(req.user) recs.forEach(function(rec) {
                    rec._canedit = canedit(req.user, rec);
                });
                res.json({apps: recs, count: count});
            });
        });
    });
});

/**
 * @apiGroup App
 * @api {get} /app/query        
 * @apiDescription              Query apps based on search query (public)
 *
 * @apiParam {String} q         Query used to search for apps
 *
 * @apiHeader {String} [authorization]
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object[]}       List of apps (populated with datatype.name / contributors)
 */
router.get('/query', common.jwt({credentialsRequired: false}), (req, res, next)=>{
    
    //construct db level query (not removed, and apps that user has access to)
    //and get *all* apps (minus some heavy/unnecessary stuff)
    common.getprojects(req.user, async (err, project_ids)=>{
        if(err) return next(err);
        const apps = await db.Apps.find({
            removed: false,
            $or: [ 
                //if projects is set, user need to have access to it
                {projects: {$in: project_ids}},

                {projects: []}, //if projects is empty array, it's available to everyone

                //for backward compatibility
                {projects: null}, //if projects is set to null, it's avalable to everyoone
                {projects: {$exists: false}}, //if projects not set, it's availableo to everyone
            ]
        })
        .select('-config -avatar -stats.gitinfo -contributors') //cut things we don't need
        //we want to search into datatype name/desc (desc might be too much?)
        .populate('inputs.datatype', 'name desc') 
        .populate('outputs.datatype', 'name desc')
        .lean();

        if(!req.query.q) return res.json(apps); //if not query is set, return everything
        const queryTokens = req.query.q.toLowerCase().split(" ");

        //then construct list of tokens for each app to search by
        apps.forEach(app=>{
            let tokens = [
                app.name, 
                app.github_branch, 
                app.github, 
                app.desc, 
                app.desc_override, 
                app.doi, 
                ...app.tags
            ];
            app.inputs.forEach(input=>{
                tokens = [...tokens, ...input.datatype_tags, input.datatype.name, input.datatype.desc];
            });
            app.outputs.forEach(output=>{
                tokens = [...tokens, ...output.datatype_tags, output.datatype.name, output.datatype.desc];
            });
            tokens = tokens.filter(token=>!!token).map(token=>token.toLowerCase());

            //let's just store it as part of the app
            app._tokens = tokens.join(" ");
        });

        //then filter apps using _tokens
        const filtered = apps.filter(app=>{
            //for each query token, make sure all token matches somewhere in _tokens
            let match = true;
            queryTokens.forEach(token=>{
                if(!match) return; //we already know it won't match
                if(!app._tokens.includes(token)) match = false;
            });
            return match;
        });

        //remove _tokens from the apps to reduce returning weight a bit
        filtered.forEach(app=>{ delete app._tokens; });

        res.json(filtered);
    });
});

//experimental
router.get('/example/:id', common.jwt({credentialsRequired: false}), async (req, res, next)=>{
    const cachefname = "/tmp/example.app-"+req.params.id+".json";
    if(fs.existsSync(cachefname)) {
        const cache = fs.readFileSync(cachefname, {encoding: "utf8"});
        const provs = JSON.parse(cache);

        if(req.user && req.user.scopes.warehouse && req.user.scopes.warehouse.includes('admin')) {
            //let admin see things that other user can't see
        } else {
            //remove info
            provs.forEach(prov=>{
                prov.nodes.forEach(node=>{
                    delete node.project;
                    delete node.desc;
                    delete node.userId;
                    delete node.user;
                    delete node.tags;
                    delete node.meta;
                    delete node.datasetId;
                    delete node.storage;
                    delete node.storageLocation;
                    delete node.taskId;
                    delete node._taskId;
                    delete node.instanceId;
                    delete node.resourceId;
                    delete node.groupId;
                    node.tags = [];
                });
            });
        }

        return res.json(provs);

    } else {
        console.log("app example not cached yet", cachefname);
        return res.json([]); 

        /*
        console.log("loading example workflow");
        const provs = await provenance.sampleTerminalTasks(req.params.id);
        provs.map(provenance.setupShortcuts);

        const commonProvs = [];
        const clusters = provenance.cluster(provs);
        clusters.forEach(cluster=>{
            //grab the first one from each cluster
            commonProvs.push(provs[cluster[0]]);
        }); 
        fs.writeFileSync(cachefname, JSON.stringify(commonProvs));
        res.json(commonProvs);
        */
    }

    /*
    const cnodes = provenance.countProvenances(provs);
    const probGroups = provenance.computeProbabilities(cnodes);
    //grab the top 3 groups
    probGroups.splice(0,3).forEach(probGroup=>{
        const idx = probGroup.provs[0]; //grab the first one from each group
        console.log("picking",idx, probGroup.prob);
        const prov = provs[idx];
        prov._prob = probGroup.prob;
        prov._probSiblings = probGroup.provs.length;
        commonProvs.push(prov);
    });

    await common.cacheDatatypes();
    commonProvs.forEach(prov=>{
        //remove things we don't want to show to the user
        prov.nodes.forEach(node=>{
            delete node.project;
            delete node.desc;
            delete node.userId;
            delete node.meta;
            delete node.datasetId;
            node.tags = [];
        });

        //populate datatype info
        prov.nodes.filter(n=>!!n.datatype).forEach(node=>{
            if(typeof node.datatype == 'object') return; //duplicate prov that's already populated?
            const id = node.datatype;
            const datatype = common.datatypeCache[id];
            let name = "unknown-dt-"+id;
            if(datatype) name = datatype.name;
            node.datatype = { id, name, }
        });
    });
    */
});

//experimental - query task provenance (admin only)
router.get('/taskprov/:id', common.jwt(), async (req, res, next)=>{
    if(!req.user.scopes.warehouse || !~req.user.scopes.warehouse.indexOf('admin')) return true;
    const prov = await provenance.traverseProvenance(req.params.id);
    provenance.setupShortcuts(prov);
    await provenance.populate(prov);
    res.json(prov);
});

/**
 * @apiGroup App
 * @api {get} /app/:id          Get App
 * @apiDescription              Get App detail (no AC as long as a valid App ID is given)
 *
 * @apiParam {String} [select]  Fields to load - multiple fields can be entered with %20 as delimiter
 * @apiParam {String} [populate] Relational fields to populate
 *
 * @apiHeader {String} [authorization]
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         App detail
 */
router.get('/:id', common.jwt({credentialsRequired: false}), (req, res, next)=>{
    db.Apps.findById(req.params.id)
    .select(req.query.select)
    .populate(req.query.populate || '')
    .lean()
    .exec((err, app)=>{
        if(err) return next(err);
        if(!app) return next("no such app");
        app._canedit = canedit(req.user, app);
        res.json(app);
    });
});

//experimental
router.get('/:id/badge', (req, res, next)=>{
    db.Apps.findById(req.params.id).select('stats').exec((err, app)=>{
        if(err) return next(err);
        if(!app) return next("no such app");
        /*
10|warehou | {
10|warehou |     "stats": {
10|warehou |         "stars": 1,
10|warehou |         "requested": 288,
10|warehou |         "users": 2,
10|warehou |         "success_rate": 83
10|warehou |     },
10|warehou |     "_id": "58c56d92e13a50849b258801"
10|warehou | }
        */
        res.redirect('https://img.shields.io/badge/brainlife-'+app.stats.requested+' runs ('+app.stats.users+' users)-brightgreen.svg');
    });
});

//experimental
//   used by: ui dashboard
router.get('/:id/metrics', (req, res, next)=>{
    db.Apps.findById(req.params.id).select('github').lean().exec((err, app)=>{
        if(err) return next(err);
        if(!app) return next("no such app");
        let service = common.sensu_name(app.github);
        request.get({url: config.metrics.api+"/render", qs: {
            target: config.metrics.service_prefix+"."+service,
            format: "json",
            noNullPoints: "true"
        }, json: true }, (err, _res, json)=>{
            if(err) return next(err);
            if(json.length == 0) return res.json([]); //maybe not reported recently?
            let points = json[0].datapoints;
            /*
            //TODO - insert artificial 0 value if timestams jumps more than 90 seconds (should be reported every 60 seconds)
            let previous = null;
            points.forEach(point=>{ });
            */
            res.json(points);
        });
    });
});

/**
 * @apiGroup App
 * @api {post} /app             Post App
 * @apiDescription              Register new app (don't set id to null)
 *
 * @apiParam {String} [name]    User friendly name for this app
 * @apiParam {String} [desc]    Description for this app
 * @apiParam {String[]} [tags]  List of tags to classify this app
 * @apiParam {String} [avatar]  URL for application avatar
 * @apiParam {String} [github]  github id/name for this app
 * @apiParam {Number} [retry]   Number of time this app should be retried (0 by default)
 * @apiParam {Object[]} [inputs]    Input datatypes. Array of {id, datatype, datatype_tags[]}
 * @apiParam {Object[]} [outputs]   Output datatypes. same as input datatype
 * @apiParam {String[]} [projects]  List of project IDs that this app should be exposed in 
 *
 * @apiParam {String} [github]   Github org/name
 * @apiParam {String} [github_branch]   Github default branch/tag name
 * @apiParam {String} [deprecated_by]   App ID that this App was deprecated by
 *
 * @apiParam {Object} [config]   configuration template
 *
 * @apiParam {String} [dockerhub]   Dockerhub id/name
 *
 * @apiParam {String[]} admins  Admin IDs
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         App registered
 */
router.post('/', common.jwt(), (req, res, next)=>{

    req.body.user_id = req.user.sub;
    
    let app = new db.Apps(req.body);

    async.series([
        //access check
        cb=>{
            logger.debug("validating");
            common.validate_projects(req.user, req.body.projects, cb);
        },
        
        //update info from github
        cb=>{
            logger.debug("loading github info");
            common.update_appinfo(app, cb);
        },

        /* let's do this async so we can monitor datacite situation 
        //mint doi
        cb=>{
            logger.debug("minting doi");
            common.get_next_app_doi((err, doi)=>{
                if(err) return cb(err);
                app.doi = doi;
                cb();
            });
        },
        */

        //save app (and generate _id)
        cb=>{
            logger.debug("saving app");
            app.save((err, _app)=>{
                if(err) return cb(err);
                app = _app;
                cb();
            });
        },

        /*
        //store doi meta
        cb=>{
            logger.debug("posting metadata for doi");
            let metadata = common.compose_app_datacite_metadata(app);
            common.doi_post_metadata(metadata, err=>{
                if(err) return cb(err);
                //then attach url to it (to "mint" it!)
                let url = config.warehouse.url+"/app/"+app._id;  
                common.doi_put_url(app.doi, url, cb);
            });
        },
        */
    ], err=>{
        if(err) return next(err);
        app = JSON.parse(JSON.stringify(app));
        app._canedit = canedit(req.user, app);
        res.json(app);
    });
});

/**
 * @apiGroup App
 * @api {put} /app/:id          Update App
 *                              
 * @apiDescription              Update App
 *
 * @apiParam {String} [name]    User friendly name for this container 
 * @apiParam {String} [desc]    Description for this dataset 
 * @apiParam {String[]} [tags]  List of tags to classify this app
 * @apiParam {String} [avatar]  URL for application avatar
 * @apiParam {String} [github]  github id/name for this app
 * @apiParam {Object[]} [inputs]    Input datatypes and tags
 * @apiParam {Object[]} [outputs]   Output datatypes and tags
 * @apiParam {String[]} [projects]  List of project IDs that this app should be exposed in 
 *
 * @apiParam {String} [dockerhub]  
 * @apiParam {String} [deprecated_by]   App ID that this App was deprecated by
 * @apiParam {Boolean} [removed]  Set it to true if this App is removed
 *
 * @apiParam {String[]} [admins]  List of admins (auth sub)
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Updated App
 */
router.put('/:id', common.jwt(), (req, res, next)=>{
    var id = req.params.id;

    //let's not validate project - as different maintainer has access to different set of projects
    //and if the project is entered by different maintainer, we don't want to error out..
    //multiprojectselecter on UI will list project that user doesn't have access using just project ID 
    //so user can retain project ID that user don't have access
    //common.validate_projects(req.user, req.body.projects, err=>{
    //    if(err) return next(err);

    db.Apps.findById(id, (err, app)=>{
        if(err) return next(err);
        if(!app) return res.status(404).end();
        if(!canedit(req.user, app)) {
            return res.status(401).end("you are not administartor of this app");
        } else {
            for(var k in req.body) {
                //white list fields that user can update
                switch(k) {
                case "admins":
                case "avatar":
                case "name":
                case "config":
                case "desc_override":
                case "github":
                case "github_branch":
                case "inputs":
                case "outputs":
                case "projects":
                case "retry":
                case "removed":
                case "deprecated_by":
                    app[k] = req.body[k];    
                    if(req.body[k] === null) app[k] = undefined; //remove 
                    break;
                default:
                    logger.debug("can't update %s", k);
                }
            }

            async.series([
                //update info from github
                cb=>{
                    common.update_appinfo(app, cb);
                },

                //update datacite info
                cb=>{
                    if(!app.doi) return cb(); //doi not set...skip
                    let metadata = common.compose_app_datacite_metadata(app);
                    common.doi_post_metadata(metadata, err=>{
                        if(err) {
                            logger.error("failed to update metadata for datacite");
                            logger.error(err);
                            return cb(); //sometime datacite is broken.. let's skip if this happens
                        }
                        cb();
                    });
                },

                //now save
                cb=>{
                    app.save((err)=>{
                        if(err) return cb(err);
                        app = JSON.parse(JSON.stringify(app));
                        app._canedit = canedit(req.user, app);
                        cb();
                    });
                },
            ], err=>{
                if(err) return next(err);
                res.json(app);
            });
        }
    });
    //});
});

/**
 * @apiGroup App
 * @api {delete} /app/:id
 *                              Remove registered app (only by the user registered it)
 * @apiDescription              Mark the application as removed (redundant with put?)
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 */
router.delete('/:id', common.jwt(), (req, res, next)=>{
    var id = req.params.id;
    //TODO - prevent user from removing app that's in use..
    db.Apps.findById(req.params.id, (err, app)=>{
        if(err) return next(err);
        if(!app) return next(new Error("can't find the app with id:"+req.params.id));
        if(canedit(req.user, app)) {
            app.removed = true;
            app.save(err=>{
                if(err) return next(err);
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

/**
 * @apiGroup App
 * @api {delete} /app/github/:org/:name
 *                              Query github information (tab, branches) 
 *                              This works for private repos
 * @apiDescription              Mark the application as removed (redundant with put?)
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 */
router.get('/info/:org/:name', common.jwt(), async (req, res, next)=>{
    let service = req.params.org+"/"+req.params.name; //TODO validate?
    try {
        let branches = [];
        let page = 1;
        while(true) {
            console.log("loading page", page);
            let items = await axios.get('https://api.github.com/repos/'+service+'/branches', {
                params: { page, },
                headers: {
                    Authorization: 'token '+config.github.access_token,
                    'User-Agent': 'brainlife/warehouse',
                }
            });
            branches = [...branches, ...items.data];
            if(items.data.length == 0) break;
            page++;
        }

        let tags = [];
        page = 1;
        while(true) {
            let items = await axios.get('https://api.github.com/repos/'+service+'/tags', {
                params: { page, },
                headers: {
                    Authorization: 'token '+config.github.access_token,
                    'User-Agent': 'brainlife/warehouse',
                }
            });
            tags = [...tags, ...items.data];
            if(items.data.length == 0) break;
            page++;
        }
        res.json({branches, tags});
    } catch(err) {
        console.error(err);
        next("No such repo?");
    }
});


module.exports = router;

