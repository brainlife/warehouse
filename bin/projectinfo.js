#!/usr/bin/env node

const async = require('async');
const axios = require('axios');
const fs = require('fs');
const mongoose = require("mongoose");

const config = require('../api/config');
const db = require('../api/models');
const common = require('../api/common');

db.init(function(err) {
    if(err) throw err;
    run();
});

function run() {
    db.Projects.find({}) //get all projects!
    .exec((err, projects)=>{
        if(err) throw err;
        async.eachSeries(projects, handle, err=>{
            if(err) {
                console.error(err);
                process.exit(1);
            }

            console.log("all done");
            db.disconnect();
        });
    });
}

async function handle(project) {
    if(!project.removed && project.xnat && project.xnat.enabled) {
        await handleXNAT(project);
    }

    //already ran it.. I don't think we need to keep running this.
    //await tidyup(project);

    await project.save();
}

//make sure groups for disabled project are deactivated
//api does this now so it shouldn't be necessary.. but for migration
async function tidyup(project) {
    if(!project.group_id) return; //hopefully only for dev..
    if(project.removed) {
        console.log("removed project.. making sure group is deactivated", project.group_id);
        //deactivate auth grouop
        const res = await axios.put(config.auth.api+"/group/"+project.group_id, {
            active: false,
        }, {
            headers: { authorization: "Bearer "+config.warehouse.jwt, }
        });
        console.log(res.status);
    }
}

async function handleXNAT(project) {
    console.log("handleXNAT --------------");

    const dago = new Date();
    dago.setDate(dago.getDate()-1);

    const auth = {
        username: project.xnat.token,
        password: project.xnat.secret,
    }

    //if(project.tokenUpdated < dago) {
        console.log("refreshing access token", project.xnat.hostname);
        try {
            console.log("issuing new token");
            const res = await axios.get(project.xnat.hostname+"/data/services/tokens/issue", {auth});
            console.debug(res.statusCode);

            console.log("invalidating old token");
            const invalidateRes = await axios.get(project.xnat.hostname+"/data/services/tokens/invalidate/"+project.xnat.token+"/"+project.xnat.secret, {auth});
            console.debug(invalidateRes.statusCode, invalidateRes.data);

            //replace with new one
            project.xnat.token = res.data.alias;
            project.xnat.secret = res.data.secret;
            project.tokenUpdated = new Date();

        } catch (err) {
            console.error(err.response);
            project.xnat.token = undefined;
            project.xnat.secret = undefined;
            project.xnat.enabled = false;
        }
        project.markModified('xnat');
    //}

    const objects = await common.enumXnatObjects(project);
    await common.updateXNATObjects(objects);
}

