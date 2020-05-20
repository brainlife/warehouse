'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const config = require('../config');
const db = require('../models');
const common = require('../common');

/**
 * @apiGroup Secondary
 * @api {get} /secondary/:task_id/:path
 *                          Download secondary content for a given dtv task / and path
 * @apiHeader {String} authorization 
 *                          A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}     Directory structure of secondary content
 */
router.get('/:task_id/*', jwt({
    //similar to dataset/download
    secret: config.express.pubkey,
    credentialsRequired: false,
    getToken: function(req) { 
        //load token from req.headers as well as query.at
        if(req.query.at) return req.query.at; 
        if(req.headers.authorization) {
            var auth_head = req.headers.authorization;
            if(auth_head.indexOf("Bearer") === 0) return auth_head.substr(7);
        }
        return null;
    }
}), (req, res, next)=>{
    const task_id = req.params.task_id;
    const p = req.query.p || req.params[0];

    axios.get(config.amaretti.api+"/task/"+task_id).then(taskres=>{
        if(taskres.status != 200) return next("failed to load task "+task_id);
        const task = taskres.data;
        const gids = req.user.gids||[];
        if(task.user_id != req.user.sub && !~gids.indexOf(task._group_id)) return next("you don't own this task or member of a group "+task._group_id);

        //ok looks good.. 
        const follow_task_id = task.deps_config[0].task;
        const prefix = "/mnt/secondary/"+task._group_id+"/"+task.instance_id+"/"+follow_task_id;

        //make sure path looks safe
        const clean_p = path.resolve(prefix+"/"+p);
        if(!clean_p.startsWith(prefix)) return next("invalid path");

        const readstream = fs.createReadStream(clean_p);
        readstream.pipe(res);   
        readstream.on('error', err=>{
            console.error("failed to pipe", err);
            next(err); 
        });
        res.on('finish', ()=>{
            common.publish("secondary.download."+req.user.sub+"."+task._group_id+"."+task._id, {headers: req.headers, path: clean_p});
        });

    }).catch(err=>{
        next(err);
    });
});

module.exports = router;


