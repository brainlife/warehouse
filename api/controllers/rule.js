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
 * @apiGroup Pipeline Rules
 * @api {get} /rule             Query pipeline rules
 *
 * @apiParam {Object} [find]    Optional Mongo find query - defaults to {}
 * @apiParam {Object} [sort]    Optional Mongo sort object - defaults to {}
 * @apiParam {String} [select]  Fields to load - multiple fields can be entered with %20 as delimiter
 * @apiParam {String} [populate] Relational fields to populate
 * @apiParam {Number} [limit]   Optional Maximum number of records to return - defaults to 0(no limit)
 * @apiParam {Number} [skip]    Optional Record offset for pagination
 *
 * @apiSuccess {Object}         List of rules (maybe limited / skipped) and total count
 */
router.get('/', (req, res, next)=>{
    let find = {};
	let skip = req.query.skip || 0;
	let limit = req.query.limit || 100;
    if(req.query.find) find = JSON.parse(req.query.find);
    db.Rules.find(find)
    .populate(req.query.populate || '') //all by default
    .select(req.query.select)
    .limit(+limit)
    .skip(+skip)
    .sort(req.query.sort || '_id')
    .lean()
    .exec((err, rules)=>{
        if(err) return next(err);
        //logger.debug("rule returned");
        //logger.debug(rules);
        db.Datatypes.count(find).exec((err, count)=>{
            if(err) return next(err);

            //dereference user ID to name/email
            /*
            rules.forEach(pub=>{
                pub.authors = pub.authors.map(common.deref_contact);
                pub.contributors = pub.contributors.map(common.deref_contact);
            });
            */
            res.json({rules, count});
        });
    });
});

module.exports = router;

