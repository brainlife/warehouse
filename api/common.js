const request = require('request');
const winston = require('winston');
const tmp = require('tmp');
const mkdirp = require('mkdirp');
const path = require('path');
const child_process = require('child_process');
const fs = require('fs');
const async = require('async');
const redis = require('redis');
const xmlescape = require('xml-escape');

const config = require('./config');
const logger = new winston.Logger(config.logger.winston);
const db = require('./models');

//connect to redis - used to store various shared caches
exports.redis = redis.createClient(config.redis.port, config.redis.server);
exports.redis.on('error', err=>{throw err});

//TODO - should be called something like "get_project_accessiblity"?
exports.getprojects = function(user, cb) {
    if(!user) return cb(null, [], []);
    
    //everyone has read access to public project
    let project_query = {access: "public"};
    
    //logged in user may have acess to more projects
    if(user) {
        project_query = {
            $or: [
                project_query,
                {"members": user.sub.toString()},
                {"admins": user.sub.toString()}, 
                {"guests": user.sub.toString()},
            ],
        };
    }

    db.Projects.find(project_query).select('_id admins members guests').lean().exec((err, projects)=>{
        if(err) return cb(err);
        //user can read from all matching projects
        let canread_ids = projects.map(p=>p._id);

        //user has write access if they are listed in members/admins
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
        tmp.dir({unsafeCleanup: true, template: "/tmp/archive-XXXXXX"}, (err, tmpdir, cleantmp)=>{
            if(err) return cb(err);

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

            let filenames = [];
            
            //now download files to temp directory
            async.eachSeries(datatype.files, (file, next_file)=>{
                if(file.skip) return next_file();

                logger.debug("processing file", file.toString());
                var writestream = null;
                var srcpath = "";
                var input_ok = true;
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
                            filenames.push(file.filename);
                            next_file()
                        } else {
                            if(file.required) {
                                return next_file({ message: "required input file failed for download", file });
                            }
                            
                            //failed but not required.. remove the file and move on
                            fs.unlink(fullpath, next_file);            
                        }
                    });
                }
                if(file.dirname) {
                    //directory has to be unzip/tar-ed to tmpdir
                    srcpath += (files_override[file.id]||file.dirname);
                    var fullpath = tmpdir+"/"+file.dirname;
                    mkdirp.sync(fullpath); //don't need to path.dirname() here
                    logger.debug("downloading from", srcpath, "and untar to", fullpath);
                    var untar = child_process.spawn("tar", ["xz"], {cwd: fullpath});
                    writestream = untar.stdin;
                    untar.on('close', code=>{
                        if(code) {
                            if(file.required) return next_file({ message: "tar failed with code:"+code, file });
                            logger.error("tar finished with code "+code);
                        }
                        if(input_ok) {
                            logger.debug("download/tar complete");
                            filenames.push(file.dirname);
                            next_file();
                        } else {
                            if(file.required) return next_file({ message: "required input directory failed to download/untar", file });
                            //failed but not required.. remove the directory
                            fs.rmdir(fullpath, next_file);
                        }
                    });
                }

                //now start feeding the writestream
                request({
                    url: config.amaretti.api+"/task/download/"+task._id,
                    qs: {
                        p: srcpath,
                    },
                    headers: { authorization: auth }
                })
                .on('response', function(r) {
                    if(r.statusCode != 200) {
                        logger.debug("/task/download failed "+r.statusCode+" path:"+srcpath+" auth:"+auth, file.required); 
                        input_ok = false;
                    }
                }).pipe(writestream);
            }, err=>{
                if(err) {
                    cleantmp();
                    if (err.file) dataset.desc = "Expected output " + (err.file.filename||err.file.dirname) + " not found";
                    else dataset.desc = "Failed to store all files under tmpdir";
                    dataset.status = "failed";
                    return dataset.save(cb);
                }

                logger.debug(filenames);
                
                //all items stored under tmpdir! call cb, but then asynchrnously copy content to the storage
                var storage = config.storage_default();
                var system = config.storage_systems[storage];
                logger.debug("obtaining upload stream for", storage);
                system.upload(dataset, (err, writestream, done)=>{
                    if(err) return cb(err);
                    filenames.unshift("hc");
                    var tar = child_process.spawn("tar", filenames, {cwd: tmpdir});
                    tar.on('close', code=>{
                        logger.debug("tar finished", code);
                        cleantmp();
                        if(code) {
                            //failed to upload..
                            dataset.desc = "Failed to archive with code:"+code;
                            dataset.status = "failed";
                        }
                    });

                    //TODO - I am not sure if all writestream returnes file object (pkgcloud does.. but this makes it a bit less generic)
                    //maybe I should run system.stat()?
                    //writestream.on('success', file=>{
                    done.then(file=>{
                        logger.debug("streaming success", JSON.stringify(file));
                        dataset.storage = storage;
                        dataset.status = "stored";
                        dataset.size = file.size;
                        dataset.save(cb);
                    }).catch(err=>{
                        logger.error("streaming failed", err);
                        dataset.desc = "Failed to archive "+err.toString();
                        dataset.status = "failed";
                        dataset.save(_err=>{
                            if(_err) logger.error(_err); //ignore..?
                            cb(err); //return error from streaming which is more interesting
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
exports.compose_app_datacite_metadata = function(app) {
    //publication year
    let year = app.create_date.getFullYear();
    let publication_year = "<publicationYear>"+year+"</publicationYear>";

    let creators = [];
    app.admins.forEach(sub=>{
        let contact = cached_contacts[sub];
        if(!contact) {
            logger.debug("missing contact", sub);
            return;
        }
        //TODO - add <nameIdentifier nameIdentifierScheme="ORCID">12312312131</nameIdentifier>
        creators.push(`<creator> 
            <creatorName>${xmlescape(contact.fullname)}</creatorName>
            </creator>`);
    });

    let contributors = [];
    app.contributors.forEach(contact=>{
        //contributorType can be ..
        //Value \'Contributor\' is not facet-valid with respect to enumeration \'[ContactPerson, DataCollector, DataCurator, DataManager, Distributor, Editor, HostingInstitution, Other, Producer, ProjectLeader, ProjectManager, ProjectMember, RegistrationAgency, RegistrationAuthority, RelatedPerson, ResearchGroup, RightsHolder, Researcher, Sponsor, Supervisor, WorkPackageLeader]\'. It must be a value from the enumeration.'
        contributors.push(`<contributor contributorType="Other"> 
            <contributorName>${xmlescape(contact.name)}</contributorName>
            </contributor>`);
    });

    let subjects = []; //aka "keyword"
    app.tags.forEach(tag=>{
        subjects.push(`<subject>${xmlescape(tag)}</subject>`);
    });

    let metadata = `<?xml version="1.0" encoding="UTF-8"?>
    <resource xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://datacite.org/schema/kernel-4" xsi:schemaLocation="http://datacite.org/schema/kernel-4 http://schema.datacite.org/meta/kernel-4/metadata.xsd">
      <identifier identifierType="DOI">${app.doi}</identifier>
      <creators>
        ${creators.join("\n")}
      </creators>
      <contributors>
        ${contributors.join("\n")}
      </contributors>
      <subjects>
        ${subjects.join("\n")}
      </subjects>
      <titles>
        <title>${xmlescape(app.name)}</title>
      </titles>
      <publisher>brainlife.io</publisher>
      ${publication_year}
      <resourceType resourceTypeGeneral="Software">XML</resourceType>
      <descriptions>
          <description descriptionType="Other">${xmlescape(app.desc_override||app.desc)}</description>
      </descriptions>
    </resource>`;
    logger.debug(metadata);
    return metadata;
}

//https://schema.datacite.org/meta/kernel-4.1/doc/DataCite-MetadataKernel_v4.1.pdf
exports.compose_pub_datacite_metadata = function(pub) {

    //publication year
    let year = pub.create_date.getFullYear();
    let publication_year = "<publicationYear>"+year+"</publicationYear>";

    //creators
    //let creators = cached_contacts[pub.user_id];

    //in case author is empty.. let's use submitter as author..
    //TODO - we need to make author required field
    if(pub.authors.length == 0) pub.authors.push(pub.user_id);

    let creators = [];
    pub.authors.forEach(sub=>{
        let contact = cached_contacts[sub];
        if(!contact) {
            logger.debug("missing contact", sub);
            return;
        }
        //TODO - add <nameIdentifier nameIdentifierScheme="ORCID">12312312131</nameIdentifier>
        creators.push(`<creator> 
            <creatorName>${xmlescape(contact.fullname)}</creatorName>
            </creator>`);

    });

    let contributors = [];
    pub.contributors.forEach(sub=>{
        let contact = cached_contacts[sub];
        if(!contact) {
            logger.debug("missing contact", sub);
            return;
        }
        //TODO - add <nameIdentifier nameIdentifierScheme="ORCID">12312312131</nameIdentifier>
        
        //contributorType can be ..
        //Value \'Contributor\' is not facet-valid with respect to enumeration \'[ContactPerson, DataCollector, DataCurator, DataManager, Distributor, Editor, HostingInstitution, Other, Producer, ProjectLeader, ProjectManager, ProjectMember, RegistrationAgency, RegistrationAuthority, RelatedPerson, ResearchGroup, RightsHolder, Researcher, Sponsor, Supervisor, WorkPackageLeader]\'. It must be a value from the enumeration.'
        contributors.push(`<contributor contributorType="Other"> 
            <contributorName>${xmlescape(contact.fullname)}</contributorName>
            </contributor>`);
        
    });

    let subjects = []; //aka "keyword"
    pub.tags.forEach(tag=>{
        subjects.push(`<subject>${xmlescape(tag)}</subject>`);
    });

    let metadata = `<?xml version="1.0" encoding="UTF-8"?>
    <resource xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://datacite.org/schema/kernel-4" xsi:schemaLocation="http://datacite.org/schema/kernel-4 http://schema.datacite.org/meta/kernel-4/metadata.xsd">
      <identifier identifierType="DOI">${pub.doi}</identifier>
      <creators>
        ${creators.join("\n")}
      </creators>
      <contributors>
        ${contributors.join("\n")}
      </contributors>
      <subjects>
        ${subjects.join("\n")}
      </subjects>
      <titles>
        <title>${xmlescape(pub.name)}</title>
      </titles>
      <publisher>brainlife.io</publisher>
      ${publication_year}
      <resourceType resourceTypeGeneral="Software">XML</resourceType>
      <descriptions>
          <description descriptionType="Other">${xmlescape(pub.desc)}</description>
      </descriptions>
    </resource>`;
    return metadata;
}

//https://support.datacite.org/v1.1/docs/mds-2
//create new doi and register metadata (still needs to set url once it's minted)
exports.doi_post_metadata = function(metadata, cb) {
    //register!
    logger.debug("registering doi metadata");
    request.post({
        url: config.datacite.api+"/metadata",
        auth: {
            user: config.datacite.username,
            pass: config.datacite.password,
        },
        headers: { 'content-type': 'application/xml' },
        body: metadata,
    }, (err, res, body)=>{
        if(err) return cb(err); 
        logger.debug('metadata registration:', res.statusCode, body);
        if(res.statusCode != 201) return cb(body);
        cb();
    });
}

//datacite api doc >  https://mds.test.datacite.org/static/apidoc
//set / update the url associated with doi
exports.doi_put_url = function(doi, url, cb) {
    console.log("registering doi url", url);
    request.put({
        url: config.datacite.api+"/doi/"+doi,
        auth: {
            user: config.datacite.username,
            pass: config.datacite.password,
        },
        headers: { 'content-type': 'text/plain' },
        body: "doi="+doi+"\nurl="+url,
    }, (err, res, body)=>{
        if(err) return cb(err); 
        logger.debug('url registration:', res.statusCode, body);
        if(res.statusCode != 201) return cb(body);
        cb(null);
    });
}

let cached_contacts = {};
function cache_contact() {
    logger.info("caching auth profiles");
    request({
        url: config.auth.api+"/profile", json: true,
        qs: {
            limit: 5000, //TODO -- really!?
        },
        headers: { authorization: "Bearer "+config.auth.jwt },
    }, (err, res, body)=>{
        if(err) return logger.error(err);
        if(res.statusCode != 200) logger.error("couldn't cache auth profiles. code:"+res.statusCode);
        else {
            body.profiles.forEach(profile=>{
                cached_contacts[profile.id.toString()] = profile;
            });
        }
    });
}
cache_contact();
setInterval(cache_contact, 1000*60*30); //cache every 30 minutes

exports.deref_contact = function(id) {
    return cached_contacts[id];
}

exports.populate_github_fields = function(repo, app, cb) {
    exports.load_github_detail(repo, (err, repo, con_details)=>{
        if(err) return cb(err);
        app.desc = repo.description;
        app.tags = repo.topics;
        if(!app.stats) app.stats = {};
        app.stats.stars = repo.stargazers_count;
        app.contributors = con_details.map(con=>{
            //see https://api.github.com/users/francopestilli for other fields
            return {name: con.name, email: con.email};
        });
        cb();
    });
}


