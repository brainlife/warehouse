'use strict';

const express = require('express');
const router = express.Router();
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

        //migrate
        if(participants.rows) {
            participants.subjects = participants.rows;
            participants.rows = undefined;
            participants.save();

            delete participants.rows;
        }

        cb(null, participants);
    });
}

/**
 * @apiGroup Participant
 * @api {get} /participant/:projectid  
 *                              Load participants data. Guest user can download participants info if it's set to use
 *                              publishParticipantsInfo
 * @apiHeader {String} [authorization]
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         Content of participants record
 */
router.get('/:projectid', common.jwt({credentialsRequired: false}), (req, res, next)=>{
    //access control
    db.Projects.findById(req.params.projectid, (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();

        if( !project.publishParticipantsInfo && 
            !common.isadmin(req.user, project) && 
            !common.ismember(req.user, project)) {
            return res.status(401).end("you are not an administartor nor member of this project (no public participants)");
        }
            
        getParticipants(req, project, (err,participants)=>{
            if(err) return next(err);

            //migrate old format (object of object) to (array of object)
            if(participants.subjects && !Array.isArray(participants.subjects)) {
                const subjects = [];
                for(const sub in participants.subjects) {
                    subjects.push(Object.assign({subject: sub}, participants.subjects[sub]));
                }
                participants.subjects = subjects;
            }

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
 *                              Upsert participants(subjects) and columns info
 *
 * @apiParam {Object[]} [subjects]    
 *                              List of objects containing subject phenotype
 * @apiParam {Object} [columns] 
 *                              An object containing BIDS participants column info
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         { status: "success" }
 */
router.put('/:projectid', common.jwt(), (req, res, next)=>{
    //access control
    db.Projects.findById(req.params.projectid, (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();
        if(!common.isadmin(req.user, project) && !common.ismember(req.user, project)) 
            return res.status(401).end("you are not an administartor nor member of this project");

        let set = { 
            project, //WHY?
        };
        //TODO validate?
        if(req.body.subjects) set.subjects = req.body.subjects;
        if(req.body.columns) set.columns = req.body.columns;
        db.Participants.updateOne({project}, {$set: set}, {new: true, upsert: true}, (err, participants)=>{
            if(err) return next(err);
            common.publish("participant.update."+req.user.sub+"."+project._id, req.body);
            res.json({status: "success"});
        });

        //store participants.json
        const participant_path = config.groupanalysis.secondaryDir+"/"+project.group_id+"/participants.json";
        //console.debug("writing participants.json to", participant_path);
        config.groupanalysis.getSecondaryUploadStream(participant_path, (err, stream)=>{
            if(err) {
                console.error(err);
                return;
            }
            stream.write(JSON.stringify(req.body.subjects, null, 4));
            stream.end();
        })

        //store participant_column
        const column_path = config.groupanalysis.secondaryDir+"/"+project.group_id+"/participants_column.json";
        //console.debug("writing participants_column to", column_path);
        config.groupanalysis.getSecondaryUploadStream(column_path, (err, stream)=>{
            if(err) {
                console.error(err);
                return;
            }
            stream.write(JSON.stringify(req.body.columns, null, 4));
            stream.end();
        })
    });
});

/**
 * @apiGroup Participant
 * @api {patch} /participant/:projectid/:subject
 *                              Update participants data for specific subject
 *
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}         { n: 1, nModified: 1, ok: 1 }
 */
/* who uses this?
router.patch('/:projectid/:subject', common.jwt(), (req, res, next)=>{
    //access control
    db.Projects.findById(req.params.projectid, (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();
        if(!common.isadmin(req.user, project) && !common.ismember(req.user, project)) 
            return res.status(401).end("you are not an administartor nor member of this project");

        let set = { ["subjects."+req.params.subject]: req.body }; //TODO is this safe?
        db.Participants.updateOne({project}, {$set: set}, (err, stats)=>{
            if(err) return next(err);
            common.publish("participant.patch."+req.user.sub+"."+project._id+"."+req.params.subject, req.body);
            res.json(stats); //{ n: 1, nModified: 1, ok: 1 }
        });

        //TODO - update participant info on secondary storage
    });
});
*/

module.exports = router;


