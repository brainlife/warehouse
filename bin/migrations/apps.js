#!/usr/bin/env node

const winston = require('winston');
const async = require('async');
const request = require('request');
const fs = require('fs');
const redis = require('redis');

const config = require('../../api/config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../../api/models');
const common = require('../../api/common');

db.init(function(err) {
    if(err) throw err;
	db.Apps.find({
        removed: false,
    })
    .exec((err, apps)=>{
		if(err) throw err;
        async.eachSeries(apps, handle_app, err=>{
            if(err) logger.error(err);
            console.log("all done");
        });
	});
});

function handle_app(app, cb) {
    //all existing app should have this set to true for now
    console.dir(app._id.toString());
    app.outputs.forEach(output=>{
        output.output_on_root = true;
    });
    app.save(cb);
}


