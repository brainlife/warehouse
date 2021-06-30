'use strict';

const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('../config');
const common = require('../common');
/**
 * @apiGroup Projects
 * @api {get} /project/data
 * @apiDescription              Query data for pie chart
 * 
 * @apiHeader {String} [authorization]
 *                                  A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object (JSON) }             Pie Chart Data
 */
 router.get('/data', common.jwt({credentialsRequired: true}), (req, res, next)=> {
    // if(!req.headers.authorization) next();
    if(!common.hasScope(req, "admin")) return next("You need to be admin to access this");
    request.get({ url : config.auth.api+'/profile/list', headers: { authorization: req.headers.authorization}}, (err, _res, json)=> {
        if(err) return next(err);
        if(json.length == 0) return res.json([]); 
        //now we have the json, we need to filter it
        let dataFiltered = JSON.parse(json).profiles.map(entry => {
            if(entry.profile.private.position) return {position : entry.profile.private.position};
        });
        if(!dataFiltered.length) return res.json([]);
        return res.send(dataFiltered);
    });
});

module.exports = router;
