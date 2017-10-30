'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
const winston = require('winston');
const request = require('request');

const config = require('../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');

function canedit(user, rec) {
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
        if(!~select.indexOf("admins")) select+=" admins";
    }

    //TODO I should only allow querying for projects that user has access?
    //right now, user can query for all project..

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

            //adding some derivatives
            recs.forEach(function(rec) {
                rec._canedit = canedit(req.user, rec);
            });
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
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Project record registered
 */
router.post('/', jwt({secret: config.express.pubkey}), function(req, res, next) {
    req.body.user_id = req.user.sub;//override

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
		project.save(function(err) {
			if (err) return next(err); 
			project = JSON.parse(JSON.stringify(project));
			project._canedit = canedit(req.user, project);
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

        //check access
        //if(project.user_id != req.user.sub && !~project.admins.indexOf(req.user.sub)) {
        if(canedit(req.user, project)) {
            //user can't update some fields
            delete req.body.user_id;
            delete req.body.create_date;
            for(var k in req.body) project[k] = req.body[k];
            project.save((err)=>{
                if(err) return next(err);
                project = JSON.parse(JSON.stringify(project));
				project._canedit = canedit(req.user, project);

                if(project.group_id) {
                    //update group
                    request.put({ url: config.auth.api+"/group/"+project.group_id, headers: { authorization: req.headers.authorization }, json: true,
                        body: {
                            //active: !req.body.removed, //I think I want group to be active even if project is removed
                            desc: req.body.desc,
                            admins: req.body.admins,
                            members: req.body.members,
                        }
                    }, (err, _res, group)=>{
                        if(err) return next(err);
                        res.json(project);
                    });
                } else {
                    //create group (for backward compatibility)
                    request.post({ url: config.auth.api+"/group", headers: { authorization: req.headers.authorization }, json: true,
                        body: {
                            name: new Date().getTime(), //TODO - better name?
                            desc: req.body.desc,
                            admins: req.body.admins,
                            members: req.body.members,
                        }
                    }, (err, _res, group)=>{
                        if(err) return next(err);
                        res.json(project);
                    });
                }
            });
        } else return res.status(401).end("you are not administartor of this project");
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
        //only superadmin or admin of this test spec can update
        if(canedit(req.user, project)) {
            /*
            project.remove().then(function() {
                res.json({status: "ok"});
            }); 
            */
            project.removed = true;
            project.save(function(err) {
                if(err) return next(err);
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

module.exports = router;


