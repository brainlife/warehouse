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
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');

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
	
	if (req.query.distinct) {
        var sortObj = {};
        sortObj.$sort = JSON.parse(req.query.sort || JSON.stringify({ '_id': 1 }));
		db.Datatypes
        .aggregate([sortObj, { $group: { _id: req.query.distinct } }, { $skip: +skip }, { $limit: +limit }], function(err, results) {
        	if (err) next(err);
            res.json(results)
        })
        return;
    }	

    db.Datatypes.find(find)
    .select(req.query.select)
    .limit(+limit)
    .skip(+skip)
    .sort(req.query.sort || '_id')
    .exec((err, datatypes)=>{
        if(err) return next(err);
        db.Datatypes.count(find).exec((err, count)=>{
            if(err) return next(err);
            res.json({datatypes: datatypes, count: count});
        });
    });
});

module.exports = router;
