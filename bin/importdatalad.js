#!/usr/bin/env node
'use strict';

const config = require('../api/config');
const db = require('../api/models');
const async = require('async');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const bids_walker = require('brainlife').bids_walker;

process.chdir('/mnt/datalad');

console.log("connecting");
db.init(async err=>{
    if(err) throw err;
    await load_datatypes();

    //find dataset_description.json
    console.log("looking for dataset_description.json");

    //let bids_dirs = child_process.execSync("find datasets.datalad.org -name dataset_description.json", {encoding: "utf8"}).split("\n");
    let bids_dirs = child_process.execSync("cat bids.list", {encoding: "utf8"}).split("\n");

    //debug..
    //let bids_dirs = ["datasets.datalad.org/ds002040/dataset_description.json"];
    //bids_dirs = ["datasets.datalad.org/simon/dataset_description.json"];

    let skipped = [];

    async.eachSeries(bids_dirs, (bids_dir, next_dir)=>{
        let dataset_path = path.dirname(bids_dir);

        console.log(dataset_path+".......................");
        if(dataset_path[0] == '.') return next_dir();
        if(dataset_path.includes("/derivatives")) return next_dir(); //openneuro/ds001734/derivatives contains dataset_description.json
        if(dataset_path.includes("/.bidsignore")) return next_dir(); //openneuro/ds001583

        //debug
        //if(dataset_path != "datasets.datalad.org/openneuro/ds000237") return next_dir();

        bids_walker(dataset_path, (err, bids)=>{
            if(err) return next_dir(err);

            //if there are no data, something went wrong..
            if(bids.datasets.length == 0) {
                skipped.push(dataset_path);
                return next_dir();
            }

            let key = {path: dataset_path};
            handle_bids(key, bids, next_dir);
        });
    }, err=>{
        if(err) throw err;
        console.log("all done");
        if(skipped.length > 0) {
            console.log("\nskipped dataset");
            console.dir(skipped);
        }
    });
});

let datatype_ids = {};
async function load_datatypes() {
    let datatypes = await db.Datatypes.find({});
    datatypes.forEach(datatype=>{
         datatype_ids[datatype.name] = datatype._id;
    });
}

function handle_bids(key, bids, cb) {
    //upsert dl-dataset record
    db.DLDatasets.findOne(key, (err, dldataset)=>{
        if(err) return next_dir(err);
        if(!dldataset) dldataset = new db.DLDatasets(key);

        if(bids.README) dldataset.README = bids.README;
        if(bids.CHANGED) dldataset.CHANGES = bids.CHANGES;
        if(bids.dataset_description) dldataset.dataset_description = bids.dataset_description;
        if(bids.participants) dldataset.participants = bids.participants;
        if(bids.participants_json) dldataset.participants_info = bids.participants_json;

        //if(!bids.dataset_description.Name) bids.dataset_description.Name = "untitled";
       
        //count
        let unique_subjects = [];
        let unique_sessions = [];
        let datatype_counts = {};
        bids.datasets.forEach(item=>{
            let meta = item.dataset.meta;
            if(!~unique_subjects.indexOf(meta.subject)) unique_subjects.push(meta.subject);
            if(meta.session && !~unique_sessions.indexOf(meta.session)) unique_sessions.push(meta.session);

            let datatype_id = datatype_ids[item.dataset.datatype];
            if(!datatype_id) throw "unknown datatype:"+item.dataset.datatype;
            if(!datatype_counts[datatype_id]) datatype_counts[datatype_id] = 0;
            datatype_counts[datatype_id]++;
        });
        dldataset.stats = {
            subjects: unique_subjects.length,
            sessions: unique_sessions.length,
            datatypes: datatype_counts,
        }

        dldataset.save(err=>{
            if(err) throw err;
           
            //handle each items
            async.eachSeries(bids.datasets, (item, next_dataset)=>{
                item.dataset.datatype = datatype_ids[item.dataset.datatype];
                item.dataset.storage = "datalad";
                let files = [];
                for(let dest in item.files) {
                    files.push({src: item.files[dest], dest});
                }
                item.dataset.storage_config = {files};
                item.dataset.status = "stored"; //should I come up with something?

                key = {
                    dldataset: dldataset._id,
                    "dataset.datatype": item.dataset.datatype,
                    "dataset.desc": item.dataset.desc,
                };
                db.DLItems.findOne(key, (err, dlitem)=>{
                    if(err) return cb(err);
                    if(!dlitem) {
                        //new
                        dlitem = new db.DLItems(Object.assign(key, {dataset: item.dataset}));
                        dlitem.save(err=>{
                            if(err) return cb(err);
                            next_dataset();
                        });
                    } else {
                        //for(let key in update) dlitem[key] = update[key];
                        db.DLItems.updateOne(key, {$set: {dataset: item.dataset}}, err=>{
                            if(err) return cb(err);
                            next_dataset();
                        });
                    }
                });

            }, err=>{
                if(err) return cb(err);
                console.log("done with this dataset");
                cb();
            });
        });
    });
}


