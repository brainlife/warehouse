
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

exports.list_all_datasets = async function(cb) {
    logger.debug("listing datasets from openneuro");

    let datasets = [];

    let hasNextPage = true;
    let cursor = null;
    while(hasNextPage) {
        logger.debug("loading another page. datasets:%d", datasets.length);
        page_query = "first: 50";
        if(cursor) page_query += "after: \""+cursor+"\"";
        query = "query { datasets("+page_query+") { edges { node { id name } } pageInfo { hasNextPage endCursor } } }";
        /*

query {
  datasets(first: 10) {
    edges {
      node {
        id
        name
        public
        created
        snapshots { tag created }
      }
    }
  }
}
        */

        //load next page
        let body = await rp({json: true, method: 'POST', 
            uri: 'https://openneuro.org/crn/graphql', 
            body: {query},
        });
        body.data.datasets.edges.forEach(edge=>datasets.push(edge.node));

        cursor = body.data.datasets.pageInfo.endCursor;
        hasNextPage = body.data.datasets.pageInfo.hasNextPage;
    }
    cb(null, datasets);
}

//cache of all datasets and snapshots for each datasets
let datasets_snaps_cache = [
/*
    {
        "id": "ds001650",
        "name": "DRM False Memory"
    },
    {
        "id": "ds001652",
        "name": "Ironia VEV"
    }
*/
];



