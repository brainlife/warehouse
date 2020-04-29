'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
const axios = require('axios');

const config = require('../config');
const db = require('../models');
const common = require('../common');

/**
 * @apiGroup Secondary
 * @api {get} /secondary/tree/:group_id/:task_id/:output_id/:path
 *                          Download secondary content
 * @apiHeader {String} authorization 
 *                          A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object}     Directory structure of secondary content
 */
router.get('/:group_id/:task_id/:output_id/:path', jwt({secret: config.express.pubkey}), (req, res, next)=>{
    const group_id = req.params.group_id;
    const task_id = req.params.task_id;
    const output_id = req.params.output_id;

    if(!~req.user.gids.indexOf(group_id)) return next("you don't have access to this group");

    axios.get(config.amaretti.api+"/task/"+task_id).then(res=>{
        res.json(res.data); 
    }).catch(err=>{
        next(err);
    });
});

module.exports = router;


