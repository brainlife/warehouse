'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
const winston = require('winston');
const async = require('async');

const config = require('../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');
const common = require('../common');
const mongoose = require('mongoose');

/**
 * @apiGroup Publications
 * @api {get} /pub              Query registered publications
 *
 * @apiParam {Object} [find]    Optional Mongo find query - defaults to {}
 * @apiParam {Object} [sort]    Optional Mongo sort object - defaults to {}
 * @apiParam {String} [select]  Fields to load - multiple fields can be entered with %20 as delimiter
 * @apiParam {String} [populate] Relational fields to populate
 * @apiParam {Number} [limit]   Optional Maximum number of records to return - defaults to 0(no limit)
 * @apiParam {Number} [skip]    Optional Record offset for pagination
 *
 * @apiSuccess {Object}         List of publications (maybe limited / skipped) and total count
 */
router.get('/', (req, res, next)=>{
    let find = {};
	let skip = req.query.skip || 0;
	let limit = req.query.limit || 100;
    if(req.query.find) find = JSON.parse(req.query.find);
    db.Publications.find(find)
    .populate(req.query.populate || '') //all by default
    .select(req.query.select)
    .limit(+limit)
    .skip(+skip)
    .sort(req.query.sort || '_id')
    .lean()
    .exec((err, pubs)=>{
        if(err) return next(err);
        db.Datatypes.count(find).exec((err, count)=>{
            if(err) return next(err);

            //dereference user ID to name/email
            pubs.forEach(pub=>{
                pub.authors = pub.authors.map(common.deref_contact);
                pub.contributors = pub.contributors.map(common.deref_contact);
            });
            res.json({pubs: pubs, count: count});
        });
    });
});

/**
 * @apiGroup Publications
 * @api {get} /pub/datasets-inventory/:pubid
 *                              Get counts of unique subject/datatype/datatype_tags. 
 *                              You can then use /pub/datasets/:pubid to get the actual list of
 *                              datasets for each subject / datatypes / etc..
 *
 * @apiSuccess {Object}         Object containing counts
 * 
 */
router.get('/datasets-inventory/:pubid', (req, res, next)=>{
    db.Datasets.aggregate()
    .match({ publications: mongoose.Types.ObjectId(req.params.pubid) })
    .group({_id: {"subject": "$meta.subject", "datatype": "$datatype", "datatype_tags": "$datatype_tags"}, count: {$sum: 1}, size: {$sum: "$size"} })
    .exec((err, stats)=>{
        if(err) return cb(err);
        res.json(stats);
    });
});

/**
 * @apiGroup Publications
 * @api {get} /pub/datasets/:pubid  
 *                              Query published datasets
 *
 * @apiParam {Object} [find]    Optional Mongo find query - defaults to {}
 * @apiParam {Object} [sort]    Optional Mongo sort object - defaults to {}
 * @apiParam {String} [select]  Fields to load - multiple fields can be entered with %20 as delimiter
 * @apiParam {String} [populate] Relational fields to populate
 * @apiParam {Number} [limit]   Optional Maximum number of records to return - defaults to 0(no limit)
 * @apiParam {Number} [skip]    Optional Record offset for pagination
 *
 * @apiSuccess {Object}         List of dataasets (maybe limited / skipped) and total count
 */
router.get('/datasets/:pubid', (req, res, next)=>{
    let find = {};
	let skip = req.query.skip || 0;
	let limit = req.query.limit || 100;
    if(req.query.find) find = JSON.parse(req.query.find);
    let query = {$and: [ find, {publications: req.params.pubid}]};
    db.Datasets.find(query)
    .populate(req.query.populate || '') //all by default
    .select(req.query.select)
    .limit(+limit)
    .skip(+skip)
    .sort(req.query.sort || '_id')
    .lean()
    .exec((err, datasets)=>{
        if(err) return next(err);
        db.Datasets.count(query).exec((err, count)=>{
            if(err) return next(err);
            res.json({datasets, count});
        });
    });
});

module.exports = router;

