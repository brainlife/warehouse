
const express = require("express");
const router = express.Router();
const config = require("../config");
const common = require('../common');
const db = require("../models");

router.get("/checkaccess/project/:project_id", common.jwt(), function(req, res, next) {
    //load project requested and check
    db.Projects.find({
        _id: req.params.project_id,
        $or: [
            {members: req.user.sub},
            {admins: req.user.sub},
            {guests: req.user.sub},
            {access: "public"},
        ]
    })
    .lean()
    .exec((err, project)=>{
        if(err) return next(err);
        if(!project) return next("401")
        res.json({status: "ok"});
    });
});

module.exports = router;
