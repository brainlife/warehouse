#!/usr/bin/env node

const winston = require('winston');
const async = require('async');
const request = require('request');
const fs = require('fs');
const redis = require('redis');
const jsonwebtoken = require('jsonwebtoken');

const config = require('../api/config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../api/models');
const common = require('../api/common');

db.init(err=> {
    if(err) throw err;
    list_developers(err=>{
        if(err) console.error(err);
    });
});

function list_developers(cb) {
	db.Apps.find({
        removed: false,
    })
    .exec((err, apps)=>{
		if(err) throw err;
        
        //console.log("\"id\",\"uid\",\"fullname\",\"email\",\"app\"");
        let contacts = {} ;
        async.eachSeries(apps, (app, next_app)=>{
            app.admins.forEach(id=>{
                let contact = common.deref_contact(id);
                if(contact) {
                    //console.log("\""+id+"\",\""+contact.username+"\",\""+contact.fullname+"\",\""+contact.email+"\",\""+app.github+"\"");
                    contacts[id] = contact;
                } else {
                    console.log("missing", id);
                }
            });
            next_app();
        }, err=>{
            if(err) return cb(err);

            console.log("app-----------------------------------------------");
            console.log("\"fullname\",\"email\"");
            for(let id in contacts) {
                console.log("\""+contacts[id].fullname+"\",\""+contacts[id].email+"\"");
            }
            logger.debug("done with all apps");
            cb();
        });
	});
}


