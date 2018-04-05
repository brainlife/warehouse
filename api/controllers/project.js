'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
const winston = require('winston');
const request = require('request');

const config = require('../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');

function isadmin(user, rec) {
    if(user) {
        if(user.scopes.warehouse && ~user.scopes.warehouse.indexOf('admin')) return true;
        if(~rec.admins.indexOf(user.sub.toString())) return true;
    }
    return false;
}

/**
 * @apiGroup Project
 * @api {get} /project          Query projects
 * @apiDescription              Query projects registered
 *
 * @apiParam {Object} [find]    Optional Mongo find query - defaults to {}
 * @apiParam {Object} [sort]    Optional Mongo sort object - defaults to {}
 * @apiParam {String} [select]  Fields to load - multiple fields can be entered with %20 as delimiter
 * @apiParam {Number} [limit]   Optional Maximum number of records to return - defaults to 0(no limit)
 * @apiParam {Number} [skip]    Optional Record offset for pagination
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         List of projects (maybe limited / skipped) and total count
 */
router.get('/', jwt({secret: config.express.pubkey, credentialsRequired: false}), (req, res, next)=>{
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);

    //always load user_id so that we can compute canedit properly
    var select = null;
    if(req.query.select) {
        select = req.query.select;
    }

    //only allow querying for public, or private project that user owns
    /*
    find = {$and: [
        find,
        {$or: [
            { members: req.user.sub },
            { admins: req.user.sub },
            { access: "public" },
        ]}
    ]};
    */
    if(req.user) {
        //user can see all public, protected, or any project that they are member of
        let access_control = {$or: [
            { members: req.user.sub },
            { admins: req.user.sub },
            { access: "public" },
            { access: "protected" },
        ]}
        find = {$and: [ find, access_control]};
    } else {
        find.access = "public"; //guest can only see public projects
    }

    db.Projects.find(find)
    .select(select)
    .limit(req.query.limit || 0)
    .skip(req.query.skip || 0)
    .sort(req.query.sort || '_id')
    .lean()
    .exec((err, recs)=>{
        if(err) return next(err);
        db.Projects.count(find).exec((err, count)=>{
            if(err) return next(err);
            res.json({projects: recs, count: count});
        });
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
router.post('/', jwt({secret: config.express.pubkey}), function(req, res, next) {

    delete req.body._id; //shouldn't be set
    req.body.user_id = req.user.sub;//override

    //TODO - I should make sure req.user.sub is listed in admin?
    //TODO - should I validate admins/members? how?

	//create a new group
	request.post({ url: config.auth.api+"/group", headers: { authorization: req.headers.authorization }, json: true,
		body: {
			name: new Date().getTime(), //TODO - better name?
            desc: req.body.desc,
			admins: req.body.admins,
			members: req.body.members,
		}
	}, (err, _res, group)=>{
		if(err) return next(err);

        //now update the warehouse project
		var project = new db.Projects(req.body);
		project.group_id = group.group.id;
		project.save(err=>{
			if (err) return next(err); 
			project = JSON.parse(JSON.stringify(project));
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
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Project object updated
 */
router.put('/:id', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    var id = req.params.id;
    db.Projects.findById(id, (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();
        if(!isadmin(req.user, project)) return res.status(401).end("you are not an administartor of this project");
        
        //user can't update following fields
        delete req.body.user_id;
        delete req.body.create_date;
        delete req.body.group_id;
        for(var k in req.body) project[k] = req.body[k];

        logger.debug("update existing group on auth service");
        request.put({ url: config.auth.api+"/group/"+project.group_id, headers: { authorization: req.headers.authorization }, json: true,
            body: {
                name: req.body.name,
                desc: "For project "+project._id,
                admins: req.body.admins,
                members: req.body.members,
                guests: req.body.guests,
            }
        }, (err, _res, group)=>{
            if(err) return next(err);
            logger.debug("done updating group");
            project.save((err)=>{
                if(err) return next(err);
                /*
                res.json(Object.assign({
                    _canedit: isadmin(req.user, project), //deprecated
                    _isadmin: isadmin(req.user, project),
                    _ismember: ismember(req.user, project),
                }, project));
                */
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
router.delete('/:id', jwt({secret: config.express.pubkey}), function(req, res, next) {
    var id = req.params.id;
    //TODO - prevent user from removing project that's in use..
    db.Projects.findById(req.params.id, function(err, project) {
        if(err) return next(err);
        if(!project) return next(new Error("can't find the project with id:"+req.params.id));
        if(isadmin(req.user, project)) {
            project.removed = true;
            project.save(function(err) {
                if(err) return next(err);
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

module.exports = router;


