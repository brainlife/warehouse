#!/usr/bin/env node
const async = require('async');
const request = require('request');
const fs = require('fs');
const tar = require('tar');
const winston = require('winston');
const ssh2 = require('ssh2');

const config = require('../api/config');
//const logger = winston.createLogger(config.logger.winston);
const db = require('../api/models');

console.log("connecting to db");
db.init(function(err) {
    if(err) throw err;
    connect_sda((err, conn, sftp)=>{
        if(err) throw err;
        run(sftp, err=>{
            if(err) throw err;
            console.debug("all done.. disconnecting");

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
    console.log("need to backup:", storages);
    
    console.debug("finding project that needs to be backed up");
    db.Projects.find({removed: false})
    .sort('create_date')
    .exec((err, projects)=>{
        if(err) return cb(err);

        async.eachSeries(projects, (project, next_project)=>{
            console.debug("------------------------------ handling project", project.toString());
            db.Datasets.find({
                project,
                removed: false,
                status: "stored",
                backup_date: {$exists: false},
                publications: {$exists: true, $ne: []},
                storage: {$in: storages}, 
            })
            .sort('create_date') //oldest first (give published datasets precedencde)
            .limit(100)  //limit to 100 datasets at a time
            .populate('datatype')
            .exec((err,datasets)=>{
                if(err) return next_project(err);
                console.debug("datasets needs backup:",datasets.length);
                let count = 0;
                async.eachSeries(datasets, (dataset, next_dataset)=>{
                    count++;

                    console.debug("handling dataset", dataset.toString());

                    var system = config.storage_systems[dataset.storage];
                    system.download(dataset, (err, readstream, filename)=>{
                        if(err) return next_dataset(err);

                        let dir = config.sda.basedir+"/"+project._id.toString();
                        let r = sftp.mkdir(dir, err=>{
                            if(err) {
                                //code 4 means directory exists
                                if(err.code == 4) {
                                    console.debug("project directory already exist.. ok")
                                } else return next_dataset(err);
                            }

                            //I believe I switched to use download/filename instead of dataset._id
                            //directly because old files are stored in .tar.gz
                            //let path = dir+"/"+dataset._id;
                            let path = dir+"/"+filename;

                            console.debug(count, "copying",dataset._id,"to",path);
                            let writestream = sftp.createWriteStream(path, {autoClose: false});
                            readstream.pipe(writestream);
                            readstream.on('error', err=>{
                                console.error("failed to pipe", err);
                                next_dataset(err);
                            });
                            writestream.on('finish', ()=>{
                                console.debug("done!", dataset._id.toString());
                                dataset.backup_date = new Date();
                                dataset.save(next_dataset);
                            });
                        });
                        console.debug("mkdir returned", r);
                    });
                }, next_project);
            });
        }, cb);
    });
}
