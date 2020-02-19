
//contrib
const amqp = require("amqp");
const mongoose = require("mongoose");
const winston = require("winston");

//mine
const config = require("./config");
const logger = winston.createLogger(config.logger.winston);
const common = require("./common"); //circular?

mongoose.set("debug", config.mongoose_debug);

let amqp_conn = null;

//deprecated by warehouse_ex
let dataset_ex;
//let rule_ex;

function init_amqp(cb) {
    common.get_amqp_connection((err, conn)=>{
        if(err) throw err;

        amqp_conn = conn;

        //deprecated by warehouse_ex
        amqp_conn.exchange("warehouse.dataset", {autoDelete: false, durable: true, type: 'topic', confirm: true}, (ex)=>{
            dataset_ex = ex;
        });
        cb();
    });
}

exports.init = (cb)=>{
    logger.debug("connecting to amqp");
    init_amqp(err=>{
        if(err) return cb(err);

        logger.debug("connecting to mongo");
        mongoose.connect(config.mongodb, {
            useNewUrlParser: true,
            
            //TODO - isn't auto_reconnect set by default?
            //auto_reconnect: true, 
            //reconnectTries: Number.MAX_VALUE
        }, err=>{
            if(err) return cb(err);
            logger.info("connected to mongo");
            cb();
        });
    });
}

//deprecated...
exports.dataset_event = function(dataset) {
    if(!dataset) {
        logger.error("dataset_event called with undefined dataset");
        return;
    }
    if(!dataset_ex) {
        logger.error("amqp not connected - but event handler called");
        return;
    }
    if(!dataset.project) {
        logger.error("no project set - can't publish event");
        return;
    }

    //unpopulate
    dataset.project = dataset.project._id || dataset.project;
    dataset.datatype = dataset.datatype._id || dataset.datatype;

    //let slim_dataset = Object.assign(dataset, {prov: null, product: null}); //hide heavy stuff that we can lookup via database
    let key = dataset.project+"."+dataset._id;
    common.publish("dataset.update."+key, dataset);

    dataset_ex.publish(key, dataset, {}); //deprecated
}

exports.rule_event = function(rule) {
    if(!rule) {
        logger.error("rule_event called with undefined rule");
        return;
    }
    if(!rule.project) {
        logger.error("no project set - can't publish rule");
        return;
    }
    let project = rule.project._id || rule.project;
    let key = project+"."+rule._id;
    /*
    rule_ex.publish(key, rule, {});
    */
    if(rule.app._id) rule.app = rule.app._id; //unpopulate
    common.publish("rule.update."+key, rule);
}

exports.project_event = function(project) {
    common.publish("project.update."+project._id, project);
}

exports.disconnect = function(cb) {
    mongoose.disconnect(cb);
    common.disconnect_amqp(); //I don't think this works..
}

///////////////////////////////////////////////////////////////////////////////////////////////////

var projectSchema = mongoose.Schema({
    //user who created this project 
    user_id: {type: String, index: true}, 

    admins: [ String ], //list of users who can administer this project (co-PIs?)
    members: [ String ], //list of users who can read/write things under this project
    guests: [ String ], //(for private project) list of users who has read access to datasets

    group_id: Number, //group id from auth service to host admins/members

    tags: [String], //used to classify projects (TODO - I don't think this is used yet..)

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
    listed: {type: Boolean, default: false},

    //list of agreemenets that user must agree before accessing datasets
    agreements: [ new mongoose.Schema({agreement: String}) ], 
    
    //basic stats for this app (aggregated by bin/projectinfo.js)
    stats: {

        //datasets stats updated by projectinfo > common.update_dataset_stats
        datasets: {

            //deprecated - by datatypes_detail
            datatypes: [{type: mongoose.Schema.Types.ObjectId, ref: "Datatypes"}],
           
            //datatypes and number of objects
            datatypes_detail: [{
                type: {type: mongoose.Schema.Types.ObjectId, ref: "Datatypes"},
                subject_count: Number,
                count: Number,
                size: Number,
            }],

            //total
            subject_count: Number,
            count: Number,
            size: Number,
        },
        
        //count of instances for each status (updated by common.update_project_stats)
        instances: {
            requested: Number,
            finished: Number,
            running: Number, 
            stopped: Number, 
            failed: Number, 
            others: Number,  //probably empty, or null
        },

        //resource uage stats updated by projectinfo > common.update_project_stats
        resources: [{
            resource_id: String, //amaretti resource_id

            //for quick referncing the resource detail
            name: String,
            desc: String,
            citation: String,

            service: String, //amaretti service (github)
            //app_id: {type: mongoose.Schema.Types.ObjectId, ref: "Apps"},
            count: Number, //number of time this app/resource pair appears for stored datasets
            total_walltime: Number, //msec for total walltime 
        }],

        //count of pipeline rules (updated by common.update_project_stats)
        rules: {
            active: Number, 
            inactive: Number, 
        },
        
        //counts of publications (updated by common.update_project_stats)
        publications: Number,

    },

    quota: {type: Number, default: 1000000000000}, //maximum archive size (1TB by default)

    //TODO - will be deprecated when datalad goes online
    //for openneuro proxy project (not set if it's not openneuro)
    openneuro: {
        dataset_id: String,
    },

    meta: mongoose.Schema.Types.Mixed, //metadata for each subject (keyed by subject id and child object)
    meta_info: mongoose.Schema.Types.Mixed, //from participants info

    //project can store datasets on project specific storage. {resource_id}
    storage: String,  //default to warehouse config.archive.storage_default
    storage_config: mongoose.Schema.Types.Mixed, 
    
    create_date: { type: Date, default: Date.now },

    removed: { type: Boolean, default: false },
});
projectSchema.post('save', exports.project_event);
projectSchema.post('findOneAndUpdate', exports.project_event);
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

    //experimental field to show that this dataset was created by copying another dataset.
    //copied_from_id: {type: mongoose.Schema.Types.ObjectId, ref: "Datasets"},
    
    //user who submitted this rule. task will run under this user
    user_id: String,
    
    //project that this data belongs to
    project: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects'},

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
    },

    //product.json content for this dataset (new) - might be subset of task.product
    product: mongoose.Schema.Types.Mixed,

    //storing - dataset is currently being archived (default)
    //stored -  dataset is stored on storage system
    //failed -  failed to archive to storage system (remove_datastes.js will remove it in a week)
    //removed - (freed) dataset is freed from storage system (remove_dataset.js will free)
    status: { type: String, default: "storing" },
    status_msg: String,
    archive_task_id: String, //amaretti task that was used to archive the data

    download_count: { type: Number, default: 0}, //number of time this dataset was downloaded

    create_date: { type: Date, default: Date.now }, //date when this dataset was registered
    backup_date: Date, //date when this dataset was copied to the SDA (not set if it's not yet backed up)
    remove_date: Date, //date when this dataset was removed
    update_date: { type: Date, index: true }, //date which this document was last updated (used by rule handler, and to see when this dataset was last downloaded / used /touched, etc..)

    removed: { type: Boolean, default: false},

    //list of publications that this datasets is published under (point to releases ID under publications)
    publications: [{type: mongoose.Schema.Types.ObjectId, ref: 'Releases', index: true}],
});

datasetSchema.post('validate', function() {
    //normalize meta fields that needs to be in string 
    if(this.meta) {
        if(typeof this.meta.subject == 'number') this.meta.subject = this.meta.subject.toString();
        if(typeof this.meta.session == 'number') this.meta.session = this.meta.session.toString();
        if(typeof this.meta.run == 'number') this.meta.run = this.meta.run.toString();
    }
});

//TODO - I think it's better to have each model handle this as it's not transparent when/which middleware hooks gets called
datasetSchema.post('save', exports.dataset_event);
datasetSchema.post('findOneAndUpdate', exports.dataset_event);
datasetSchema.post('findOneAndRemove', exports.dataset_event);
datasetSchema.post('remove', exports.dataset_event);
datasetSchema.pre('save', function(next) {
    console.log("updating dataset....................................", this._id);
    this.update_date = new Date;
    next();
});

datasetSchema.index({'$**': 'text'}) //make all text fields searchable
datasetSchema.index({project: 1, 'prov.task.instance_id': 1, removed: 1, 'meta.subject': 1, 'meta.session': 1, create_date: -1});
datasetSchema.index({project: 1, update_date: 1, removed: 1}); //rule to query the lastest dataset touched
datasetSchema.index({'prov.task_id': 1, 'prov.output_id': 1, removed: 1}); //for event_handler
datasetSchema.index({datatype: 1, removed: 1}); //for searching projects that provides distinct datatypes

//for some reason..  dataset query can't use the index that has "meta.run".. sort index has to match exactly?
//datasetSchema.index({'meta.subject': 1, 'meta.session': 1, 'meta.run': 1, create_date: -1});
datasetSchema.index({'meta.subject': 1, 'meta.session': 1, create_date: -1}); 
//datasetSchema.index({create_date: -1});  //for rule_handler- finding input

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
    files: [ new mongoose.Schema({ //mongoose.Schema allows for *missing*
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

    //name of ABCD service that is used to validate this data (if not set, user can't import this datatype via UI)
    validator: String, 
    validator_branch: String,  

    //spec used to export this datatype to bids
    bids: new mongoose.Schema({
        //should I move derivatives to maps - so that 1 dataset can output files for more than 1 modality?
        derivatives: String, //dwi/func/anat (meaningless if maps is empty)
        maps: [ {
            src: String, //file pattern "dwi_aligned*.nii.gz"
            dest: String, //bids file suffix.ext (dwi.nii.gz)
            json: String, //bids sidecar filename (dwi.json) (optional)
        }],
    }),

    //registered UIs for this datatype
    uis: [{type: mongoose.Schema.Types.ObjectId, ref: 'UIs'}], 

    //published dataset that can be used as a sample dataset
    samples: [{type: mongoose.Schema.Types.ObjectId, ref: 'Datasets'}],

    create_date: { type: Date, default: Date.now },
});
exports.Datatypes = mongoose.model('Datatypes', datatypeSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////

var appSchema = mongoose.Schema({
    user_id: String, //registrar of this application
    projects: [{type: mongoose.Schema.Types.ObjectId, ref: 'Projects'}], //projects that this app is members of
    admins: [ String ], //list of users who can administer this app
    avatar: String, //url for app avatar

    name: String,

    //TODO - citation / references can easily be part of README.md on github..
    //citation: String,
    //references: [ new mongoose.Schema({text: String}) ], 

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
        advanced: { type: Boolean, default: false}, //advanced option (show under advanced section)
    })],

    //output files for this application
    //TODO right now, we can only deal with a single output data types per task
    outputs: [ new mongoose.Schema({
        id: String, //output files should be stored on a directory that matches this id (unless output_on_root is true)
        desc: String, //any description to show for this input (experimental)
        datatype : {type: mongoose.Schema.Types.ObjectId, ref: 'Datatypes'},
        datatype_tags: [ String ], //add specifificity to datatype (like "acpc-aligned")
        datatype_tags_pass: String, //add all datatype tags of input dataset with specified ID

        output_on_root: { type: Boolean, default: false},  //output files are stored on the root of workdir
        files: mongoose.Schema.Types.Mixed, //(when output_on_root is true) optional output file/dir mapping to datatype file_id
        archive: { type: Boolean, default: true }, //archive output by default
    })],
        
    //_rate: {type: Number, default: 0}, //1-5 scale rating of this app - precomputed (0 means not set)

    //basic stats for this app (aggregated by bin/appinfo.js - most info comes from amaretti/service/info)
    stats: {
        serviceinfo: Object,
        gitinfo: Object,
        
        //DEPRECTED - stats.serviceinfo / stats.gitinfo
        requested: Number, //number of times this app was requested
        users: Number, //number of users who used this app
        stars: Number, //github stars
        success_rate: Number, 
    },
    
    removed: { type: Boolean, default: false} ,
    deprecated_by: {type: mongoose.Schema.Types.ObjectId, ref: 'Apps'}, //if set, this app is deprecated

    create_date: { type: Date, default: Date.now },
}, {minimize: false}); //to keep empty config{} from disappearing
//appSchema.index({'$**': 'text'}) //make all text fields searchable (not used according to accesses.ops)
exports.Apps = mongoose.model('Apps', appSchema);

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// App rating submitte by user (DEPRECATED?)
//

var apprateSchema = mongoose.Schema({
    user_id: String,
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
    user_id: String,
    
    //project to look for missing datasets and to archive generated data
    //input_project: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects'},
    //project to store generated dataset
    //output_project: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects'},

    //project to look for input datasets and store generated datasets to
    project: {type: mongoose.Schema.Types.ObjectId, ref: 'Projects'},

    //subject to look for each input id (if not set, it should match the same subject group)
    input_subject: mongoose.Schema.Types.Mixed,
    input_session: mongoose.Schema.Types.Mixed,
    //any tags to look for each input id (object with key(output id)=>array(tags))
    input_tags: mongoose.Schema.Types.Mixed,
    
    //if user wants to override where the input data comes from, specify projects IDs keyed by input id
    input_project_override: mongoose.Schema.Types.Mixed,

    //specify input selection strategy
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
    
    //archive info (keyed by output id, then {do: Boolean, desc: ""}.
    archive: mongoose.Schema.Types.Mixed,

    //only process subjects/session that ends with this if set
    subject_match: String,
    session_match: String,

    stats: {
        tasks: {
            requested: Number,
            finished: Number,
            running: Number, 
            stopped: Number, 
            failed: Number, 
            removed: Number, 
            stop_requested: Number,
            running_sync: Number,
        },
    },

    //when the rule is first defined
    create_date: { type: Date, default: Date.now },
    update_date: { type: Date, default: Date.now }, //date which this document was last updated 
    handle_date: { type: Date }, //date which the rule was last handled

    removed: { type: Boolean, default: false} ,

    //allows user to temporarily disable processing of the rule
    active: { type: Boolean, default: true } ,

}, {minimize: false}); //to keep empty config{} from disappearing

ruleSchema.post('save', exports.rule_event);
ruleSchema.post('findOneAndUpdate', exports.rule_event);
ruleSchema.post('findOneAndRemove', exports.rule_event);
ruleSchema.post('remove', exports.rule_event);

//TODO not tested
ruleSchema.pre('save', function(next) {
    //console.log("updating rule....................................", this._id);
    this.update_date = new Date;
    next();
});
exports.Rules = mongoose.model('Rules', ruleSchema);

//////////////////////////////////////////////////////////////
//
// DL collections
// 

//similar to brainlife "project"
var dlDatasetSchema = mongoose.Schema({

    path: String, //datasets.dl.org/openneuro (can be used as dataset "group")

    commit_id: String, //dataset datalad git repo commit id (used to skip iterating through already registered dataset?)

    README: String, 
    CHANGES: String, 

    //https://bids.neuroimaging.io/bids_spec.pdf section 8.1.1
    dataset_description: {
        Name: String,
        BIDSVersion: String,
        License: String, 
        Authors: [String],
        Acknowledgements: [String],
        HowToAcknowledge: String,
        Funding: [String],
        ReferencesAndLinks: [String],
        DatasetDOI: String,
    },

    participants: [
        mongoose.Schema.Types.Mixed, //{subject: "01", sex: 'F', age: '26', etc.. }
    ],
    participants_info: mongoose.Schema.Types.Mixed, //metadata for participants info

    stats: {
        subjects: Number,
        sessions: Number,
        datatypes: mongoose.Schema.Types.Mixed,
    },


});
dlDatasetSchema.index({path: 1, name: 1}, {unique: true}); 
dlDatasetSchema.index({'$**': 'text'}) //make all text fields searchable
exports.DLDatasets = mongoose.model('DLDatasets', dlDatasetSchema);

//similar to brainlife "dataset"
var dlItemSchema = mongoose.Schema({

    //dataset that this item is member of
    dldataset: {type: mongoose.Schema.Types.ObjectId, ref: 'DLDatasets'},

    //path: String, //"/home/hayashis/dl/workshops/mind-2017/MotivationalT",

    /*
    author: [String], //["van der Meer"],
    conformsto: String, //"http://specs.frictionlessdata.io/data-packages",
    description: String, //"For a description of the experimental procedures, including the behavioral task, see van der Meer, Carey, Tanaka (2017) Optimizing for generalization in the decoding of internally generated activity in the hippocampus. Hippocampus 27(5), pp. 580--595",
    license: [String], //["http://opendatacommons.org/licenses/pddl/"],
    name: String, //"MotivationalT",
    shortdescription: String, //"Extracellular tetrode recordings from the dorsal CA1 area of the hippocampus in behaving rats"
    */

    //metadata from dl
    //meta: {},


    dataset: datasetSchema, //brainlife dataset record (as parsed by bids_walker)
    
    /*
    dsid: String, 
    metadata: {
        dl_core: mongoose.Schema.Types.Mixed,
        frictionless_datapackage: mongoose.Schema.Types.Mixed,
    },
    path: String,
    status: String,
    */
    create_date: { type: Date, default: Date.now },
    update_date: { type: Date, default: Date.now },
});
dlItemSchema.index({'dldataset': 1, 'dataset.datatype': 1, 'dataset.meta.subject': 1, 'dataset.meta.session': 1, 'dataset.meta.run': 1}); //importdatlad uses this as *key* for each item
exports.DLItems = mongoose.model('DLItems', dlItemSchema);


