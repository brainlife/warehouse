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
router.get('/', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    let find = {};
	let skip = req.query.skip || 0;
	let limit = req.query.limit || 100;

    //TODO - should I only allow querying rules for public or accessible private project?

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

/**
 * @apiGroup Pipeline Rules
 * @api {delete} /rule/:id
 *                              Set rule's removed flag to true
 * @apiDescription              Logically remove dataset by setting "removed" to true
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 */
router.delete('/:id', jwt({secret: config.express.pubkey}), function(req, res, next) {
    const id = req.params.id;
    db.Rules.findById(id, function(err, rule) {
        if(err) return next(err);
        if(!rule) return next(new Error("can't find the rule with id:"+id));
        
        //check user has access to the project
        common.getprojects(req.user, function(err, canread_project_ids, canwrite_project_ids) {
            if(err) return next(err);
            //console.dir(rule.project);
            let found = canwrite_project_ids.find(id=>id.equals(rule.project));
            if(!found) return next("you are not allowed to edit this rule");
            //rule.remove_date = new Date();
            rule.removed = true;
            rule.save(function(err) {
                if(err) return next(err);
                res.json({status: "ok"});
            }); 
        });
    });
});

module.exports = router;

