#!/usr/bin/env node
"use strict";

const fs = require('fs');
const async = require('async');
const rp = require('request-promise-native');
const nodemailer = require("nodemailer");

const config = require('../api/config');
const db = require('../api/models');
const common = require('../api/common');

//subject: "brainlife.io Newsletter - March 2020",
//subject: "New Microsoft fellowship to advance brainlife.io, segmentation tool added to platform, and more",
const subject = "brainlife.io user survey: Tell us how to improve the platform";
const rootdir = "newsletters/usersurvey";

//retrieve list of users who should receive general newsletter

exports.send_mail = async ()=>{
    let users = await common.users_general();

    //for safety..
    //users = users.slice(0, 1); //limit

    //override with debug 
    users = [
    //    {fullname: "Brainlife.io", email: "brlife@iu.edu"},
        {fullname: "Stephanie McGavin", email: "smcgavin@iu.edu"},
        {fullname: "Soichi Hayashi", email: "soichih@gmail.com"},
        {fullname: "Franco Pestilli", email: "franpest@iu.edu"},

        //{fullname: "Soichi Hayashi (IU-1)", email: "hayashis@iu.edu"},
    ];

    let message = {
        subject,

        from: config.mail.from,
        text: "Please open this newsletter with html enabled email client!",
        html: fs.readFileSync(__dirname+'/'+rootdir+'/index.html', "utf8"),
        list: {
            help: 'brlife@iu.edu?subject=newsletter-help',
            unsubscribe: {
                url: 'https://brainlife.io/settings',
                comment: 'Notification Settings'
            },
        },
        attachments: [
            //common imiages
            {
                filename: 'cloud.png',
                path: __dirname+'/newsletters/img/cloud.png',
                cid: 'img@cloud.png' //same cid value as in the html img src
            },
            {
                filename: 'logo.png',
                path: __dirname+'/newsletters/img/logo.png',
                cid: 'img@logo.png' //same cid value as in the html img src
            },

            //newsletter specific images
            /*
            {
                filename: 'classifyber.png',
                path: __dirname+'/newsletters/march2020/img/classifyber.png',
                cid: 'img@classifyber.png' //same cid value as in the html img src
            },
            */
        ],
    };
    //console.dir(message);
    let transporter = nodemailer.createTransport(config.mail.mailer);

    //create batches of to address (IU mail server only accept up to 30)
    let users_batches = [];
    let batch_size = 20;
    for(let i = 0;i < users.length; i+=batch_size) {
        users_batches.push(users.slice(i, i+batch_size));
    }

    async.eachSeries(users_batches, async (batch)=>{
        message.bcc = batch.reduce((all, user)=>{
           return all+user.fullname+" <"+user.email+">, ";
        }, "");

        console.log("sending to ", message.bcc);
        let info = await transporter.sendMail(message);
        console.dir(info);
    }, err=>{
        if(err) throw err;
        transporter.close();
        console.log("done..");
        process.exit(1);
    });
}

exports.send_mail();
