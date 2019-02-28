#!/usr/bin/env nodejs

const elasticsearch = require('elasticsearch');
const winston = require('winston');
const async = require('async');

const config = require('../../api/config');
const logger = winston.createLogger(config.logger.winston);
const db = require('../../api/models');

console.log("connecting to db");
db.init(err=>{
    let es = new elasticsearch.Client({
      host: 'localhost:9200',
      log: 'trace'
    });
    /*
    client.ping({
      requestTimeout: 30000,
    }, function (error) {
      if (error) {
        console.error('elasticsearch cluster is down!');
      } else {
        console.log('All is well');
      }
    });
    */
    let previous_date = new Date();
    previous_date.setDate(previous_date.getDate()-30); //pick last 30 days?
    console.log("querying since", previous_date);
    db.Datasets.find({
        //project: "5aaeb3dc7bc1d95ea21f2cb0",
        removed: false,
        status: "stored",
        product: {$exists: true}, 
        create_date: {$gt: previous_date},
    })
    //.limit(100)
    .lean()
    .select('product project')
    .exec((err,datasets)=>{
        if(err) throw err;
        async.eachSeries(datasets, (dataset, next_dataset)=>{
            let doc = {
                index: "warehouse."+dataset.project,
                type: "dataset-product",
                id: dataset._id.toString(),
                body: dataset.product,
            }
            console.dir(doc);
            es.exists(doc).then(b=>{
                if(b) return next_dataset();
                es.create(doc, next_dataset);
            });
        }, err=>{
            if(err) throw err;
            console.log("all done");
            db.disconnect();
        });
    });
});



