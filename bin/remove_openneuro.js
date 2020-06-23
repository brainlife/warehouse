#!/usr/bin/env node
'use strict';

const config = require('../api/config');
const db = require('../api/models');
const async = require('async');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

let root = "/mnt/datalad";
if(config.debug) root = "/mnt/scratch/datalad-test";
else process.chdir(root)

//https://github.com/OpenNeuroOrg/openneuro/issues/1608
//let bad_datasets = [ "ds000030", "ds000113", "ds000217", "ds000221", "ds001417", "ds002236" ];
let bad_datasets = [ ];

console.log("connecting to db");
db.init(async err=>{
    if(err) throw err;
    db.DLDatasets.find({path: {$regex: "^OpenNeuroDatasets"}}, (err, dldatasets)=>{
        if(err) return cb(err);
        async.eachSeries(dldatasets, (dataset, next_dataset)=>{
            console.log(dataset.path);

            //dataset.path: OpenNeuroDatasets/ds002374
            let dataset_id = dataset.path.split("/")[1];
            //dataset_id = "ds002171"; //removed
            //dataset_id = "ds001934";
            let query = `query { dataset(id:\"${dataset_id}\") { id name public } }`;
            //name public created snapshots { tag created } analytics { downloads views }
            console.log(query);
            axios({url: "https://openneuro.org/crn/graphql", method: 'post', data: {query}}).then(res=>{
                if(res.errors) return next_dataset(res.errors);
                if(res.data.data.dataset && res.data.data.dataset.public && !bad_datasets.includes(dataset_id)) {
                    console.log("still good");
                    console.dir(res.data.data.dataset);
                    dataset.removed = false;
                } else {
                    console.log("marking as removed");
                    console.dir(res.data);
                    dataset.removed = true;
                }
                dataset.save(next_dataset);
            }).catch(next_dataset);
        }, err=>{
            if(err) throw err;
            console.log("all done");
            db.disconnect(()=>{
                process.exit(0);
            });
        });
    });
});


