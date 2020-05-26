'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
const winston = require('winston');
const request = require('request');

const config = require('../config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../models');
const common = require('../common');

function getParticipants(req, project, cb) {
    //load data
    db.Participants.findOne({project}, (err, participants)=>{
        if(err) return cb(err);
        if(!participants) {
            //maybe first time accessed? let's create new record
            participants = new db.Participants({
                project,
                subjects: {},
                //columns: {},
            });
            common.publish("participant.create."+req.user.sub+"."+project._id, participants);
            participants.save();
        }

        cb(null, participants);
    });
}

/**
 * @apiGroup Participant
 * @api {get} /participant/:projectid  
 *                              Load participants data
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         Content of participants record
 */
router.get('/:projectid', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    //access control
    db.Projects.findById(req.params.projectid, (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();
        if(!common.isadmin(req.user, project) && !common.ismember(req.user, project)) 
            return res.status(401).end("you are not an administartor nor member of this project");
            
        getParticipants(req, project, (err,participants)=>{
            if(err) return next(err);

            if(!participants.columns) {
                console.log("generating participants.columns");
                //generate columns list
                participants.columns = {};
                for(let subject in participants.subjects) {
                    let row = participants.subjects[subject];
                    for(let k in row) {
                        let v = row[k]; //use this to analyze?
                        if(!participants.columns[k]) participants.columns[k] = {
                            LongName: k,
                            Description: k,
                            //Units: string
                            //Levels: {k/v}
                        };
                    }
                }
            }

            res.json(participants);
        });
    });
});

/**
 * @apiGroup Participant
 * @api {put} /participant/:projectid
 *                              Replace participants info
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 */
router.put('/:projectid', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    //access control
    db.Projects.findById(req.params.projectid, (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();
        if(!common.isadmin(req.user, project) && !common.ismember(req.user, project)) 
            return res.status(401).end("you are not an administartor nor member of this project");

        let set = { 
            project,
            subjects: req.body.subjects,
            columns: req.body.columns,
        };
        db.Participants.updateOne({project}, {$set: set}, {new: true, upsert: true}, (err, participants)=>{
            if(err) return next(err);
            common.publish("participant.update."+req.user.sub+"."+project._id, req.body);
            res.json({status: "success"});
        });
    });
});

/**
 * @apiGroup Participant
 * @api {patch} /participant/:projectid/:subject
 *                              Update participants data
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         Content of participants record
 */
router.patch('/:projectid/:subject', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    //access control
    db.Projects.findById(req.params.projectid, (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();
        if(!common.isadmin(req.user, project) && !common.ismember(req.user, project)) 
            return res.status(401).end("you are not an administartor nor member of this project");

        let set = { ["subjects."+req.params.subject]: req.body }; //TODO is this safe?
        db.Participants.updateOne({project}, {$set: set}, (err, participants)=>{
            if(err) return next(err);
            common.publish("participant.patch."+req.user.sub+"."+project._id+"."+req.params.subject, req.body);
            res.json({status: "success"});
        });
    });
});

module.exports = router;


