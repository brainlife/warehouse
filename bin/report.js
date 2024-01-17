#!/usr/bin/env node

const winston = require('winston');
const async = require('async');
const fs = require('fs');

const config = require('../api/config');
const db = require('../api/models');
const common = require('../api/common');

console.log("running report");

db.init(async err=>{
    if(err) throw err;

    /*
    const objectStats = {};
    const objects = await db.Dataasets.aggregate([
        {
            $match { 
                removed: false 
                //TODO date range?
            }
        },
        {
            $group: {
                _id: '',  //
                count: {$sum: 1},
                walltime: {$sum: "$runtime"},
            }
        }
    ]);
        */


    console.log("dumping app stats");
    const appStats = [];
    const apps = await db.Apps.find({ removed: false });
    apps.forEach(app=>{
        appStats.push({
            name: app.name, 
            github: app.github, 
            desc: app.desc, 
            stats: app.stats,
            create_date: app.create_date,
            doi: app.doi,
        });
    });
    fs.writeFileSync("/output/apps.stats.json", JSON.stringify(appStats));

    console.log("dumping projects stats");
    const projectStats = [];
    const projects = await db.Projects.find({ removed: false });
    projects.forEach(project=>{
        projectStats.push({
            name: project.name, 
            desc: project.desc, 
            stats: project.stats,
            group_id: project.group_id,
            access: project.access,
            create_date: project.create_date,
            admins: project.admins,
            members: project.members,
            guests: project.guest,
        });
    });
    fs.writeFileSync("/output/projects.stats.json", JSON.stringify(projectStats));

    //start monthly report
    for (let year = 2017; year <= new Date().getFullYear(); ++year) {
        for (let month = 1; month <= 12; ++month) {
            const start = new Date(year+"-"+month+"-01");
            const end = new Date(start);
            end.setMonth(end.getMonth()+1);
            await report(start, end);
        }
    }

    console.log("done");
    db.disconnect();
});

async function report(start, end) {
    const rangeName = start.getFullYear()+"-"+(start.getMonth()+1) + "." + end.getFullYear()+"-"+(end.getMonth()+1);

    //debug -- skip ones that we already have
    //if(fs.existsSync("/output/objects."+rangeName+".json")) return;

    console.log("querying ", rangeName);

    const objects = {};
    const users = await db.Datasets.aggregate([
        {$match: {
            create_date: {$gte: start, $lt: end},
            //status: "stored",
            removed: false, //should I include removed ones as well?
        }},

        {
            $group: {
                _id: {userId: "$user_id"},
                count: {$sum: 1},
                size: {$sum: "$size"},
                downloads: {$sum: "$download_count"},
            }
        }
    ]);

    const datatypes = await db.Datasets.aggregate([
        {$match: {
            create_date: {$gte: start, $lt: end},
            //status: "stored",
            removed: false, //should I include removed ones as well?
        }},

        {
            $group: {
                _id: {datatypeId: "$datatype"},
                count: {$sum: 1},
                size: {$sum: "$size"},
                downloads: {$sum: "$download_count"},
            }
        }
    ]);
    const datatypesPop = await db.Datatypes.populate(datatypes, {path: "_id.datatypeId"});

    const projects = await db.Datasets.aggregate([
        {$match: {
            create_date: {$gte: start, $lt: end},
            //status: "stored",
            removed: false, //should I include removed ones as well?
        }},

        {
            $group: {
                _id: {projectId: "$project"},
                count: {$sum: 1},
                size: {$sum: "$size"},
                downloads: {$sum: "$download_count"},
            }
        }
    ]);
    const projectsPop = await db.Projects.populate(projects, {path: "_id.projectId"});

    objects.totalObjectCount = users.reduce((a,v)=>a+v.count, 0);
    objects.totalObjectSize = users.reduce((a,v)=>a+v.size, 0);
    objects.totalObjectDownload = users.reduce((a,v)=>a+v.downloads, 0);
    objects.byUsers = users.map(u=>({
        sub: u._id.userId.toString(),
        count: u.count,
        totalSize: u.size,
        totalDownload: u.downloads,
    }));
    objects.byDatatypes = datatypesPop.map(u=>({
        datatypeId: u._id.datatypeId._id.toString(),
        datatypeName: u._id.datatypeId.name,
        count: u.count,
        totalSize: u.size,
        totalDownload: u.downloads,
    }));
    objects.byProjects = projectsPop.map(u=>({
        projectId: (u._id.projectId?u._id.projectId._id.toString():null),
        projectName: (u._id.projectId?u._id.projectId.name:null),
        count: u.count,
        totalSize: u.size,
        totalDownload: u.downloads,
    }));

    console.dir(objects);
    fs.writeFileSync("/output/objects."+rangeName+".json", JSON.stringify(objects, null, 4));
}


