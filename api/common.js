
const request = require('request');
const winston = require('winston');
const tmp = require('tmp');
const mkdirp = require('mkdirp');
const path = require('path');
const child_process = require('child_process');
const fs = require('fs');
const async = require('async');

const config = require('./config');
const logger = new winston.Logger(config.logger.winston);
const db = require('./models');

exports.archive_task = function(task, dataset, files_override, auth, cb) {
    if(!files_override) files_override = {};

    logger.debug(JSON.stringify(dataset, null, 4));
   
    //start by pulling datatype detail
    db.Datatypes.findById(dataset.datatype, (err, datatype)=>{
        if(err) return cb(err);
        if(!datatype) return cb("couoldn't find specified datatype:"+dataset.datatype);
        logger.debug("datatype loaded", datatype.toString());

        //create temp directory to download things
        tmp.dir({unsafeCleanup: true}, (err, tmpdir, cleantmp)=>{
            if(err) return cb(err);
            var input_ok = true;
            //now download all files to temp directory
            async.eachSeries(datatype.files, (file, next_file)=>{
                logger.debug("processing file", file.toString());
                var writestream = null;
                var srcpath = task.instance_id+"/"+task._id+"/";
                if(dataset.prov.subdir) srcpath += dataset.prov.subdir+"/";
                if(file.filename) {
                    //files can be downloaded directly to tmpdir
                    srcpath += (files_override[file.id]||file.filename);
                    var fullpath = tmpdir+"/"+file.filename;
                    mkdirp.sync(path.dirname(fullpath)); //make sure the path exitsts
                    logger.debug("downloading from", srcpath, "and write to", fullpath);
                    writestream = fs.createWriteStream(fullpath);
                    writestream.on('finish', ()=>{
                        if(!input_ok) return next_file("input failed for download");
                        logger.debug("download complete");
                        next_file()
                    });
                }
                if(file.dirname) {
                    //directory has to be unzip/tar-edto tmpdir
                    srcpath += (files_override[file.id]||file.dirname);
                    var fullpath = tmpdir+"/"+file.dirname;
                    mkdirp.sync(fullpath); //don't need to path.dirname() here
                    logger.debug("downloading from", srcpath, "and untar to", fullpath);
                    var untar = child_process.spawn("tar", ["xz"], {cwd: fullpath});
                    writestream = untar.stdin;
                    untar.on('close', code=>{
                        if(code) return next_file("untar files with code:"+code);
                        if(!input_ok) return next_file("input failed for download/untar");
                        logger.debug("download/tar complete");
                        next_file();
                    });
                }

                //now start feeding the writestream
                request.get({
                    url: config.wf.api+"/resource/download",
                    qs: {
                        r: task.resource_id, p: srcpath,
                    },
                    headers: { authorization: auth }
                })
                .on('response', function(r) {
                    if(r.statusCode != 200) {
                        logger.error("/resource/download failed "+r.statusCode+" path:"+srcpath+" auth:"+auth);
                        input_ok = false;
                    }
                }).pipe(writestream);
            }, err=>{
                if(err) {
                    logger.error(err);
                    cleantmp(); 
                    dataset.desc = "Failed to store all files under tmpdir";
                    dataset.status = "failed";
                    return dataset.save(cb);
                }
                
                //all items stored under tmpdir! call cb, but then asynchrnously copy content to the storage
                var storage = config.storage_default();
                var system = config.storage_systems[storage];
                logger.debug("obtaining upload stream for ", storage);
                system.upload(dataset, (err, writestream)=>{
                    if(err) return next(err);
                    var tar = child_process.spawn("tar", ["hcz", "."], {cwd: tmpdir});
                    tar.on('close', code=>{
                        cleantmp();
                        if(code) {
                            dataset.desc = "Failed to archive with code:"+code;
                            dataset.status = "failed";
                        } else {
                            dataset.storage = storage;
                            dataset.status = "stored";
                        }
                        dataset.save(cb);
                    });
                    logger.debug("streaming to storage");
                    tar.stdout.pipe(writestream);
                });
            });
        });
    });
}

