#!/usr/bin/env node
const async = require('async');
const request = require('request');
const fs = require('fs');
const tar = require('tar');
const winston = require('winston');
const ssh2 = require('ssh2');

const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');

console.log("connecting to db");
db.init(function(err) {
    if(err) throw err;
    connect_sda((err, conn, sftp)=>{
        if(err) throw err;
        run(sftp, err=>{
            if(err) throw err;
            logger.info("all done.. disconnecting");

            conn.end();
            db.disconnect();

            //amqp disconnect() is broken
            //https://github.com/postwait/node-amqp/issues/462
            setTimeout(()=>{
                console.log("killing myself - until node-amqp bug is fixed");
                process.exit(0);
            }, 1000);
        });
    });
});

function connect_sda(cb) {
    console.log("connecting to sda");
    let Client = require('ssh2');
    let conn = new Client();
    conn.on('ready', ()=>{
        console.log('ssh ready');
        conn.sftp((err, sftp)=>{
            cb(err, conn, sftp);
        });
    });
    conn.on('error', cb);
    conn.connect(config.sda.ssh);
}

function run(sftp, cb) {

    //list storage system that we need to backup
    let storages = [];
    for(var id in config.storage_systems) {
        if(config.storage_systems[id].need_backup) storages.push(id);
    }
    db.Datasets.find({
        backup_date: {$exists: true},
        size: {$exists: false},
    })
    .sort('create_date') //oldest first
    .limit(100)  //limit to 100 datasets at a time
    .exec((err,datasets)=>{
        if(err) return cb(err);
        logger.debug("datasets needs size sets:",datasets.length);
        let count = 0;
        async.eachSeries(datasets, (dataset, next_dataset)=>{
            count++;
            logger.debug(count, "handling dataset", dataset.toString());
            let filename = dataset._id+".tar.gz"; //for old datasets
            logger.debug(JSON.stringify(dataset, null, 4));
            if(dataset.storage_config && dataset.storage_config.filename) filename = dataset.storage_config.filename;
            let path = config.sda.basedir+"/"+dataset.project.toString()+"/"+filename;
            sftp.stat(path, (err, stats)=>{
                if(err) return next_dataset(err);
                console.dir(stats);
                dataset.size = stats.size;
                dataset.save(next_dataset);
            });
        }, cb);
    });
}
