#!/usr/bin/env node
const winston = require('winston');
const async = require('async');
const request = require('request');
const fs = require('fs');

const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// TODOs
//
// * Look for finished tasks and archive data
// * Look for failed tasks and report to the user / disable rule?
//

db.init(function(err) {
    if(err) throw err;

	/*
    //simulate rule record
    var rule = {
        _id: "123456",

        //rule can be applied to a specific project
        project: "58bfa5d07a92c43c7d9e5484", //development

        //application to run
        app: "58cdf136e13a50849b258836", //mrtrix tracking
        //app: "58d15dece13a50849b258842", //life

        //configuration used to run the app (excluding inputs - inputs will be set automatically
        config: {
            lmax: 6,
            fibers_max: 900000,
            fibers: 400000,
        },

        //for each input that the app requires, it will look for any new datasets that matches that criteria
        //process_date is used to look for *new* datasets
        //gets updated when the rule is triggered
        process_date: new Date("2017-05-01"), 

        //when application finishes,
        archive: {
        }
    }
	*/

	db.Rules.find().exec((err, rules)=>{
		if(err) throw err;
        console.log(JSON.stringify(rules, null, 4));

        //TODO - handle all rules
        var rule = rules[0];
        handle_rule(rules[0], err=>{
            if(err) throw err;
        });
	});
});

function handle_rule(rule, cb) {

    var jwt = null;
    var process_date = rule.process_date; //keep old date to compare things against..
    var app = null;
    var subjects = null;
   
    //DEBUG----------------------------------------------------------------------------------------------------------------------------
    //this lets me rerun rule that I just handled
    process_date = new Date("2017-05-01");
    //DEBUG----------------------------------------------------------------------------------------------------------------------------

    //prepare for stage / app / archive
    async.series([
            
        //issue user jwt
        next=>{
            request.get({
                url: config.auth.api+"/jwt/"+rule.user_id, json: true,
                headers: { authorization: "Bearer "+config.auth.jwt },
            }, (err, res, body)=>{
                if(err) return next(err);
                if(res.statusCode != 200) return cb("couldn't obtain user jwt code:"+res.statusCode);
                jwt = body.jwt;
                next();
            });
        },

        //update process date
        next=>{
            //update process_date so that we don't process this again (even if rest of processing fails)
            rule.process_date = new Date();
            rule.save(next);
        },

        //first load the app we might be submitting
        next=>{
            db.Apps.findById(rule.app, (err, _app)=>{
                if(err) return next(err);
                console.log(_app.name);
                console.dir(_app.config);  
                app = _app;
                next();
            });
        },

        //enumerate all subjects under rule's project
        next=>{
            logger.debug("enum subjects");
            db.Datasets.find({
                project: rule.project,
            })
            .distinct("meta.subject", (err, _subjects)=>{
                if(err) return next(err);
                subjects = _subjects;        
                next();
            });
        },

        //handle all subjects
        next=>{
            async.eachSeries(subjects, handle_subject, next);
        },
    ], err=>{
        if(err) return cb(err);
        logger.debug("done processing rule");
        cb();
    });

    function handle_subject(subject, next_subject) {
        logger.debug("handling subject", subject);

        //for each input.. see there is any new datasets created since last process_date
        var foundnew = false;
        var inputs = {};
        async.eachSeries(app.inputs, (input, next_input)=>{
            
            var query = {
                project: rule.project,
                removed: false,
                datatype: input.datatype,
            }
            if(input.datatype_tags.length > 0) datatype_tags = { $all: input.datatype_tags };
            db.Datasets.findOne(query)
            .populate('datatype')
            .sort('-create_date')
            .lean()
            .exec((err, dataset)=>{
                if(err) return next_input(err);
                if(!dataset) {
                    logger.debug(" no ", input.id);
                    return next_subject(); //doesn't have input.. 
                }
                //console.log(JSON.stringify(dataset, null, 4));
                inputs[input.id] = dataset;

                //see if we spot any dataset that's newer than the rule's last process data (if so, we need to submit)
                if(!process_date || dataset.create_date > process_date) foundnew = true;

                //load status of task that produced this dataset
                if(dataset.prov && dataset.prov.task_id) {
                    //logger.debug("loading task status", dataset.prov.task_id);
                    request.get({
                        url: config.wf.api+"/task", json: true,
                        headers: { authorization: "Bearer "+jwt },
                        qs: {
                            find: JSON.stringify({_id: dataset.prov.task_id}),
                        },
                    }, (err, res, body)=>{
                        if(err) return next_input(err);
                        logger.debug(body);
                        dataset.prov._task = body.tasks[0];
                        next_input();
                    });
                } else {
                    //probably uploaded / imported
                    next_input();
                }
            });
        }, err=>{
            if(err) return cb(err);
            
            //console.log(JSON.stringify(inputs, null, 4));
            if(!foundnew) {
                logger.debug("no new dataset.. move to next subject");
                return next_subject();
            }

            submit_tasks(subject, inputs, next_subject);
            
        }, err=>{
            if(err) return cb(err);
            logger.info("all done");
        });
    }

    function submit_tasks(subject, inputs, next_subject) {
        var instance_name = "brainlife.rule."+rule._id+"."+subject;
        var instance = null;
        var task_stage = null;
        var task_app = null;

        //prepare for stage / app / archive
        async.series([

            //look for instance that we can use
            next=>{
                request.get({
                    url: config.wf.api+"/instance", json: true,
                    headers: { authorization: "Bearer "+jwt },
                    qs: {
                        find: JSON.stringify({name: instance_name}),
                    },
                }, (err, res, body)=>{
                    if(err) return next(err);
                    instance = body.instances[0];
                    if(instance) logger.debug("using instance", instance.name);
                    next();
                });
            },

            //if we don't have the instance, create one
            next=>{
                if(instance) return next();
                logger.debug("creating a new instance");
                request.post({
                    url: config.wf.api+'/instance', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body: {
                        name: instance_name,
                        //config: {}
                    },
                }, (err, res, body)=>{
                    instance = body;
                    next(err);
                });
            },

            //submit staging task
            next=>{
                var body = {
                    instance_id: instance._id,
                    name: "staging input for subject:"+rule._id+" subject:"+subject,
                    service: "soichih/sca-product-raw",

                    config: {
                        symlink: [], //for datasets that we have tasks for
                        download: [] //for datasets that produced task no longer exists
                    },
                    deps: [],
                }

                for(var input_id in inputs) {
                    var task = inputs[input_id].prov._task;
                    if(task && task.status == 'finished') {
                        //we still have the datasets!
                        body.config.symlink.push({ 
                            src: "../../"+task.instance_id+"/"+task._id+"/"+input_id, //TODO - not sure if this is the right path?
                            dest: input_id 
                        }); 
                        body.deps.push(task._id);
                    } else {
                        body.config.download.push({
                            url: config.warehouse.api+"/dataset/download/"+inputs[input_id]._id+"?at="+jwt,
                            untar: "auto",
                            dir: input_id,
                        });
                    }
                }

                request.post({
                    url: config.wf.api+'/task', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body,
                }, (err, res, _body)=>{
                    console.log(JSON.stringify(_body, null, 4));
                    task_stage = _body.task;
                    logger.debug("submitted staging task", task_stage);
                    next(err);
                });
            },


            //submit app task
            next=>{
                var body = {
                    instance_id: instance._id,
                    name: "running applicaiton "+app.name+" for subject:"+rule._id+" subject:"+subject,
                    service: app.github,
                    service_branch: app.github_branch,

                    config: Object.assign(rule.config, resolve_config(app.config, inputs, task_stage)),
                    deps: [ task_stage._id ], 
                }
                request.post({
                    url: config.wf.api+'/task', json: true, 
                    headers: { authorization: "Bearer "+jwt },
                    body,
                }, (err, res, _body)=>{
                    console.log(JSON.stringify(_body, null, 4));
                    task_app = _body.task;
                    logger.debug("submitted app task", task_app);
                    next(err);
                });
            },
        ], err=>{
            logger.debug("TODO - move to next subject");
            //next_subject(err);
        });
    }
}

function resolve_config(config, inputs, task_stage) {
    function walk(node, out) {
        for(var k in node) {
            var v = node[k];
            if(v.type === undefined) {
                //must be grouping object.. traverse to child 
                console.log("groupingn ", k);
                out[k] = {};
                walk(v, out[k]);
                continue;
            }
            switch(v.type) {
            case "input":
                var dataset = inputs[v.input_id];
                //find file
                dataset.datatype.files.forEach(file=>{
                    if(file.id == v.file_id) {
                        out[k] = "../"+task_stage._id+"/"+v.input_id+"/"+(file.filename||file.dirname);
                    }
                });
                break;
            case "integer":
            case "string":
                //scalar configs are handled by the user
            }
        }
        return out;
    }
    return walk(config, {});
}

