#!/usr/bin/env node

const pkgcloud = require('pkgcloud');
const fs = require('fs');

const js_config = require('../api/config/jetstream');
const js_storage = pkgcloud.storage.createClient(js_config);

const graphite_prefix = process.argv[2];
if(!graphite_prefix) {
    console.error("usage: objectstore_metrics.js <graphite_prefix>");
    process.exit(1);
}

js_storage.getContainers((err, containers)=>{
    if(err) throw err;
    const time = Math.round(new Date().getTime()/1000);
    containers.forEach(container=>{
        if(container.bytes > 1024*1024*1024*10) { //>10Gb
            console.log(graphite_prefix+".objectstore.bytes."+container.name+" "+container.bytes+" "+time);
            console.log(graphite_prefix+".objectstore.count."+container.name+" "+container.count+" "+time);
        }
    });
});
