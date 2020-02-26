#!/usr/bin/env node

const async = require('async');
const request = require('request');
const fs = require('fs');
const tar = require('tar');
const winston = require('winston');
const ssh2 = require('ssh2');

const config = require('../../api/config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../../api/models');
const common = require('../../api/common');

const limit = 1000;

console.log("connecting to db");
db.init(err=>{
    if(err) throw err;
    run(err=>{
        if(err) throw err;
        logger.info("all done.. disconnecting");
        db.disconnect(()=>{
            process.exit(0);
        });
    });
});

function run(cb) {
    //find project that we need to set group_id
    db.Datasets.find({
        product: {$exists: true},
    })
    .limit(limit)
    .select("product")
    .exec((err,datasets)=>{
        if(err) return cb(err);
        let products = datasets.map(dataset=>{
            return {
                dataset_id: dataset._id,
                product: common.escape_dot(dataset.product),
            }
        });
        if(products.length == 0) return cb(); // no more
        db.DatasetProducts.collection.insert(products, (err, docs)=>{
            if(err) return cb(err);
            async.eachSeries(datasets, (dataset, next_dataset)=>{
                console.log("removing product from", dataset._id);
                dataset.product = undefined;
                dataset.save(next_dataset);
            }, cb);
        });
    });
}


