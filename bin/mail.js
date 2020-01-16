"use strict";

const fs = require('fs');
const async = require('async');
const rp = require('request-promise-native');
const nodemailer = require("nodemailer");

const config = require('../api/config');
const db = require('../api/models');
const mongoose = require('mongoose');

//retrieve list of users who should receive general newsletter
exports.users_general = async ()=>{
    console.log("loading users");
    let users = await rp.get({
        url: config.auth.api+"/profile/list", json: true,
        qs: {
            find: JSON.stringify({
                active: true,
                "profile.private.notification.newsletter_general": true,
            }),
            limit: 3000,
        },
        headers: { authorization: "Bearer "+config.warehouse.jwt },
    });

    return users.profiles;
}

exports.send_mail = async ()=>{
    let users = await exports.users_general();

    //for safety..
    users = users.slice(0, 1); //limit

    //override with debug 
    /*
    users = [
    //    {fullname: "Brainlife.io", email: "brlife@iu.edu"},
    //    {fullname: "Soichi Hayashi", email: "soichih@gmail.com"},
        {fullname: "Soichi Hayashi (IU)", email: "hayashis@iu.edu"},
    //    {fullname: "Stephanie McGavin", email: "smcgavin@iu.edu"},
    //    {fullname: "Soichi Hayashi (IU-1)", email: "hayashis+1@iu.edu"},
    ];
    */

    let message = {
        subject: "brainlife.io Newsletter - January 2020",
        from: config.mail.from,
        text: "Sorry.. Please open this newsletter with html enabled email client!",
        html: fs.readFileSync(__dirname+'/newsletters/jan2020/index.html', "utf8"),
        list: {
            help: 'brlife@iu.edu?subject=newsletter-help',
            unsubscribe: {
                url: 'https://brainlife.io/settings',
                comment: 'Notification Settings'
            },
        },
        attachments: [
            {
                filename: 'cloud.png',
                path: __dirname+'/newsletters/jan2020/img/cloud.png',
                cid: 'img@cloud.png' //same cid value as in the html img src
            },
            {
                filename: 'logo.png',
                path: __dirname+'/newsletters/jan2020/img/logo.png',
                cid: 'img@logo.png' //same cid value as in the html img src
            },
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
        transporter.close();
        process.exit(1);
    });
}

exports.send_mail();

//test
/*
let users = [
//    {fullname: "Brainlife.io", email: "brlife@iu.edu"},
//    {fullname: "Soichi Hayashi", email: "soichih@gmail.com"},
    {fullname: "Soichi Hayashi (IU)", email: "hayashis@iu.edu"},
    {fullname: "Stephanie McGavin", email: "smcgavin@iu.edu"},
//    {fullname: "Soichi Hayashi (IU-1)", email: "hayashis+1@iu.edu"},
];
*/
/*
exports.send_mail(users, err=>{
    if(err) throw err;
});
*/
