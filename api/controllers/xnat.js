
const express = require("express");
const router = express.Router();
const config = require("../config");
const common = require('../common');
const axios = require('axios');
const db = require("../models");

//validate xnat token
router.get("/validate", common.jwt(), async (req, res, next)=>{
    const hostname = req.query.hostname;
    const token = req.query.token;
    const secret = req.query.secret;
    const auth = {
        username: token,
        password: secret,
    }
    try {
        const resXnat = await axios.get(hostname+"/data/services/tokens/validate/"+token+"/"+secret, {auth});
        res.json({status: resXnat.status, message: resXnat.statusText, res: resXnat.data});
    } catch (err) {
        console.error(err.response);
        res.json({status: err.response.status, message: err.response.statusText});
    }
});

//enumerate xnat scans and convert to brainlife object and update the project
router.post('/load/:projectid', common.jwt(), async (req, res, next)=>{
    var projectid = req.params.projectid;
    db.Projects.findById(projectid, async (err, project)=>{
        if(err) return next(err);
        if(!project) return res.status(404).end();
        if(!common.isadmin(req.user, project)) return res.status(401).end("you are not an administartor of this project");

        const objects = await common.enumXnatObjects(project);
        await common.updateXNATObjects(objects);

        //TODO.. too big?
        res.json(objects);
    });
});

module.exports = router;


