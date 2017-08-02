'use strict';

//contrib
const mongoose = require('mongoose');
const winston = require('winston');

//mine
const config = require('./config');
const logger = new winston.Logger(config.logger.winston);

if(config.debug) {
    mongoose.set('debug', true);
}

exports.init = (cb)=>{
    mongoose.connect(config.mongodb, {
        //TODO - isn't auto_reconnect set by default?
        server: { auto_reconnect: true, reconnectTries: Number.MAX_VALUE }
    }, err=>{
        if(err) return cb(err);
        logger.info("connected to mongo");
        cb();
    });
}
exports.disconnect = function(cb) {
    mongoose.disconnect(cb);
}

///////////////////////////////////////////////////////////////////////////////////////////////////

var projectSchema = mongoose.Schema({
    //user who created this project 
    user_id: {type: String, index: true}, 

    //gid: {type: Number, index: true},
    admins: [ String ], //list of users who can administer this project (co-PIs?)
    members: [ String ], //list of users who can access things under this project

    tags: [String], //used to classify projects

    name: String,
    desc: String, 

    readme: String,  //markdown

    avatar: String, //url for avatar

    //project details
    //config: mongoose.Schema.Types.Mixed, 

    //access control 
    //* private - only the project member can access
    //* public - accessible by anyone
    access: {type: String, default: "private" },
    
    create_date: { type: Date, default: Date.now },

    removed: { type: Boolean, default: false },
});
exports.Projects = mongoose.model('Projects', projectSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////
//data that's entered to the warehouse
//each data is a .tar.gz of a task directory from wf service
var datasetSchema = mongoose.Schema({
    
    //user who submitted this rule. task will run under this user
    user_id: {type: String, index: true},
    
    //project that this data belongs to
    project: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects'},

    //type of the data
    datatype : {type: mongoose.Schema.Types.ObjectId, ref: 'Datatypes'},
    datatype_tags: [String], //add specificity to datatype (different from "tags" which is used for searching)

    //meta fields as specified in the datatype.meta
    meta: mongoose.Schema.Types.Mixed,
    
    //human readable name / desc
    name: String,
    desc: String, 

    tags: [String], //allows user to search by tags (not datatype_tags)

    //physical location of this crate (URI?)
    storage: String, //azure, dc2, sda?, jetstream-swift, etc.. (as configured in /config)
    //any extra storage config (maybe like subdir needed to access the dataset)
    storage_config: mongoose.Schema.Types.Mixed, 

    //not set if user uploaded it. 
    prov: {
        app: {type: mongoose.Schema.Types.ObjectId, ref: 'Apps'}, //application that created this data
        instance_id: String, //output task's instance_id
        task_id: String, //output task id
        output_id: String, //output task's output id
        subdir: String, //subdir that contained the actual output. often output_id == subdir
    },

    create_date: { type: Date, default: Date.now },

    status: { type: String, default: "storing" },
    //storing (default)
    //stored (dataset is stored on storage system, but not yet archive), 
    //failed (failed to store to storage system)
    //archived (dataset is stored on storage system and on sda)
    status_msg: String,

    archive_date: { type: Date }, //date when the content of this dataset was archived to tape
    archive_path: String, //htar path
    archive_file: String, //file name that this dataset is stored as

    removed: { type: Boolean, default: false} ,
})
datasetSchema.index({'$**': 'text'}) //make all text fields searchable
exports.Datasets = mongoose.model('Datasets', datasetSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// defines data type entry points (allowing user to upload)
//
var datatypeSchema = mongoose.Schema({
    name: String,
    desc: String, 

    //file inventory for this datatype
    //files: [ mongoose.Schema.Types.Mixed ],
    files: [ new mongoose.Schema({
        id: String,
        filename: String,
        dirname: String, //should use filename instead?
        desc: String,
        ext: String,
        required: Boolean
    })],
    /*
    [ 
        {
            "id" : "DT_STREAM",
            "filename" : "output.DT_STREAM.tck",
            "desc" : "Tensor / Deterministic Tracks",
            "ext" : ".tck",
            "required" : true
        }, 
    ]
    */

    //name of ABCD service that is used to validate this data
    //if not set, it will default to "soichih/sca-service-conneval-validate"
    validator: String, 

    meta: [ new mongoose.Schema({
        id: String,
        type: String,
        required: Boolean,
    })],
    /*
    "meta": [
        {
            "id": "subject",
            "type": "string",
            "required": true
        }
    ]
    */

    //create_date: { type: Date, default: Date.now },
});
exports.Datatypes = mongoose.model('Datatypes', datatypeSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////

var appSchema = mongoose.Schema({
    //owner of this application
    user_id: {type: String, index: true}, 

    admins: [ String ], //list of users who can administer this app
    
    name: String,
    desc: String, 

    tags: [String], //used to classify apps

    avatar: String, //url for avatar

    //application storage
    github: String, //if the app is stored in github
    github_branch: String, //default to "master"

    retry: Number, //not set, or 0 means no retry

    dockerhub: String, //if the app is stored in dockerhub
    
    //configuration template
    config: mongoose.Schema.Types.Mixed, 

    //input files for this application
    inputs: [ new mongoose.Schema({
        id: String,
        datatype : {type: mongoose.Schema.Types.ObjectId, ref: 'Datatypes'},
        datatype_tags: [ String ], //add specifificity to datatype (like "acpc-aligned")
    })],

    //output files for this application
    //TODO right now, we can only deal with a single output data types per task
    outputs: [ new mongoose.Schema({
        id: String,
        datatype : {type: mongoose.Schema.Types.ObjectId, ref: 'Datatypes'},
        datatype_tags: [ String ], //add specifificity to datatype (like "acpc-aligned")

        //optional output file/dir mapping to datatype file_id
        files: mongoose.Schema.Types.Mixed,
    })],
        
    _rate: {type: Number, default: 0}, //1-5 scale rating of this app - precomputed (0 means not set)
    removed: { type: Boolean, default: false} ,

    create_date: { type: Date, default: Date.now },
});
exports.Apps = mongoose.model('Apps', appSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// App rating submitte by user
//

var apprateSchema = mongoose.Schema({
    user_id: {type: String, index: true}, 
    app: {type: mongoose.Schema.Types.ObjectId, ref: 'Apps'},
    rate: Number, //1-5 scale rating
});
exports.Apprates = mongoose.model('Apprates', apprateSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Project Rules
//
// Rule defines following.
// 1) datasets(datatype/tags) that should exist for each subject
// 2) for each missing datasets, application / scaler configuration used to generate the missing output dataset
//      for each input configuration, input datatype/tags to use

var ruleSchema = mongoose.Schema({

    name: String,
    desc: String, 

    //user submitted this rule (all tasks will be submitted under this user)
    user_id: {type: String, index: true}, 
    
    //project to look for missing datasets and to archive generated data
    input_project: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects'},
    
    //if user wants to override where the input data comes from, specify projects IDs keyed by input id
    input_project_override: mongoose.Schema.Types.Mixed,

    //app to submit
    app: {type: mongoose.Schema.Types.ObjectId, ref: 'Apps'},
    //scalar configs (input configs are used to detect new datasets)
    config: mongoose.Schema.Types.Mixed, 

    //project to store generated dataset
    output_project: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects'},
    //any tags to set for each output id (object with key(output id)=>array(tags))
    output_tags: mongoose.Schema.Types.Mixed,

    //only process subjects that ends with this if set
    subject_match: String,

    //when the rule is first defined
    create_date: { type: Date, default: Date.now },

    removed: { type: Boolean, default: false} ,
    active: { type: Boolean, default: true} ,
});
exports.Rules = mongoose.model('Rules', ruleSchema);


