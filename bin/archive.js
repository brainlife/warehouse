#!/usr/bin/env node

const winston = require('winston');
const async = require('async');
const request = require('request');
const fs = require('fs');
const tar = require('tar');

const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');

//
//find datasets that are not yet archived (archive_date not set)
//download such datasets up to 30GB in size
//make sure all requires files exists
//run validators  (?)
//htar to SDA
//update datasets with information about archive and set archive_date

db.init(function(err) {
    if(err) throw err;

    logger.debug("finding datasets need archiving");
    db.Datasets.find({
        removed: false,
        archive_date: {$exists: false},
        storage: {$exists: true}, //skip datasets that are still being loaded
    })
    .sort('create_date')
    .limit(300)
    .populate('datatype')
    .exec((err,datasets)=>{
        if(err) throw err;
        logger.debug("datasets needs archiving:",datasets.length);

		var total_size = 0;
        var datasets_to_archive = [];

        async.eachSeries(datasets, (dataset,next_dataset)=>{
            logger.debug("handling", dataset._id);
            if(total_size > 30*1024*1024*1024) {
                //skip the rest
                return next_dataset();
            }
            
            //download
            var system = config.storage_systems[dataset.storage];
            system.download(dataset, (err, readstream, filename)=>{
                if(err) return next(err);
                if(!filename) filename = dataset._id+'.tar.gz';
                var path = config.archive.tmp+"/"+filename;
                logger.info("downloading "+dataset._id, path);
                readstream.pipe(fs.createWriteStream(path));
                readstream.on('error', err=>{
                    logger.error("failed to pipe", err);
                });
                readstream.on('close', ()=>{
                    
                    //get file paths
                    //TODO - if I can pipe tar.t() between read/write stream, I don't have to reread itt
                    //https://github.com/npm/node-tar/issues/124
                    var paths = [];
                    tar.t({
                        file: path,
                        onentry: entry=>{
                            paths.push(entry.path);
                        }, 
                        sync: true,
                    });

                    //logger.debug("paths", paths);
                    
                    //check for file/dir
                    var valid = true;
                    var error_msg = null;
                    dataset.datatype.files.forEach(file=>{
                        if(!file.required) return;
                        if(file.filename && !~paths.indexOf("./"+file.filename)) {
                            valid = false; 
                            error_msg = file.filename+" missing";
                            logger.debug(dataset.status_msg);
                        }
                        if(file.dirname && !~paths.indexOf("./"+file.dirname)) {
                            valid = false; 
                            error_msg = file.dirname+" missing";
                            logger.debug(dataset.status_msg);
                        }
                    });

                    if(!valid) {
                        //failed to validate.. skip this dataset and also update status
                        dataset.status = "invalid";
                        dataset.status_msg = error_msg;
                        dataset.save(err=>{
                            return next_dataset();    
                        })
                    } else {
                        dataset.status = "archived";
                        dataset.archive_date = new Date();
                        dataset.archive_path = "todo123";
                        dataset.archive_file = path;

                        datasets_to_archive.push(dataset);
                        
                        //update total size
                        var stats = fs.statSync(path); 
                        total_size += stats.size;
                        logger.debug("total size:", total_size, "datasets", datasets_to_archive.length);

                        next_dataset();
                    }
                });
            });
        }, err=>{
            if(err) throw err;
            if(total_size < 10*1024*1024*1024) {
                logger.error("we don't have enough data to archive.. maybe later");
            } else {
                logger.debug("TODO - now send files to hsi and save all datasets");
            }
            db.disconnect();
        });
    });
});

