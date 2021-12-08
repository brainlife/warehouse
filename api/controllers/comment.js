'use strict';

const express = require('express');
const router = express.Router();

const config = require('../config');
const db = require('../models');
const common = require('../common');


/**
 * @apiGroup Comment
 * @api {get} /comment/project/:projectid  Get Comment List of Particular Project
 * @apiHeader {String} authorization 
 *                              A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}            List of Comments 
 */

router.get('/project/:id', common.jwt(), (req, res, next) =>{
    if(!req.params.id) return next("project id not defined");
    let projectID = req.params.id;
    let limit = req.query.limit || 100;
    db.Projects.findById(projectID, async (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();
        if(!common.ismember(req.user, project)) return res.status(401).end("you are not a member of this project");
        const find = {"project": projectID, "removed" : false};
        db.Comments.find(find).limit(+limit).exec((err, recs)=>{
            // console.log(recs);
            if(err) return next(err);
            // console.log(recs);
            db.Comments.countDocuments(find).exec((err, count)=>{
                if(err) return next(err);
                res.json(recs);
            })
        }); 
    });
});

/**
 * @apiGroup Comments
 * @api {post} /comment/project/:id Post comment on a Project
 * @apiParam {user_id} userID 
 * @apiParam {String} comment
 * @apiParam {project} projectID
 * @apiSuccess {}            Comment registered 
 */

router.post('/', common.jwt(), function(req, res, next) {
    if(!req.body.comment) next("comment string missing");
    if(!req.body.project) next("project id missing");
    let projectID = req.body.project;
    db.Projects.findById(projectID, async (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();

        let comment = new db.Comments(req.body);
        comment.user_id = req.user.sub;
        comment.save((err)=>{
        if(err) return next(err);
        // comment = JSON.parse(JSON.stringify(comment));
        // console.log(comment);
        common.publish("comment_project.create."+req.user.sub+"."+comment.project,comment);
        res.json(comment);
        })
    });
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
            common.publish("comment_project.update."+req.user.sub+"."+comment.project, comment);
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
            common.publish("comment_project.update."+req.user.sub+"."+comment.project, comment);
            res.json("removed comment");
        })
    })
})



module.exports = router;
