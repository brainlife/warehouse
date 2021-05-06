#!/usr/bin/env node

const config = require('../../api/config');
const db = require('../../api/models');
//const common = require('../../api/common');
const async = require('async');

db.init(async err=>{
    if(err) throw err;
    const projects = await db.Projects.find({removed: false});
    async.eachSeries(projects, async (project, next)=>{
        console.log("querying", project.name);
        let dldataset_ids = await db.Datasets.distinct('storage_config.dldataset_id', {status: "stored", removed: false, project: project._id, /*'storage_config.dldataset_id': {$exists: true}*/});
        let dldatasets = await db.DLDatasets.find({_id: {$in: dldataset_ids}});
        project.importedDLDatasets = dldatasets.map(rec=>({
            dataset_id: rec._id, 
            //pick things that we want
            dataset_description: rec.dataset_description,
            stats: rec.stats,
            path: rec.path,
        }))
        console.debug(project.importedDLDatasets);
        await project.save();
    }, err=>{
        if(err) throw err;
        db.disconnect();
    });
});

