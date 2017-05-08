'use strict';

//contrib
const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
const winston = require('winston');
const async = require('async');

//mine
const config = require('../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');
//const common = require('../common');

router.get('/health', (req, res)=>{
    var status = "ok";
    var msg = "no issues detected";

    //check for storage system status
    async.forEachOf(config.storage_systems, function(system, system_id, next) {
        var system = config.storage_systems[system_id];
        system.test(next);
    }, err=>{
        if(err) {
            status = "failed";
            msg = err.toString();
        }
        res.json({status, msg});
    });
});

router.use('/project', require('./project'));
//router.use('/crate', require('./crate'));
router.use('/dataset', require('./dataset'));
router.use('/app', require('./app'));
router.use('/datatype', require('./datatype'));

module.exports = router;

