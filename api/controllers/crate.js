'use strict';

//contrib
const express = require('express');
const router = express.Router();
const winston = require('winston');
const jwt = require('express-jwt');
//const async = require('async');

//mine
const config = require('../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');
//const common = require('../common');

/**
 * @apiGroup Crate
 * @api {get} /crate            Query Crates 
 * @apiDescription              Returns all crates belongs to a user
 *
 * @apiParam {Object} [find]    Optional Mongo query to perform (you need to JSON.stringify)
 * @apiParam {Object} [sort]    Mongo sort object - defaults to _id. Enter in string format like "-name%20desc"
 * @apiParam {String} [select]  Fields to load - multiple fields can be entered with %20 as delimiter
 * @apiParam {Number} [limit]   Maximum number of records to return - defaults to 100
 * @apiParam {Number} [skip]    Record offset for pagination (default to 0)
 * 
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         List of crate (maybe limited / skipped) and total count
 */
router.get('/', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);

    /*
    //handling user_id.
    if(!req.user.scopes.sca || !~req.user.scopes.sca.indexOf("admin") || find.user_id === undefined) {
        //non admin, or admin didn't set user_id
        find.user_id = req.user.sub;
    } else if(find.user_id == null) {
        //admin can set it to null and remove user_id filtering all together
        delete find.user_id;
    }
    */

    db.Crate.find(find)
    .select(req.query.select)
    .limit(req.query.limit || 100)
    .skip(req.query.skip || 0)
    .sort(req.query.sort || '_id')
    .exec((err, crates)=>{
        if(err) return next(err);
        db.Crate.count(find).exec((err, count)=>{
            if(err) return next(err);
            res.json({crates: crates, count: count});
        });
    });
});

/**
 * @apiGroup Crate
 * @api {post} /crate                   Create new crate
 * @apiDescription                      Make a request to create a new crate from wf service workdir
 *
 * @apiParam {String} instance_id       WF service Instance ID to create the crate from
 * @apiParam {String} project_id        Project used to store this crate under
 * @apiParam {String} [name]            Name for this crate
 * @apiParam {String} [desc]            Description for this crate
 *
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}                 Crate created
 *                              
 */
router.post('/', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    //query the instance (relay jwt from user) 

    //query tasks under the instance and figure out which resources they are in

    //create new crate record (get id)
    
    //decide which storage system to store this crate in (based on where each tasks are?)

    //download each task dir(.tar.gz) (from wf service - relay user.jwt) and stream it to target storage system
    
});

