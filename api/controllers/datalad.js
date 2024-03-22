'use strict';

const express = require('express');
const router = express.Router();
const async = require('async');

const config = require('../config');
const db = require('../models');
const common = require('../common');

/**
 * @apiGroup Datalad
 * @api {get} /datalad/datasets                              
 * @apiDescription              Query Datalad Datasets
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
router.get('/datasets', common.jwt({credentialsRequired: false}), (req, res, next)=>{
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);
    var skip = req.query.skip||0;
    let limit = req.query.limit||100;

    //always load user_id so that we can compute canedit properly
    var select = null;
    if(req.query.select) select = req.query.select;

    db.DLDatasets.find(find)
    .select(select)
    .skip(+skip)
    .limit(+limit)
    .sort(req.query.sort || '')
    .lean()
    .exec((err, recs)=>{
        if(err) return next(err);
        res.json(recs);
    });
});

/**
 * @apiGroup Datalad
 * @api {post} /datalad/import/:dataset_id
 * @apiDescription              Import dataset
 *
 * @apiParam {String} project   Project ID to import dataset
 * @apiParam {String[]} datatypes  
 *                              Datatype IDs to import
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 */
router.post('/import/:dataset_id', common.jwt(), (req, res, next)=>{
    db.DLDatasets.findById(req.params.dataset_id).exec((err, dataset)=>{
        if(err) return next(err);
        if(!dataset) return next("no such dataset");

        db.Projects.findById(req.body.project, (err, project)=>{
            if(err) return next(err); 
            if(!project) return next("no such project");

            let canedit = false;

            //TODO - project.admins/members contain id in string
            //but req.user.sub is numeric... so why don't I have to toString()??
            if(project.admins.includes(req.user.sub)) canedit = true;
            if(project.members.includes(req.user.sub)) canedit = true;
            if(!canedit) return next("you can't import to this project"); 

            //update participants info
            let participants = new db.Participants({
                project,

                //copy participants info..
                subjects: dataset.participants,
                columns: dataset.participants_info, //might be missing
            });
            common.publish("participant.create."+req.user.sub+"."+project._id, participants); //too much data?
            participants.save();

            db.DLDatasets.updateOne({_id: dataset._id}, {$inc: {import_count: 1} }).then(err=>{
                if(err) console.error(err);
                else console.log("incremented import_count");
                common.publish("datalad.import."+req.user.sub+"."+project._id+"."+dataset._id, {
                    datatypes: req.body.datatypes,

                    //include some key information 
                    path: dataset.path,
                    commit_id: dataset.commit_id,
                }); 
            });

            //add to importedDLDatasets 
            const existing = project.importedDLDatasets.find(rec=>rec.dataset_id == dataset._id);
            if(!existing) {
                project.importedDLDatasets.push({
                    dataset_id: dataset._id,
                    dataset_description: dataset.dataset_description,
                    stats: dataset.stats,
                    path: dataset.path,
                });
                project.save();
            }

            //query datasets requested for import
            db.DLItems.find({
                dldataset: dataset._id,
                'dataset.datatype': {$in: req.body.datatypes},
            }).lean().exec((err, items)=>{
                if(err) return next(err);
                async.eachSeries(items, (item, next_item)=>{
                    let d = item.dataset;
                    delete d._id;
                    d.user_id = req.user.sub;
                    d.project = project._id;
                    d.storage_config.dlitem_id = item._id;
                    db.Datasets.create(d, next_item);
                }, err=>{
                    if(err) return next(err);
                    console.log("updating dataset stats")
                    common.update_dataset_stats(project._id, err=>{
                        if(err) return next(err);
                        res.json("inserted");
                    });
                });  
            });
        });
    });
});

/**
 * @apiGroup Datalad
 * @api {get} /datalad/items          
 * @apiDescription              Query Datalad items(brainlife dataobjects)
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
router.get('/items', common.jwt({credentialsRequired: false}), (req, res, next)=>{
    var find = {};
    if(req.query.find) find = JSON.parse(req.query.find);
    var skip = req.query.skip||0;
    let limit = req.query.limit||100;

    //always load user_id so that we can compute canedit properly
    var select = null;
    if(req.query.select) select = req.query.select;

    db.DLItems.find(find)
    .select(select)
    .skip(+skip)
    .limit(+limit)
    .sort(req.query.sort || '')
    .lean()
    .exec((err, recs)=>{
        if(err) return next(err);
        res.json(recs);
    });
});

module.exports = router;


