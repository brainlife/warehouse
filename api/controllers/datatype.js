'use strict';

//contrib
const express = require('express');
const router = express.Router();
const winston = require('winston');
const jwt = require('express-jwt');
const async = require('async');
const request = require('request');
const fs = require('fs');

//mine
const config = require('../config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../models');
const common = require('../common');

/**
 * @apiGroup Datatype
 * @api {get} /datatype         Query Datatype
 * @apiDescription              Returns all datatypes that matches user query
 *
 * @apiParam {Object} [find]    Optional Mongo query to perform (you need to JSON.stringify)
 * @apiParam {Object} [sort]    Mongo sort object - defaults to _id. Enter in string format like "-name%20desc"
 * @apiParam {String} [select]  Fields to load - multiple fields can be entered with %20 as delimiter
 * @apiParam {Number} [limit]   Maximum number of records to return - defaults to 100
 * @apiParam {Number} [skip]    Record offset for pagination (default to 0)
 * 
 * @apiHeader {String} authorization A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         List of datatypes (maybe limited / skipped) and total count
 */
router.get('/', jwt({secret: config.express.pubkey, credentialsRequired: false}), (req, res, next)=>{
    var find = {};
	var skip = req.query.skip || 0;
	var limit = req.query.limit || 100;
    if(req.query.find) find = JSON.parse(req.query.find);
    db.Datatypes.find(find)
    .select(req.query.select)
    .populate('uis') //why?
    .limit(+limit)
    .skip(+skip)
    .sort(req.query.sort || '_id')
    .exec((err, datatypes)=>{
        if(err) return next(err);
        db.Datatypes.countDocuments(find).exec((err, count)=>{
            if(err) return next(err);
            res.json({datatypes: datatypes, count: count});
        });
    });
});

//get all uis registered
router.get('/ui', jwt({secret: config.express.pubkey, credentialsRequired: false}), (req, res, next)=>{
    db.UIs.find({})
    .lean()
    .exec((err, uis)=>{
        if(err) return next(err);
        res.json({uis, count: uis.length});
    });
});

/**
 * @apiGroup Datatype
 * @api {post} /datatype        Post Datatype
 * @apiDescription              Register new datatype
 *
 * @apiParam {String} name      Name of datatype (neuro/anat/t1w, etc..)
 * @apiParam {String} desc      Description for this datatype
 * @apiParam {String} [readme]  Markdown content describing this datatype
 *
 * @apiParam {String[]} admins  Admins who can update this datatype
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Datatype registered
 */
router.post('/', jwt({secret: config.express.pubkey}), function(req, res, next) {

    delete req.body._id; //shouldn't be set
    //req.body.user_id = req.user.sub; 

    //TODO - I should make sure req.user.sub is listed in admin?
    //TODO - should I validate admins/members? how?

    //only warehouse admin can register datatype for now..
    if(!req.user.scopes.warehouse || !~req.user.scopes.warehouse.indexOf('datatype.create')) return res.status(401).end("only user with datatype.create role can register datatype for now");

    let datatype = new db.Datatypes(req.body);
    datatype.save(err=>{
        if (err) return next(err); 
        //datatype = JSON.parse(JSON.stringify(datatype));
        res.json(datatype);
    });
});

/**
 * @apiGroup Datatype
 * @api {put} /datatype/:id
 * @apiDescription              Update datatype
 *
 * @apiParam {String} name      Name of datatype (neuro/anat/t1w, etc..)
 * @apiParam {String} desc      Description for this datatype
 * @apiParam {String} [readme]  Markdown content describing this datatype
 *
 * @apiParam {String[]} admins  List of admins (auth sub) who can update this datatype
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Datatype updated
 */
router.put('/:id', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    var id = req.params.id;
    db.Datatypes.findById(id, (err, datatype)=>{
        if(err) return next(err);
        if(!datatype) return res.status(404).end();
        if(!common.isadmin(req.user, datatype)) return res.status(401).end("you are not an administartor of this datatype");
        
        //user can't update following fields
        //delete req.body.user_id;
        //delete req.body.group_id;
        delete req.body.create_date;
        for(var k in req.body) datatype[k] = req.body[k];

        datatype.save(err=>{
            if(err) return next(err);
            res.json(datatype);
        });
    });
});

module.exports = router;
