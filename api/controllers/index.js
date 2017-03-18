'use strict';

//contrib
const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
const winston = require('winston');

//mine
const config = require('../config');
const logger = new winston.Logger(config.logger.winston);
const db = require('../models');
//const common = require('../common');

router.get('/health', (req, res)=>{
    res.json({todo: true});
});

router.use('/project', require('./project'));
//router.use('/crate', require('./crate'));
router.use('/dataset', require('./dataset'));
router.use('/app', require('./app'));
router.use('/datatype', require('./datatype'));

module.exports = router;

