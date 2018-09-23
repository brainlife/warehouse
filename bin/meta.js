#!/usr/bin/env node

const winston = require('winston');
const async = require('async');
const request = require('request');
const fs = require('fs');
const jsonwebtoken = require('jsonwebtoken');
const mkdirp = require('mkdirp');
//const xml2js = require('xml2js');

const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');
const common = require('../api/common');


//suppress non error out
config.logger.winston.transports[0].level = 'error';

let info_apps = {};
let info_pubs = {};

db.init(err=>{
    if(err) throw err;
    async.series(
    [
        next=>{
            logger.info("caching contact");
            common.cache_contact(next);
        },
        next=>{
            logger.info("processing apps");
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
            logger.info("processing pubs");
            db.Publications.find({
                //removed: false, //let's just output all..
            })
            .lean()
            .exec((err, pubs)=>{
                if(err) throw err;
                async.eachSeries(pubs, handle_pub, next);
            });
        },
    ],
    err=>{
        if(err) logger.error(err);
        //console.log(JSON.stringify(info_apps, null, 4));
        //console.log(JSON.stringify(info_pubs, null, 4));

        console.log(JSON.stringify({apps: info_apps, pubs: info_pubs}, null, 4));

        logger.info("all done");
        db.disconnect();
        
        //amqp disconnect() is broken
        //https://github.com/postwait/node-amqp/issues/462
        setTimeout(()=>{
            console.error("killing myself - until node-amqp bug is fixed");
            process.exit(0);
        }, 1000);

    });
});

function format_date(d) {
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    let year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
}

function handle_app(app, cb) {
    logger.debug(app.name, app._id.toString());
    let info = {
        title: app.name,
        meta: {
            description: app.desc, 
            citation_doi: app.doi,
            citation_title: app.name,
            citation_date: format_date(app.create_date),
        }
    };
    if(app.contributors) info.meta.citation_author = app.contributors.map(contact=>{ return contact.name}).join(", "),
    info_apps[app._id.toString()] = info;
    /*
    xml2js.parseString(common.compose_app_datacite_metadata(app), {trim: false}, (err, info)=>{
        if(err) return cb(err);
        info_pubs[app._id.toString()] = info.resource;
    });
    */
    cb();
}

function handle_pub(pub, cb) {
    logger.debug(pub.name, pub._id.toString());
    let info = {
        title: pub.name,
        meta: {
            description: pub.desc,
            citation_doi: pub.doi,
            citation_title: pub.name,
            citation_date: format_date(pub.create_date),
        }
    };
    info.meta.citation_author = pub.authors.map(sub=>{ 
        let contact = common.deref_contact(sub);
        return contact.fullname;
    }).join(", "),
    info_pubs[pub._id.toString()] = info;
    /*
    xml2js.parseString(common.compose_pub_datacite_metadata(pub), {trim: false}, (err, info)=>{
        if(err) return cb(err);
        info_pubs[pub._id.toString()] = info.resource;
    });
    */
    cb();
}

