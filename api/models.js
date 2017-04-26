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
    mongoose.connect(config.mongodb, {reconnectTries: Number.MAX_VALUE}, (err)=>{
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

    name: String,
    desc: String, 

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

    //provenance info (if it's derivative) - not set if user uploaded it
    prov: {
        //application that produced this data (not set if user uploaded it)
        app: {type: mongoose.Schema.Types.ObjectId, ref: 'Apps'},
        
        //dataset used by the application to generate this data
        deps: [{
            input_id: String, 
            dataset: {type: mongoose.Schema.Types.ObjectId, ref: 'Datasets'}
        }],
        //app config used to generate the data
        config: mongoose.Schema.Types.Mixed, 

        //instance / task ID from workflow service
        instance_id: String,
        task_id: String,
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

    //name of ABCD service that is used to validate this data (TODO..)
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
    })],

    create_date: { type: Date, default: Date.now },
});
exports.Apps = mongoose.model('Apps', appSchema);


