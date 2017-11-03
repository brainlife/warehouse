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

//find datasets that are not yet archived (archive_date not set)
//download such datasets up to 30GB in size
//make sure all requires files exists
//run validators  (?)
//htar to SDA
//update datasets with information about archive and set archive_date

console.log("connecting to db");
db.init(function(err) {
    if(err) throw err;
    connect_sda((err, conn, sftp)=>{
        if(err) throw err;
        run(sftp, err=>{
            if(err) throw err;
            conn.end();
            db.disconnect();
            console.log("all done");
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
    logger.debug("finding datasets that needs to be copied to SDA");

    let settle_data = new Date();

    db.Datasets.find({
        removed: false,
        status: "stored",
        backup_date: {$exists: false},
    })
    .sort('create_date')
    .limit(2) 
    .populate('datatype')
    .exec((err,datasets)=>{
        if(err) throw err;
        logger.debug("datasets needs backup:",datasets.length);
        async.eachSeries(datasets, (dataset, next_dataset)=>{
            var system = config.storage_systems[dataset.storage];
            system.download(dataset, (err, readstream, filename)=>{
                if(err) return next(err);
                let dir = "test/"+dataset.project.toString();
                sftp.mkdir(dir, err=>{
                    if(err) {
                        if(err.code == 4) logger.debug(dir,"already exists");
                        else return next_dataset(err);
                    }

                    let path = dir+"/"+dataset._id;
                    logger.debug("copying",dataset._id,"to",path);
                    let writestream = sftp.createWriteStream(path);
                    readstream.pipe(writestream);
                    readstream.on('error', err=>{
                        logger.error("failed to pipe", err);
                        next_dataset(err);
                    });
                    writestream.on('finish', ()=>{
                        logger.debug("done!");
                        dataset.backup_date = new Date();
                        dataset.save(next_dataset);
                    });
                });
            });
        }, cb);
    });
}
