
//contrib
const amqp = require("amqp");
const mongoose = require("mongoose");
const winston = require("winston");

//mine
const config = require("./config");
const logger = winston.createLogger(config.logger.winston);

//use native promise for mongoose
//without this, I will get Mongoose: mpromise (mongoose's default promise library) is deprecated
//mongoose.Promise = global.Promise; 
if(config.mongoose_debug) mongoose.set("debug", true);

let dataset_ex = null;
let amqp_conn = null;
function init_amqp(cb) {
    logger.info("connecting to amqp..");
    amqp_conn = amqp.createConnection(config.event.amqp, {reconnectBackoffTime: 1000*10});
    amqp_conn.once("ready", ()=>{
        logger.info("amqp connection ready.. creating exchanges");
        amqp_conn.exchange("warehouse.dataset", {autoDelete: false, durable: true, type: 'topic', confirm: true}, (ex)=>{
            dataset_ex = ex;
            cb();
        });
    });
    amqp_conn.on("error", (err)=>{
        logger.error("amqp connection error");
        logger.error(err);
    });
}

exports.init = (cb)=>{
    logger.debug("connecting to amqp");
    init_amqp(err=>{
        if(err) return cb(err);

        logger.debug("connecting to mongo");
        mongoose.connect(config.mongodb, {
            //TODO - isn't auto_reconnect set by default?
            server: { auto_reconnect: true, reconnectTries: Number.MAX_VALUE }
        }, err=>{
            if(err) return cb(err);
            logger.info("connected to mongo");
            cb();
        });
    });
}

function dataset_event(dataset) {
    if(!dataset_ex) {
        logger.error("amqp not connected - but event handler called");
        return;
    }
    if(!dataset.project) {
        logger.error("no project set - can't publish event");
        return;
    }
    let project = dataset.project._id || dataset.project;
    let key = project+"."+dataset._id;
    dataset_ex.publish(key, dataset, {});
}

exports.disconnect = function(cb) {
    mongoose.disconnect(cb);
    if(amqp_conn) {
        logger.debug("disconnecting from amqp");
        amqp_conn.setImplOptions({reconnect: false}); //https://github.com/postwait/node-amqp/issues/462
        amqp_conn.disconnect();
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////

var projectSchema = mongoose.Schema({
    //user who created this project 
    user_id: {type: String, index: true}, 

    admins: [ String ], //list of users who can administer this project (co-PIs?)
    members: [ String ], //list of users who can read/write things under this project
    guests: [ String ], //(for private project) list of users who has read access to datasets

    group_id: Number, //group id from auth service to host admins/members

    tags: [String], //used to classify projects

    name: String,
    desc: String, 

    //deprecated by publication
    readme: String,  //markdown

    avatar: String, //url for avatar

    //access control 
    //* private - only the project member can access
    //* public - accessible by anyone
    access: {type: String, default: "private" },

    //for a private project, list it for everyone to see the summary
    listed: { type: Boolean, default: false},

    //list of agreemenets that user must agree before accessing datasets
    agreements: [ new mongoose.Schema({agreement: String}) ], 
    
    create_date: { type: Date, default: Date.now },

    removed: { type: Boolean, default: false },
});
//projectSchema.index({admins: 1, members: 1, guest: 1});
exports.Projects = mongoose.model("Projects", projectSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////

var releaseSchema = mongoose.Schema({
    name: String, //"1", "2", etc..
    create_date: { type: Date, default: Date.now }, //release date
    removed: { type: Boolean, default: false },  //release should not removed.. but just in case
});
mongoose.model("Releases", releaseSchema);

var publicationSchema = mongoose.Schema({
    
    //user who created this publication 
    user_id: {type: String, index: true}, 

    license: String, //cc0, ccby.40, etc.
    doi: String, //doi for this dataset (we generate this)
    paper_doi: String, //doi for the paper (journal should publish this)

    fundings: [ new mongoose.Schema({funder: String, id: String}) ], 
    
    //project that this data belongs to
    project: {type: mongoose.Schema.Types.ObjectId, ref: "Projects"},

    authors: [ String ], //list of users who are the author/creator of this publicaions
    contributors: [ String ], //list of users who contributed (PI, etc..)

    publisher: String, //NatureScientificData //TODO - is this used?
    
    name: String, //title of the publication
    desc: String, 
    tags: [String], //software, eeg, mri, etc..
    readme: String, //markdown (abstract in https://purl.stanford.edu/rt034xr8593)

    releases: [ releaseSchema ],

    create_date: { type: Date, default: Date.now },

    removed: { type: Boolean, default: false }, //only admin can remove publication for now (so that doi won't break)
});
exports.Publications = mongoose.model("Publications", publicationSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// data that's entered to the warehouse
// each data is a .tar.gz of a task directory from wf service
//
var datasetSchema = mongoose.Schema({
    
    //user who submitted this rule. task will run under this user
    user_id: {type: String, index: true},
    
    //project that this data belongs to
    project: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects', index: true},

    //type of the data
    datatype : {type: mongoose.Schema.Types.ObjectId, ref: 'Datatypes', index: true},
    datatype_tags: [String], //add specificity to datatype (different from "tags" which is used for searching)

    //meta fields as specified in the datatype.meta
    meta: mongoose.Schema.Types.Mixed,
    
    //human readable name / desc
    //name: String, //deprecated
    desc: String, 

    tags: [String], //allows user to search by tags (not datatype_tags)

    //physical location of this crate (URI?)
    storage: String, //azure, dc2, sda?, jetstream-swift, etc.. (as configured in /config)
    //any extra storage config (maybe like subdir needed to access the dataset)
    storage_config: mongoose.Schema.Types.Mixed, 
    //size of datasets (when downloaded). at the momenet, size is only set when it's copied to SDA
    size: Number,

    //not set if user uploaded it. 
    prov: {
        task: mongoose.Schema.Types.Mixed, //task document at the time of archival
        output_id: String, 
        subdir: String, //(optional) subdir that contained the actual output. often output_id == subdir

        ///////////////////////////////////////
        // DEPRECATED .. don't use these
        instance_id: String,  //deprecated by prov.task.instance_id
        task_id: String, //deprecated by prov.task._id
        //
        ///////////////////////////////////////

        /* task.config sample..
        "_app": "5a21bf932adf297d2e3afa29",
        "_tid": 1,
        "_inputs": [
            {
                "keys": [
                    "t1"
                ],
                "id": "anat",
                "subdir": "5bcf676af36818213e17e5b3",
                "dataset_id": "5bcf676af36818213e17e5b3",
                "task_id": "5bd34be2e04a503518838804",
                "datatype": "58c33bcee13a50849b25879a",
                "datatype_tags": [
                    "acpc_aligned"
                ],
                "tags": [
                    "soichi"
                ],
                "meta": {
                    "subject": "0001"
                },
                "project": "58eeceaabb2e2e2bd70d4682"
            }
        ],
        "_outputs": [
            {
                "id": "out",
                "datatype": "58c33bcee13a50849b25879a",
                "desc": "out from ACPC alignment via ART",
                "meta": {
                    "subject": "0001"
                },
                "files": null,
                "datatype_tags": [
                    "acpc_aligned"
                ]
            }
        ]
        */

    },

    //product.json content for this dataset (new) - might be subset of task.product
    product: mongoose.Schema.Types.Mixed,

    //storing - dataset is currently being archived (default)
    //stored dataset is stored on storage system
    //failed failed to archive to storage system
    //removed dataset is removed from storage system
    status: { type: String, default: "storing" },
    status_msg: String,

    download_count: { type: Number, default: 0}, //number of time this dataset was downloaded

    create_date: { type: Date, default: Date.now }, //date when this dataset was registered
    backup_date: Date, //date when this dataset was copied to the SDA (not set if it's not yet backed up)
    download_date: Date, //last time this dataset was downloaded
    remove_date: Date, //date when this dataset was removed
    update_date: { type: Date, index: true }, //date which this document was last updated (used by rule handler)

    removed: { type: Boolean, default: false},

    //list of publications that this datasets is published under (point to releases ID under publications)
    publications: [{type: mongoose.Schema.Types.ObjectId, ref: 'Releases'}],
});

datasetSchema.post('validate', function() {
    //normalize meta fields that needs to be in string 
    if(this.meta) {
        if(typeof this.meta.subject == 'number') this.meta.subject = this.meta.subject.toString();
        if(typeof this.meta.session == 'number') this.meta.session = this.meta.session.toString();
        if(typeof this.meta.run == 'number') this.meta.run = this.meta.run.toString();
    }
});

datasetSchema.post('save', dataset_event);
datasetSchema.post('findOneAndUpdate', dataset_event);
datasetSchema.post('findOneAndRemove', dataset_event);
datasetSchema.post('remove', dataset_event);
datasetSchema.pre('save', function(next) {
    console.log("updating dataset....................................", this._id);
    this.update_date = new Date;
    next();
});

datasetSchema.index({'$**': 'text'}) //make all text fields searchable
datasetSchema.index({project: 1, 'prov.task.instance_id': 1, removed: 1});
exports.Datasets = mongoose.model('Datasets', datasetSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// UI Catalog
//
var UISchema = mongoose.Schema({
    ui: String, //maybe to be deprecated?
    name: String, 
    desc: String, 
    avatar: String, //url of avatar
    docker: { type: Boolean, default: false}, //UI runs on docker container
});
exports.UIs = mongoose.model('UIs', UISchema);

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// defines data type entry points (allowing user to upload)
//

var datatypeSchema = mongoose.Schema({
    name: String, //"neuro/anat/t1w"
    desc: String, 
    readme: String,  //in markdown

    admins: [ String ], //list of users who can administer this datatype
    
    //file inventory for this datatype
    files: [ new mongoose.Schema({
        id: String,

        //either filename or dirname should be set
        filename: String,
        dirname: String, 

        desc: String,
        ext: String, //ui accept filter (for datatypes with validator)
        required: Boolean
    })],

    //list of *official* datatypes
    datatype_tags: [
        {
            datatype_tag: String,
            desc: String,
        }
    ],

    //name of ABCD service that is used to validate this data
    //if not set, it will default to "soichih/sca-service-conneval-validate" (still true?)
    validator: String, 

    //spec used to export this datatype to bids
    bids: {
        //should I move derivatives to maps - so that 1 dataset can output files for more than 1 modality?
        derivatives: String, //dwi/func/anat (meaningless if maps is empty)
        maps: [ {
            src: String, //file pattern "dwi_aligned*.nii.gz"
            dest: String, //bids file suffix.ext (dwi.nii.gz)
            json: String, //bids sidecar filename (dwi.json) (optional)
        }],
    },

    //registered UIs for this datatype
    uis: [{type: mongoose.Schema.Types.ObjectId, ref: 'UIs'}], 

    //published datasets that can be used as sample datasets
    //in the future, all sample datasets will be permanently staged and allows quick access
    samples: [{type: mongoose.Schema.Types.ObjectId, ref: 'Datasets'}],

    create_date: { type: Date, default: Date.now },
});
exports.Datatypes = mongoose.model('Datatypes', datatypeSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////

var appSchema = mongoose.Schema({
    user_id: {type: String, index: true}, //registrar of this application
    projects: [{type: mongoose.Schema.Types.ObjectId, ref: 'Projects'}], //projects that this app is members of
    admins: [ String ], //list of users who can administer this app
    avatar: String, //url for app avatar

    name: String,

    //TODO - citation / references can easily be part of README.md on github..
    citation: String,
    references: [ new mongoose.Schema({text: String}) ], 

    ///////////////////////////////////////////////////////////////////////////////////////////////
    //
    //
    github: String, //if the app is stored in github
    github_branch: String, //default to "master"

    //(TODO) these fields should be cached from github (how often?)
    // like .. 
    // https://api.github.com/repos/brain-life/app-life
    //      https://api.github.com/repos/brain-life/app-life/contributors
    desc: String,  //pulled from github
    desc_override: String, //if user wants to override the githut desc

    tags: [String], //pulled from github/repo topics
    contributors: [ {name: String, email: String} ], //populated by appinfo from github
    //
    //
    ///////////////////////////////////////////////////////////////////////////////////////////////

    retry: Number, //not set, or 0 means no retry
    doi: String, //doi associated with this app
    
    //configuration template
    config: mongoose.Schema.Types.Mixed, 

    //input files for this application
    inputs: [ new mongoose.Schema({
        id: String,
        desc: String, //any description to show for this input (experimental)
        datatype : {type: mongoose.Schema.Types.ObjectId, ref: 'Datatypes'},
        datatype_tags: [ String ], //add specifificity to datatype (like "acpc-aligned")

        optional: { type: Boolean, default: false}, //input is optional (false for arra means requires at least one)
        multi: { type: Boolean, default: false}, //array input
    })],

    //output files for this application
    //TODO right now, we can only deal with a single output data types per task
    outputs: [ new mongoose.Schema({
        id: String, //output files should be stored on a directory that matches this id (unless output_on_root is true)
        datatype : {type: mongoose.Schema.Types.ObjectId, ref: 'Datatypes'},
        datatype_tags: [ String ], //add specifificity to datatype (like "acpc-aligned")
        datatype_tags_pass: String, //add all datatype tags of input dataset with specified ID

        output_on_root: { type: Boolean, default: false},  //output files are stored on the root of workdir
        files: mongoose.Schema.Types.Mixed, //(when output_on_root is true) optional output file/dir mapping to datatype file_id
    })],
        
    //_rate: {type: Number, default: 0}, //1-5 scale rating of this app - precomputed (0 means not set)

    //basic stats for this app (aggregated by bin/appinfo.js - most info comes from amaretti/service/info)
    stats: {
        requested: Number, //number of times this app was requested
        users: Number, //number of users who used this app
        stars: Number, //github stars
        success_rate: Number, 
    },
    
    removed: { type: Boolean, default: false} ,

    create_date: { type: Date, default: Date.now },
}, {minimize: false}); //to keep empty config{} from disappearing
appSchema.index({'$**': 'text'}) //make all text fields searchable
exports.Apps = mongoose.model('Apps', appSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// App rating submitte by user (DEPRECATED?)
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
    //input_project: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects'},
    //project to store generated dataset
    //output_project: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects'},

    //project to look for input datasets and store generated datasets to
    project: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects'},

    //any tags to look for each input id (object with key(output id)=>array(tags))
    input_tags: mongoose.Schema.Types.Mixed,
    
    //if user wants to override where the input data comes from, specify projects IDs keyed by input id
    input_project_override: mongoose.Schema.Types.Mixed,

    //EXPERIMENTAL .. specify input selection strategy
    //options are..
    //          (default) looks for the *latest* datasets that it finds
    //          ignore: submit without this dataset (used for optional input dataset)
    input_selection: mongoose.Schema.Types.Mixed,

    //app to submit
    app: {type: mongoose.Schema.Types.ObjectId, ref: 'Apps'},
    branch: String, //branch to use (required for new rules)
    
    //scalar configs (input configs are used to detect new datasets)
    config: mongoose.Schema.Types.Mixed, 

    //datatype tags to add to each input datatype (keyed by input id, then array of tags)
    extra_datatype_tags: mongoose.Schema.Types.Mixed,

    //any tags to set for each output id (object with key(output id)=>array(tags))
    output_tags: mongoose.Schema.Types.Mixed,

    //only process subjects that ends with this if set
    subject_match: String,

    //when the rule is first defined
    create_date: { type: Date, default: Date.now },
    update_date: { type: Date, default: Date.now }, //date which this document was last updated 
    handle_date: { type: Date }, //date which the rule was last handled

    removed: { type: Boolean, default: false} ,

    //allows user to temporarily disable processing of the rule
    active: { type: Boolean, default: true } ,

}, {minimize: false}); //to keep empty config{} from disappearing
exports.Rules = mongoose.model('Rules', ruleSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Downtoken just stores list of dataset ids to allow downloading of the dataset
//
/*
var downtokenSchema = mongoose.Schema({
    user_id: {type: String, index: true}, 

    ids: [{type: mongoose.Schema.Types.ObjectId, ref: 'Datasets'}], 

    count: {type: Number, default: 0 }, //number of time accessed?

    //exp_date: { type: Date },
    create_date: { type: Date, default: Date.now },
});
exports.Downtokens = mongoose.model('Downtokens', downtokenSchema);
*/
