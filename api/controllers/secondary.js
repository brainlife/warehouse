'use strict';

const express = require('express');
const router = express.Router();
const axios = require('axios');
const async = require('async');
const path = require('path');
const fs = require('fs');

const config = require('../config');
const db = require('../models');
const common = require('../common');

//DEPRECATED 
// we now store object metadata under /inputs/meta
// information under /inputs/meta can be accessed directly (without this api)
// /inputs/meta is created whenever dataset object is created/updated so user can treat them
// one2one with archived objects (user has to consider "removed", however..)
/**
 * @apiGroup Secondary
 *                              List secondary output list. This is a public interface (for now) as it only contains the metadata, 
 *                              and user must know the project id to access it. But it would be nice to restrict this to the 
 *                              ipython notebook running for the group. maybe I can issue a special token?
 * @apiSuccess {Object}         List of secondary outputs
 */
router.get('/list/:projectid', async (req, res, next)=>{
    try {
        let project = await db.Projects.findById(req.params.projectid);
        if(!project) return res.status(404).end();

        console.log("loading all secondary archive task from project group", project.group_id);
        const _res = await axios.get(config.amaretti.api+'/task', {
            params: {
                select: 'config.requests instance_id',
                find: JSON.stringify({
                    'finish_date': {$exists: true}, //status is probably "removed" by now
                    'service': 'brainlife/app-archive-secondary',
                    '_group_id': project.group_id,
                }),
                limit: 100000, //TODO.. how scalable is this!?
                //sort: 'create_date', //this seems to slow things down
            },
            headers: { authorization: "Bearer "+config.warehouse.jwt },
        });

        let objects = [];

        //merge all output requests into a single list
        console.log("iterating secondary archive tasks", _res.data.tasks.length);
        _res.data.tasks.forEach(task=>{
            if(!task.config.requests) return; //old format?
            task.config.requests.forEach(request=>{

                //filter out some extra metadata that's too big to store..
                if(request.output && request.output.meta) {
                    for(let k in request.output.meta) {
                        if(typeof request.output.meta[k] == 'object') request.output.meta[k] = "_suppresed_";
                    }
                }

                //we only want objects with datatype set (for group analysis datatypes)
                //validator output archive won't have datatype set (see event handler) 
                //so we can filter them out by looking for this.
                if(!request.datatype) return; 

                //slim down datatype
                //I don't think I have to do this anymore as secondary archiver should only 
                //store _id and name. (doing this for old tasks. probably)
                request.datatype = {
                    _id: request.datatype._id,
                    name: request.datatype.name,
                }

                //pull information out of request and store things that users care
                let o = {
                    path: request.instance_id+"/"+request.task_id+"/"+request.subdir,
                    task_id: request.task_id,
                    datatype: request.datatype,

                    //these might not exist on old objects during development
                    app: request.app||{},

                    //BUG... tags/desc/dtag/meta/etc.. might be changed by the user on the archived dataset
                    //but, we are looking up the "provenance" of the task.. so it might contain old data
                    //(this was the case for guio when she set the tags after the data was archived..)
                    //we need to lookup the *current* datasets but that's really expensive..
                    //we might want to set a flag on the dataset object to indicate that the output is stored in the
                    //secondary so we can just query against that? 
                    output: request.output||{},

                    finish_date: new Date(request.finish_date),
                };
                objects.push(o);
            });
        });

        objects.sort((a,b)=>{
            return a.finish_date - b.finish_date;
        });

        console.log("returning json");
        res.json(objects);

    } catch (err) {
        next(err);
    }
});

/**
 * @apiGroup Secondary
 * @api {get} /secondary/:task_id
 *                          Download secondary content for a given dtv task / and path
 *                          jwt token is optional for task with config._public set to allow secondary content 
 *                          exposed for published secondary data
 * @apiParam {string} task_id
 *                          Task ID to load secondary data
 * @apiQuery {string} p     File path to load the secondary data from
 * @apiQuery {string} at    Access token to override the http header
 * @apiHeader {String} authorization
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         Directory structure of secondary content
 */
router.get('/:task_id/*', common.jwt({
    credentialsRequired: false,
    //similar to dataset/download
    getToken: function(req) { 
        //load token from req.headers as well as query.at
        if(req.query.at) return req.query.at; 
        if(req.headers.authorization) {
            var auth_head = req.headers.authorization;
            if(auth_head.indexOf("Bearer") === 0) return auth_head.substr(7);
        }
        return null;
    }
}), async (req, res, next)=>{
    const task_id = req.params.task_id;
    const p = req.query.p || req.params[0];
    const taskres = await axios.get(config.amaretti.api+"/task/"+task_id);
    if(taskres.status != 200) return next("failed to load task "+task_id);
    const task = taskres.data;

    if(!task.config._public) {
        //if not public output, restrict access
        const gids = req.user.gids||[];
        if(!req.user) return next("Please login");
        if(task.user_id != req.user.sub && !~gids.indexOf(task._group_id)) return next("you don't own this task or member of a group "+task._group_id);
    }

    //ok looks good.. 
    const parent_task_id = task.deps_config[0].task;
    const prefix = config.groupanalysis.secondaryDir+"/"+task._group_id+"/"+task.instance_id+"/"+parent_task_id;

    //make sure path looks safe
    const clean_p = path.resolve(prefix+"/"+p);

    //console.debug("clean_p", clean_p);

    if(!clean_p.startsWith(prefix)) return next("invalid path");

    config.groupanalysis.getSecondaryDownloadStream(clean_p, (err, readstream)=>{
        if(err) return next(err);
        readstream.pipe(res);   
        readstream.on('error', err=>{
            console.error("failed to pipe", err);
            next(err); 
        });
        res.on('finish', ()=>{
            let sub = "guest";
            if(req.user) sub = req.user.sub;
            common.publish("secondary.download."+sub+"."+task._group_id+"."+task._id, {headers: req.headers, path: clean_p});
        });
    });
});

async function issueGAJwt(instance_id, user, authorization, cb) {
    try {
        //access control instance by querying for it
        let _res = await axios.get(config.amaretti.api+"/instance", {
            params: {
                find: JSON.stringify({_id: instance_id}),
            },
            headers: { authorization },
        });
        if(_res.data.instances.length != 1) return cb("no such instance?");
        const instance = _res.data.instances[0];

        //give the user jwt extra access to gid used to access ga server
        _res = await axios.get(config.auth.api+"/jwt/"+user.sub, {
            params: {
                claim: JSON.stringify({gids: [instance.group_id, config.groupanalysis.gid]}),
            },
            headers: { authorization: "Bearer "+ config.warehouse.jwt }
        });
        const jwt = _res.data.jwt;

        //lookup project ID from group_id (ga-launcher uses it to set PROJECT_ID)
        const project = await db.Projects.findOne({group_id: instance.group_id});
        if(!project) return next("can't find project with group_id:"+instance.group_id);

        cb(null, jwt, instance, project);

    } catch(err) {
        cb(err);
    }
}

/**
 * @apiGroup Secondary
 * @api {put} /secondary/launchga   Launch Group Analysis Container
 *                              
 * @apiParam {String} instance_id   Instance to launch the group analysis 
 * @apiParam {String} [name]        Name for this analysis
 * @apiParam {String} [desc]        Description for this analysis
 * @apiParam {Object} [config]      Configuration to send to the launcher
 * @apiParam {Object} [deps_config] amaretti dep_config for dataset id?
 *
 * @apiHeader {String} authorization 
 *                                  A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}             Submitted launcher task
 */
router.post('/launchga', common.jwt(), (req, res, next)=>{
    if(!req.body.instance_id) return next("instance_id is not set");
    if(!req.body.config) return next("please set config");
    if(!req.body.config.container) return next("please set contianer (with tag)");

    issueGAJwt(req.body.instance_id, req.user, req.headers.authorization, 
        async (err, jwt, instance, project)=>{
        if(err) return next(err);

        let _config = Object.assign({}, req.body.config);
        _config.project = {
            _id: project._id, 
            name: project.name, //galauncher just need _id, but just in case it might become handy..
        }
        _config.group = instance.group_id;

        //submit the launcher!
        const farfuture = new Date("2100-07-27");
        try{
            const _res = await axios.post(config.amaretti.api+"/task", {
                name: req.body.name,
                desc: req.body.desc,
                service : "brainlife/ga-launcher",
                service_branch: "master", //TODO
                instance_id : instance._id,
                gids: [config.groupanalysis.gid],
                max_runtime: 24*1000*3600, //auto stop after 24 hours .
                remove_date: farfuture, //set it far enough into future to prevent it from getting it removed
                deps_config: req.body.deps_config,
                config: _config,
            }, {
                headers: { authorization: "Bearer "+jwt, }
            });
            res.json(_res.data.task);
        } catch(err) {
            next(err);
        }
    });
});

router.post('/archive', common.jwt(), (req, res, next)=>{
    if(!req.body.instance_id) return next("instance_id is not set");
    if(!req.body.session) return next("session is not set");
    if(!req.body.notebook) return next("notebook is not set");

    const notebookPath = "../"+req.body.session+"/notebook/"+req.body.notebook;

    //make sure notebookPath lives within the instance directory
    //by checking to see if the notebookPath resolves on cwd's parent directory
    //TODO - is this secure enough?
    const notebookPathResolved = path.resolve(notebookPath);
    const parentDir = path.resolve(process.cwd()+"/..");

    //debug
    console.log(notebookPathResolved, parentDir);

    if(!notebookPathResolved.startsWith(parentDir)) {
        return next("bad notebookPath");
    }

    issueGAJwt(req.body.instance_id, req.user, req.headers.authorization, 
        async (err, jwt, instance, project)=>{
        if(err) return next(err);

        try {
            const _res = await axios.post(config.amaretti.api+'/task', {
                instance_id: instance._id,
                gids: [config.groupanalysis.gid],
                name: "Converting notebook to html",
                service: "brainlife/app-nbconvert",
                config: {
                    _public: true,

                    //notebook to convert to html/index.html
                    notebook: notebookPath,

                    _outputs: [
                        {
                            id: "html", //needed by archive-secondary
                            datatype: "5e56dc330f7fa604cc3cc291", //report/html
                        },
                        {
                            id: "notebook",
                            datatype: "6079f960f1481a4d788fba3e", //jupyter/notebook
                            subdir: "notebook",
                            meta: {
                                subject: "analysis",
                            },
                            archive: {
                                project: project._id,
                                desc: "for notebook publication: "+req.body.notebook, 
                            },
                        },
                    ],
                }
            }, {
                headers: { authorization: "Bearer "+jwt, }
            });
            res.json(_res.data.task);
        } catch (err) {
            next(err);
        }
    });
});

module.exports = router;


