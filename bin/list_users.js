#!/usr/bin/env node
"use strict";

//const config = require('../api/config');
const common = require('../api/common');

async function run() {
    let lists = await common.list_users();
    //console.log(JSON.stringify(lists, null, 4));

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

    process.exit(0);
}

run();
