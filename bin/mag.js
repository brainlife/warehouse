#!/usr/bin/env node
const async = require('async');
const db = require('../api/models');
const common = require('../api/common');

console.log("running mag.js");

db.init(function(err) {
    if(err) throw err;
    run();
});

function run() {
    async.series([
        next => {
            db.Projects.find({
                removed: false,
            }).exec((err, projects) => {
                if(err) return next(err);
                async.eachSeries(projects, common.updateRelatedPaperMag, next);
            });
        }, 

        next => {
            db.Publications.find({
                removed: false,
            }).exec((err, publications) => {
                async.eachSeries(publications, common.updateRelatedPaperMag, next);
            });
        }
    ], err => {
        if(err) throw err;
        console.log("all done");
        db.disconnect();
    })
}
