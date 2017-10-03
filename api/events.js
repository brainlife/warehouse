'use strict';

const amqp = require('amqp');
const winston = require('winston');

//mine
const config = require('./config');
const logger = new winston.Logger(config.logger.winston);
const db = require('./models');

let dataset_ex = null;

logger.info("attempting to connect to amqp..");
let conn = amqp.createConnection(config.event.amqp, {reconnectBackoffTime: 1000*10});
conn.on('ready', function() {
    logger.info("amqp connection ready.. creating exchanges");

    conn.exchange("warehouse.dataset", {autoDelete: false, durable: true, type: 'topic', confirm: true}, function(ex) {
        dataset_ex = ex;
    });
});
conn.on('error', function(err) {
    logger.error("amqp connection error");
    logger.error(err);
});

exports.dataset = function(dataset) {
    let key = dataset.project+"."+dataset._id;
    dataset_ex.publish(key, dataset, {});
}


