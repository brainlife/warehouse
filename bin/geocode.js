#!/usr/bin/env node
"use strict";

const axios = require('axios');
const async = require('async');
const fs = require('fs');
const NodeGeocoder = require('node-geocoder');

const config = require('../api/config');

const cache_filename = "geocode_cache.json";
const cache = require(__dirname+'/'+cache_filename);

const options = {
  provider: 'google',
  apiKey: config.geocode.apikey,
};
const geocoder = NodeGeocoder(options);

//look for user profiles that doesn't have showOnMap flag set (recently registered)
//lookup the lat/lng and set showOnMap to true if we can resolve it - if not, set to false
//to mark that we've already processed it

axios.get(config.auth.api+"/users", {
    headers: {
        authorization: "Bearer "+config.warehouse.jwt
    }
}).then(res=>{
    async.eachSeries(res.data, (user, next_user)=>{
        console.log(user.sub, user.fullname);
        if(!user.active) {
            console.log("not active");
            return next_user();
        }
        const pprofile = user.profile.public;
        if(!pprofile) {
            console.log("no public profile..");
            return next_user();
        }
        if(pprofile.showOnMap !== undefined) {
            console.log("already processed", pprofile);
            return next_user();
        }
        const inst = pprofile.institution;
        if(!inst || inst.length < 7) {
            console.log("bad institution info", inst);
            return next_user();
        }
        console.log("need to look up... inst:", inst);
        lookupAddress(inst, (err, info)=>{
            const update = {};
            if(err) {
                console.error(err);
                update["profile.public.showOnMap"] = false;
            } else {
                update["profile.public.showOnMap"] = true;
                update["profile.public.lat"] = info.lat;
                update["profile.public.lng"] = info.lng;
            }
            
            console.log("updating", user.sub);
            axios.put(config.auth.api+"/user/"+user.sub, update, {
                headers: {
                    authorization: "Bearer "+config.warehouse.jwt
                }
            }).then(res=>{
                console.dir(res.data);
                next_user();
            });
        });
    }, err=>{
        if(err) console.error(err);
        console.log("all done");
    });
});

async function lookupAddress(inst, cb) {
    //try the cache first
    if(cache[inst]) return cb(null, cache[inst]);

    console.log("no cache.. looking up from google");

    /*
    const res = await axios.get('http://www.datasciencetoolkit.org/maps/api/geocode/json?sensor=false&address='+inst);
    console.dir(res.data);
    */
    geocoder.geocode(inst).then(res=>{
        console.dir(res);
        if(!res[0]) return cb("failed to lookup");
        if(res[0].extra.confidence < 0.9) return cb("low confidence");
        cache[inst] = {
            lat: res[0].latitude,
            lng: res[0].longitude,
        };
        fs.writeFileSync(__dirname+"/"+cache_filename, JSON.stringify(cache, null, 4));
        cb(null, cache[inst]);
    });
}


