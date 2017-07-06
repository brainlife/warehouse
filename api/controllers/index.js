'use strict';

//contrib
const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
const winston = require('winston');
const async = require('async');
const timeout = require('callback-timeout');

//mine
const config = require('../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');

router.get('/health', (req, res)=>{
    var status = "ok";
    var msg = "no issues detected";
    var storages = {};

    //check for storage system status
    async.forEachOf(config.storage_systems, function(system, system_id, next) {
        var system = config.storage_systems[system_id];
        system.test(timeout(err=>{
            if(err) return next(err);
            storages[system_id] = "ok";
            next();
        }, 5000)); //5 seconds should be enough.. right?
    }, err=>{
        if(err) {
            status = "failed";
            msg = err.toString();
        }
        res.json({status, msg, storages});
    });
});

router.use('/project', require('./project'));
router.use('/dataset', require('./dataset'));
router.use('/app', require('./app'));
router.use('/datatype', require('./datatype'));

module.exports = router;

