const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
const async = require('async');

const config = require('../config');
const db = require('../models');
const health = require('../health');

router.get('/health', (req, res, next)=>{
    health.get_reports((err, reports)=>{
        if(err) return next(err);
        var status = "ok";
        var messages = [];

        //aggregate reports from all services
        for(var service in reports) {
            var report = reports[service];
            if(report.status != "ok") {
                status = "failed";
                messages.push(service+" is failing");
            }

            //check report date
            var age = Date.now() - new Date(report.date).getTime();
            messages.push(service+" age "+age+" msec");
            if(age > (report.maxage||1000*120)) {
                status = "failed";
                messages.push(service+" is stale max:"+(report.maxage||(1000*120)));
            }
        }
        res.json({status, messages, reports});
    });
});

router.use('/project', require('./project'));
router.use('/dataset', require('./dataset'));
router.use('/app', require('./app'));
router.use('/pub', require('./pub'));
router.use('/datatype', require('./datatype'));
router.use('/event', require('./event'));
router.use('/rule', require('./rule'));
router.use('/datalad', require('./datalad'));
router.use('/participant', require('./participant'));
router.use('/secondary', require('./secondary'));

module.exports = router;

