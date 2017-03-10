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

//things that user has pushed to the warehouse
//Each crate is a basically a whole workdir for wf service
//Each create is a directory containing .tar.gz for each task directory
//(tasks with no external inputs can be removed - since it can be just rerun)
//When pushed, the entire workdir should be stored (all tasks)
//But when pulled, only a single task(.tar.gz) can be pulled as needed
var crateSchema = mongoose.Schema({
    //user who registered this data
    user_id: {type: String, index: true},
    //project that this data belongs to
    project_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects'},

    /*
    //type of the data
    datatype_id : {type: mongoose.Schema.Types.ObjectId, ref: 'Datatypes'},
    products: mongoose.Schema.Types.Mixed,
    */

    //human readable name / desc
    name: String,
    desc: String, 

    //TODO I wonder if I should store this as part of input task (config?)
    //hierarchical information for this crate
    //for neuroscience 
    //research
    //    IIBISID: 2016-00001
    //    Modality: "MRI"
    //    StationName: "CT71271"
    //    radio_tracer: "DOTA NOC",
    //exam(/study)
    //    subject: 
    //    study_id: //StudyInstanceUID
    //    studytime: //StudyTimestamp
    //series
    //    series:  (SeriesDescription)
    //    series_num:  (some series repeats)
    //acquisition
    //    acquisition_num: (usually just 1?)
    hierarchy: mongoose.Schema.Types.Mixed,

    //current state of crate (archiving, failed, archived)
    status: String, 
    status_msg: String,
    
    //physical location of this crate (URI?)
    system: String, //azure, dc2, jetstream-swift, etc..

    //wf.instance
    instance: mongoose.Schema.Types.Mixed,

    //list of wf.task records stored in this crate (and products.json)
    //this allows qureying of data products based on service(validator) and config used
    tasks: [ mongoose.Schema.Types.Mixed ],

    create_date: { type: Date, default: Date.now },
})
exports.Crates = mongoose.model('Crates', crateSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// defines data type entry points (allowing user to upload)
//
var datatypeSchema = mongoose.Schema({
    //user who created this project 
    //user_id: {type: String, index: true}, 

    //admins: [ String ], //list of users who can administer this project (co-PIs?)
    //members: [ String ], //list of users who can access things under this project

    name: String,
    desc: String, 

    //list of files to accept (for dwi, it will be something like)
    //[
    //  {
    //  required: true
    //  name: "dwi",
    //  ext: ".nii.gz",
    //  },
    //  {
    //  required: true
    //  name: "bvecs",
    //  },
    //  {
    //  required: true
    //  name: "bvals",
    //  }
    //]
    files: [ mongoose.Schema.Types.Mixed ],

    //data type detail (TODO..)
    //config: mongoose.Schema.Types.Mixed, 

    //name of ABCD service that is used to validate this data
    validator: String, 

    //create_date: { type: Date, default: Date.now },
});
exports.Datatypes = mongoose.model('Datatypes', datatypeSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////

/*
exports.Datasets = mongoose.model('Datasets', 
    mongoose.Schema({
        user_id: {type: String, index: true},
        project_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects'},

        name: String, //name of the dataset
        desc: String, 
        //tags: [String], //brain region, spiecies, recording technique, etc..

        source: mongoose.Schema({
            service: String, //service which produced this dataset
            service_branch: String, //service 
        }),

        //any metadata associated with this dataset (data type, applications to be used for, etc..)
        config: mongoose.Schema.Types.Mixed, 

        create_date: { type: Date, default: Date.now },
    })
);
*/

///////////////////////////////////////////////////////////////////////////////////////////////////

/*
var application_schema = mongoose.Schema({
    user_id: {type: String, index: true},
    //gids: [ Number ], //list of auth service group IDs that should have access to this data

    project_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects'},

    //list of input datasets and directory names
    datasets: [{
        name: String,
        id: {type: mongoose.Schema.Types.ObjectId, ref: 'Datasets'},
    }],

    name: String, //user friendly name for this container
    desc: String, 

    //configuration for the service
    config: mongoose.Schema.Types.Mixed, 

    create_date: { type: Date, default: Date.now },
});
application_schema.index({name: 'text', desc: 'text'}); //TODO need to allow searching for dataset / projects..
exports.Applications = mongoose.model('Applications', application_schema);
*/
