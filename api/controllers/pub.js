'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
const winston = require('winston');
const async = require('async');
const request = require('request');

const config = require('../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');
const common = require('../common');
const mongoose = require('mongoose');

//check if user can publish this project
function can_publish(req, project_id, cb) {
    //TODO - why does this exist?
    if(typeof project_id === 'string') project_id = mongoose.Types.ObjectId(project_id);
    
    //check user has access to the project
    common.getprojects(req.user, function(err, canread_project_ids, canwrite_project_ids) {
        if(err) return cb(err);
        let found = canwrite_project_ids.find(id=>id.equals(project_id));
        cb(null, found);
    });
}

/**
 * @apiGroup Publications
 * @api {get} /pub              Query registered publications (public)
 *
 * @apiParam {Object} [find]    Optional Mongo find query - defaults to {}
 * @apiParam {Object} [sort]    Optional Mongo sort object - defaults to {}
 * @apiParam {String} [select]  Fields to load - multiple fields can be entered with %20 as delimiter
 * @apiParam {String} [populate] Relational fields to populate
 * @apiParam {Number} [limit]   Optional Maximum number of records to return - defaults to 0(no limit)
 * @apiParam {Boolean} [deref_contacts]  
 *                              Authors/ contributors are populated with (auth profile)
 * @apiParam {Number} [skip]    Optional Record offset for pagination
 *
 * @apiSuccess {Object}         List of publications (maybe limited / skipped) and total count. 
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
            if(req.query.deref_contacts) pubs.forEach(pub=>{
                pub.authors = pub.authors.map(common.deref_contact);
                pub.contributors = pub.contributors.map(common.deref_contact);
            });
            /*
            if(req.user) pubs.forEach(pub=>{
                pub._canedit = ..
            });
            */
            res.json({pubs, count});
        });
    });
});

/**
 * @apiGroup Publications
 * @api {get} /pub/datasets-inventory/:pubid Get counts of unique subject/datatype/datatype_tags. You can then use /pub/datasets/:pubid to 
 *              get the actual list of datasets for each subject / datatypes / etc..
 * @apiSuccess {Object} Object containing counts
 */
//WARNING: similar code in dataset.js
router.get('/datasets-inventory/:pubid', (req, res, next)=>{
    db.Datasets.aggregate()
    .match({ publications: mongoose.Types.ObjectId(req.params.pubid) })
    .group({_id: {"subject": "$meta.subject", "datatype": "$datatype", "datatype_tags": "$datatype_tags"}, 
        count: {$sum: 1}, size: {$sum: "$size"} })
    .sort({"_id.subject":1})
    .exec((err, stats)=>{
        if(err) return next(err);
        res.json(stats);
    });
});

/**
 * @apiGroup Publications
 * @api {get} /pub/apps/:pubid
 *                              Enumerate applications used to generate datasets
 *
 * @apiSuccess {Object[]}       Application objects
 * 
 */
router.get('/apps/:pubid', (req, res, next)=>{
    /*
    db.Datasets.find({
        publications: mongoose.Types.ObjectId(req.params.pubid) 
    })
    .distinct("prov.task.config._app")
    */
    db.Datasets.aggregate([
        {$match: {
            publications: mongoose.Types.ObjectId(req.params.pubid) 
        }},
        {$group: {
            _id: {
                app: "$prov.task.config._app",
                service: "$prov.task.service",
                service_branch: "$prov.task.service_branch",
            }
        }},

        //cleanup result
        {$project: {
            _id: 0, 
            app: "$_id.app", 
            service: "$_id.service",
            service_branch: "$_id.service_branch",
        }},

        /* doesn't work..
        {$lookup: {
            from: "app",
            localField: "app",
            foreignField: "_id",
            as: "appp",
        }},
        */
    ])
    .exec((err, recs)=>{
        if(err) return next(err);
        
        //now populate apps
        let app_ids = [];
        recs.forEach(rec=>{ if(rec.app) app_ids.push(rec.app);});

        db.Apps.find({
            _id: {$in: app_ids},
            projects: [], //only show *public* apps
        })
        .populate(req.query.populate || '')
        .exec((err, apps)=>{
            if(err) return next(err);

            //make it easier to lookup apps
            let app_obj = {};
            apps.forEach(app=>{
                app_obj[app._id] = app;
            });

            //populate on recs
            let populated = [];
            recs.forEach(rec=>{
                if(rec.app) {
                    rec.app = app_obj[rec.app];
                    populated.push(rec);
                }
            });
            res.json(populated);
        });
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


/**
 * @apiGroup Publications
 * @api {post} /pub                     Register new publication
 * @apiDescription                      Create new publication record. You have to register datasets via another API
 *
 * @apiParam {String} project           Project ID associated with this publication
 * @apiParam {String} license           License used for this publication
 * @apiParam {Object[]} fundings        Array of {funder, id}
 *
 * @apiParam {String[]} authors         List of author IDs.
 * @apiParam {String[]} contributors    List of contributor IDs.
 *
 * @apiParam {String} name              Publication title 
 * @apiParam {String} desc              Publication desc (short summary)
 * @apiParam {String} readme            Publication detail (paper abstract)
 * @apiParam {String[]} tags            Publication tags
 *
 * @apiParam {Boolean} removed          If this is a removed publication
 *
 * @apiHeader {String} authorization    A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}                 Publication record created
 *                              
 */
router.post('/', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    if(!req.body.project) return next("project id not set");
    if(!req.body.license) return next("license not set");
    if(!req.body.name) return next("name not set");
    //TODO validate input?

    can_publish(req, req.body.project, (err, can)=>{
        if(err) return next(err);
        if(!can) return res.status(401).end("you can't publish this project");
        let def = {
            tags: [],
        }
        let override = {
            user_id: req.user.sub, 
        }
        //new db.Publications(Object.assign(def, req.body, override)).save((err, pub)=>{
        let pub = new db.Publications(Object.assign(def, req.body, override));

        //mint new doi - get next doi id - use number of publication record with doi (brittle?)
        db.Publications.count({doi: {$exists: true}}).exec((err, count)=>{
            if(err) return next(err);
            let doi = config.datacite.prefix+"pub."+count; //TODO - should make the "shoulder" configurable?
            pub.doi = doi;
            pub.save(err=>{
                if(err) return next(err);

                //return to the caller
                res.json(pub);

                //now post metadata and set url
                let metadata = common.compose_pub_datacite_metadata(pub);
                common.doi_post_metadata(metadata, err=>{
                    if(err) return next(err);
                    //then attach url to it (to "mint" it!)
                    let url = config.warehouse.url+"/pub/"+pub._id;  //TODO make it configurable?
                    common.doi_put_url(pub.doi, url, logger.error);
                });
            }); 
        });
    });
});

/**
 * @apiGroup Publications
 * @api {put} /pub/:pubid          Update Publication
 *                              
 * @apiDescription              Update Publication
 *
 * @apiParam {String} license           License used for this publication
 * @apiParam {Object[]} fundings        Array of {funder, id}
 *
 * @apiParam {String[]} authors         List of author IDs.
 * @apiParam {String[]} contributors    List of contributor IDs.
 *
 * @apiParam {String} name              Publication title 
 * @apiParam {String} desc              Publication desc (short summary)
 * @apiParam {String} readme            Publication detail (paper abstract)
 * @apiParam {String[]} tags            Publication tags
 *
 * @apiParam {Boolean} removed          If this is a removed publication
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Updated Publication
 */
router.put('/:id', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    var id = req.params.id;
    db.Publications.findById(id, (err, pub)=>{
        if(err) return next(err);
        if(!pub) return res.status(404).end();
        
        can_publish(req, pub.project, (err, can)=>{
            if(err) return next(err);
            if(!can) return res.status(401).end("you can't publish this project");

            //TODO - should I check to see if the user is listed as author?

            //disallow user from making changes to protected fields
            delete req.body.user_id;
            delete req.body.project;
            delete req.body.doi;
            delete req.body.create_date;
            //delete req.body.removed; //let's secretly allow removal for now..

            //update pub record
            for(let k in req.body) pub[k] = req.body[k];
            pub.save((err, pub)=>{
                if(err) return next(err);
                res.json(pub); 

                if(pub.doi) { //old test pubs doesn't have doi
                    let metadata = common.compose_pub_datacite_metadata(pub);
                    common.doi_post_metadata(metadata, logger.error); 
                }
            });
        });
    });
});

/**
 * @apiGroup Publications
 * @api {put} /pub/:pubid/datasets 
 *                              
 * @apiDescription                      Publish datasets
 *
 * @apiParam {Object} [find]            Mongo query to subset datasets (all datasets in the project by default)
 *
 * @apiHeader {String} authorization    A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}                 Number of published datasets, etc..
 */
router.put('/:id/datasets', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    var id = req.params.id;
    db.Publications.findById(id, (err, pub)=>{
        if(err) return next(err);
        if(!pub) return res.status(404).end();
        
        can_publish(req, pub.project, (err, can)=>{
            if(err) return next(err);
            if(!can) return res.status(401).end("you can't publish this project");

            let find = {};
            if(req.body.find) find = JSON.parse(req.body.find);

            //override to make sure user only publishes datasets from specific project
            find.project = pub.project;
            find.removed = false; //no point of publishing removed dataset right?

            db.Datasets.update(
                find,
                {$addToSet: {publications: pub._id}}, 
                {multi: true},
            (err, _res)=>{
                if(err) return next(err);
                res.json(_res);
            });
        });
    });
}); 

/**
 * @apiGroup Publications
 * @api {put} /pub/:pubid/doi
 *                              
 * @apiDescription                      Issue DOI for publication record (or update URL)
 *
 * @apiParam {String} url               URL to associate the minted DOI
 *
 * @apiHeader {String} authorization    A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}                 Publication object with doi field
 */
/*
router.put('/:id/doi', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    let id = req.params.id;
    let url = req.body.url;
    //logger.debug(id, url);

    //TODO - maybe we shouldn't let user control the url?

    db.Publications.findById(id, (err, pub)=>{
        if(err) return next(err);
        if(!pub) return res.status(404).end();
        if(pub.doi) return res.status(404).end("doi already issued");
        
        can_publish(req, pub.project, (err, can)=>{
            if(err) return next(err);
            if(!can) return res.status(401).end("you can't publish on this project");

            //register metadata and attach url to it
            common.doi_post_metadata(pub, (err, doi)=>{
                if(err) return next(err);
                //let url = "https://brainlife.io/pub/"+pub._id; 
                logger.debug("making request", doi, url);
                common.doi_put_url(doi, url, err=>{
                    if(err) return next(err);
                    res.json(pub);
                });
            });
        });
    });
}); 
*/

//proxy doi.org doi resolver
router.get('/doi', (req, res, next)=>{
    logger.debug("querying doi", req.query.doi);
    request({
        url: "https://doi.org/"+req.query.doi, //TODO validate!
        headers: {
            //Accept: "text/x-bibliography; style=harvard3",
            //Accept: "application/x-bibtex",
            accept: req.query.accept,
        }
    }, (err, _res, body)=>{
        if(err) return next(err);
        res.status(_res.statusCode).send(body);
    });
});

module.exports = router;

