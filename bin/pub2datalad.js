#!/usr/bin/env node

//this script creates script to setup datalad repo from brainlife publication

const async = require('async');
const request = require('request');
const fs = require('fs');
const tar = require('tar');
const winston = require('winston');
const ssh2 = require('ssh2');

const config = require('../api/config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../api/models');
const mongoose = require('mongoose');
const common = require('../api/common');

let pub_id = process.argv[2];
let host = "brainlife.io";
if(!process.argv[2]) {
    //throw new Error("please specify release id.. you can find it by bl pub query -q something")
    pub_id = "5a2c3dea5d93341fdaf7a78d"; //debug
    host = "dev1.soichi.us";
}

const download_api = "https://"+host+"/api/warehouse/dataset/download";

//need to set in .git/config
//[annex]
//  http-headers-command = echo "Authorization: Bearer $(cat ~/.config/brainlife.io/.jwt)"

console.log("#/bin/bash");
console.log("# pub_id"+pub_id);
//console.log("# release "+release_id);

db.init(function(err) {
    if(err) throw err;
    run(err=>{
        if(err) throw err;
        db.disconnect(()=>{
            process.exit(0);
        });
    });
});

async function run(cb) {
    const pub = await db.Publications.findById(mongoose.Types.ObjectId(pub_id));
    if(!pub) return cb("no such pub:"+pub_id);
    if(!pub.releases) return cb("no releases");
    if(pub.removed) return cb("publication is removed");
    console.log("#datalad create pub-"+pub_id+" -D \""+pub.name+"\"");
    console.log("#cd pub-"+pub_id);
    async.eachSeries(pub.releases, (release, next_release)=>{
        handle_release(pub, release, next_release);
    }, cb);
}

async function handle_release(pub, release, cb) {
    console.log("#release "+release.name);
    console.log("mkdir -p release-"+release.name);
    console.log("cd release-"+release.name);
    const datasets = await db.Datasets.find({publications: release._id}).populate('datatype');
    datasets.forEach(dataset=>{
        console.log("#dataset "+dataset._id);
        if(!dataset.storage) {
            console.error("storage field not set..");
            return;
        }
        let path = "sub-"+dataset.meta.subject;
        if(dataset.meta.session) path += "/ses-"+dataset.meta.session;
        if(dataset.meta.run) path += "/run-"+dataset.meta.run;
        let filename = common.dataset_to_filename(dataset);
        console.log("mkdir -p "+path);
        console.log("(cd "+path+" && git-annex addurl --relaxed --raw "+download_api+"/"+dataset._id+" --file "+filename+".tar)");
    });
    console.log("cd .."); //get out of release

    //we need to push git-annex branch or datalad won't work
    console.log("#pushing git-annex branch");
    console.log("git push origin git-annex");
    cb();
}


