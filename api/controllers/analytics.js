'use strict';

const express = require('express');
const router = express.Router();
const request = require('request');
const axios = require('axios');
const config = require('../config');
const common = require('../common');

/**
 * @apiGroup Analytics
 * @api {get} /userPosCounts
 * @apiDescription              Query data for pie chart
 * 
 * @apiHeader {String} [authorization]
 *                                  A valid JWT token "Bearer: xxxxx"
 * @apiSuccess {Object (JSON) }             Pie Chart Data
 */
 router.get('/userPosCounts', common.jwt({credentialsRequired: true}), (req, res, next)=> {
    const dataObject = {
        "PhD Student": 0,
        "Faculty" : 0,
        "Postdoctoral Researcher" :0,
        "Research Assistant" : 0,
        "High School Student" : 0,
        "Clinician" : 0,
        "College Student" : 0,
        "Industry" : 0,
        "Masters Student" : 0,
        "Student (unspecified)" :0,
        "Other" : 0
    }
    // if(!req.headers.authorization) next();
    if(!common.hasScope(req, "admin")) return next("You need to be admin to access this");
    request.get({ url : config.auth.api+'/profile/list', headers: { authorization: req.headers.authorization}}, (err, _res, json)=> {
        if(err) return next(err);
        if(json.length == 0) return res.json([]); 
        //now we have the json, we need to filter it
        let dataFiltered = JSON.parse(json).profiles.map(entry => {
            if(entry.profile.private.position) return {position : entry.profile.private.position};
        }).filter(f=>!!f);
        if(!dataFiltered.length) return res.json([]);
        dataFiltered.forEach(entry=>{
            if(/\s(phd|doctoral|grad|graduate)+( candidate| student)/.test(entry.position.toLowerCase())) dataObject["Phd Student"] += 1;
            else if(/prof|senior|pi|teacher|scholar|lec|advisor|inst|chair|scient|direc|invest/.test(entry.position.toLowerCase())) dataObject["Faculty"] += 1;
            else if(/^(research)|^(post)|(phd)/.test(entry.position.toLowerCase())) dataObject["Postdoctoral Researcher"] += 1;
            else if(/(research)[^\s]*( assistant| associate | coordinator) |(intern)|\bra/.test(entry.position.toLowerCase())) dataObject["Research Assistant"] +=1;
            else if(/school/.test(entry.position.toLowerCase())) dataObject["High School Student"] += 1;
            else if(/(logist)|(clin)|(neuro)|(chief)|(cal)|\b(md)|(physic)/.test(entry.position.toLowerCase())) dataObject["Clinician"] += 1;
            else if(/undergrad|\bteaching assistant/.test(entry.position.toLowerCase())) dataObject["Undergraduate Student"] += 1;
            else if(/masters|phil|mtech|msc/.test(entry.position.toLowerCase())) dataObject["Masters Student"] +=1;
            else if(/software|product|manager|owner|developer|des|engineer/.test(entry.position.toLowerCase())) dataObject["Industry"] +=1;
            else if(/student/.test(entry.position.toLowerCase())) dataObject["Student (unspecified)"] += 1;
            else dataObject["Other"] += 1;
        });
        return res.send(dataObject);
    });
});

module.exports = router;
