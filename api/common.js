const request = require('request'); //TODO - switch to rp
const rp = require('request-promise-native');
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
const logger = winston.createLogger(config.logger.winston);
const db = require('./models');

//connect to redis - used to store various shared caches
exports.redis = redis.createClient(config.redis.port, config.redis.server);
exports.redis.on('error', err=>{throw err});

//TODO - should be called something like "get_project_accessiblity"?
exports.getprojects = function(user, cb) {
    if(user === undefined) return cb(null, [], []);
    //string has sub() so I can't just do if(user.sub)
    if(typeof user == 'object') user = user.sub.toString();
    
    //everyone has read access to public project
    let project_query = {access: "public"};
    
    //logged in user may have acess to more projects
    project_query = {
        $or: [
            project_query,
            {"members": user},
            {"admins": user}, 
            {"guests": user},
        ],
    };
    db.Projects.find(project_query).select('_id admins members guests').lean().exec((err, projects)=>{
        if(err) return cb(err);
        //user can read from all matching projects
        let canread_ids = projects.map(p=>p._id);

        //user has write access if they are listed in members/admins
        let canwrite_projects = projects.filter(p=>{
            if(p.members.includes(user)) return true;
            if(p.admins.includes(user)) return true;
            return false;
        });
        let canwrite_ids = canwrite_projects.map(p=>p._id);
        cb(null, canread_ids, canwrite_ids);
    });
}

//check if user has access to all projects in (write access) projects_id
exports.validate_projects = function(user, project_ids, cb) {
    if(!project_ids) return cb(); //no project, no checking necessary
    exports.getprojects(user, (err, canread_project_ids, canwrite_project_ids)=>{
        if(err) return cb(err);

        //need to convert all ids to string..
        canwrite_project_ids = canwrite_project_ids.map(id=>id.toString());

        //iterate each ids to see if user has access
        var err = null;
        project_ids.forEach(id=>{
            if(!~canwrite_project_ids.indexOf(id)) err = "you don't have write access to project:"+id;
        });
        cb(err);
    });
}

/*
exports.archive_task = function(dataset, auth, cb) {

    //find output file override
    let output_id = dataset.prov.output_id;
    let output = dataset.prov.task.config._outputs.find(o=>o.id == output_id);
    let files_override = output.files || {}

    //TODO - deprecate this with app-archive based archiver

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

                //now start feeding the writestream (/tmp/archive-XXX/thing)
                request({
                    url: config.amaretti.api+"/task/download/"+dataset.prov.task._id,
                    qs: {
                        p: srcpath,
                    },
                    headers: { authorization: auth }
                })
                .on('response', function(r) {
                    if(r.statusCode != 200) {
                        logger.debug("/task/download failed "+r.statusCode+" path:"+srcpath, file.required); 
                        input_ok = false;
                    }
                }).pipe(writestream);
            }, err=>{
                if(err) {
                    cleantmp();
                    if (err.file) dataset.desc = "Expected output " + (err.file.filename||err.file.dirname) + " not found";
                    else dataset.desc = "Failed to store all files under tmpdir";
                    dataset.status = "failed";
                    dataset.save(_err=>{
                        if(_err) logger.error(_err); //ignore..?
                        cb(dataset.desc);
                    });
                    return;
                }

                fs.writeFileSync(tmpdir+"/.brainlife.json", JSON.stringify(dataset, null, 4));
                filenames.push(".brainlife.json");
                //console.dir(filenames);

                //all items stored under tmpdir! call cb, but then asynchrnously copy content to the storage
                var storage = config.storage_default();
                var system = config.storage_systems[storage];
                logger.debug("obtaining upload stream for", storage);
                system.upload(dataset, (err, writestream, done)=>{
                    if(err) return cb(err);
                    filenames.unshift("hc"); //inject tar command..
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

                    logger.debug("streaming to storage");
                    tar.stdout.pipe(writestream);

                    //TODO - I am not sure if all writestream returnes file object (pkgcloud does.. but this makes it a bit less generic)
                    //maybe I should run system.stat()?
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
                });
            });
        });
    });
}
*/

//TODO should inline this?
function register_dataset(task, output, product, cb) {
    new db.Datasets({
        user_id: task.user_id,
        project: output.archive.project,
        desc: output.archive.desc,

        tags: product.tags,
        meta: product.meta,
        datatype: output.datatype,
        datatype_tags: product.datatype_tags,

        //status: "waiting",
        status_msg: "Waiting for the archiver ..",
        product,
        
        prov: {
            task, 
            output_id: output.id, 
            subdir: output.subdir, //optional

            instance_id: task.instance_id, //deprecated use prov.task.instance_id
            task_id: task._id, //deprecated. use prov.task._id
        },
    }).save(cb); 
}

//wait for a task to terminate .. finish/fail/stopped/removed
exports.wait_task = function(req, task_id, cb) {
    logger.info("waiting for task to finish");
    request.get({
        url: config.amaretti.api+"/task/"+task_id,
        json: true,
        headers: {
            authorization: req.headers.authorization,
        }
    }, (err, _res, task)=>{
        if(err) return cb(err);
        switch(task.status) {
        case "finished":
            cb();
            break;
        case "requested":
        case "running":
        case "running_sync":
            setTimeout(()=>{
                exports.wait_task(req, task_id, cb);
            }, 2000);
            break;
        default:
            //consider all else as failed
            cb(task.status);
        }
    });
}

exports.issue_archiver_jwt = async function(user_id, cb) {
    //load user's gids so that we can add warehouse group id (authorized to access archive)
    let gids = await rp.get({
        url: config.auth.api+"/user/groups/"+user_id,
        json: true,
        headers: {
            authorization: "Bearer "+config.warehouse.jwt,
        }
    });
    
    ///add warehouse group that allows user to submit
    gids = gids.concat(config.archive.gid);  

    //issue user token with added gids priviledge
    let {jwt: user_jwt} = await rp.get({
        url: config.auth.api+"/jwt/"+user_id,
        json: true,
        qs: {
            claim: JSON.stringify({gids}),
        },
        headers: {
            authorization: "Bearer "+config.warehouse.jwt,
        }
    });

    return user_jwt;
}

exports.archive_task_outputs = function(task, outputs, cb) {
    if(!Array.isArray(outputs)) {
        return cb("archive_task_outputs/outputs is not array "+JSON.stringify(outputs, null, 4));
    }
    let products = exports.split_product(task.product||{}, outputs);

    //get all project ids set by user
    let project_ids = [];
    outputs.forEach(output=>{
        if(output.archive) project_ids.push(output.archive.project);
    });
    
    //check project access
    exports.validate_projects(task.user_id, project_ids, err=>{
        if(err) return cb(err);
        
        //register datasets
        let datasets = []; 
        async.eachSeries(outputs, (output, next_output)=>{
            if(!output.archive) return next_output();
            register_dataset(task, output, products[output.id], (err, dataset)=>{
                if(err || !dataset) return next_output(); //couldn't register, or already registered
                /*
                if(!output.subdir) {
                    //if output doesn't have subdir set, we need to use the old archiving method...
                    logger.debug("requesting for archive_handler to archive it");
                    acon.publish('warehouse.archive', {dataset_id: dataset._id});
                }else {
                */
                let dir =  "../"+task._id;
                dataset.prov.task = dataset.prov.task._id; //unpopulate prov as it will be somewhat redundant
                if(output.subdir) {
                    //new subdir outputs
                    dir+="/"+output.subdir,
                    datasets.push({
                        project: output.archive.project,
                        dir,
                        dataset, //need to pass the dataet for .brainlife.io
                    });
                    next_output();
                } else {
                    //old method
                    //console.dir(output.archive);
                    db.Datatypes.findById(output.datatype, (err, datatype)=>{
                        if(err) return next_output(err);
                        datasets.push({
                            project: output.archive.project,
                            dir,
                            dataset, //for .brainlife.io
                            files: datatype.files,
                            files_override: output.files, 
                        });
                        next_output();
                    });
                }

            });
        }, async err=>{
            if(err) return cb(err);
            if(datasets.length == 0) return cb();

            try {
                let user_jwt = await exports.issue_archiver_jwt(task.user_id);
                /*
                //load user's gids so that we can add warehouse group id (authorized to access archive)
                let gids = await rp.get({
                    url: config.auth.api+"/user/groups/"+task.user_id,
                    json: true,
                    headers: {
                        authorization: "Bearer "+config.warehouse.jwt,
                    }
                });
                
                ///add warehouse group that allows user to submit
                gids = gids.concat(config.archive.gid);  

                //issue user token with added gids priviledge
                let {jwt: user_jwt} = await rp.get({
                    url: config.auth.api+"/jwt/"+task.user_id,
                    json: true,
                    qs: {
                        claim: JSON.stringify({gids}),
                    },
                    headers: {
                        authorization: "Bearer "+config.warehouse.jwt,
                    }
                });
                */

                //submit app-archive!
                let remove_date = new Date();
                remove_date.setDate(remove_date.getDate()+7); //remove in 7 days(?)
                let archive_task = await rp.post({
                    url: config.amaretti.api+"/task",
                    json: true,
                    body: {
                        deps : [ task._id ],
                        //name : "archiving",
                        //desc : "archiving",
                        service : "brainlife/app-archive",
                        instance_id : task.instance_id,
                        config: {
                            datasets,
                        },
                        max_runtime: 1000*3600, //1 hour should be enough for most..
                        remove_date,
                    },
                    headers: {
                        authorization: "Bearer "+user_jwt,
                    }
                });
                logger.info("submitted archive_task:"+archive_task.task._id);
                cb(null, archive_task.task);
            } catch(err) {
                cb(err);
            }
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
                    con_details.push(detail);
                    next_con();
                });
            }, err=>{
                cb(null, git, con_details);
            });
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
        creators.push(`<creator><creatorName>${xmlescape(contact.fullname)}</creatorName></creator>`);
    });

    let contributors = [];
    if(app.contributors) app.contributors.forEach(contact=>{
        //contributorType can be ..
        //Value \'Contributor\' is not facet-valid with respect to enumeration \'[ContactPerson, DataCollector, DataCurator, DataManager, Distributor, Editor, HostingInstitution, Other, Producer, ProjectLeader, ProjectManager, ProjectMember, RegistrationAgency, RegistrationAuthority, RelatedPerson, ResearchGroup, RightsHolder, Researcher, Sponsor, Supervisor, WorkPackageLeader]\'. It must be a value from the enumeration.'
        contributors.push(`<contributor contributorType="Other"><contributorName>${xmlescape(contact.name)}</contributorName></contributor>`);
    });

    let subjects = []; //aka "keyword"
    app.tags.forEach(tag=>{
        subjects.push(`<subject>${xmlescape(tag)}</subject>`);
    });

    let metadata = `<?xml version="1.0" encoding="UTF-8"?>
    <resource xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://datacite.org/schema/kernel-4" xsi:schemaLocation="http://datacite.org/schema/kernel-4 http://schema.datacite.org/meta/kernel-4/metadata.xsd">
      <identifier identifierType="DOI">${app.doi}</identifier>
      <creators>
        ${creators.join('\n')}
      </creators>
      <contributors>
        ${contributors.join('\n')}
      </contributors>
      <subjects>
        ${subjects.join('\n')}
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
        creators.push(`<creator><creatorName>${xmlescape(contact.fullname)}</creatorName></creator>`);

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
        contributors.push(`<contributor contributorType="Other"><contributorName>${xmlescape(contact.fullname)}</contributorName></contributor>`);
        
    });

    let subjects = []; //aka "keyword"
    pub.tags.forEach(tag=>{
        subjects.push(`<subject>${xmlescape(tag)}</subject>`);
    });

    let metadata = `<?xml version="1.0" encoding="UTF-8"?>
    <resource xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://datacite.org/schema/kernel-4" xsi:schemaLocation="http://datacite.org/schema/kernel-4 http://schema.datacite.org/meta/kernel-4/metadata.xsd">
      <identifier identifierType="DOI">${pub.doi}</identifier>
      <creators>
        ${creators.join('\n')}
      </creators>
      <contributors>
        ${contributors.join('\n')}
      </contributors>
      <subjects>
        ${subjects.join('\n')}
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
exports.cache_contact = function(cb) {
    request({
        url: config.auth.api+"/profile", json: true,
        qs: {
            limit: 5000, //TODO -- really!?
        },
        headers: { authorization: "Bearer "+config.warehouse.jwt }, //config.auth.jwt is deprecated
    }, (err, res, body)=>{
        if(err) return logger.error(err);
        if(res.statusCode != 200) logger.error("couldn't cache auth profiles. code:"+res.statusCode);
        else {
            body.profiles.forEach(profile=>{
                cached_contacts[profile.id.toString()] = profile;
            });
            if(cb) cb();
        }
    });
}
exports.cache_contact();
setInterval(exports.cache_contact, 1000*60*30); //cache every 30 minutes

exports.deref_contact = function(id) {
    return cached_contacts[id];
}

/* bad pattern..
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
        console.dir(app.contributors.toObject());
        cb();
    });
}
*/

//for split_product
Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
};

//split the task product into separate dataset products. flatten structure so that we merge *global* (applies to all dataset) product.json info
//to output for each datasets - for convenience and for backward compatibility
exports.split_product = function(task_product, outputs) {
    //create global product (everything except output.id keys)
    let global_product = Object.assign({}, task_product); //copy
    if(!Array.isArray(outputs)) {
        logger.error("broken outputs info");
        return {};
    }
    outputs.forEach(output=>{
        delete global_product[output.id]; //remove dataset specific output
    });

    function merge(dest, src) {
        for(let key in src) {
            if(!dest[key]) dest[key] = src[key];
            else {
                if(Array.isArray(src[key])) {
                    dest[key] = dest[key].concat(src[key]).unique(); //merge array
                } else if(typeof src[key] == 'object') {
                    Object.assign(dest[key], src[key]);
                } else {
                    //must be primitive
                    dest[key] = src[key];
                }
            }
        }
    }

    //put everything together - output specific data takes precedence over global
    let products = {};
    outputs.forEach(output=>{
        //pull things from config output
        products[output.id] = {
            tags: output.tags||[],
            datatype_tags: output.datatype_tags||[],
            meta: output.meta||{},
        };
        merge(products[output.id], global_product);
        if(task_product) merge(products[output.id], task_product[output.id])
    });

    return products;
}
