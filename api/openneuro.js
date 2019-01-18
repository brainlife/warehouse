
//contrib
const amqp = require("amqp");
const mongoose = require("mongoose");
const winston = require("winston");
const rp = require('request-promise');

//mine
const config = require("./config");
const logger = winston.createLogger(config.logger.winston);

/*
curl -X POST --url https://openneuro.org/crn/graphql \
  --header 'Content-Type: application/json' \
  --data '{"query":"query { snapshot(datasetId: \"ds001293\" tag: \"00001\") { description { Name  License } files {id filename size urls objectpath} } }"}'
#  --data '{"query":"query { dataset(id: \"ds001293\") { public name snapshots { tag } } }"}'
#  --data '{"query":"query { datasets(first: 50) { edges { node { id name } } pageInfo { hasNextPage endCursor } } }"}'
#  --data '{"query":"query { snapshot(datasetId: \"ds000001\", tag: \"\") { tag } }"}'
#  --data '{"query":"query { datasets(first: 5) { edges { node { id name } } pageInfo { hasNextPage endCursor } } }"}'
#  --data '{"query":"query { users { created, name, email, avatar } }"}'
#  --data '{"query":"query { users { avatar } }"}' | jq -r
#  --data '{"query":"query dataset { datasets(first: 10, orderBy: {created:descending}, filterBy: {public:true}, myDatasets: false) { edges { node { id name } } pageInfo { hasNextPage endCursor } } }"}' | jq -r
*/

exports.list_datasets = async function(cb) {
    logger.debug("listing datasets from openneuro");

    let datasets = [];

    //load first page
    logger.debug("loading first page");
    let query = "query { datasets(first: 10) { edges { node { id name } } pageInfo { hasNextPage endCursor } } }";
    let body = await rp({json: true, method: 'POST', 
        uri: 'https://openneuro.org/crn/graphql', 
        body: {query},
    });
    body.data.datasets.edges.forEach(edge=>datasets.push(edge.node));
    let cursor = body.data.datasets.pageInfo.endCursor;
    while(cursor) {
        logger.debug("loading another page");
        query = "query { datasets(first: 10 after: \""+cursor+"\") { edges { node { id name } } pageInfo { hasNextPage endCursor } } }";
        let body = await rp({json: true, method: 'POST', 
            uri: 'https://openneuro.org/crn/graphql', 
            body: {query},
        });
        body.data.datasets.edges.forEach(edge=>datasets.push(edge.node));
        cursor = body.data.datasets.pageInfo.endCursor;
    }
    cb(null, datasets);
}

//exports.list_datasets();

exports.list_snapshots=function(cb) {
}



