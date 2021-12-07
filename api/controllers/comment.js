'use strict';

const express = require('express');
const router = express.Router();
const winston = require('winston');
const request = require('request');
const axios = require('axios');

const config = require('../config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../models');
const common = require('../common');


/**
 * @apiGroup Comment
 * @api {get} /comment  Get Comment List of Particular Project
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}            List of Comments 
 */

router.get('/', common.jwt({credentialsRequired: true}), (req, res, next) =>{
    if(!req.query.project) return next("project not defined");
    let project = req.query.project;
    if(project) {
        const find = {"project": project, "removed" : false};
        db.Comments.find(find).exec((err, recs)=>{
            // console.log(recs);
            if(err) return next(err);
            // console.log(recs);
            db.Comments.countDocuments(find).exec((err, count)=>{
                if(err) return next(err);
                res.json({
                    comments : recs, 
                    count
                });
            })
        })
    }
});

/**
 * @apiGroup Comments
 * @api {post} /comment Post comment on a Project
 * @apiParam {user_id} userID 
 * @apiParam {String} comment
 * @apiParam {project} projectID
 * @apiSuccess {}            Comment registered 
 */

router.post('/', common.jwt(), function(req, res, next) {
    if(!req.body.user_id) return next('user id missing');
    if(!req.body.comment) next("comment string missing");
    if(!req.body.project) next("project id missing");
    let comment = new db.Comments(req.body);
    comment.save((err)=>{
        if(err) return next(err);
        // comment = JSON.parse(JSON.stringify(comment));
        // console.log(comment);
        common.publish("comment_project.create."+comment.user_id+"."+comment.project,comment);
        res.json(comment);
    })
});


/**
 * @apiGroup Comments
 * @api {patch} /comment/id  Update comment on a Project
 * @apiParam {String} commentString
 * 
 * @apiSuccess {}            Comment updated 
 */

router.patch('/:id', common.jwt(), (req, res, next) =>{
    if(!req.params.id) return next("Id missing");
    if(!req.body.commentString) return next("comment String missing");
    const id = req.params.id;
    const updatedComment = req.body.commentString;
    db.Comments.findById(id, (err, comment)=>{
        if(err) return next(err);
        if(!comment) return res.status(404).end();
        comment.comment = updatedComment;
        comment.save((err, comment)=>{
            if(err) return next(err);
            common.publish("comment_project.update."+comment.user_id+"."+comment.project, comment);
            res.json(comment);
        })
    })
});


/**
 * @apiGroup Comments
 * @api {delete} /comment/id  Deleted comment on a Project
 * @apiParam {String} commentString
 * 
 * @apiSuccess {}            Comment Deleted 
 */

router.delete('/:id', common.jwt(), (req, res)=>{
    if(!req.params.id) return next("Id missing");
    const id = req.params.id;
    db.Comments.findById(id, (err, comment)=>{
        if(err) return next(err);
        if(!comment) return res.status(404).end();
        comment.removed = true;
        comment.save((err, comment)=>{
            if(err) return next(err);
            common.publish("comment_project.update."+comment.user_id+"."+comment.project_id, comment);
            res.json("removed comment");
        })
    })
})



module.exports = router;
