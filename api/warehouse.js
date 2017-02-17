#!/usr/bin/node
'use strict';

const server = require('./server');
server.start(function(err) {
    if(err) throw err;
    console.log("waiting for incoming connections...");
});

