#!/usr/bin/env node

const amqp = require('amqp');
const mongoose = require('mongoose');
const async = require('async');
const request = require('request-promise-native'); //TODO switch to axios
const axios = require('axios'); 
const rp = require('request-promise-native');
const redis = require('redis');
const fs = require('fs');
const child_process = require('child_process');

const pkg = require('../api/package.json');

const config = require('../api/config');
const db = require('../api/models');
const common = require('../api/common');

// TODO  Look for failed tasks and report to the user/dev?
let acon, rcon;

console.log("connected to mongo");
db.init(err=>{
    common.connectAMQP((err, conn)=>{
        if(err) throw err;
        acon = conn;
        subscribe();
    });

    rcon = common.connectRedis(config.redis);
    setInterval(emit_counts, 1000*config.metrics.counts.interval);  //usually 24 hours?
    setInterval(emit_health_counts, 1000*config.metrics.health_counts.interval);  //usually 5min
});

function subscribe() {
    async.series([
        //ensure queues/binds and subscribe to instance events
        next=>{
            console.debug("subscribing to instance event");
            //let's create permanent queue so that we don't miss event if event handler goes down
            //TODO - why can't I use warehouse queue for this?
            acon.queue('warehouse.instance', {durable: true, autoDelete: false}, instance_q=>{
                instance_q.bind('wf.instance', '#');
                instance_q.subscribe({ack: true}, (instance, head, dinfo, ack)=>{
                    handle_instance(instance, err=>{
                        if(err) {
                            console.error(err)
                            //continue .. TODO - maybe I should report the failed event to failed queue?
                        }
                        instance_q.shift();
                    });
                });
                next();
            });
        },

        //ensure queues/binds and subscribe to task events
        next=>{
            //TODO - why can't I use warehouse queue for this?
            acon.queue('warehouse.task', {durable: true, autoDelete: false}, task_q=>{
                task_q.bind('wf.task', '#');
                task_q.subscribe({ack: true}, (task, head, dinfo, ack)=>{
                    handle_task(task, err=>{
                        console.log("done handling task");
                        if(err) {
                            console.error(err)
                            //TODO - maybe I should report the failed event to failed queue?
                        }
                        task_q.shift();
                    });
                });
                next();
            });
        },

        next=>{
            //TODO - why can't I use warehouse queue for this?
            acon.queue('warehouse.dataset', {durable: true, autoDelete: false}, dataset_q=>{
                dataset_q.bind('warehouse', 'dataset.create.#');
                dataset_q.bind('warehouse', 'dataset.update.#'); //for removal
                dataset_q.subscribe({ack: true}, (dataset, head, dinfo, ack)=>{
                    let tokens = dinfo.routingKey.split(".");
                    dataset.project = tokens[3]; //project id
                    dataset._id = tokens[4]; //dataset id
                    handle_dataset(dataset, err=>{
                        if(err) {
                            console.error(err)
                            //TODO - maybe I should report the failed event to failed queue?
                        }
                        dataset_q.shift();
                    });
                });
                next();
            });
        },
       
        next=>{
            acon.queue('auth', {durable: true, autoDelete: false}, q=>{
                //TODO why not just user.*?
                q.bind('auth', 'user.create.*');
                q.bind('auth', 'user.login.*');
                q.subscribe({ack: true}, (msg, head, dinfo, ack)=>{
                    handle_auth_event(msg, head, dinfo, err=>{
                        if(err) console.error(err) //TODO - maybe I should report the failed event to failed queue?
                        q.shift();
                    });
                });
                next();
            });
        },

        next=>{
            acon.queue('warehouse.comment', {durable: true, autoDelete: false}, q=>{
                q.bind('warehouse', 'comment_project.#');
                q.subscribe({ack: true}, (msg, head, dinfo, ack)=>{
                    console.log("----------received comment_project");
                    handleProjectComments(msg, err=>{
                        if(err) console.error(err);
                        q.shift();
                    });
                });
                next();
            });
        },

    ], err=>{
        if(err) throw err;
        console.log("done subscribing");
    });
}

let counts = {};
function inc_count(path) {
    if(counts[path] === undefined) counts[path] = 0;
    counts[path]++;
}

function isValidationTask(task) {
    if(task.service.startsWith("brainlife/validator-")) return true;
    return false;
}

function emit_counts() {
    //emit graphite metrics
    let out = "";
    for(let key in counts) {
        out += config.metrics.counts.prefix+"."+key+" "+counts[key]+" "+new Date().getTime()/1000+"\n";
    }
    fs.writeFileSync(config.metrics.counts.path, out);

    counts = {}; //reset all counters
}

const health_counts = {
    tasks: 0,
    instanceS: 0,
}
function emit_health_counts() {
    var report = {
        status: "ok",
        version: pkg.version,
        messages: [],
        date: new Date(),
        counts: health_counts,
        maxage: 1000*60*20,  //should be double the check frequency to avoid going stale while development
    }

    /* TODO - now that we have a separate health check, the count becomes 0 too often
    if(health_counts.tasks == 0) {
        report.status = "failed";
        report.messages.push("task event counts is low");
    }
    */
    console.log("---------- reporting health check @ "+new Date().toLocaleString()+" --------------")
    console.dir(report);
    rcon.set("health.warehouse.event."+process.env.HOSTNAME+"-"+process.pid, JSON.stringify(report));

    //emit graphite metrics
    const time = new Date().getTime()/1000;
    let out = `
${config.metrics.health_counts.prefix}.health.tasks ${health_counts.tasks} ${time}
${config.metrics.health_counts.prefix}.health.instances ${health_counts.instances} ${time}
`;
    fs.writeFileSync(config.metrics.health_counts.path, out);

    health_counts.tasks = 0;
    health_counts.instances = 0;
}

function handle_task(task, cb) {
    if(!task) return cb("null task..");

    console.debug("task", (task._status_changed?"+++":"---"), task._id, task.name, task.service, task.status, task.status_msg);

    health_counts.tasks++;

    //number of task event for each app
    if(task.config && task.config._app) inc_count("task.app."+task.config._app+"."+task.status); 
    
    //number of task event for each resource
    if(task.resource_id) inc_count("task.resource."+task.resource_id+"."+task.status); 
    
    //number of task events for each project
    if(task.config && task.config._rule) {
        console.debug("rule task status changed");
        debounce("update_rule_stats."+task.config._rule.id, ()=>{
            common.update_rule_stats(task.config._rule.id, err=>{
                if(err) console.error(err);
            });
        }, 1000*10); 
    }

    let task_product = task.product; //fallback for old task (task.product is deprecated)

    //handle event
    async.series([
        //load task product for finished task
        //TODO - can we gurantee that the amaretti/task/product is loaded by the time we received this event?
        next=>{
            if(task.status != "finished") return next();
            //console.log("loading product for ", task._id, task.name);
            axios.get(config.amaretti.api+"/task/product", {
                params: {
                    ids: [task._id],
                },
                headers: { authorization: "Bearer "+config.warehouse.jwt, }
            }).then(res=>{
                if(res.data.length == 1) {
                    task_product = res.data[0].product;
                }
                next();
            }).catch(err=>{
                console.error(err);
                console.error("failed to load product for "+task._id); //TODO should I retry? how?
                next();
            });
        },
        
        //submit output validators
        next=>{
            //we don't wait for the job to finish before we submit validator
            //because UI needs the validator already submitted before next job can be submitted 
            //to create pipe between App1 > validator > App2.
            //let's do this for UI tasks only (task.nice is set) otherwise task queue will pile up 
            //with events for requrested tasks
            if(!task.nice && task.status != "finished") return next();


            //no output, no validator
            if(!task.config || !task.config._outputs ||  
                //don't run on staging tasks
                !task.deps_config || task.deps_config.length == 0 || 
                //don't run on validator task output!
                isValidationTask(task)) {
                return next();
            } 


            //handle validator submission
            async.eachSeries(task.config._outputs, async (output)=>{

                let datatype = await db.Datatypes.findById(output.datatype);
                if(!datatype.validator) return; //no validator for this datatype..

                //see if we already submitted validator for this output
                //TODO - I should probably key by the resource_id also? if user resubmit a jobs on different resource
                //we probably want to resubmit validator on the different resource also? - in case the resource is disabled and such
                let find = {
                    "deps_config.task": task._id,
                    "config._outputs.id": output.id,
                    instance_id: task.instance_id,
                    service: datatype.validator, 
                };
                if(datatype.validator_branch) find.service_branch = datatype.validator_branch;

                let subdirs;
                if(output.subdir) {
                    subdirs = [output.subdir];
                }
                let tasks = await rp.get({
                    url: config.amaretti.api+"/task?find="+JSON.stringify(find)+"&limit=1",
                    json: true,
                    headers: {
                        authorization: "Bearer "+config.warehouse.jwt,
                    }
                });

                //validator already submitted
                if(tasks.tasks.length) return;

                let validator_config = {
                    _app: task.config._app, //app id

                    //prov graph uses _input to travel upstream.. so let's set some info
                    _inputs: [Object.assign({}, output, {
                        task_id: task._id,
                        keys: datatype.files.map(f=>f.id), //populate all file ids..
                    })],

                    _outputs: [Object.assign({}, output, {
                        subdir: "output", //validator should always output under "output"
                        //validator should always output files using datatype file names
                        //also without this, it could end up using deprecated app file mapping
                        files: null, 
                    })],

                    //_tid: task.config._tid,  //for UI.. use the same _tid as the parent
                    //I decided to handle this at the loading time
                    //pass the followed task's product to validator so it can analyze / merge it!
                    //product: products[output.id],
                    //product: "../"+task._id, //let validator find it by itself
                };
                datatype.files.forEach(file=>{
                    if(output.subdir) {
                        validator_config[file.id] = "../"+task._id+"/"+output.subdir+"/"+(file.filename||file.dirname);
                    } else {
                        //deprecated output uses file mapping
                        if(output.files && output.files[file.id]) {
                            validator_config[file.id] = "../"+task._id+"/"+output.files[file.id];
                        } else {
                            //use default path
                            validator_config[file.id] = "../"+task._id+"/"+(file.filename||file.dirname);
                        }
                    }
                });

                let dtv_task = await rp.post({
                    url: config.amaretti.api+"/task",
                    json: true,
                    body: Object.assign(find, {
                        //use the parent task's name for validation task name as it's used by 
                        //ui to show the task name used to generate the dataobject
                        name: task.name+"(v)", 

                        deps_config: [ {task: task._id, subdirs} ],
                        config: validator_config,
                        //max_runtime: 1000*3600, //1 hour should be enough for most..(nope.. it could be queued for a lone time)
                        
                        //we can't set remove_date to something like (now+1 day) because we now submit validator when main task is submitted
                        //main task could take weeks before it get submitted.. but I think it should be safe to remove when main task is
                        //removed.. (or maybe we should add +1 day from task.remove_date - if it's set? or it is better to not set it at all?)
                        remove_date: task.remove_date,  

                        //we want to run on the same resource that task has run on
                        follow_task_id: task._id,
                        nice: task.nice, //mirror niceness of the parent

                        //we need to submit with admin jwt so we can set follow_task_id, 
                        //but the task itself needs to be owned by the user so that user
                        //can archive output
                        user_id: task.user_id, 
                        //gids: task.gids, 
                    }),
                    headers: {
                        //authorization: "Bearer "+user_jwt,

                        //use warehouse as submitter so we can run validator on as follow up
                        authorization: "Bearer "+config.warehouse.jwt,
                    }
                });
            }, next);
        },
        
        //submit output archivers
        next=>{
            if(task.status == "finished" && task.config && task.config._outputs) {
                if(isValidationTask(task)) {
                    if(!task_product) {
                        console.error("validation service didn't generate product.. maybe parse error? - skip archive")
                        return next();
                    }
                    if(!task_product.errors) {
                        console.error("validation service didn't generate product.errors.. something wrong? skip archive")
                        return next();
                    }
                    if(task_product.errors.length > 0) {
                        console.log("validator reports error .. skipping archive");
                        return next();
                    }
                }

                let outputs = [];

                //check to make sure that the output is not already registered
                async.eachSeries(task.config._outputs, async (output)=>{
                    let datatype = await db.Datatypes.findById(output.datatype);
                    
                    //if the output datatype has validator, then the validator will archive the output
                    //unless of course, this task itself is an validator
                    if(datatype.validator && !isValidationTask(task)) return;

                    let task_ids = [task._id];
                    if(task.follow_task_id) task_ids.push(task.follow_task_id);
                    let _dataset = await db.Datasets.findOne({
                        "prov.task._id": {$in: task_ids},
                        "prov.output_id": output.id,
                        //ignore failed and removed ones
                        $or: [
                            { removed: false }, //already archived!
                            //or.. if archived but removed and not failed, user must have a good reason to remove it.. (don't rearchive)
                            //or.. removed while being stored (maybe got stuck storing?)
                            { removed: true, status: {$nin: ["storing", "failed"]} }, 
                        ]
                    });
                    if(_dataset) {
                        console.log("already archived or removed by user. output_id:"+output.id+" dataset_id:"+_dataset._id.toString());
                        return;
                    } 

                    outputs.push(output);

                }, err=>{
                    if(err) return next(err);

                    //archive outputs not yet archived
                    common.archive_task_outputs(task.user_id, task, outputs, next);
                });
            } else next();
        },
        
        //submit secondary archiver for validation tasks to store UI output to secondary storage
        //also submit secondary archive for the group analysis which is also stored on secondary storage but it's not "UI" output.
        async next=>{
            if(task.status != "finished") return;
            //if(task.service == "brainlife/app-stage") return;

            //let's go ahead and resubmit secondary archiver - to force the secondary output to be re-achived if "force_secondary" is not set
            if(task.service == "brainlife/app-stage"){ 
                if(task.config.forceSecondary) {
                    console.log("processing with secondary archive for app-stage (forceSecondary is set)");
                } else {
                    //don't run seconary archive for app-stage
                    return;
                }
            }

            if(!task.config) {
                console.error("task.config not set for task _id", task._id);
                return;
            }

            //see what needs to be archived to secondary
            let requests = [];
            let subdirs = [];
            async.eachSeries(task.config._outputs, async (output)=>{
                let datatype = await db.Datatypes.findById(output.datatype);

                //datatype with group analysis is always archived, and validationTask's secondary output is also archived
                if(datatype.groupAnalysis || isValidationTask(task)) {
                    let request = {
                        src: "../"+task._id+"/"+output.id,

                        //destination
                        group_id: task._group_id,
                        instance_id: task.instance_id,
                        task_id: task._id,
                        subdir: output.id,

                        output,

                        app: {
                            service: task.service,
                            service_branch: task.service_branch,
                            commit_id: task.commit_id,
                            name: task.name,
                        },

                        finish_date: task.finish_date,
                    }

                    //validation task organize things in a unique way
                    if(isValidationTask(task)) {
                        //TODO - shouldn't makre sure validation didn't find any errors before going ahead with archive?
                        
                        subdirs.push("secondary"); //validator always output secondary output under ./secondary
                        
                        //only archive ./secondary (there could be other stuff that we don't need to put in secondary storage)
                        request.src = "../"+task._id+"/secondary";
                        request.subdir += "/secondary";

                        request.task_id = task.deps_config[0].task; //use the task id of the parent

                        request.validator = true; //used to let UI know that this was output from validator
                    } else {
                        //group analysys output is more straightfoward
                        //TODO - for legacy root-output apps, we shouldn't set subdir (and need to apply override?)
                        //or.. do I say secondary output won't work with legacy app anymore?
                        subdirs.push(output.id);
                        
                        //datatype field is used to tell which secondary archive is for group analysis
                        //this is only set for group analysis (not validation task) because secondary output from validation task
                        //is only for UI
                        request.datatype = {
                            _id: datatype._id,
                            name: datatype.name,
                        }
                    }
                    requests.push(request);
                }
            }, async err=>{
                if(err) {
                    console.error(err);
                    return;
                }

                if(requests.length == 0) return;

                //see if we already submitted secondary archiver for this task
                console.log("checking to see if we already submitted app-archive-secondary");
                let find = {
                    service: "brainlife/app-archive-secondary",
                    instance_id: task.instance_id,
                    "deps_config.task": task._id,
                }
                let tasks = await rp.get({
                    url: config.amaretti.api+"/task?find="+JSON.stringify(find)+"&limit=1",
                    json: true,
                    headers: {
                        authorization: "Bearer "+config.warehouse.jwt,
                    }
                });

                //app-secondary-secondary already submitted?
                if(tasks.tasks.length) return;

                let user_jwt;
                if(task.user_id == "warehouse") {
                    console.error("task.user_id set to warehouse! using warehouse jwt to issue archive_jwt");
                    user_jwt = config.warehouse.jwt;
                } else {
                    user_jwt = await common.issue_archiver_jwt(task.user_id);
                }

                //submit secondary archiver with just secondary deps
                let remove_date = new Date();
                remove_date.setDate(remove_date.getDate()+1); //remove in 1 day
                let newtask = await rp.post({
                    url: config.amaretti.api+"/task", json: true,
                    body: Object.assign(find, {
                        deps_config: [ {task: task._id, subdirs} ],
                        config: {
                            requests, 
                            _public: task.config._public,
                        },
                        remove_date,
                        gids: [config.archive.gid],
                        nice: task.nice, //mirror niceness of the parent
                    }),
                    headers: {
                        //authorization: "Bearer "+config.warehouse.jwt,
                        authorization: "Bearer "+user_jwt,
                    }
                });
            });
        },

        //report archive status back to user through dataset_config
        next=>{
            if(task.service == "brainlife/app-archive") {
                async.eachSeries(task.config.datasets, (dataset_config, next_dataset)=>{
                    let _set = {
                        status_msg: task.status_msg,
                    };
                    switch(task.status) {
                    case "requested":
                        _set.archive_task_id = task._id;
                        break;
                    case "finished":
                        _set.status = "stored";
                        if(dataset_config.storage) _set.storage = dataset_config.storage;
                        if(dataset_config.storage_config) _set.storage_config = dataset_config.storage_config; //might not be set
                        if(task_product) { //app-archive didn't create task.product before
                            let dataset_product = task_product[dataset_config.dataset_id];
                            if(dataset_product) _set.size = dataset_product.size;
                        }
                        break;
                    case "failed":
                        _set.status = "failed";
                        break;
                    }
                    common.publish("dataset.update."+task.user_id+"."+dataset_config.project+"."+dataset_config.dataset_id, Object.assign(_set, {_id: dataset_config.dataset_id}));
                    db.Datasets.findByIdAndUpdate(dataset_config.dataset_id, {$set: _set}, next_dataset);
                }, next);
            } else next();
        },

        //poke rule to trigger re-evaluation
        next=>{
            if(task.status == "removed" && task.config && task.config._rule) {
                console.log("rule submitted task is removed. updating update_date:"+task.config._rule.id);
                db.Rules.findOneAndUpdate({_id: task.config._rule.id}, {$set: {update_date: new Date()}}, next);
            } else next();
        },
    ], cb);
}

let debouncer = {};

//run a given action as frequently as the specified delay
function debounce(key, action, delay) {
    let now = new Date().getTime();
    let d = debouncer[key];
    if(!d) {
        d = {
            lastrun: 0,
            timeout: null,
        };
        debouncer[key] = d;
    }

    if(d.lastrun+delay < now) {
        //hasn't run (for a while).. run it immediately
        d.lastrun = now;
        action();
    } else {
        //debounce
        if(!d.timeout) {
            let need_delay = d.lastrun + delay - now;
            d.timeout = setTimeout(action, need_delay);
            d.lastrun = now + need_delay;
            setTimeout(()=>{
                d.timeout = null;
            }, need_delay);
        }
    }
}

async function handleProjectComments(event, cb) {
    const project = await db.Projects.findById(event.project);
    debounce("comment_project."+project.group_id, async ()=>{
        await common.update_project_stats(project);
    }, 1000*10);
    cb();
}

function handle_instance(instance, cb) {
    if(!instance) return cb("null instance..");

    console.debug("instance ---", instance._id, instance.status);
    health_counts.instances++;

    //number of instance events for each user
    inc_count("instance.user."+instance.user_id+"."+instance.status); 

    //number of instance events for each project
    if(instance.group_id) {
        inc_count("instance.group."+instance.group_id+"."+instance.status); 

        debounce("update_project_stats."+instance.group_id, async ()=>{
            let project = await db.Projects.findOne({group_id: instance.group_id});
            console.log("requesting to update_project_stats");
            common.update_project_stats(project);
        }, 1000*60); 
    }
    cb();
}

async function handle_dataset(dataset, cb) {
    if(!dataset) return cb("null dataset");
    debounce("update_dataset_stats."+dataset.project, ()=>{
        common.update_dataset_stats(dataset.project);
    }, 1000*60);  //counting datasets are bit more expensive.. let's debounce longer

    try {
        await common.updateSecondaryInventoryInfo(dataset._id);
        cb();
    } catch (err) {
        //can't connect to osiris? (try different host)
        cb(err);
    }
}

function handle_auth_event(msg, head, dinfo, cb) {
    console.debug(JSON.stringify(msg, null, 4));
    let exchange = dinfo.exchange;
    let keys = dinfo.routingKey.split(".");
    if(dinfo.exchange == "auth" && dinfo.routingKey.startsWith("user.create.")) {
        let sub = keys[2];
        let email = msg.email;
        let fullname = msg.fullname;
        if(config.slack) {
            invite_slack_user(email, fullname);
            subscribe_newsletter(email, fullname);
            post_newusers(msg);
        }
    }
    cb();
}

function invite_slack_user(email, real_name) {
    //https://github.com/ErikKalkoken/slackApiDoc/blob/master/users.admin.invite.md
    //TODO - I can't get first_name / last_name to work
    console.debug("sending slack invite to "+email);
    request({
        method: "POST",
        uri: "https://brainlife.slack.com/api/users.admin.invite",
        form:{
            token: config.slack.token, email, real_name, resend: true, //channels: "general,apps",
        },  
    }).then(res=>{
        console.dir(res);
    }).catch(err=>{
        console.error(err);
    }); 
}

function subscribe_newsletter(email, real_name) {
    let name = real_name.split(" ");
    //https://mailchimp.com/developer/reference/lists/list-members/#post_/lists/-list_id-/members
    axios.post("https://us12.api.mailchimp.com/3.0/lists/"+config.mailchimp.newsletter_list+"/members", {
        status: "subscribed",
        email_address: email,
        merge_fields: {
            FNAME: name.shift(),
            LNAME: name.join(" "),
        } 
    }, 
    {
        auth: {
            username: "anystring",
            password: config.mailchimp.api_key,
        }
    }).then(res=>{
        console.dir(res.data);
    }).catch(err=>{
        console.dir(err.response.data);
    });
}

function post_newusers(msg) {
    if(!config.slack) return;
    request({
        method: "GET",
        uri: "http://api.ipstack.com/"+msg.headers["x-real-ip"]+"?access_key="+config.ipstack.token,
    }).then(iostackRes=>{
        //https://api.slack.com/methods/chat.postMessage
        console.debug("posting new user info to slack channel");
        request({
            method: "POST",
            uri: "https://brainlife.slack.com/api/chat.postMessage",
            form:{
                token: config.slack.token, 
                channel: config.slack.newuser,
                //text: "new user registration\n"+JSON.stringify(msg, null, 4), 
                text: `new user registration. sub:${msg.sub}
fullname: ${msg.fullname}
email: ${msg.email}
public profile: 
${JSON.stringify(msg._profile.public, null, 4)}
private profile: 
${JSON.stringify(msg._profile.private, null, 4)}
user-agent: ${msg.headers["user-agent"]}
ipstack: 
${JSON.stringify(iostackRes, null, 4)}
                `,
            },  
        }).then(res=>{
            console.dir(res);
        }); 
    }).catch(err=>{
        console.error(err);
    });
}


