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
    //.select('product project datatype meta prov')
    .populate('datatype')
    .exec((err,datasets)=>{
        if(err) throw err;
        async.eachSeries(datasets, (dataset, next_dataset)=>{
            let doc = {
                index: "warehouse."+dataset.project,
                type: "dataset-product", //es didn't like datatype._id..
                id: dataset._id.toString(),
            }
            es.exists(doc).then(b=>{
                if(b) return next_dataset();
                
                //add bit more info to body
                delete dataset.product.brainlife; //this is for ui
                delete dataset.product.meta; //this is for sidecard
                delete dataset.product.tags; 
                delete dataset.product.datatype_tags; 

                doc.body = dataset.product;
                doc.body._datatype = dataset.datatype.name;
                doc.body._subject = dataset.meta.subject;
                if(dataset.meta.session) doc.body._session = dataset.meta.session;
                if(dataset.meta.run) doc.body._run = dataset.meta.run;
                doc.body._service = dataset.prov.task.service;
                if(dataset.prov.task.service_branch) doc.body._branch = dataset.prov.task.service_branch;
                console.dir(doc);
                es.create(doc, next_dataset);
            });
        }, err=>{
            if(err) throw err;
            console.log("all done");
            db.disconnect();
            //es.close();
        });
    });
});



