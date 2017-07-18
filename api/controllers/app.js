'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
const winston = require('winston');

const config = require('../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');

function canedit(user, rec) {
    if(user) {
        if(user.scopes.warehouse && ~user.scopes.warehouse.indexOf('admin')) return true;
        if(rec.admins && ~rec.admins.indexOf(user.sub.toString())) return true;
    }
    return false;
}

/**
 * @apiGroup App
 * @api {post} /app/:id/rate    Rate app
 * @apiDescription              Rate app in 1-5 scale with given app id
 *
 * @apiParam {Number} rate      1-5
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Number}         Aggregated rating of the app after this update
 */
router.post('/:id/rate', jwt({secret: config.express.pubkey}), function(req, res, next) {
    //first, find the app
    db.Apps.findById(req.params.id, function(err, app) {
        if (err) return next(err); 
        if(!app) return next(new Error("can't find the app with id:"+req.params.id));

        //then upsert new rate 
        db.Apprates.findOneAndUpdate({app: req.params.id, user_id: req.user.sub}, {
            app: req.params.id,
            user_id: req.user.sub,
            rate: req.body.rate,
        }, {upsert:true}, function(err, rate){
            if (err) return next(err);

            //aggregate rate from all users
            db.Apprates.aggregate([
                { $match: { app: app._id }},
                { $group: {
                    _id: "$app",
                    avgRate: {$avg: "$rate" }
                }}
            ]).exec((err, avgret)=>{
                if(err) return next(err);

                //update the app._rate
                app._rate = avgret[0].avgRate;
                app.save();
                //console.log("new _rate", app._rate);

                res.json({_rate: app._rate});
            });
        });
    });
});    
/**
 * @apiGroup App
 * @api {get} /app              Query apps
 * @apiDescription              Query registered apps
 *
 * @apiParam {Object} [find]    Optional Mongo find query - defaults to {}
 * @apiParam {Object} [sort]    Optional Mongo sort object - defaults to {}
 * @apiParam {String} [select]  Fields to load - multiple fields can be entered with %20 as delimiter
 * @apiParam {String} [populate] Relational fields to populate
 * @apiParam {Number} [limit]   Optional Maximum number of records to return - defaults to 0(no limit)
 * @apiParam {Number} [skip]    Optional Record offset for pagination
 *
 * @apiHeader {String} [authorization]
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         List of apps (maybe limited / skipped) and total count
 */
router.get('/', jwt({secret: config.express.pubkey, credentialsRequired: false}), (req, res, next)=>{
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);

    db.Apps.find(find)
    .select(req.query.select)
    .limit(req.query.limit || 0)
    .skip(req.query.skip || 0)
    .sort(req.query.sort || '_id')
    //.populate('inputs.datatype outputs.datatype')
    .populate(req.query.populate || '')
    .lean()
    .exec((err, recs)=>{
        if(err) return next(err);
        db.Apps.count(find).exec((err, count)=>{
            if(err) return next(err);
            //adding some derivatives
            if(req.user) recs.forEach(function(rec) {
                rec._canedit = canedit(req.user, rec);
            });
            res.json({apps: recs, count: count});
        });
    });
});

/**
 * @apiGroup App
 * @api {post} /app             Post App
 * @apiDescription              Register new app (don't set id to null)
 *
 * @apiParam {String} [name]    User friendly name for this app
 * @apiParam {String} [desc]    Description for this app
 * @apiParam {String[]} [tags]  List of tags to classify this app
 * @apiParam {String} [avatar]  URL for application avatar
 * @apiParam {String} [github]  github id/name for this app
 * @apiParam {Number} [retry]   Number of time this app should be retried (0 by default)
 * @apiParam {Object[]} [inputs]    Input datatypes. Array of {id, datatype, datatype_tags[]}
 * @apiParam {Object[]} [outputs]   Output datatypes. same as input datatype
 *
 * @apiParam {String} [github]   Github org/name
 * @apiParam {String} [github_branch]   Github default branch/tag name
 *
 * @apiParam {Object} [config]   configuration template
 *
 * @apiParam {String} [dockerhub]   Dockerhub id/name
 *
 * @apiParam {String[]} admins  Admin IDs
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         App registered
 */
router.post('/', jwt({secret: config.express.pubkey}), function(req, res, next) {
    req.body.user_id = req.user.sub;//override
    var app = new db.Apps(req.body);
    app.save(function(err, _app) {
        if (err) return next(err); 
        app = JSON.parse(JSON.stringify(_app));
        app._canedit = canedit(req.user, app);
        res.json(app);
    });
});

/**
 * @apiGroup App
 * @api {put} /app/:id          Update App
 *                              
 * @apiDescription              Update App
 *
 * @apiParam {String} [name]    User friendly name for this container 
 * @apiParam {String} [desc]    Description for this dataset 
 * @apiParam {String[]} [tags]  List of tags to classify this app
 * @apiParam {String} [avatar]  URL for application avatar
 * @apiParam {String} [github]  github id/name for this app
 * @apiParam {Object[]} [inputs]    Input datatypes and tags
 * @apiParam {Object[]} [outputs]   Output datatypes and tags
 * @apiParam {String} [dockerhub]  
 *
 * @apiParam {String[]} [admins]  List of admins (auth sub)
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Updated App
 */
router.put('/:id', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    var id = req.params.id;
    db.Apps.findById(id, (err, app)=>{
        if(err) return next(err);
        if(!app) return res.status(404).end();

        if(canedit(req.user, app)) {
            //user can't update some fields
            delete req.body.user_id;
            delete req.body.create_date;
            for(var k in req.body) app[k] = req.body[k];
            app.save((err)=>{
                if(err) return next(err);
                app = JSON.parse(JSON.stringify(app));
                app._canedit = canedit(req.user, app);
                res.json(app);
            });
        } else return res.status(401).end("you are not administartor of this app");
    });
});

/**
 * @apiGroup App
 * @api {delete} /app/:id
 *                              Remove registered app (only by the user registered it)
 * @apiDescription              Mark the application as removed
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 */
router.delete('/:id', jwt({secret: config.express.pubkey}), function(req, res, next) {
    var id = req.params.id;
    //TODO - prevent user from removing app that's in use..
    db.Apps.findById(req.params.id, function(err, app) {
        if(err) return next(err);
        if(!app) return next(new Error("can't find the app with id:"+req.params.id));
        if(canedit(req.user, app)) {
            /*physically remove
            app.remove().then(function() {
                res.json({status: "ok"});
            }); 
            */
            app.removed = true;
            app.save(function(err) {
                if(err) return next(err);
                res.json({status: "ok"});
            }); 
        } else return res.status(401).end();
    });
});

/**
 * @apiGroup Dataset
 * @api {get} /app/bibtex/:id   Download BibTex JSON for BrainLife Application
 * @apiDescription              Output BibTex JSON content for specified application ID
 *
 */
router.get('/bibtex/:id', (req, res, next)=>{
    db.Apps.findById(req.params.id, function(err, app) {
        if(err) return next(err);
        res.set('Content-Type', 'application/x-bibtex');
        res.write("@misc{https://brain-life.org/warehouse/#/app/"+app._id+",\n")
        //res.write(" doi = {11.1111/b.ds."+app._id+"},\n");
        res.write(" author = {Hayashi, Soichi},\n");
        res.write(" keywords = {},\n");
        res.write(" title = {brainlife application "+app._id+"},\n");
        res.write(" publisher = {BrainLife},\n");
        res.write(" year = {"+(app.create_date.getYear()+1900)+"},\n");
        res.write("}");
        res.end();
    });
});

module.exports = router;

