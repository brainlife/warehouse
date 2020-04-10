#!/usr/bin/env node
"use strict";

//const config = require('../api/config');
const db = require('../api/models');
const common = require('../api/common');

async function run() {
    let lists = await common.list_users();
    //console.log(JSON.stringify(lists, null, 4));

    /*
    console.log("# recently registered users");
    lists.active.forEach(user=>{
        console.log(user.fullname, "<"+user.email+">");
        if(user.profile) {
            console.log("public.........");
            console.dir(user.profile.public);
            console.log("private.........");
            console.dir(user.profile.private);
        }
        console.log("");
    });
    */

    let active_users = lists.active.map(user=>user.sub.toString());
    console.log("active users");
    console.dir(active_users);

    let projects = await db.Projects.find({
        removed: false,
    }).lean().exec();

    console.log("inactive project-----------------------------");
    projects.forEach(project=>{
        //console.log(project.name);
        let project_users = [...project.admins, ...project.members];
        //console.log(project_users);

        let has_active_users = false;
        project_users.forEach(user=>{
            if(active_users.includes(user)) has_active_users = true;
        });
        //console.log("has active user", has_active_users);
        if(!has_active_users) {
            console.log(project._id, project.name);
        }
    });

    process.exit(0);
}

db.init(function(err) {
    run();
});
