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
const prov = require('./prov');

//TODO - should be called something like "get_my_projects"?
exports.getprojects = function(user, cb) {
    if(!user) return cb(null, [], []);
    //firt, find all public projects
    let project_query = {access: "public"};
    //if user is logged in, look for private ones also
    if(user) {
        project_query = {
            $or: [
                project_query,
                {"members": user.sub.toString()},
                {"admins": user.sub.toString()}, //I think it makes sense to give admin read/write access
            ],
        };
    }

    db.Projects.find(project_query).select('_id admins members').lean().exec((err, projects)=>{
        if(err) return cb(err);
        let canread_ids = projects.map(p=>p._id);
        let canwrite_projects = projects.filter(p=>{
            if(p.members.includes(user.sub.toString())) return true;
            if(p.admins.includes(user.sub.toString())) return true;
            return false;
        });
        let canwrite_ids = canwrite_projects.map(p=>p._id);
        cb(null, canread_ids, canwrite_ids);
    });
}

exports.archive_task = function(task, dataset, files_override, auth, cb) {
    if(!files_override) files_override = {};
   
    //start by pulling datatype detail
    db.Datatypes.findById(dataset.datatype, (err, datatype)=>{
        if(err) return cb(err);
        if(!datatype) return cb("couldn't find specified datatype:"+dataset.datatype);

        //create temp directory to download things
        tmp.dir({unsafeCleanup: true}, (err, tmpdir, cleantmp)=>{
            if(err) return cb(err);
            var input_ok = true;

            //find files that doesn't need to be copied - as it's contained inside another dirname
            var dirs = datatype.files.filter(file=>file.dirname);
            var files = datatype.files.filter(file=>file.filename);
            files.forEach(file=>{
                dirs.forEach(dir=>{
                    if(dir.dirname == ".") file.skip = true; //TODO a bit brittle

                    //skip files that are contained inside another directory
                    //for example..
                    //(dirname)  dtiinit
                    //(filename) dtiinit/something.mat
                    //since something.mat is under dtiinit/, I can skip it
                    if(file.filename.startsWith(dir.dirname+"/")) file.skip = true;
                });
            });

            //now download files to temp directory
            async.eachSeries(datatype.files, (file, next_file)=>{
                if(file.skip) return next_file();

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
                        if(input_ok) {
                            logger.debug("download complete");
                            next_file()
                        } else {
                            if(file.required) return next_file("required input file failed for download");
                            
                            //failed but not required.. remove the file and move on
                            fs.unlink(fullpath, next_file);            
                        }
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
                        if(input_ok) {
                            logger.debug("download/tar complete");
                            next_file();
                        } else {
                            if(file.required) return next_file("required input directory failed to download/untar");
                            
                            //failed but not required.. remove the directory
                            fs.rmdir(fullpath, next_file);
                        }
                    });
                }

                //now start feeding the writestream
                request({
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
                    return dataset.save(_err=>{
                        cb(err);
                    });
                }
                
                //all items stored under tmpdir! call cb, but then asynchrnously copy content to the storage
                var storage = config.storage_default();
                var system = config.storage_systems[storage];
                logger.debug("obtaining upload stream for", storage);
                system.upload(dataset, (err, writestream)=>{
                    if(err) return cb(err);
                    var tar = child_process.spawn("tar", ["hc", "."], {cwd: tmpdir});
                    tar.on('close', code=>{
                        logger.debug("tar finished", code);
                        cleantmp();
                        if(code) {
                            //failed to upload..
                            dataset.desc = "Failed to archive with code:"+code;
                            dataset.status = "failed";
                        }
                    });
                    writestream.on('error', err=>{
                        logger.error("streaming failed", err);

                        dataset.desc = "Failed to archive "+err.toString();
                        dataset.status = "failed";
                        dataset.save(_err=>{
                            if(_err) logger.error(_err); //ignore..?
                            cb(err); //return error from streaming which is more interesting
                        });
                    });

                    //TODO - I am not sure if all writestream returnes file object (pkgcloud does.. but this makes it a bit less generic)
                    //maybe I should run system.stat()?
                    writestream.on('success', file=>{
                        logger.debug("streaming success", JSON.stringify(file));
                        
                        dataset.storage = storage;
                        dataset.status = "stored";
                        dataset.size = file.size;
                        dataset.save(cb);
                            
                        //also register to neo4j.. I might deprecate
                        prov.register_dataset(dataset, err=>{
                            if(err) logger.error(err); //fall through
                        });
                    });

                    logger.debug("streaming to storage");
                    tar.stdout.pipe(writestream);
                });
            });
        });
    });
}

exports.load_github_detail = function(service_name, cb) {
    if(!config.github) return cb("no github config");

    let auth = "?client_id="+config.github.client_id + "&client_secret="+config.github.client_secret;

    //first load main repo info
    logger.debug("loading repo detail");
    logger.debug("https://api.github.com/repos/"+service_name+auth);
    request("https://api.github.com/repos/"+service_name+auth, { json: true, headers: {
        'User-Agent': 'brain-life/warehouse',
        
        //needed to get topic (which is currently in preview mode..)
        //https://developer.github.com/v3/repos/#list-all-topics-for-a-repository
        'Accept': "application/vnd.github.mercy-preview+json", 
    }}, function(err, _res, git) {
        if(err) return cb(err);
        if(_res.statusCode != 200) {
            logger.error(_res.body);
            return cb("failed to query requested repo. code:"+_res.statusCode);
        }

        logger.debug("loading contributors");
        request("https://api.github.com/repos/"+service_name+"/contributors"+auth, { json: true, headers: {
            'User-Agent': 'brain-life/warehouse',
        }}, function(err, _res, cons) {
            if(err) return cb(err);
            if(_res.statusCode != 200) {
                logger.error(_res.body);
                return cb("failed to query requested repo. code:"+_res.statusCode);
            }

            logger.debug("loading contributor details")
            let con_details = [];
            async.eachSeries(cons, (con, next_con)=>{
                request(con.url+auth, { json: true, headers: {'User-Agent': 'brain-life/warehouse'} }, function(err, _res, detail) {
                    if(err) return next_con(err);
                    if(_res.statusCode != 200) {
                        logger.error(_res.body);
                        return next_con("failed to load user detail:"+_res.statusCode);
                    }
                    //console.dir(detail);
                    con_details.push(detail);
                    next_con();
                });
            }, err=>{
                //console.dir(con_details);
                cb(null, git, con_details);
            });
            //load collaborators (developers)
            //cb(null, git, cons);
        });
                    
    });
}

let cached_contacts = {};
function cache_contact() {
    logger.info("caching auth profiles");
    request({
        url: config.auth.api+"/profile", json: true,
        headers: { authorization: "Bearer "+config.auth.jwt },
    }, (err, res, body)=>{
        if(err) return logger.error(err);
        if(res.statusCode != 200) logger.error("couldn't obtain user jwt code:"+res.statusCode);
        body.profiles.forEach(profile=>{
            cached_contacts[profile.id.toString()] = profile;
        });
    });
}
cache_contact();
setInterval(cache_contact, 1000*60*30); //cache every 30 minutes

exports.deref_contact = function(id) {
    return cached_contacts[id];
}


