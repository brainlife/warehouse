'use strict';

const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('../config');
const common = require('../common');

const LabelNameMatch = {
    "PhD Student": ["doctoral student", "graduate student","phd candidate","grad student","phd student"],
    "Faculty" : ["prof", "senior research fellow", "chair", "instructor", "director", "scientist", "advisor", "principal investigator", "pi", "teacher","scholar", "lec"],
    "Postdoctoral Researcher" : ["postdoctoral" ,"fellow", "research associate", "post", "phd" ,"research"],
    "Research Assistant" : ["research assistant", "research coordinator", "intern","ra"],
    "High School Student" : ["high school"],
    "Clinician" : ["chief physician","clinical researcher","advanced imaging neuroscientist","presurgical tumor evaluation","md","radiologist","neuroradiologist",
                "logist","physic","clinician","medical doctor","physician","neurologist"],
    "College Student" : ["under", "teaching assistant",],
    "Industry" : ["software", "product", "manager", "owner", "developer", "des", "engineer"],
    "Masters Student" : ["masters", "phil", "mtech", "msc"],
    "Student (unspecified)" : ["studen"],
}
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
        return res.send(LabeltoValue(dataFiltered,LabelNameMatch));
    });
});

function LabeltoValue(data,LabelNameMatch) {
    let labelCount = [];
    let labelRes = [];
    let totalValidCount = 0;
    data.filter(entry => entry.position && entry.position.toLowerCase() != "n/a" && entry.position.length > 1).forEach(pos=> {
        totalValidCount++;
        let entry = pos.position; 
        for (const [label,value] of Object.entries(LabelNameMatch)) {
            if(value.some(query=> entry.toLowerCase().includes(query) || entry.toLowerCase() == query)) {
                if(!labelRes.includes(label)) {
                    labelRes.push(label);
                    labelCount.push(0);
                }
                labelCount[labelRes.indexOf(label)] += 1;
                break;
            }
        }
    });
    let OtherCount = totalValidCount - labelCount.reduce((a, b) => a + b, 0);
    labelRes.push("Other");
    labelCount.push(OtherCount);
    return {labelRes, labelCount};
}


module.exports = router;
