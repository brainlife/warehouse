'use strict';

const express = require('express');
const router = express.Router();

const config = require('../config');
const db = require('../models');
const common = require('../common');


/**
 * @apiGroup Comment
 * @api {get} /comment/project/:projectid  Get Comment List of Particular Project
 * @apiHeader {String} authorization    A valid JWT token "Bearer: xxxxx"
 * @apiParam {Number} [limit]   Optional Maximum number of records to return - defaults to 0(no limit)
 * 
 * @apiSuccess {Object}            List of Comments 
 * 
 */
router.get('/project/:id', common.jwt(), (req, res, next) =>{
    let limit = req.query.limit || 100;
    db.Projects.findById(req.params.id, (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();
        if(project.acesss == 'private') {
            if(!common.ismember(req.user,project) && 
            !common.isadmin(req.user,project) && 
            !common.isguest(req.user,project)) return res.status(401).end("you are not a afilliated with the project");
        }

        db.Comments.find({"project": project._id, "removed" : false}).limit(+limit).exec((err, recs)=>{
            if(err) return next(err);
            res.json(recs);
        }); 
    });
});

/**
 * @apiGroup Comments
 * @api {post} /comment/project/:id Post comment on a Project
 * @apiHeader {String} authorization    A valid JWT token "Bearer: xxxxx"
 * @apiParam {String} comment
 * @apiParam {project} projectID
 * @apiSuccess {}            Comment registered 
 */

router.post('/project/:id', common.jwt(), function(req, res, next) {
    if(!req.body.comment) next("comment string missing");
    db.Projects.findById(req.params.id, async (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();
        let comment = new db.Comments(req.body);
        if(project.access == 'private') { 
            if(!common.ismember(req.user,project) && 
            !common.isadmin(req.user,project) && 
            !common.isguest(req.user,project)) return next("you can not comment to private project");
        } 

        comment.project = project._id;
        comment.user_id = req.user.sub;
        comment.save((err)=>{
        if(err) return next(err);
            common.publish("comment_project.create."+req.user.sub+"."+comment.project,comment);
            res.json(comment);
        })
    });
});


/**
 * @apiGroup Comments
 * @api {patch} /comment/:id  Update comment on a Project
 * @apiHeader {String} authorization    A valid JWT token "Bearer: xxxxx"
 * @apiParam {String} comment
 * @apiSuccess {}            Comment updated 
 */
router.patch('/:id', common.jwt(), (req, res, next) =>{
    if(!req.body.comment) return next("comment missing");
    db.Comments.findById(req.params.id, (err, comment)=>{
        if(err) return next(err);
        if(!comment) return res.status(404).end();
        if(comment.user_id != req.user.sub && !common.isadmin(req.user, comment.project)) 
            return next("unauthorized attempt to edit comment"); 

        comment.comment = req.body.comment;
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
 * @apiHeader {String} authorization    A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {}            Comment Deleted 
 */
router.delete('/:id', common.jwt(), (req, res)=>{
    db.Comments.findById(req.params.id, (err, comment)=>{
        if(err) return next(err);
        if(!comment) return res.status(404).end();
        if(comment.user_id != req.user.sub && !common.isadmin(req.user, comment.project))
            return next("unauthorized attempt to delete comment"); 

        comment.removed = true;
        comment.save((err, comment)=>{
            if(err) return next(err);
            common.publish("comment_project.update."+req.user.sub+"."+comment.project, comment);
            res.json("removed comment");
        })
    })
})

module.exports = router;
