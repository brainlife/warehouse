'use strict';

const express = require('express');
const router = express.Router();
const winston = require('winston');
const request = require('request');

const config = require('../config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../models');
const common = require('../common');

/**
 * @apiGroup Project
 * @api {get} /project          Query projects
 * @apiDescription              Query projects registered
 *
 * @apiParam {Object} [find]    Optional Mongo find query - defaults to {}
 * @apiParam {Object} [sort]    Optional Mongo sort object - defaults to {}
 * @apiParam {String} [select]  Fields to load - multiple fields can be entered with %20 as delimiter
 * @apiParam {String} [populate] Relational fields to populate
 * @apiParam {Number} [limit]   Optional Maximum number of records to return - defaults to 0(no limit)
 * @apiParam {Number} [skip]    Optional Record offset for pagination
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         List of projects (maybe limited / skipped) and total count
 */
router.get('/', common.jwt({credentialsRequired: false}), (req, res, next)=>{
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);

    var skip = req.query.skip||0;
    let limit = req.query.limit||100;

    var select = null;
    if(req.query.select) select = req.query.select;
    
    if(req.user && 
        req.user.scopes.warehouse && 
        ~req.user.scopes.warehouse.indexOf('admin') && 
        req.query.admin) {
        //admin requested admin priviledge return all
    } else if(req.user) {
        //only allow querying for public, or private project that user owns
        //user can see all public, private-listed or any project that they are member of
        let access_control = {$or: [
            { guests: req.user.sub },
            { members: req.user.sub },
            { admins: req.user.sub },
            { access: "public" },
            { listed: true }, //private project can be viewed if it's listed
        ]}
        find = {$and: [ find, access_control ]};
    } else {
        find.access = "public"; //guest can only see public projects
    }

    db.Projects.find(find)
    .select(select)
    .skip(+skip)
    .limit(+limit)
    .sort(req.query.sort || '_id')
    .populate(req.query.populate || '')
    .lean()
    .exec((err, recs)=>{
        if(err) return next(err);
        db.Projects.countDocuments(find).exec((err, count)=>{
            if(err) return next(err);
            res.json({
                projects: recs, 
                count
            });
        });
    });
});

/**
 * @apiGroup Project
 * @api {get} /project/query
 * @apiDescription                 Query projects based on search query (public)
 * 
 * @apiParam {String} q            Query used to search for projects
 *
 * @apiHeader {String} [authorization]  
 *                                 A valid JWT token "Bearer : xxxxx"
 * 
 * @apiSuccess {Object}            Project record registered 
 */
router.get('/query',common.jwt({credentialsRequired: false}), (req, res, next)=> {
    /*lets find first all the projects*/
    let ands = [{removed : false, "openneuro": {$exists: false}}];
    
    common.getprojects(req.user, async (err, project_ids)=>{
        if(err) return next(err);
        ands.push({_id : {$in : project_ids}});
        let projects = await db.Projects.find({$and : ands});
        console.log(projects.length);
        if(!req.query.q) return res.json(projects);
        const queryTokens = req.query.q.toLowerCase().split(" ");

        projects.forEach(project=>{
            let tokens = [
                project.name,
                project.desc,
                project.readme,
            ];
            tokens = tokens.filter(token=>!!token).map(token=>token.toLowerCase());
            project._tokens = tokens.join(" ");
        });
        const filtered = projects.filter(project=>{
            //for each query token, make sure all token matches somewhere in _tokens
            let match = true;
            queryTokens.forEach(token=>{
                if(!match) return; //we already know it won't match
                if(!project._tokens.includes(token)) match = false;
            });
            return match;
        });

        //remove _tokens from the apps to reduce returning weight a bit
        filtered.forEach(project=>{ delete project._tokens; });
        console.log(filtered);
        res.json(filtered);
    });    
});


/**
 * @apiGroup Project
 * @api {post} /project         Post Project
 * @apiDescription              Register new project
 *
 * @apiParam {String} access    "public" or "private"
 * @apiParam {String} [name]    User friendly name for this container 
 * @apiParam {String} [desc]    Description for this dataset 
 * @apiParam {String} [readme]  Markdown content describing this project
 *
 * @apiParam {String[]} admins  Admin IDs
 * @apiParam {String[]} members Members
 * @apiParam {String[]} guests  Guest Members
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Project record registered
 */
router.post('/', common.jwt(), function(req, res, next) {
    delete req.body._id; //shouldn't be set
    req.body.user_id = req.user.sub; //override (TODO - toString()?)

    //TODO - should I validate admins/members? how?

    //make sure submitter is listed as admin
    if(!req.body.admins) req.body.admins = [];
    if(!req.body.admins.includes(req.user.sub.toString())) req.body.admins.push(req.user.sub);

    //create a new group
    request.post({ url: config.auth.api+"/group", headers: { authorization: req.headers.authorization }, json: true,
        body: {
            name: new Date().getTime(), //TODO - better name?
            desc: req.body.desc,
            admins: req.body.admins,
            members: req.body.members,
        }
    }, (err, _res, body)=>{
        if(err) return next(err);

        //now update the warehouse project
        var project = new db.Projects(req.body);
        project.group_id = body.group.id;
        project.save(err=>{
            if (err) return next(err); 
            project = JSON.parse(JSON.stringify(project));
            common.publish("project.create."+req.user.sub+"."+project._id, {})
            res.json(project);
        });
    });
});

/**
 * @apiGroup Project
 * @api {put} /project/:id
 * @apiDescription              Update project
 *
 * @apiParam {String} [access]  "public" or "private"
 * @apiParam {String} [name]    User friendly name for this container 
 * @apiParam {String} [desc]    Description for this dataset 
 * @apiParam {String} [readme]  Markdown content describing this project
 *
 * @apiParam {String[]} [admins]  List of admins (auth sub)
 * @apiParam {String[]} [members] List of admins (auth sub)
 * @apiParam {String[]} [guests]  List of guest users (auth sub)
 * @apiParam {String[]} [agreemenets]  List of data access agreemenets that user must check
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Project object updated
 */
router.put('/:id', common.jwt(), (req, res, next)=>{
    var id = req.params.id;
    db.Projects.findById(id, (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();
        if(!common.isadmin(req.user, project)) return res.status(401).end("you are not an administartor of this project");
        
        //user can't update following fields
        delete req.body.user_id;
        delete req.body.create_date;
        delete req.body.group_id;
        for(var k in req.body) project[k] = req.body[k];

        logger.debug("update existing group on auth service");
        logger.debug(req.body.admins);
        logger.debug(req.body.members);
        request.put({ url: config.auth.api+"/group/"+project.group_id, headers: { authorization: req.headers.authorization }, json: true,
            body: {
                name: req.body.name,
                desc: "For project "+project._id,
                admins: req.body.admins,
                members: req.body.members,
                guests: req.body.guests,
                agreemenets: req.body.agreements,
            }
        }, (err, _res, group)=>{
            if(err) return next(err);
            logger.debug("done updating group");
            project.save((err)=>{
                if(err) return next(err);
                common.publish("project.update."+req.user.sub+"."+project._id, project)
                res.json(project);
            });
        });
    });
});

/**
 * @apiGroup Project
 * @api {delete} /project/:id   Hide project
 * @apiDescription              Logically remove project by setting "removed" to true
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 */
router.delete('/:id', common.jwt(), function(req, res, next) {
    var id = req.params.id;
    //TODO - prevent user from removing project that's in use..
    db.Projects.findById(req.params.id, function(err, project) {
        if(err) return next(err);
        if(!project) return next(new Error("can't find the project with id:"+req.params.id));
        if(common.isadmin(req.user, project)) {
            project.removed = true;
            project.save(function(err) {
                if(err) return next(err);
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

module.exports = router;

