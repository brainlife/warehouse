
const request = require('request'); //TODO switch to axios!
const rp = require('request-promise-native');
const keywordEx = require("keyword-extractor");
const tmp = require('tmp');
const path = require('path');
const child_process = require('child_process');
const fs = require('fs');
const async = require('async');
const redis = require('redis');
const xmlescape = require('xml-escape');
const amqp = require("amqp"); //switch to amqplib?
const axios = require('axios');
const jwt = require('express-jwt');
const crypto = require('crypto');

const config = require('./config');
const db = require('./models');
const mongoose = require('mongoose');

exports.connectRedis = function() {
    const con = redis.createClient(config.redis.port, config.redis.server);
    con.on('error', console.error);
    con.on('ready', ()=>{ console.log("connected to redis") });
    return con;
}

//TODO - should be called something like "get_project_accessiblity"?
exports.getprojects = function(user, cb) {
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
            if(user && p.members.includes(user)) return true;
            if(user && p.admins.includes(user)) return true;
            return false;
        });
        let canwrite_ids = canwrite_projects.map(p=>p._id);
        cb(null, canread_ids, canwrite_ids);
    });
}

//check if user has access to all projects in (write access) projects_id
exports.validate_projects = function(user, project_ids, cb) {
    if(!project_ids) return cb(); //no project, no checking necessary

    //need to be all strings
    project_ids = project_ids.map(id=>id.toString());

    exports.getprojects(user, (err, canread_project_ids, canwrite_project_ids)=>{
        if(err) return cb(err);

        //need to be all strings
        canwrite_project_ids = canwrite_project_ids.map(id=>id.toString());

        //iterate each ids to see if user has access
        err = null;
        project_ids.forEach(id=>{
            if(!~canwrite_project_ids.indexOf(id)) err = "you("+user+") don't have write access to project:"+id;
        });
        cb(err);
    });
}

//copy exists in amaretti/ common.js
exports.escape_dot = function(obj) {
    if(typeof obj == "object") {
        for(let key in obj) {
            exports.escape_dot(obj[key]);
            if(key.includes(".")) {
                let newkey = key.replace(/\./g, '-');
                obj[newkey] = obj[key];
                delete obj[key];
            }
        }
    }
    return obj;
}

//TODO should inline this?
function register_dataset(task, output, product, cb) {

    //WATCH OUT.. "task" here could be the _dtv.. not the main task.
    //so service/servide_branch etc.. might not be meaningful..
    //we need to lookup the task via follow_task_id if it's set

    db.Datasets.create({
        user_id: task.user_id,
        project: output.archive.project,
        desc: output.archive.desc,

        tags: product.tags,
        meta: product.meta,
        datatype: output.datatype,
        datatype_tags: product.datatype_tags,

        status_msg: "Waiting for the archiver ..",

        prov: {
            //only store the most important things
            task: {
                _id: task._id,
                follow_task_id: task.follow_task_id, //for _dtv

                name: task.name,
                config: task.config||{},
                service: task.service,
                service_branch: task.service_branch,

                deps_config: task.deps_config,

                instance_id: task.instance_id,
                resource_id: task.resource_id,
                commit_id: task.commit_id,
                user_id: task.user_id,

                create_date: task.create_date,
                start_date: task.start_date,
                finish_date: task.finish_date,
            },
            output_id: output.id,
            subdir: output.subdir, //optional

            instance_id: task.instance_id, //deprecated use prov.task.instance_id
            task_id: task._id, //deprecated. use prov.task._id
        },
    }, (err, _dataset)=>{
        if(err) return cb(err);
        
        //store product in different table
        db.DatasetProducts.create({
            dataset_id: _dataset._id,
            product: exports.escape_dot(product),

            //I think we always query datasets first, then load product as necessary
            //if so, the I don't think we need to store service/branch - just look up from dataset?
            //service: task.service,
            //service_branch: task.service_branch,

        }, (err, _dataset_product)=>{
            if(!err) exports.publish("dataset.create."+task.user_id+"."+output.archive.project+"."+_dataset._id, _dataset);
            cb(err, _dataset);
        });
    });
}

//wait for a task to terminate .. finish/fail/stopped/removed
exports.wait_task = function(req, task_id, cb) {
    console.debug("waiting for task to finish id:"+task_id);
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
            console.debug("wait_task detected failed task")
            cb(task.status_msg);
        }
    });
}

//TODO - I should create more generic version of this
//galauncher api does something similar
exports.issue_archiver_jwt = async function(user_id) {

    //load user's gids so that we can add warehouse group id (authorized to access archive)
    //I need existing user's gids so that user can submit staging task on the instance that user should have access to
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

//register new dataset and submits brainlife/app-archive to archive data for it
exports.archive_task_outputs = async function(user_id, task, outputs, cb) {
    if(!Array.isArray(outputs)) {
        return cb("archive_task_outputs/outputs is not array "+JSON.stringify(outputs, null, 4));
    }

    let task_products;
    try {
        task_products = await rp.get({
            url: config.amaretti.api+"/task/product/", json: true,
            qs: {
                ids: [task._id],
            },
            headers: { authorization: "Bearer "+config.warehouse.jwt, },
        });
    } catch (err) {
        return cb(err)
    }

    let task_product;
    if(task_products.length == 1) {
        task_product = task_products[0].product;
    } else {
        //fallback on the old task.product - in case user is still running old jobs
        task_product = task.product;
    }

    let products = exports.split_product(task_product, outputs);

    //get all project ids set by user
    let project_ids = [];
    outputs.forEach(output=>{
        if(output.archive && !~project_ids.indexOf(output.archive.project)) project_ids.push(output.archive.project);
    });

    //handles multiple output datasets, but they should all belong to the same project.
    //if not, app-archive will fail..
    if(project_ids.length == 0) return cb(); //nothing to archive?
    if(project_ids.length > 1) return cb("archive_task_outputs can't handle request with mixed projects");
    let project = await db.Projects.findById(project_ids[0]);

    //let storage = project.storage||config.archive.storage_default;
    //let storage_config = project.storage_config||config.archive.storage_config;
    let storage = config.archive.storage_default;
    let storage_config = {};

    //check project access
    exports.validate_projects(user_id, project_ids, err=>{
        if(err) return cb(err);
        let datasets = []; 
        let dataset_configs = []; 
        let subdirs;
        let noSubdirs = false;
        async.eachSeries(outputs, (output, next_output)=>{
            //only archive output that has archive requested
            if(!output.archive) return next_output();

            console.debug("registering dataset for task", task._id);
            register_dataset(task, output, products[output.id], async (err, dataset)=>{
                if(err) return next_output(err);
                if(!dataset) return next_output(); //couldn't register, or already registered
                let dir =  "../"+task._id;

                const datatype = await db.Datatypes.findById(output.datatype);

                let dataset_config = {
                    project: output.archive.project,
                    dir,

                    dataset_id: dataset._id,
                    create_date: dataset.create_date,

                    //should be the same across all requested dataset (these are set by event_handler when app-achive finishes successfully)
                    storage,
                    storage_config,
                }

                if(project.xnat && project.xnat.enabled) {
                    dataset_config.storage = "xnat";

                    const secretEnc = exports.encryptConfigValue(project.xnat.secret);
                    const meta = products[output.id].meta;
                    dataset_config.storage_config = {
                        hostname: project.xnat.hostname,
                        project: project.xnat.project,
                        token: project.xnat.token,
                        path: "files", //everything
                        secretEnc,
                        meta, //app-archive needs to access subject/session
                    }
                    dataset_config.datatype_id = datatype._id;
                    dataset_config.datatype_name = datatype.name;

                    //app-archive load the prov from the public API and store it next to data
                    dataset_config.provURL = config.warehouse.api+"/dataset/prov/"+dataset._id;
                }

                if(output.subdir) {
                    //new subdir outputs
                    dataset_config.dir+="/"+output.subdir;
                    if(!subdirs) subdirs = [];
                    subdirs.push(output.subdir);
                } else {
                    //old method - use datatype info
                    dataset_config.files = datatype.files;
                    dataset_config.files_override = output.files;
                    noSubdirs = true; //old method requires the entire workdir to be synced.
                }
                dataset_configs.push(dataset_config);
                datasets.push(dataset);
                next_output();
            });
        }, async err=>{
            if(err) return cb(err);
            if(datasets.length == 0) return cb();
            try {
                //only archiver group user can run app-stage/arcvehi, 
                //so I need to add group access temporarily
                let user_jwt = await exports.issue_archiver_jwt(user_id);

                //submit app-archive!
                let remove_date = new Date();
                remove_date.setDate(remove_date.getDate()+1); //remove in 1 day
                if(noSubdirs) subdirs = undefined;
                console.log("submitting app-archive");
                let archive_task_res = await axios.post(config.amaretti.api+"/task", {
                    name: "archive",
                    deps_config: [ {task: task._id, subdirs } ],
                    service: "brainlife/app-archive",
                    instance_id: task.instance_id,
                    gids: [config.archive.gid],
                    config: {
                        datasets: dataset_configs,
                    },
                    max_runtime: 1000*3600, //1 hour should be enough for most..
                    remove_date,

                    //for slate?
                    //preferred_resource_id: storage_config.resource_id,
                },{
                    headers: {
                        authorization: "Bearer "+user_jwt,
                    }
                });

                //note: archive_task_id is set by event_handler (when app-archive is requested)
                //storage/storate_config is also copied to dataset once archive finished
                console.debug("submitted archive_task:"+archive_task_res.data.task._id);
                cb(null, datasets, archive_task_res.data.task);
            } catch(err) {
                cb(err);
            }
        });
    });
}

//get new information from github and apply it to app document
exports.update_appinfo = function(app, cb) {
    let service_name = app.github;
    exports.load_github_detail(service_name, (err, repo, con_details)=>{
        if(err) return cb(err);
        app.desc = repo.description;
        app.tags = repo.topics;
        if(!app.stats) app.stats = {};
        app.stats.stars = repo.stargazers_count;
        app.markModified('stats');
        app.contributors = con_details.map(con=>{
            //see https://api.github.com/users/francopestilli for other fields
            return {name: con.name, email: con.email};
        });
        cb();
    });
}

exports.load_github_detail = function(service_name, cb) {
    if(!config.github) return cb("no github config");
    let headers = {
        'Authorization': 'token '+config.github.access_token,
        'User-Agent': 'brainlife',

        //needed to get topic (which is currently in preview mode..)
        //https://developer.github.com/v3/repos/#list-all-topics-for-a-repository
        'Accept': "application/vnd.github.mercy-preview+json", 
    }
    axios.get("https://api.github.com/repos/"+service_name, { headers }).then(res=>{
        let git = res.data;
        if(res.status != 200) {
            console.error(res);
            return cb("failed to query requested repo. code:"+res.status);
        }

        console.debug("loading contributors");
        axios.get("https://api.github.com/repos/"+service_name+"/contributors", { headers }).then(res=>{
            let cons = res.data;
            if(res.status != 200) {
                console.error(res);
                return cb("failed to query requested repo. code:"+res.status);
            }

            console.debug("loading contributor details")
            let con_details = [];
            async.eachSeries(cons, (con, next_con)=>{
                axios.get(con.url, { headers }).then(res=>{
                    let detail = res.data;
                    if(res.status != 200) {
                        console.error(res);
                        return next_con("failed to load user detail:"+res.status);
                    }
                    con_details.push(detail);
                    next_con();
                }).catch(next_con);
            }, err=>{
                cb(err, git, con_details);
            });
        }).catch(cb);
    }).catch(cb)
}

exports.generateQueries = async function(query, cb) {
    const res = await axios.get("https://api.labs.cognitive.microsoft.com/academic/v1.0/interpret",{
        headers: {
            'Ocp-Apim-Subscription-Key': config.mag.subscriptionKey,
            'User-Agent': 'brainlife',
        },
        params: {
            query,
        }
    });
    if(res.status != 200) return cb("failed to call mag interpret api");
    const queries = [];
    res.data.interpretations.forEach(i=>{
       const rule = i.rules[0]; //not sure why MAG returns an array of 1
       queries.push({query: rule.output.value, logprob: i.logprob});
    });
    cb(null, queries);
}

exports.getRelatedPaper = function(query, cb) {
    axios.get("https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate", {
        headers: {
            'Ocp-Apim-Subscription-Key': config.mag.subscriptionKey,
            'User-Agent': 'brainlife',
        },
        params: {
            expr: query,
            count: 10, 
            offset: 0, 
            model: 'latest', 
            attributes: 'Id,AA.AfId,AA.AfN,AA.AuId,AA.AuN,AA.DAuN,CC,CN,D,Ti,F.FId,F.FN,Y,VFN,DOI,IA',
        },
    }).then(res=>{
        if(res.status != 200) return cb("failed to call mag api");
        cb(null, res.data.entities);
    });
}

exports.updateRelatedPaperMag = function(rec,cb) {
    console.log("----------------- updateRelatedPaperMag %s %s", rec.name, rec._id.toString());

    //put everything togetehr
    let str = "";
    if(rec.tags) str += rec.tags.join(" ")+" ";
    if(rec.name) str += rec.name+" ";
    if(rec.desc) str += rec.desc+" ";
    if(rec.readme) str += rec.readme+" ";

    //pull keywords
    let keywords = keywordEx.extract(str,{
        language:"english",
        remove_digits: true,
        return_chaned_words: true,
        remove_duplicates: true,
    });

    //remove keywords that starts with odd characters (like "/", "##", etc..)
    keywords = keywords.filter(w=>w.match(/^[a-z0-9]/i));

    //pick the first N words
    keywords = keywords.slice(0, 20); //too big?

    console.log("using keywods", keywords);
    if(!keywords.length) cb(); //no keywords, no paper..

    let papers = [];
    exports.generateQueries(keywords.join(" "), (err, queries)=>{
        if(err) return cb(err);
        async.eachSeries(queries, (query, next_query)=>{
            console.log("--- query ", query);
            exports.getRelatedPaper(query.query, (err, entities)=>{
                if(err) return next_query(err);
                entities.forEach(entity=>{
                    console.log(entity.logprob, entity.DOI, entity.Ti);

                    if(!entity.DOI) return; //ignore ones without DOI

                    //"multiply" by the query probability
                    entity.logprob+=query.logprob;

                    //dedupe papers and check for doi
                    const existingPaper = papers.find(paper=>paper.Id == entity.Id);

                    if(existingPaper) {
                        existingPaper.logprob += 5; //boost prob if we found more than once
                        if(existingPaper.logprob < entity.logprob) existingPaper.logprob = entity.logprob;
                    } else {
                        papers.push(entity);
                    }
                });
                next_query();
            });
        }, err=>{
            if(err) return cb(err);

            //sort papers by logprob
            papers.sort((a,b)=>b.logprob - a.logprob);

            //map to relatedPapers object
            console.log("---------- final results ------------");
            rec.relatedPapers = papers.map(paper=>{
                console.log(paper.logprob, paper.DOI, paper.Ti);
                const ret = {
                    publicationDate: new Date(paper.D),
                    citationCount: paper.CC,
                    title: paper.Ti, 
                    doi: paper.DOI,
                    venue: paper.VFN, 
                    authors: paper.AA.map(author=>({institution: author.AfN, name: author.DAuN })),

                    logprob: paper.logprob,
                }

                if(paper.F) ret.fields = paper.F.map(name=>name.FN);
                if(paper.IA) {
                    let abstract = [];
                    for (const word in paper.IA.InvertedIndex) {
                        paper.IA.InvertedIndex[word].forEach(idx=>{
                            abstract[idx] = word;
                        });
                    }
                    ret.abstract = abstract.join(' ');
                }
                return ret;
            }).sort((a,b)=> new Date(b.publicationDate) - new Date(a.publicationDate)).
            filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i); //.slice(0, 20); //only store top 20

            rec.markModified("relatedPapers");
            rec.save(cb);
        });
    });
}

exports.compose_app_datacite_metadata = function(app) {
    if(!cachedContacts) throw "Please call startContactCache first";

    //publication year
    let year = app.create_date.getFullYear();
    let publication_year = "<publicationYear>"+year+"</publicationYear>";

    let creators = [];
    app.admins.forEach(sub=>{
        let contact = cachedContacts[sub];
        if(!contact) {
            console.debug("missing contact", sub);
            return;
        }
        //TODO - add <nameIdentifier nameIdentifierScheme="ORCID">12312312131</nameIdentifier>
        creators.push(`<creator><creatorName>${xmlescape(contact.fullname)}</creatorName></creator>`);
    });

    //datacite requires at least 1 creator.. if we fail to find at least 1 admin contact, let's use franco's name
    if(creators.length == 0) {
        creators.push(`<creator><creatorName>Franco Pestilli</creatorName></creator>`);
    }

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
    return metadata;
}

//https://schema.datacite.org/meta/kernel-4.1/doc/DataCite-MetadataKernel_v4.1.pdf
exports.compose_pub_datacite_metadata = function(pub) {
    if(!cachedContacts) throw "Please call startContactCache first";

    //publication year
    let year = pub.create_date.getFullYear();
    let publication_year = "<publicationYear>"+year+"</publicationYear>";

    //in case author is empty.. let's use submitter as author..
    //TODO - we need to make author required field
    if(pub.authors.length == 0) pub.authors.push(pub.user_id);

    let creators = [];
    pub.authors.forEach(sub=>{
        let contact = cachedContacts[sub];
        if(!contact) {
            console.debug("missing contact", sub);
            return;
        }
        //TODO - add <nameIdentifier nameIdentifierScheme="ORCID">12312312131</nameIdentifier>
        creators.push(`<creator><creatorName>${xmlescape(contact.fullname)}</creatorName></creator>`);
    });

    let contributors = [];
    pub.contributors.forEach(sub=>{
        let contact = cachedContacts[sub];
        if(!contact) {
            console.debug("missing contact", sub);
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

exports.get_next_app_doi = function(cb) {
    //console.log("querying for next doi")
    db.Apps.find({}).select("doi").sort("-doi").limit(1).exec().then(recs=>{
        let rec = recs[0];
        let doi_tokens = rec.doi.split(".");
        let num = parseInt(doi_tokens[doi_tokens.length-1])+1;
        //console.debug("next doi token will be", num);
        cb(null, config.datacite.prefix+"app."+num);
    }).catch(cb);
}

//https://support.datacite.org/v1.1/docs/mds-2
//create new doi and register metadata (still needs to set url once it's minted)
exports.doi_post_metadata = function(metadata, cb) {
    //register!
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
        console.debug('metadata registration:', res.statusCode, body);
        if(res.statusCode == 201) return cb(); //good!

        //consider all else failed!
        console.error("failed to post metadata to datacite");
        console.error(config.datacite.api+"/metadata");
        console.error("user %s", config.datacite.username);
        return cb(body);
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
        console.debug('url registration:', res.statusCode, body);
        if(res.statusCode != 201) return cb(body);
        cb(null);
    });
}

exports.cacheContact = function(cb) {
    console.debug("caching contacts");
    axios.get(config.auth.api+"/profile/list", {
        params: {
            limit: 5000, //TODO -- really!?
        },
        headers: { authorization: "Bearer "+config.warehouse.jwt }, //config.auth.jwt is deprecated
    }).then(res=>{
        if(res.status != 200) console.error("couldn't cache auth profiles. code:"+res.status);
        else {
            cachedContacts = {};
            res.data.profiles.forEach(profile=>{
                cachedContacts[profile.sub] = profile;
            });
            //console.log("cached profile len:", res.data.profiles.length);
            if(cb) cb();
        }
    }).catch(err=>{
        if(cb) cb(err);
        else console.error(err);
    });
}

//call this if you want to use API that uses contact cache
//TODO - update cache from amqp events instead?
let cachedContacts = null;
exports.startContactCache = function(cb) {
    if(cachedContacts) return cb(); //already started
    setInterval(exports.cacheContact, 1000*60*30); //cache every 30 minutes
    exports.cacheContact(cb);
}

//just a wrapper for startContactCache.
exports.startContactCachePromise = async function() {
    return new Promise((resolve, reject)=>{
        exports.startContactCache(err=>{
            if(err) return reject(err);
            resolve();
        });
    });
}

exports.deref_contact = function(id) {
    if(!cachedContacts) throw "Please call startContactCache first";
    return cachedContacts[id];
}

//for split_product
Array.prototype.unique = function() {
    let a = this.concat();
    for(let i=0; i<a.length; ++i) {
        for(let j=i+1; j<a.length; ++j) {
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
        console.error("outputs should be an array.. given:", outputs);
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

//TODO - this has to match up between amaretti/bin/metrics and warehouse/api/controller querying for graphite daa
exports.sensu_name = function(name) {
    name = name.toLowerCase();
    name = name.replace(/[_.@$#\/]/g, "-");
    name = name.replace(/[ ()]/g, "");
    return name;
}

let amqpConn = null;
let warehouse_ex;
exports.connectAMQP = function(cb) {
    let conn = amqp.createConnection(config.event.amqp, {reconnectBackoffTime: 1000*10});
    conn.once("ready", err=>{
        if(err) return cb(err);
        console.log("connected to amqp server");
        conn.exchange("warehouse", {autoDelete: false, durable: true, type: 'topic', confirm: true}, ex=>{
            warehouse_ex = ex;

            //deprecated exchange but still used
            conn.exchange("wf.instance", {autoDelete: false, durable: true, type: 'topic', confirm: true}, _ex=>{

                //deprecated exchange but still used
                conn.exchange("wf.task", {autoDelete: false, durable: true, type: 'topic', confirm: true}, _ex=>{
                    amqpConn = conn;
                    cb(null, conn);
                });
            });
        })
    });
    conn.on("error", cb);
}

exports.disconnectAMQP = function(cb) {
    if(!amqpConn) return console.error("AMQP not connected");
    console.debug("disconnecting from amqp");
    amqpConn.setImplOptions({reconnect: false}); //https://github.com/postwait/node-amqp/issues/462
    amqpconn.disconnect();
}

//connect to the amqp exchange and wait for a event to occur
exports.wait_for_event = function(exchange, key, cb) {
    if(!amqpConn) return console.error("wait_for_event called before connecting to amqp");
    amqpConn.queue('', q=>{
        q.bind(exchange, key, ()=>{
            q.subscribe((message, header, deliveryInfo, messageObject)=>{
                q.destroy();
                cb(null, message);
            });
        });
    });
}

exports.update_dataset_stats = async function(project_id, cb) {
    console.debug("updating dataset stats project:%s", project_id);
    project_id = mongoose.Types.ObjectId(project_id);

    try {
        //create inventory stats
        let inventory = await db.Datasets.aggregate()
            .match({ removed: false, project: project_id, })
            .group({_id: {
                "subject": "$meta.subject", 
                "datatype": "$datatype", 
            }, count: {$sum: 1}, size: {$sum: "$size"} })
            .sort({"_id.subject":1});
        let subjects = new Set();
        let stats = {
            subject_count: 0,
            count: 0, 
            size: 0,
            datatypes_detail: [],
        }
        inventory.forEach(item=>{
            subjects.add(item._id.subject);

            //some project contains dataset without datatype??
            if(item._id.datatype) {
                let type = item._id.datatype;
                let datatype = stats.datatypes_detail.find(datatype=>datatype.type.toString() == type.toString());
                if(datatype) {
                    datatype.subject_count++;
                    datatype.count += item.count;
                    datatype.size += item.size;
                } else {
                    stats.datatypes_detail.push({ type, count: item.count, size: item.size, subject_count: 1 });
                }
            }

            //calculate total
            stats.count += item.count;
            stats.size += item.size;
        });
        stats.subject_count = subjects.size;
        console.log("publishing project update", project_id);
        console.dir(stats);
        exports.publish("project.update.warehouse."+project_id, {stats: {
            datasets: stats
        }})
        let doc = await db.Projects.findByIdAndUpdate(project_id, {$set: {"stats.datasets": stats}}, {new: true});

        if(cb) cb(null, doc);
    } catch(err) {
        if(cb) cb(err);
        else console.error(err);
    }
}

//update the secondary metadata for group analysis datatypes
//(removed will set to true if it's removed - but we don't remove files)
exports.updateSecondaryInventoryInfo = async function(dataset_id) {
    const dataset = await db.Datasets.findOne({_id: dataset_id}).populate([
        {path: 'datatype', select: 'groupAnalysis name desc files'},
        {path: 'project', select: 'group_id'},
    ]);

    if(!dataset.datatype.groupAnalysis) return; //not group analysis

    const project = await db.Projects.findById(dataset.project);

    const dir = config.groupanalysis.secondaryDir+"/"+project.group_id;
    const path = dir+"/meta/"+dataset._id+".json";

    //figure out the secondary path
    const p = dataset.prov;
    if(p.task.follow_task_id) {
        //output from dtv is stored slightly differently (has to use output_id)
        dataset._secondaryPath = p.task.instance_id+"/"+p.task.follow_task_id+"/"+p.output_id;
    } else {
        //output without validator
        dataset._secondaryPath = p.task.instance_id+"/"+p.task._id+"/"+p.subdir;
    }

    await dataset.save();
    await new Promise((resolve, reject)=>{
        //console.debug(path);
        config.groupanalysis.getSecondaryUploadStream(path, (err, stream)=>{
            if(err) return reject(err);
            stream.write(JSON.stringify(dataset, null, 4));
            stream.end();
            resolve();
        });
    });
}

exports.update_secondary_index = async function(project) {
    console.log("updating secondary output index file for project", project._id);
    let participants = await db.Participants.findOne({project}).lean();

    //migrate
    if(participants && participants.rows) {
        console.log("renaming rows to subjects (rows are deprecated now)");
        participants.subjects = participants.rows;
        delete participants.rows;
    }

    //now load the index
    const _res = await axios.get(config.amaretti.api+'/task', {
        params: {
            select: 'config instance_id',
            find: JSON.stringify({
                'finish_date': {$exists: true},
                'service': 'brainlife/app-archive-secondary',
                '_group_id': project.group_id,
            }),
            limit: 20000, //TODO.. how scalable is this!?
        },
        headers: { authorization: "Bearer "+config.warehouse.jwt },
    });

    //merge sectasks into participants.subjects
    let index = {
        //project,
        //subjects: {},
        objects: [],
        participants,
    };

    //merge all output requests into a single list
    _res.data.tasks.forEach(task=>{
        if(!task.config.requests) return; //old format?
        task.config.requests.forEach(request=>{
            if(!request.datatype) return; //should only happen on dev
            
            //pull information out of request and store things that users care
            index.objects.push({
                path: request.instance_id+"/"+request.task_id+"/"+request.subdir,

                instance_id: request.instance_id,
                task_id: request.task_id,
                subdir: request.subdir,

                create_date: request.create_date,

                datatype: {
                    id: request.datatype._id,
                    name: request.datatype.name,
                    desc: request.datatype.desc,
                    files: request.datatype.files,
                },
                desc: request.output.desc,
                datatype_tags: request.output.datatype_tags,
                tags: request.output.tags,
                meta: request.output.meta,
            })
        });
    });

    //organize outputs into different subjects
    /*
    sectasks.forEach(sectask=>{
        let subject = sectask.meta.subject;
        if(!index.subjects[subject]) index.subjects[subject] = {}
        if(!index.subjects[subject].items) index.subjects[subject].items = [];
        index.subjects[subject].items.push(sectask);
    });
    */

    /* -- too expensive.. index.json could be close to 100MB.. we need a better way
    const path = config.groupanalysis.secondaryDir+"/"+project.group_id+"/index.json";
    config.groupanalysis.getSecondaryUploadStream(path, (err, stream)=>{
        console.log("storing index.json", path);
        stream.write(JSON.stringify(index, null, 4));
        stream.end();
    })
    */
}

exports.update_project_stats = async function(project, cb) {
    console.log("updating project stats project:", project._id)
    try {
        let counts = await rp.get({
            url: config.amaretti.api+"/instance/count", json: true,
            qs: {
                find: JSON.stringify({status: {$ne: "removed"}, group_id: project.group_id}),
            },
            headers: { authorization: "Bearer "+config.warehouse.jwt, },
        });
        let instance_counts = counts[0]; //there should be only 1

        //rule stats --------------------------------------------------------
        let stats = await db.Rules.aggregate()
            .match({removed: false, project: project._id})
            .group({_id: { "active": "$active" }, count: {$sum: 1}});
        
        let rules = {
            active: 0,
            inactive: 0,
        }
        stats.forEach(rec=>{
            if(rec._id.active) rules.active = rec.count;
            else rules.inactive = rec.count;
        });

        //group analysis--------------------------------------------------------
        let groupanalysis = {
            sessions: [],
        }

        //load existing sessions
        let sessionsRes = await axios(config.amaretti.api+"/task", {
            params: {
                find: JSON.stringify({
                    status: {$ne: "removed"},
                    service: "brainlife/ga-launcher",
                    //instance_id: instance._id,
                    _group_id: project.group_id,
                }),
                select: 'config.container'
            },
            headers: { authorization: "Bearer "+config.warehouse.jwt, },
        });

        console.log("tasks found", sessionsRes.data.tasks);
        groupanalysis.sessions = sessionsRes.data.tasks.map(t=>{
            return {
                task_id: t._id,
                config: t.config,
            }
        });
        
        //app stats -------------------------------------------------------------
        const recs = await exports.aggregateDatasetsByApps({project:project._id})
        const app_stats = [];
        recs.forEach(rec=>{
            app_stats.push({
                count: rec.count,
                app: rec.app,
                task: rec.task,
            });
        })

        //resource / service counts --------------------------------------------
        let resource_usage = await rp.get({
            url: config.amaretti.api+"/task/resource_usage", json: true,
            qs: {
                find: JSON.stringify({/*status: {$ne: "finished"},*/ _group_id: project.group_id}),
            },
            headers: { authorization: "Bearer "+config.warehouse.jwt, },
        });
        //resource_usage api returns group with no resource_id attached.. (bug?) let's filter them out for now
        resource_usage = resource_usage.filter(r=>r._id.resource_id !== undefined);

        //load resource details to be merged into the resource_usage info
        let resource_ids = resource_usage.map(raw=>raw._id.resource_id);
        resource_ids = [...new Set(resource_ids)]; //dedupe resource_ids
        const {resources} = await rp.get({
            url: config.amaretti.api+"/resource", json: true,
            qs: {
                find: JSON.stringify({_id: {$in: resource_ids}, user_id: null}),
            },
            headers: { authorization: "Bearer "+config.warehouse.jwt, },
        });
        const resource_stats = [];
        resources.forEach(resource=>{
            let count = 0;
            let total_walltime = 0;
            let services = [];
            resource_usage.filter(r=>r._id.resource_id == resource._id).forEach(raw=>{
                count+=raw.count;
                total_walltime+=raw.total_walltime;
                if(!services.includes(raw._id.service)) services.push(raw._id.service);
            });
            console.dir(services);
            resource_stats.push({
                resource_id: resource._id,
                name: resource.name,
                count,
                total_walltime,
                services,
            });
        });

        //lad number of publications
        let publications = await db.Publications.countDocuments({project});
        let comments = await db.Comments.count({project: project._id, removed: false});

        //now update the record!
        let newproject = await db.Projects.findOneAndUpdate({_id: project._id}, {$set: {
            "stats.rules": rules, 
            "stats.resources": resource_stats, 
            "stats.apps": app_stats, 
            "stats.publications": publications,
            "stats.instances": instance_counts,
            "stats.groupanalysis": groupanalysis,
            "stats.comments": comments,
        }}, {new: true});

        //only publish some stats that UI wants to receive
        exports.publish("project.update.warehouse."+project._id, {stats: {
            rules, //counts..
            instances: instance_counts,
            groupanalysis, //object..
            publications,
            comments,
        }})

        if(cb) cb(null, newproject);

    } catch (err) {
        if(cb) cb(err);
        else console.error(err);
    }
}

exports.update_rule_stats = function(rule_id, cb) {
    axios.get(config.amaretti.api+"/task", {
        params: {
            find: JSON.stringify({'config._rule.id': rule_id, status: {$ne: "removed"}}),
            select: 'status', 
            limit: 3000,
        },
        headers: { authorization: "Bearer "+config.warehouse.jwt, },
    }).then(async res=>{
        let tasks = res.data.tasks;
        if(!tasks) return cb(body);
        let stats = {}
        tasks.forEach(task=>{
            if(stats[task.status] === undefined) stats[task.status] = 0;
            stats[task.status]+=1;
        });
        const rule = await db.Rules.findById(rule_id);
        if(!rule) return cb("can't find the rule:"+rule_id);
        if(!rule.stats) rule.stats = {};
        rule.stats.tasks = stats;
        await rule.save();
        exports.publish("rule.update.warehouse."+rule.project+"."+rule._id, {
            stats: {
                tasks: rule.stats.tasks,
            }
        });
        cb(null, rule);
    }).catch(cb);
}

exports.dataset_to_filename = function(dataset) {
    let path ="dt-"+dataset.datatype.name.replace(/\//g, '-');
    dataset.datatype_tags.forEach(tag=>{
        //null is getting injected into datatype_tags.. until I find where it's coming from, 
        //I need to patch this by ignoring this
        if(!tag) return; 
        path+=".tag-"+tag.replace(/\./g, '-'); //'.' is used as delimiter
    });
    if(dataset.meta.run) path += ".run-"+dataset.meta.run;
    path+= ".id-"+dataset._id;
    return path;
}

exports.publish = (key, message, cb)=>{
    if(!message) message = {};
    message.timestamp = (new Date().getTime())/1000; //it's crazy that amqp doesn't set this?
    if(!warehouse_ex) { 
        console.error("warehouse_ex not connected yet.. can't publish");
    } else {
        console.log("publishing event", key, message);
        warehouse_ex.publish(key, message, {}, cb);
    }
}

exports.isadmin = (user, rec)=>{
    if(user) {
        if(user.scopes.warehouse && ~user.scopes.warehouse.indexOf('admin')) return true;
        if(rec.admins && ~rec.admins.indexOf(user.sub.toString())) return true;
    }
    return false;
}

exports.isguest = (user, rec)=> {
    if(user) {
        if(user.scopes.warehouse && ~user.scopes.warehouse.indexOf('admin')) return true;
        if(rec.guests && ~rec.guests.indexOf(user.sub.toString())) return true;
    }
    return false;
}

exports.ismember = (user, rec)=>{
    if(user) {
        if(user.scopes.warehouse && ~user.scopes.warehouse.indexOf('admin')) return true;
        if(rec.members && ~rec.members.indexOf(user.sub.toString())) return true;
    }
    return false;
}

exports.users_general = async ()=>{
    console.log("loading users");
    try {
        let users = await rp.get({
            url: config.auth.api+"/profile/list", json: true,
            qs: {
                find: JSON.stringify({
                    active: true,
                    "profile.private.notification.newsletter_general": true,
                }),
                limit: 3000,
            },
            headers: { authorization: "Bearer "+config.warehouse.jwt },
        });
        return users.profiles;
    } catch (err) {
        console.error(err);
    }
}


exports.cast_mongoid = function(node) {
    //mongoose doesn't cast object id on aggregate pipeline .. https://github.com/Automattic/mongoose/issues/1399
    //somewhat futile attempt to convert all string that looks like objectid to objectid.
    //mongoose.Types.ObjectId.isValid by itself doesn't work (https://github.com/Automattic/mongoose/issues/1959#issuecomment-97583033) 
    //const checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
    function isObjectIdValid(id) {
        if (mongoose.Types.ObjectId.isValid(id)) {
            if (String(new mongoose.Types.ObjectId(id)) === id) {
                return true;
            } else {
                return false
            }
        } else {
            return false
        }
    }

    for(let k in node) {
        let v = node[k];
        if(v === null) continue;
        if(isObjectIdValid(v)) {
            node[k] = mongoose.Types.ObjectId(v);
        } else if(typeof v == 'object') exports.cast_mongoid(v); //recurse
    }
}

exports.list_users = async ()=>{
    let year_ago = new Date();
    year_ago.setDate(year_ago.getDate() - 365);

    let week_ago = new Date();
    week_ago.setDate(year_ago.getDate() - 7);

    let users = await rp.get({
        url: config.auth.api+"/profile/list", json: true,
        qs: {
            find: JSON.stringify({
                active: true,
            }),
            limit: 3000,
        },
        headers: { authorization: "Bearer "+config.warehouse.jwt },
    });
    let lists = {
        active: [],
        inactive: [],
        recent: [],
    }
    users.profiles.forEach(user=>{
        if(!user) return;

        if(user.times && (
            new Date(user.times.github_login) > year_ago ||
            new Date(user.times.google_login) > year_ago ||
            new Date(user.times.local_login) > year_ago ||
            new Date(user.times.orcid_login) > year_ago)) {
            lists.active.push(user);
        } else {
            lists.inactive.push(user);
        }

        if(user.times && new Date(user.times.register) > week_ago) lists.recent.push(user);
    });
    return lists;
}

//https://github.com/brainlife/brainlife/issues/96
exports.aggregateDatasetsByApps = query=>{
    return new Promise((resolve, reject)=>{
        query["prov.task.config._app"] = {$exists: true};
        db.Datasets.aggregate()
        .match(query)
        .group({
            _id: { 
                app: "$prov.task.config._app", 
            },
            count: {$sum: 1},
            task: { "$first": "$prov.task"}, //pick the first task as a sample
        })
        .project({
            _id: 0, 
            count: "$count",
            app: "$task.config._app",
            task: "$task",
        })
        .exec((err, recs)=>{
            if(err) return reject(err);

            //do some clean up of data
            recs.forEach(rec=>{
                for(const k in rec.task.config) {
                    if(k == "_app") continue; //we need this for <taskconfig>
                    if(k.startsWith("_")) delete rec.task.config[k]; //hidden parameters
                }
            });

            resolve(recs);
        });
    });
}

//wrapper for express-jwt to set some required default options
exports.jwt = opt=>{
    return jwt(Object.assign({
        secret: config.express.pubkey,
        algorithms: ['RS256'],
    }, opt));
}

exports.encryptConfigValue = value=>{
    return child_process.execSync("openssl rsautl -inkey "+__dirname+"/config/configEncrypt.key -encrypt", {
        input: value,
    }).toString('base64');
}

exports.enumXnatObjects = async (project)=>{

    const auth = {
        username: project.xnat.token,
        password: project.xnat.secret,
    }

    //use openssl rsautl to encrypt the xnat secret
    /*
    const secretEnc = child_process.execSync("openssl rsautl -inkey "+__dirname+"/config/configEncrypt.key -encrypt", {
        input: project.xnat.secret,
    }).toString('base64');
    */
    const secretEnc = exports.encryptConfigValue(project.xnat.secret);

    console.log("loading all experiments for this project");
    const objects = [];
    const res = await axios.get(project.xnat.hostname+"/data"+
        "/projects/"+project.xnat.project+
        "/subjects", {auth});
    const oSubjects = res.data.ResultSet.Result;
    for(const oSubject of oSubjects) {
        console.log("  subject", oSubject.URI);
        //console.dir(oSubject);
        /* oSubject
        {
          insert_date: '2020-09-15 17:01:51.751',
          project: 'PIPELINETEST',
          ID: 'XNAT19_S00012',
          label: 'S03',
          insert_user: 'tclo7153',
          URI: '/data/subjects/XNAT19_S00012'
        }
        */
        const exres = await axios.get(project.xnat.hostname+"/data"+
            "/projects/"+project.xnat.project+
            "/subjects/"+oSubject.ID+
            "/experiments", {auth});
        for(const oExperiment of exres.data.ResultSet.Result) {
            console.log("    experiement", oExperiment.ID);
            //console.log("  <experiment>");
            /* oExperiment
              {
                  date: '',
                  xsiType: 'xnat:mrSessionData',
                  'xnat:subjectassessordata/id': 'XNAT19_E00028',
                  insert_date: '2020-09-15 17:27:26.971',
                  project: 'PIPELINETEST',
                  ID: 'XNAT19_E00028',
                  label: 'S03_MR2',
                  URI: '/data/experiments/XNAT19_E00028'
              },
            */
            const scanres = await axios.get(project.xnat.hostname+oExperiment.URI+"/scans", {auth});
            for(const oScan of scanres.data.ResultSet.Result) {
                console.log("      scan", oScan.ID, oScan.type, oScan.series_description);
                const mapping = project.xnat.scans.find(scan=>scan.scan == oScan.type);
                if(mapping) {
                    objects.push({
                        meta: {
                            subject: oSubject.label, 
                            session: oExperiment.label,
                            xnat_scan: oScan.ID,
                        },
                        datatype: mapping.datatype,
                        datatype_tags: mapping.datatype_tags,

                        desc: oScan.URI+" "+(oScan.note||oScan.series_description),
                        tags: [oScan.type], //has to exist for ui

                        storage: "xnat",
                        storage_config: {

                            hostname: project.xnat.hostname,
                            project: project.xnat.project,
                            token: project.xnat.token,

                            //path: "resources/NIFTI/files", //not all project has dicom > nifti conversion turned on.. so we can't use this
                            path: "resources/DICOM/files",

                            secretEnc,
                        },

                        create_date: new Date(oExperiment.insert_date),
                        user_id: project.user_id, //using project creator's id (not always right?)
                        project: project.id,

                        removed: false,
                        status: "stored",
                    });
                }
            }
        }
    }

    console.log("----------  done enumerating objects");
    return objects;
}

exports.updateXNATObjects = async (objects)=>{
    for(let object of objects) {
        console.log(JSON.stringify(object, null, 4));
        //TODO - this wipes out any updates made by user for existing object.. maybe I should upsert a bit more manually?
        let res = await db.Datasets.findOneAndUpdate({
            "storage": "xnat",

            //"storage_config.url": object.storage_config.url,
            "meta.subject": object.meta.subject,
            "meta.session": object.meta.session,
            "meta.xnat_scan": object.meta.xnat_scan,

        }, object, {new: true, upsert: true, rawResult: true});
        console.dir(res.lastErrorObject); 
    }
}

exports.datatypeCache = null;
exports.cacheDatatypes = async ()=>{
    if(exports.datatypeCache) return; //already cached.. TODO invalidate after a while?
    const datatypes = await db.Datatypes.find({});
    exports.datatypeCache = {};
    datatypes.forEach(datatype=>{
        exports.datatypeCache[datatype._id.toString()] = datatype;
    });
}

