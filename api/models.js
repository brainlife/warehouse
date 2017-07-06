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
        server: { reconnectTries: Number.MAX_VALUE }
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
});
exports.Projects = mongoose.model('Projects', projectSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////
//data that's entered to the warehouse
//each data is a .tar.gz of a task directory from wf service
var datasetSchema = mongoose.Schema({
    
    //user who registered this data
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

    /*
    //provenance info (if it's derivative) - not set if user uploaded it
    prov: {
        //application that produced this data (not set if user uploaded it)
        app: {type: mongoose.Schema.Types.ObjectId, ref: 'Apps'},

        //output id of the app (set when dataset is posted)
        //output_id: String, 
        
        //dataset used by the application to generate this data
        deps: [{
            input_id: String, 
            dataset: {type: mongoose.Schema.Types.ObjectId, ref: 'Datasets'}
        }],
        
        //config for main task used to generate the data
        config: mongoose.Schema.Types.Mixed, 

        //instance / output task ID from workflow service
        instance_id: String,
        task_id: String,
        dirname: String, //subdir that contained the output data
    },
    */
    
    //not set if user uploaded it. 
    prov: {
        app: {type: mongoose.Schema.Types.ObjectId, ref: 'Apps'}, //application that created this data
        task_id: String, //output task id
        dirname: String, //subdir that contain the output data (not set if it's on taskdir)
    },

    create_date: { type: Date, default: Date.now },

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

    //user submitted this rule (and the instance will be submitted under)
    user_id: {type: String, index: true}, 
    
    //project to store generated data
    project: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects'},

    //app to submit
    app: {type: mongoose.Schema.Types.ObjectId, ref: 'Apps'},
    app_config: mongoose.Schema.Types.Mixed, 

});
exports.Rules = mongoose.model('Rules', ruleSchema);



