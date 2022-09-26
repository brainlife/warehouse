#!/usr/bin/env node
'use strict';

const config = require('../api/config');
const db = require('../api/models');
const async = require('async');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const cli = require('brainlife');
const axios = require('axios');

process.chdir('/mnt/datalad');

console.log("connecting");
db.init(async err=>{
    if(err) throw err;
    await load_datatypes();

    /*
    console.log("loading datasets2.txt");
    let datasets = child_process.execSync("cat datasets2.txt", {encoding: "utf8"}).split("\n").filter(dataset=>{
        //ignore some datasets
        if(dataset.startsWith("datasets.datalad.org/openneuro")) return false;
        if(dataset.startsWith("datasets.datalad.org/openfmri")) return false;
        return true;
    });
    */

    console.log("loading dataset_description.json");
    //let datasets = child_process.execSync("find ./ -name dataset_description.json", {encoding: "utf8"}).split("\n").filter(dataset=>{
    const datasets = fs.readFileSync(process.argv[2], "utf8").split("\n").filter(dataset=>{
        //ignore some datasets
        if(dataset.startsWith("datasets.datalad.org/openneuro")) return false;
        if(dataset.startsWith("datasets.datalad.org/openfmri")) return false;
        return true;
    });

    //datasets = ["OpenNeuroDatasets/ds001771/dataset_description.json"];
    let skipped = [];
    async.eachSeries(datasets, (bids_dir, next_dir)=>{
        let dataset_path = path.dirname(bids_dir);

        console.log(dataset_path+".......................");
        //if(dataset_path[0] == '.') return next_dir();

	//ignore dataset_description.json contained inside derivatives
        if(dataset_path.includes("/derivatives/")) return next_dir(); 

        //openneuro/ds001583
        //if(dataset_path.includes("/.bidsignore")) return next_dir(); 

        //somehow it gets stuck... (not bids walker issue?)
        /*
        //TODO - fix it!
        if(dataset_path == "OpenNeuroDatasets/ds001499") return next_dir();
        if(dataset_path == "OpenNeuroDatasets/ds003634") return next_dir();
        if(dataset_path == "OpenNeuroDatasets/ds003505") return next_dir();
        if(dataset_path == "OpenNeuroDatasets/ds002785") return next_dir();
        */

        console.log("walking bids..");
        cli.bids_walker(dataset_path, (err, bids)=>{
            if(err) return next_dir(err);

            //if there are no data, something went wrong..
            if(bids.datasets.length == 0) {
                skipped.push({dataset_path, reason: "empty dataset"});
                return next_dir();
            }
            if(!bids.dataset_description) {
                skipped.push({dataset_path, reason: "empty dataset_description?"});
                return next_dir();
            }

            let version = undefined;
            if(dataset_path.startsWith("OpenNeuro/")) {
                const tokens = dataset_path.split("/");
                version = tokens[2]; // OpenNeuro/ds001499/1.0.0
            }

            console.log(" .. found", bids.datasets.length, "objects", dataset_path, version);
            handle_bids({
                path: dataset_path,
                version,
            }, bids, next_dir);
        });
    }, err=>{
        if(err) throw err;
        if(skipped.length > 0) {
            console.log("\nskipped dataset");
            console.dir(skipped);
        }

        db.disconnect();
        console.log("all done");
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
        if(err) return cb(err);
        if(!bids.dataset_description) return cb();

        //create new dataset for first time!
        if(!dldataset) dldataset = new db.DLDatasets(key);

        //we don't care if it's already removed
        if(dldataset.removed) return cb();

        if(bids.README) dldataset.README = bids.README;
        if(bids.CHANGED) dldataset.CHANGES = bids.CHANGES;
        if(bids.dataset_description) dldataset.dataset_description = bids.dataset_description;
        if(bids.participants) dldataset.participants = bids.participants;
        if(bids.participants_json) dldataset.participants_info = bids.participants_json;

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

        //TODO if we update bids_walker, then I need to invalidate commit_id for all dldatasets 
        //so that data will be re-registered (should I store the branlife npm package version number?)
        let commit_id = child_process.execSync("git rev-parse HEAD", {cwd: key.path, encoding: "utf8"}).trim();
        dldataset.commit_id = commit_id;

        //why was I doing this?
        //dldataset.removed = false;

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

                item.dataset.storage_config = {
                    files, 
                    commit_id, //let's set commit_id for provenance purpose (not used yet)
                    path: key.path, 
                    dldataset_id: dldataset._id, 
                    something: 'whatever' 
                };

                item.dataset.status = "stored"; //should I come up with something?

                //similar code exists in bl-bids-upload
                let itemkey = {
                    dldataset: dldataset._id,
                    "dataset.datatype": item.dataset.datatype,
                    "dataset.meta.subject": item.dataset.meta.subject,
                };
                if(item.dataset.meta.session) {
                    itemkey["dataset.meta.session"] = item.dataset.meta.session;
                }

                //need to append any bids entities that make this object unique
                //https://github.com/bids-standard/bids-specification/blob/master/src/schema/entities.yaml
                let entities = [
                    "task", "acq", "ce", "rec", "dir", 
                    "run", "mod", "echo", "flip", "inv", "mt", "part", "recording",
                    "proc", "split", 
                ];
                entities.forEach(e=>{
                    if(item.dataset.meta[e]) itemkey["dataset.meta."+e] = item.dataset.meta[e];
                })

                db.DLItems.findOne(itemkey, (err, dlitem)=>{
                    if(err) return cb(err);
                    if(!dlitem) {
                        //new
                        dlitem = new db.DLItems(Object.assign(itemkey, {dataset: item.dataset, create_date: new Date()}));
                        dlitem.save(err=>{
                            if(err) return cb(err);
                            next_dataset();
                        });
                    } else {
                        db.DLItems.updateOne(itemkey, {$set: {dataset: item.dataset, update_date: new Date()}}, err=>{
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

