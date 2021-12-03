#!/usr/bin/env node
'use strict';

const fs = require('fs');
const provenance = require('../api/lib/provenance');
const db = require('../api/models');

//const appid = "5fe1056057aacd480f2f8e48"; //freesurfer
//const appid = "58e6d875b1157a7f0f82c453"; //network neuro
//const appid = "5dfceebd32bff0640ce27bbd"; //fmriprep
//const appid = "5fda378756422f36d2f97ac2"; //freesurfer stats

db.init(async function(err) {
    if(err) throw err;

    console.log("loading apps");
    const apps = db.Apps.find({removed: false}).select({_id:1, name:1, service:1}).lean();
    for await (const app of apps) {
        await run(app._id);
    }
    //test
    //await run("5fda378756422f36d2f97ac2"); //freesurfer stats

    console.log("all done");
    db.disconnect();
});

async function run(appid) {
    const countfname = "/tmp/count."+appid+".json";
    const commonfname = "/tmp/common."+appid+".json";

    if(fs.existsSync(commonfname)) return; //skip if already exists

    console.log("---------------------------------------------------------------");
    console.log("loadingprovenance for app", appid);
    console.log("---------------------------------------------------------------");
    //const provs = require('/home/hayashis//Documents/testdata/provenances/app-5cc9c6b44b5e4502275edb4b.provs.json');
    const provs = await provenance.sampleTerminalTasks(appid);
    provs.map(provenance.setupShortcuts);
    const cnodes = provenance.countProvenances(provs);

    console.log("saving counts", countfname);
    fs.writeFileSync(countfname, JSON.stringify(cnodes, null, 4))
    //console.log(JSON.stringify(cnodes, null, 4));
    
    const probGroups = provenance.computeProbabilities(cnodes);
    const commonProvs= [];
    //grab the top 3 groups
    probGroups.splice(0,3).forEach(probGroup=>{
        const idx = probGroup.provs[0]; //grab the first one from each group
        const prov = provs[idx];
        prov._prob = probGroup.prob;
        prov._probSiblings = probGroup.provs.length;
        commonProvs.push(prov);
    });
    console.log("saving common provs", commonfname);
    fs.writeFileSync(commonfname, JSON.stringify(commonProvs, null, 4))
}

