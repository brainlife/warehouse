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
    let projectID = req.params.id;
    let limit = req.query.limit || 100;
    db.Projects.findById(projectID, async (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();
        /*if project access is public, let any body see the comment  
        if project is private let admins, members and guests be able to look
        */
        if(project.acesss != "public" && 
        !common.isuserpartofProject(req.user,project)) return res.status(401).end("you are not a afilliated with the project");

        db.Comments.find({"project": projectID, "removed" : false}).limit(+limit).exec((err, recs)=>{
            if(err) return next(err);
            res.json(recs);
        }); 
    });
});

/**
 * @apiGroup Comments
 * @api {post} /comment/project/:id Post comment on a Project
 * @apiParam {String} comment
 * @apiParam {project} projectID
 * @apiSuccess {}            Comment registered 
 */

router.post('/project/:id', common.jwt(), function(req, res, next) {
    if(!req.body.comment) next("comment string missing");
    let projectID = req.params.id;    
    db.Projects.findById(projectID, async (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();
        let comment = new db.Comments(req.body);
        comment.project = projectID;
        /* project is private, only let members,admins and guest comment */
        if(project.access == "private" && !common.isuserpartofProject(req.user,project)) next("you can not comment to private project"); 
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
        /* user is either the same or it is the admin*/
        if(comment.user_id != req.user.sub && !common.isadmin(req.user, comment.project)) return next("unauthorized attempt to delete comment"); 
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
        if(comment.user_id != req.user.sub && !common.isadmin(req.user, comment.project)){
            console.log("error not the author");
            return next("unauthorized attempt to delete comment"); 
        }
        comment.removed = true;
        comment.save((err, comment)=>{
            if(err) return next(err);
            common.publish("comment_project.update."+req.user.sub+"."+comment.project, comment);
            res.json("removed comment");
        })
    })
})



module.exports = router;
