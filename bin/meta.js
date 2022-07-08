#!/usr/bin/env node

const async = require('async');
const request = require('request');
const fs = require('fs');
const jsonwebtoken = require('jsonwebtoken');

const config = require('../api/config');
const db = require('../api/models');
const common = require('../api/common');

//TODO - don't let anything write to stdout other than the meta.json.
//better option is to specify where to write it, and write to that file
config.mongoose_debug = false;

let output_filename = process.argv[2];
if(!output_filename) throw "please specify output filename";

let info_apps = {};
let info_pubs = {};
let info_projs = {};

db.init(err=>{
    if(err) throw err;
    async.series(
    [
        next=>{
            console.info("caching contact");
            common.startContactCache(next);
        },
        next=>{
            console.info("processing apps");
            db.Apps.find({
                //removed: false, //let's just output all..
            })
            .lean()
            .exec((err, apps)=>{
                if(err) throw err;
                async.eachSeries(apps, handle_app, next);
            });
        },
        next=>{
            console.info("processing pubs");
            db.Publications.find({
                //removed: false, //let's just output all..
            })
            .populate('project')
            .lean()
            .exec((err, pubs)=>{
                if(err) throw err;
                async.eachSeries(pubs, handle_pub, next);
            });
        },
        next=>{
            console.info("processing projects");
            db.Projects.find({
                //removed: false, //let's just output all..
                $or: [
                    { access: "public" },
                    { 
                        access: "private",
                        listed: true,
                    }
                ]
            })
            .lean()
            .exec((err, projs)=>{
                if(err) throw err;
                async.eachSeries(projs, handle_proj, next);
            });
        },

    ],
    err=>{
        if(err) console.error(err);

        fs.writeFileSync(output_filename, JSON.stringify({apps: info_apps, pubs: info_pubs, projs: info_projs}, null, 4));

        console.info("all done");
        db.disconnect();
        
        //amqp disconnect() is broken
        //https://github.com/postwait/node-amqp/issues/462
        setTimeout(()=>{
            console.error("done");
            process.exit(0);
        }, 1000);

    });
});

function format_date(d) {
    if(!d.getMonth) {
        console.error("odd data object passed to format_date");
        console.error(d);
        return null;
    }
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    let year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
}

function handle_app(app, cb) {
    console.debug(app.name, app._id.toString());
    let info = {
        title: app.name,
        meta: {
            ID: app._id.toString(),
            description: app.desc, 
            
            //for slack
            //https://medium.com/slack-developer-blog/everything-you-ever-wanted-to-know-about-unfurling-but-were-afraid-to-ask-or-how-to-make-your-e64b4bb9254
            "og:title": app.name,
            "og:image": app.avatar,
            "og:description": app.desc||"no description",

            doi: app.doi,
            date: format_date(app.create_date),
        }
    };
    if(app.contributors) info.meta.citation_author = app.contributors.map(contact=>{ return contact.name}).join(", "),
    info_apps[app._id.toString()] = info;
    cb();
}

function handle_pub(pub, cb) {
    console.debug(pub.name, pub._id.toString());
    let info = {
        title: pub.name,
        meta: {
            ID: pub._id.toString(),
            description: pub.desc,

            //for slack
            //https://medium.com/slack-developer-blog/everything-you-ever-wanted-to-know-about-unfurling-but-were-afraid-to-ask-or-how-to-make-your-e64b4bb9254
            "og:title": pub.name,
            "og:image": pub.project.avatar,
            "og:description": pub.desc,

            //for altmetrics
            //https://help.altmetric.com/support/solutions/articles/6000141419-what-metadata-is-required-to-track-our-content-
            citation_doi: pub.doi,
            citation_title: pub.name,
            citation_date: format_date(pub.create_date),

            keywords: pub.tags.join(", "),
            copyright: pub.license,
        }
    };
    info.meta.citation_author = pub.authors.map(sub=>{ 
        let contact = common.deref_contact(sub);
        return contact.fullname;
    }).join(", "),
    info_pubs[pub._id.toString()] = info;
    cb();
}

function handle_proj(proj, cb) {
    console.debug(proj.name, proj._id.toString());
    let info = {
        title: proj.name,
        meta: {
            ID: proj._id.toString(),
            description: proj.desc,
            
            //for slack
            //https://medium.com/slack-developer-blog/everything-you-ever-wanted-to-know-about-unfurling-but-were-afraid-to-ask-or-how-to-make-your-e64b4bb9254
            "og:title": proj.name,
            "og:image": proj.avatar,
            "og:description": proj.desc,

            description: proj.desc, 
            citation_title: proj.name,
            publish_date: format_date(proj.create_date),
        }
    };
    info_projs[proj._id.toString()] = info;
    cb();
}

