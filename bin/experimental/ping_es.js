#!/usr/bin/env nodejs

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: '10.0.0.11:9200',
  log: 'trace'
});

client.ping({
  requestTimeout: 30000,
}, function (error) {
  if (error) {
    console.error('elasticsearch cluster is down!');
  } else {
    console.log('All is well');
  }
});
