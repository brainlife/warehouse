#!/usr/bin/env node

const winston = require('winston');
const async = require('async');

const config = require('../api/config');
const db = require('../api/models');
const common = require('../api/common');

console.log("running datatype");
db.init(function(err) {
    if(err) throw err;
    run();
});

function run() {
	db.Datatypes.find({}).exec((err, datatypes)=>{
		if(err) throw err;
        async.eachSeries(datatypes, handle_datatype, err=>{
            if(err) console.error(err);
            console.log("all done");
            db.disconnect();
        });
	});
}

function handle_datatype(datatype, cb) {
    console.log("....................... %s", datatype.name);
    async.series([
        next=>{
            //query all datatype_tags from all dataset
            db.Datasets.distinct("datatype_tags", {removed: false, datatype}).exec((err, tags)=>{
                if(err) return next(err);
                tags = tags.filter(tag=>Boolean(tag));
                console.dir(tags);
                datatype._datatype_tags = tags;
                next();
            });
        },
        
        //now save the datatype
        next=>{
            datatype.save(next);
        },

    ], cb);
}


