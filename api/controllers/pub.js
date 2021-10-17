'use strict';

const express = require('express');
const router = express.Router();
const winston = require('winston');
const async = require('async');
const request = require('request');

const config = require('../config');
const logger = winston.createLogger(config.logger.winston);
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
    if(req.query.find) {
        find = JSON.parse(req.query.find);
    }
    db.Publications.find(find)
    .populate(req.query.populate || '') //all by default
    .select(req.query.select)
    .limit(+limit)
    .skip(+skip)
    .sort(req.query.sort || '_id')
    .lean()
    .exec((err, pubs)=>{
        if(err) return next(err);
        db.Publications.countDocuments(find).exec((err, count)=>{
            if(err) return next(err);

            //dereference user ID to name/email
            if(req.query.deref_contacts) pubs.forEach(pub=>{
                pub.authors = pub.authors.map(common.deref_contact).filter(c=>!!c);
                pub.contributors = pub.contributors.map(common.deref_contact).filter(c=>!!c);
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
 * @apiGroup Publication
 * @api {get} /pub/query
 * @apiDescription                 Query publications based on search query (public)
 * 
 * @apiParam {String} q            Query used to search for publications
 * @apiParam {String} [select]     Fields to load - multiple fields can be entered with %20 as delimiter
 *
 * @apiHeader {String} [authorization]  
 *                                 A valid JWT token "Bearer : xxxxx"
 * 
 * @apiSuccess {Object}            Project record registered 
 */

router.get('/query',common.jwt({credentialsRequired: false}),(req, res, next)=> {
    let find = {};
    let skip = req.query.skip || 0;
    let limit = req.query.limit || 100;
    if(req.query.find) {
        find = JSON.parse(req.query.find);
    }
    let select = "";
    if(req.query.select) select = req.query.select;

    select += "name desc releases -readme";
    db.Publications.find(find)
    .populate(req.query.populate || '') //all by default
    .select(req.query.select)
    .limit(+limit)
    .skip(+skip)
    .sort(req.query.sort || '_id')
    .lean()
    .exec((err, pubs)=> {
        if(err) return next(err);
        db.Publications.countDocuments(find).exec((err, count)=>{
            if(err) return next(err);

            if(!req.query.q) return res.json({pubs, count});
            const queryTokens = req.query.q.toLowerCase().split(" ");
            
            pubs.forEach(pub => {
                let tokens = [
                    pub.name,
                    pub.desc,
                    pub.doi,
                    pub.license,
                    ...pub.tags,
                ];
                
                if(pub.authors) pub.authors.map(common.deref_contact).forEach(addContactTokens);
                if(pub.contributors) pub.contributors.map(common.deref_contact).forEach(addContactTokens);
            
                function addContactTokens(c) {
                    if(!c) return;
                    tokens.push(c.fullname);
                    tokens.push(c.username);
                    tokens.push(c.email);
                }
                tokens = tokens.filter(thing=>!!thing).join(" ").toLowerCase();
                pub._tokens = tokens.join(" ");
            });

            const filtered = pubs.filter(pub=>{
                let match = true;
                queryTokens.forEach(token=>{
                    if(!match) return;
                    if(!pub._tokens.includes(token)) match = false;
                });
                return match;
            });
            //remove _tokens from the pubs to reduce returning weight a bit
            filtered.forEach(pub=>{ delete pubs._tokens; });
            res.json({filtered, "count" : filtered.length});

            //dereference user ID to name/email
            // if(req.query.deref_contacts) pubs.forEach(pub=>{
            //     pub.authors = pub.authors.map(common.deref_contact).filter(c=>!!c);
            //     pub.contributors = pub.contributors.map(common.deref_contact).filter(c=>!!c);
            // });


            /*
            if(req.user) pubs.forEach(pub=>{
                pub._canedit = ..
            });
            */
            // res.json({pubs, count});
        });
    });
});

/**
 * @apiGroup Publications
 * @api {get} /pub/datasets/:releaseid  
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
router.get('/datasets/:releaseid', (req, res, next)=>{
    let find = {};
    let skip = req.query.skip || 0;
    let limit = req.query.limit || 100;
    if(req.query.find) find = JSON.parse(req.query.find);
    let query = {$and: [ find, {publications: req.params.releaseid}]};
    db.Datasets.find(query)
    .populate(req.query.populate || '') //all by default
    .select(req.query.select)
    .limit(+limit)
    .skip(+skip)
    .sort(req.query.sort || '_id')
    .lean()
    .exec((err, datasets)=>{
        if(err) return next(err);
        db.Datasets.countDocuments(query).exec((err, count)=>{
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
 * @apiParam {Object[]} releases        Release records
 *
 * @apiParam {Boolean} removed          If this is a removed publication
 *
 * @apiHeader {String} authorization    A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}                 Publication record created
 *                              
 */
router.post('/', common.jwt(), (req, res, next)=>{
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
        let pub = new db.Publications(Object.assign(def, req.body, override));

        //mint new doi - get next doi id - use number of publication record with doi (brittle?)
        db.Publications.countDocuments({doi: {$exists: true}}).exec((err, count)=>{
            if(err) return next(err);
            let doi = config.datacite.prefix+"pub."+count; //TODO - should make the "shoulder" configurable?
            pub.doi = doi;
            pub.save(err=>{
                if(err) return next(err);
                //return to the caller already
                res.json(pub);

                //post metadata to datacite and set url
                let metadata = common.compose_pub_datacite_metadata(pub);
                common.doi_post_metadata(metadata, err=>{
                    if(err) return next(err);
                    //then attach url to it (to "mint" it!)
                    let url = config.warehouse.url+"/pub/"+pub._id;  //TODO make it configurable?
                    common.doi_put_url(pub.doi, url, err=>{
                        if(err) console.error(err);
                    });
                });
                
                //handle data/ga release
                async.eachSeries(pub.releases, (release, next_release)=>{
                    doRelease(release, pub.project, err=>{
                        if(err) return next_release(err);
                        updateReleaseInfo(pub, release, next_release);
                    });
                }, err=>{
                    if(err) console.error(err);
                    console.log("done processing releases - resaving releases - we've added some cache");
                    pub.markModified('releases');
                    pub.save();
                });
           }); 
        });
    });
});

function updateReleaseInfo(pub, release, cb) {
    async.series([
        next=>{
            //list apps used to produce this release
            common.aggregateDatasetsByApps({
                publications: release._id,
            }).then(apps=>{
                release.apps = apps;
                next();
            });
        },

        next=>{
            //count number of subjects for this release (TODO - and sessions?)
            db.Datasets.find({publications: release._id}).distinct('meta.subject').exec((err, subjects)=>{
                if(err) return next(err);
                release.subjects = subjects.length;
                next();
            });
        },

        next=>{
            //count number of subjects for this release (TODO - and sessions?)
            db.Datasets.find({publications: release._id}).distinct('meta.session').exec((err, sessions)=>{
                if(err) return next(err);
                console.log("number of sessions", sessions.length);
                release.sessions = sessions.length;
                next();
            });
        },
    ], cb)
}

/**
 * @apiGroup Publications
 * @api {put} /pub/:pubid               Update Publication
 *                              
 * @apiDescription                      Update Publication
 *
 * @apiParam {String} license           License used for this publication
 * @apiParam {Object[]} fundings        Array of {funder, id}
 *
 * @apiParam {String[]} authors         List of author IDs.
 * @apiParam {String[]} contributors    List of contributor IDs.
 * @apiParam {Object[]} releases        Release records
 *
 * @apiParam {String} name              Publication title 
 * @apiParam {String} desc              Publication desc (short summary)
 * @apiParam {String} readme            Publication detail (paper abstract)
 * @apiParam {String[]} tags            Publication tags
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 *
 * @apiSuccess {Object}         Updated Publication
 */
router.put('/:id', common.jwt(), (req, res, next)=>{
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
            delete req.body.__v; //could cause VersionError
            //delete req.body.removed; //let's secretly allow removal for now..

            //update pub record to make sure all new releases has id
            for(let k in req.body) pub[k] = req.body[k];
            pub.save((err, pub)=>{
                if(err) return next(err);
                res.json(pub); 
                
                //update doi metadata to datacite (TODO - why could doi not be set?)
                if(pub.doi) {
                    let metadata = common.compose_pub_datacite_metadata(pub);
                    common.doi_post_metadata(metadata, err=>{
                        if(err) console.error(err);
                    });
                }

                /*
                //I have to use req.body.releases which has "sets", but not release._id
                //so let's set release._id on req.body.releases and use that list to 
                //handle new publications
                req.body.releases.forEach((release, idx)=>{
                    release._id = pub.releases[idx]._id;
                });
                */
                //async.eachOfSeries(req.body.releases, (release, idx, next_release)=>{

                //handle data/ga release
                async.eachSeries(pub.releases, (release, next_release)=>{
                    doRelease(release, pub.project, err=>{
                        if(err) return next_release(err);
                        updateReleaseInfo(pub, release, next_release);
                    });
                }, err=>{
                    if(err) console.error(err);
                    console.log("resaving releases - we've added some cache");
                    pub.markModified('releases');
                    pub.save();
                });
            });

        });
    });
});

function doRelease(release, project, cb) {

    //publish all new release sets
    async.eachSeries(release.sets, (set, next_set)=>{
        let find = {
            project,
            removed: false,
            datatype: set.datatype._id,
        };
        if(set.datatype_tags.length > 0) {
            find.datatype_tags = {$all: set.datatype_tags};
        }
        if(set.subjects.length > 0) {
            find["meta.subject"] = {$in: set.subjects};
        }
        if(set.tags && set.tags.length > 0) {
            let all = [];
            let nin = [];
            set.tags.forEach(tag=>{ 
                if(tag[0] == "!") {
                    nin.push(tag.substring(1));
                } else {
                    all.push(tag);
                }
            });
            find.tags = {};
            if(all.length > 0) find.tags["$all"] = all;
            if(nin.length > 0) find.tags["$nin"] = nin;
        }

        db.Datasets.update(find, {$addToSet: {publications: release._id}}, {multi: true}, next_set);
    }, err=>{
        if(err) return cb(err);
        
        //also publish group analysis archives
        async.eachSeries(release.gaarchives, (ga, next_ga)=>{
            if(!ga.dataset_id) return next_ga(); //for dev
            console.log("publishing ga archive dataset", ga);
            db.Datasets.findByIdAndUpdate(ga.dataset_id, 
                {$addToSet: {publications: release._id}}, 
                next_ga);
        }, cb);
    });
}

//proxy doi.org doi resolver
//TODO - why does this exist? should let client directly access it?
router.get('/doi', (req, res, next)=>{
    logger.debug("querying doi: %s", req.query.doi);
    if(req.query.doi.includes("bldev")) {
        return res.send(req.query.doi+" can not be resolved (it's dev)");
    }

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

