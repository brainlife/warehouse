#!/usr/bin/env node

const async = require('async');
const request = require('request');
const fs = require('fs');

const config = require('../api/config');
const db = require('../api/models');

let recent = new Date((new Date).getTime() - 1000*3600*24*10);

console.log("querying failed jobs to rerun (up to 100)", recent);
request.get({
    url: config.amaretti.api+"/task", json: true,
    headers: { authorization: "Bearer "+config.warehouse.jwt },
    qs: {
        find: JSON.stringify({
            status: "failed",
            service: "brainlife/app-archive",
            fail_date: {$gt: recent },
        }),
        select: 'status status_msg service fail_date user_id _group_id',
        limit: 100,
    },
}, (err, res, body)=>{
    if(err) throw err;
    if(res.statusCode != "200") throw "api server returned:"+res.statusCode;
    async.eachSeries(body.tasks, (task, next_task)=>{
        console.dir(task);
        request.put({
            url: config.amaretti.api+"/task/rerun/"+task._id, json: true,
            headers: { authorization: "Bearer "+config.warehouse.jwt },
        }, (err, res, body)=>{
            if(err) return next_task(err);
            if(res.statusCode != "200") return next_task("api server returned:"+res.statusCode);
            console.dir(body.message);
            next_task();
        });
    }, err=>{
        if(err) throw err;
        console.log("all done for this batch", body.tasks.length);
    });
});

