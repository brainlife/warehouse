#!/usr/bin/node

const server = require('./server');
server.start(function(err) {
    if(err) throw err;
    console.log("waiting for incoming connections...");
});

