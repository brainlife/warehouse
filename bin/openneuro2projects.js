#!/usr/bin/env node
//cronjob script to ingest openneuro datasets as brainlife projects

const mongoose = require("mongoose");
const winston = require("winston");
const rp = require('request-promise-native');
const async = require('async');

const config = require("../api/config");
const logger = winston.createLogger(config.logger.winston);
const db = require('../api/models');

//make this configurable or pull from DB
let admin_uid = "1";
let project_group_id = 1; //brainlife default group (TODO - does this mean everyone has write access?)
let datatypes = {
    "neuro/anat/t1w": "58c33bcee13a50849b25879a",
    "neuro/anat/t2w": "594c0325fa1d2e5a1f0beda5",
    "neuro/dwi": "58c33c5fe13a50849b25879b",
    "neuro/func/task": "59b685a08e5d38b0b331ddc5",
    "neuro/fmap": "5c390505f9109beac42b00df",
}

async function asyncForEach(array, callback) {
    logger.debug("handling "+array.length+" items in async");
    let awaits = [];
    for (let index = 0; index < array.length; index++) {
        awaits.push(callback(array[index], index, array));
    }
    await Promise.all(awaits);
}

async function list_datasets() {
    logger.debug("listing datasets from openneuro");
    let edges = "edges { node { id name public created snapshots { tag created } analytics { downloads views } } }";

    let items = [];
    let hasNextPage = true;
    let cursor = null;
    while(hasNextPage) {
        logger.debug("loading another page. items:%d", items.length);
        page_query = "first: 50";
        if(cursor) page_query += "after: \""+cursor+"\"";
        
        //load next page
        let all_query = "query { datasets("+page_query+") { "+edges+" pageInfo { hasNextPage endCursor } } }";
        let body = await rp({json: true, method: 'POST', 
            uri: 'https://openneuro.org/crn/graphql', 
            body: {query: all_query},
        });
        body.data.datasets.edges.forEach(edge=>items.push(edge.node));
        cursor = body.data.datasets.pageInfo.endCursor;
        hasNextPage = body.data.datasets.pageInfo.hasNextPage;
    }

    console.log("datasets count: %d", items.length);
    return items;

}

async function load_snapshot(dataset_id, snapshot_tag, cb) {
    logger.debug("loading snapshot detail for tag:%s", snapshot_tag);
    try  {
        let query = "query { snapshot(datasetId: \""+dataset_id+"\" tag: \""+snapshot_tag+"\") { tag created description { Name  License } files {id filename size urls objectpath } } }";
        let body = await rp({json: true, method: 'POST', 
            uri: 'https://openneuro.org/crn/graphql', 
            body: {query},
        });
        cb(null, body.data.snapshot);
    } catch(err) {
        cb(err);
    }
}

function load_root_meta(files, cb) {
    let rootfiles = [];
    files.forEach(file=>{
        let filename_tokens = file.filename.split("/");
        if(filename_tokens.length == 1) rootfiles.push(file);
    });

    //now load all root files
    async.eachSeries(rootfiles, async rootfile=>{
        let is_json = rootfile.filename.endsWith(".json");
        console.log("loading "+rootfile.filename);
        if(!rootfile.urls || rootfile.urls.length == 0) {
            logger.error("can't load.. as urls not set or empty");
            logger.error(JSON.stringify(rootfile, null, 4));
            return;
        }
        rootfile.body = await rp({json: is_json, uri: rootfile.urls[0] });
    }, err=>{
        let rootmeta = {};
        rootfiles.forEach(file=>{
            if(file.body) rootmeta[file.filename] = file;
        });
        cb(err, rootmeta);
    });
}

function group_files(files) {
    let groups = {}; //keyed by structual meta
    files.forEach(file=>{
        if(file.urls.length == 0) {
            logger.error("urls is empty");
            logger.debug(JSON.stringify(file, null, 4));
            return;
        }
        
        //parse bids filepath
        let filename_tokens = file.filename.split("/");

        if(filename_tokens[0] == "derivatives") {
            logger.warn("derivatives is TODO..: %s", file.filename);
            return;
        }
        if(filename_tokens.length == 1) return; //root items are handled by load_root_meta

        let bids_filename = filename_tokens.pop(); //sub-10_T1w.nii.gz
        let modality = filename_tokens.pop(); //anat/func, etc..
        
        //rest goes to the meta
        let meta = {};
        let dir;
        filename_tokens.forEach(token=>{
            let token_parts = token.split("-");
            meta[token_parts[0]] = token_parts[1];
        });

        //directory org with file level meta
        let filename_meta = bids_filename.split("_");
        let filename = filename_meta.pop(); //T1w.nii.gz
        filename_meta.forEach(token=>{
            let token_parts = token.split("-");
            if(token_parts[0] == "dir") {
                dir = token_parts[1].toLowerCase(); //AP > ap
                return; //for fmap/dir- we don't want to group different dir- together.
            }
            meta[token_parts[0]] = token_parts[1];
        });

        //rename "sub" to "subject" and "ses" to "session"
        if(meta.sub) {
            meta.subject = meta.sub;
            delete meta.sub;
        }
        if(meta.ses) {
            meta.session = meta.ses;
            delete meta.ses;
        }

        let key = JSON.stringify({meta, modality});
        if(!groups[key]) groups[key] = [];
        groups[key].push({
            file,
            filename,
            dir,
        });
    });
    return groups;
}

//some group contains multiple datasets (like t1w and t2w together..)
function split_groups(in_groups) {
    let groups = {};
    for(let key in in_groups) {
        group = in_groups[key];
        let keyobj = JSON.parse(key);

        let t1 = false;
        let t2 = false;
        group.forEach(item=>{
            switch(item.filename) {
            case "T1w.nii.gz":
                t1 = true;
                break;
            case "T2w.nii.gz":
                t2 = true;
                break;
            }
        });

        if(t1 && t2) {
            logger.warn("both t1 and t2 exists... splitting");
            let t1group = [];
            let t2group = [];
            key1 = Object.assign({t1: true}, keyobj);
            key2 = Object.assign({t2: true}, keyobj);
            group.forEach(item=>{
                if(item.filename.includes("T1")) t1group.push(item);
                if(item.filename.includes("T2")) t2group.push(item);
            });
            groups[JSON.stringify(key1)] = t1group;
            groups[JSON.stringify(key2)] = t2group;
            continue;
        }

        //keep it the same
        groups[key] = group;
    }
    return groups;
}

function upsert_project(rootmeta, dataset, snapshot, cb) {
    db.Projects.findOne({"openneuro.dataset_id": dataset.id}).exec((err, project)=>{
        if(err) return cb(err);
        if(!project) {
            logger.debug("creating new project");
            project = new db.Projects({
                //make soichi the admin for now..
                user_id: admin_uid,
                admins: [admin_uid], 
                group_id: project_group_id,
                //avatar: "https://raw.githubusercontent.com/brain-life/brainlife.github.io/master/images/project-logos/openneuro.png",
                avatar: "https://avatars3.githubusercontent.com/u/30672233",
                access: "public",
                created_date: new Date(snapshot.created),
                //agreements: [ {agreement: "You agree to OpenNeuro's AUP"} ],
                openneuro: {
                    dataset_id: dataset.id,
                },
            });
        }

        //fields that we should be able to update
        //project.name = dataset.name;
        project.name = "openneuro / "+dataset.id;
        project.desc = snapshot.description.Name;
        project.readme = snapshot.description.License;  //fallback.. TODO 
        if(rootmeta["README"]) project.readme = rootmeta["README"].body; //TODO - need to replace \n..
        //project.readme += "\n\nhttps://openneuro.org/datasets/"+dataset.id+"/versions/"+snapshot.tag;

        logger.info("upsert project %s %s", project.name, project._id.toString());
        project.save(err=>{
            cb(err, project);
        });
    });
}

//get file id of the largest file in the group
function compute_file_id(group) {
    let size = 0;
    let id;
    group.forEach(g=>{
        if(g.file.size > size) {
            id = g.file.id;
            size = g.file.size;
        }
    });
    return id;
}

function upsert_datasets(project, rootmeta, snapshot, groups, cb) {
    async.eachOfSeries(groups, (group, _key, next_group)=>{
        let key = JSON.parse(_key); //meta/modality

        ///////////////////////////////////////////////////////////////////////
        //
        //if(key.meta.subject != "010001") return next_group();
        //
        ///////////////////////////////////////////////////////////////////////

        let file_id = compute_file_id(group);
        console.log("loading %s", file_id);
        db.Datasets.findOne({removed: false, project, "storage_config.file_id": file_id}).exec(async (err, dataset)=>{
            if(err) return next_group(err);
            if(dataset) {
                logger.debug("already registered %s", file_id);
                return next_group();
            }
           
            //create new dataset
            dataset = {
                user_id: admin_uid, 
                project,
                //datatype_tags: [], 
                //desc: group[0].filename, //just use the first one..
                tags: ["snapshot-"+snapshot.tag], 
                storage: "url",
                storage_config: {
                    file_id,
                    files: [],
                },
                create_date: new Date(snapshot.created), //no file specific create date as far as I can tell
                status: "stored",
            }

            //pull things from meta for tags
            if(key.meta.session) dataset.tags.push("ses-"+key.meta.session);
            if(key.meta.run) dataset.tags.push("run-"+key.meta.run);
            if(key.meta.acq) dataset.tags.push("acq-"+key.meta.acq);
            if(key.meta.task) dataset.tags.push("task-"+key.meta.task);

            dataset.meta = Object.assign({}, key.meta);

            //set datatype / files
            switch(key.modality) {
            case "anat":
                //check if it's t1 or t2..
                let t1 = false;
                let t2 = false;
                group.forEach(item=>{
                    switch(item.filename) {
                    case "T1w.nii.gz":
                        t1 = true;
                        break;
                    case "T2w.nii.gz":
                        t2 = true;
                        break;
                    }
                });
                if(t1 && t2) {
                    logger.error("both t1 and t2 exists... I need to split this group!")
                    break;
                }
                if(!t1 && !t2) {
                    logger.debug(JSON.stringify(group, null, 4));
                    logger.error("neighet t1 or t2 detected for anat.. odd");
                    break;
                }

                if(t1) {
                    dataset.datatype = datatypes["neuro/anat/t1w"];
                    if(rootmeta["T1w.json"]) Object.assign(dataset.meta, rootmeta["T1w.json"].body);
                }
                if(t2) {
                    dataset.datatype = datatypes["neuro/anat/t2w"];
                    if(rootmeta["T2w.json"]) Object.assign(dataset.meta, rootmeta["T2w.json"].body);
                }
                await asyncForEach(group, async item=>{
                    let body;
                    switch(item.filename) {
                    case "T1w.json":
                        logger.debug("loading T1w.json");
                        body = await rp({ json: true, uri: item.file.urls[0] });
                        Object.assign(dataset.meta, body);
                        break;
                    case "T1w.nii.gz":
                        dataset.storage_config.files.push({ local: "t1.nii.gz", url: item.file.urls[0], });
                        break;
                    case "T2w.json":
                        logger.debug("loading T2w.json");
                        body = await rp({ json: true, uri: item.file.urls[0] });
                        Object.assign(dataset.meta, body);
                        break;
                    case "T2w.nii.gz":
                        dataset.storage_config.files.push({ local: "t2.nii.gz", url: item.file.urls[0], });
                        break;
                    case "FLAIR.json":
                    case "FLAIR.nii.gz":
                    case "GRE.json":
                    case "GRE.nii.gz":
                    case "defacemask.nii.gz":
                    case "T1map.nii.gz":
                    case "mp2rage.json":
                    case "mp2rage.nii.gz":
                    case "inplaneT2.nii.gz":
                    case "inplaneT2.json":
                        logger.warn("don't know how to handle "+item.filename);
                        break;
                    default:
                        logger.error("unknown file in anat");
                        logger.debug(JSON.stringify(item, null, 4));
                    }
                });
                break;
            case "func":
                dataset.datatype = datatypes["neuro/func/task"];
                dataset.datatype_tags = [key.meta.task];
                let json_name = "task-"+key.meta.task+"_bold.json";
                if(rootmeta[json_name]) Object.assign(dataset.meta, rootmeta[json_name].body);
                await asyncForEach(group, async item=>{
                    switch(item.filename) {
                    case "bold.json":
                        //logger.debug("loading bold.json");
                        let body = await rp({ json: true, uri: item.file.urls[0] });
                        Object.assign(dataset.meta, body);
                        break;

                    case "bold.nii.gz":
                    case "events.tsv":
                    case "events.json":
                    case "sbref.nii.gz":
                    case "sbref.json":
                    case "physio.tsv.gz":
                    case "physio.json":
                        dataset.storage_config.files.push({ local: item.filename, url: item.file.urls[0], });
                        break;

                    case "defacemask.nii.gz":
                        logger.warn("don't know how to handle defacemask.nii.gz for func.. skipping");
                        break;
                    default:
                        logger.error("unknown file in func");
                        logger.error(JSON.stringify(item, null, 4));
                    }
                });
                break;
            case "dwi":
                dataset.datatype = datatypes["neuro/dwi"];
                if(rootmeta["dwi.json"]) Object.assign(dataset.meta, rootmeta["dwi.json"].body);
                let has_bvecs = false;
                let has_bvals = false;
                await asyncForEach(group, async item=>{
                    let body;
                    switch(item.filename) {
                    case "dwi.json":
                        body = await rp({ json: true, uri: item.file.urls[0] });
                        Object.assign(dataset.meta, body);
                        break;
                    case "dwi.nii.gz":
                        dataset.storage_config.files.push({ local: "dwi.nii.gz", url: item.file.urls[0], });
                        break;
                    case "dwi.bvec":
                        dataset.storage_config.files.push({ local: "dwi.bvecs", url: item.file.urls[0], });
                        has_bvecs = true;
                        break;
                    case "dwi.bval":
                        dataset.storage_config.files.push({ local: "dwi.bvals", url: item.file.urls[0], });
                        has_bvals = true;
                        break;
                    default:
                        logger.error("unknown file in dwi");
                        logger.debug(JSON.stringify(item, null, 4));
                    }
                });

                //some dwi shared bvecs/bvals stored on root
                if(!has_bvecs && rootmeta["dwi.bvec"]) {
                    dataset.storage_config.files.push({ local: "dwi.bvecs", url: rootmeta["dwi.bvec"].urls[0] });
                }
                if(!has_bvals && rootmeta["dwi.bval"]) {
                    dataset.storage_config.files.push({ local: "dwi.bvals", url: rootmeta["dwi.bval"].urls[0] });
                }
                
                break;
            case "fmap":
                dataset.datatype = datatypes["neuro/fmap"];

                //figure out datatype_tag (phasediff, epi, real, or 2phasemag)
                group.forEach(item=>{
                    switch(item.filename) {
                    case "phase1.nii.gz": 
                        dataset.datatype_tags = ["2phasemag"];
			if(rootmeta["phase1.json"]) Object.assign(dataset.meta, {phase1: rootmeta["phase1.json"].body});
			if(rootmeta["phase2.json"]) Object.assign(dataset.meta, {phase2: rootmeta["phase2.json"].body});
			if(rootmeta["magnitude1.json"]) Object.assign(dataset.meta, {magnitude1: rootmeta["magnitude1.json"].body});
			if(rootmeta["magnitude2.json"]) Object.assign(dataset.meta, {magnitude2: rootmeta["magnitude2.json"].body});
                        break;
                    case "phasediff.nii.gz":
                        dataset.datatype_tags = ["phasediff"];
			if(rootmeta["phasediff.json"]) Object.assign(dataset.meta, rootmeta["phasediff.json"].body);
			if(rootmeta["magnitude1.json"]) Object.assign(dataset.meta, {magnitude1: rootmeta["magnitude1.json"].body});
			if(rootmeta["magnitude2.json"]) Object.assign(dataset.meta, {magnitude2: rootmeta["magnitude2.json"].body});
                        break;
                    case "epi.nii.gz":
                        dataset.datatype_tags = ["epi"];
			//TODO -- any root items?
                        break;
                    case "fieldmap.nii.gz":
                        dataset.datatype_tags = ["real"];
			if(rootmeta["fieldmap.json"]) Object.assign(dataset.meta, rootmeta["fieldmap.json"].body);
			if(rootmeta["magnitude.json"]) Object.assign(dataset.meta, {magnitude: rootmeta["magnitude.json"].body});
                        break;
                    }
                });

                //see https://bids.neuroimaging.io/bids_spec.pdf
                //load files
                await asyncForEach(group, async item=>{
                    let body, name;
                    switch(item.filename) {
                    //phasediff things
                    case "phasediff.json":
                        body = await rp({ json: true, uri: item.file.urls[0] });
                        Object.assign(dataset.meta, body);
                        //fall through to store the json .. will be redundant with meta.. but just in case
                    case "phasediff.nii.gz":
                    case "magnitude1.nii.gz":
                    case "magnitude2.nii.gz":
                        dataset.storage_config.files.push({ local: item.filename, url: item.file.urls[0], });
                        break;

                    //2phasemag things
                    case "phase1.json":
                    case "phase2.json":
                    case "magnitude1.json":
                    case "magnitude2.json":
                        body = await rp({ json: true, uri: item.file.urls[0] });
                        name = item.filename.split(".")[0]; //phase1/phase2/magnitude1/magnitude2
                        Object.assign(dataset.meta, {[name]: body});
                        //fall through to store the json .. will be redundant with meta.. but just in case
                    case "phase1.nii.gz":
                    case "phase2.nii.gz":
                        dataset.storage_config.files.push({ local: item.filename, url: item.file.urls[0], });
                        break;
                           
                    //epi things
                    case "epi.json":
                        body = await rp({ json: true, uri: item.file.urls[0] });
                        Object.assign(dataset.meta, {[item.dir]: body});
                        //fall through to store the json .. will be redundant with meta.. but just in case
                    case "epi.nii.gz":
                        dataset.storage_config.files.push({ local: item.dir+"."+item.filename, url: item.file.urls[0], });
                        break;
                            
                    //real things
                    case "fieldmap.json":
                        body = await rp({ json: true, uri: item.file.urls[0] });
                        Object.assign(dataset.meta, body);
                        //fall through to store the json .. will be redundant with meta.. but just in case
                    case "magnitude.nii.gz":
                    case "fieldmap.nii.gz":
                        dataset.storage_config.files.push({ local: item.filename, url: item.file.urls[0], });
                        break;
                        
                    default:
                        logger.error("unknown file in fmap");
                        logger.debug(JSON.stringify(item, null, 4));
                    }
                });

                break;
            default: 
                logger.warn("unknown modality - or maybe some cross-modality file?:"+key.modality);
                logger.warn(JSON.stringify(group, null, 4));
                return next_group();
            }

            if(dataset.storage_config.files.length == 0) {
                logger.error("no files.. bailing");
                return next_group();
            }

            //console.log(JSON.stringify(dataset, null, 4));
            logger.info("saving dataset----------------");
            new db.Datasets(dataset).save(next_group);
        });
    }, cb);
}

function run() {
    db.init(async err=>{
        if(err) throw err;
        let datasets = await list_datasets();
        async.eachSeries(datasets, (dataset, next_dataset)=>{

            ///////////////////////////////////////////////////////////////////////////////////////
            // 
            // limit to a single dataset for now
            //
            //if(dataset.id != "ds001499") return next_dataset(); //empty urls
            //if(dataset.id != "ds000221") return next_dataset(); 
            if(dataset.id != "ds000224") return next_dataset(); 
            //if(dataset.id != "ds000115") return next_dataset(); 
            //
            //
            ///////////////////////////////////////////////////////////////////////////////////////

            console.log("%s %s", dataset.id, dataset.name);
            //find the latest snapshot
            dataset.snapshots.sort((a,b)=>{
                let a_date = new Date(a.created);
                let b_date = new Date(b.created);
                if(a_date < b_date) return 1;
                if(a_date > b_date) return -1;
                return 0;
            });
            if(dataset.snapshots.length == 0) {
                logger.warn("no snapshots for dataset:%s", dataset.id);
                return next_dataset();
            }
            if(dataset.analytics.downloads < 100) {
                logger.info("low download count.. skipping");
                return next_dataset();
            }
            let _snapshot = dataset.snapshots[0];
            logger.debug("snapshot:"+_snapshot.tag+" ----------------------------------------------------------------");
            logger.debug(JSON.stringify(dataset.analytics, null, 4));
            load_snapshot(dataset.id, _snapshot.tag, (err, snapshot)=>{
                if(err) return next_dataset(err);
                //console.dir(snapshot.created);
                //process.exit(1);
                load_root_meta(snapshot.files, (err, rootmeta)=>{
                    if(err) return next_dataset(err);
                    upsert_project(rootmeta, dataset, snapshot, (err, project)=>{
                        if(err) return next_dataset(err);
                        console.log("files:"+snapshot.files.length);
                        let groups = group_files(snapshot.files);
                        groups = split_groups(groups);
                        upsert_datasets(project, rootmeta, snapshot, groups, next_dataset);
                    });
                });
            });
        }, err=>{
            if(err) logger.error(err);
            db.disconnect(()=>{
                logger.info("all done");
                process.exit(0);
            });
        });
    });
}

run();
