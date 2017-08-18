'use strict';

//contrib
const mongoose = require('mongoose');
const winston = require('winston');
const neo4j = require('neo4j');

//mine
const config = require('./config');
const logger = new winston.Logger(config.logger.winston);

const db = new neo4j.GraphDatabase(config.neo4j);

//test
logger.debug("testing connection to neo4j");
db.cypher({
    //query: 'MATCH (t:Task)-[r]-(src) RETURN t,r,src LIMIT 100',
    query: 'MATCH (n) RETURN count(*)',
}, (err, results)=>{
    if(err) throw err;
    console.log("neo4j node count", JSON.stringify(results[0], null, 4));
});

//make sure the task and relationship to parent tasks exists
exports.register_task = (task, cb)=>{
    console.log(JSON.stringify(task, null, 4));

    if(!task.config) return; //noop?
    if(task.config._app) {
        //make sure task exists
        var query = `MERGE (t:Task { task_id: '${task._id.toString()}', app_id: '${task.config._app}' }) `;
        
        //make sure relationships to input tasks exists
        if(task.config._inputs) {
            task.config._inputs.forEach(input=>{
                if(input.dataset_id) {
                    //input from dataset
                    query += `MERGE (t)-[:INPUT {input_id: '${input.id}'}]->(:Dataset {dataset_id: '${input.dataset_id}'}) `;
                } else {
                    //input from other task
                    query += `MERGE (t)-[:INPUT {input_id: '${input.id}', output_id: '${input.output_id}'}]->(:Task {task_id: '${input.task_id}'}) `;
                }
            });
        }
        //now run everything
        query += "RETURN t";
        logger.debug(query);
        db.cypher({ query }, (err, results)=>{
            if(err) return cb(err);
            //console.log(JSON.stringify(results, null, 4));
            cb();
        });
    } else {
        //maybe like noop / novnc? ignore..
        cb();
    }
}

exports.register_dataset = (dataset, cb)=>{
    var query = `MERGE (d:Dataset {dataset_id: '${dataset._id.toString()}'})-[:FROM {output_id: '${dataset.prov.output_id}'`;
    if(dataset.prov.subdir) query += `,subdir: '${dataset.prov.subdir}'`;
    query += `}]->(:Task { task_id: '${dataset.prov.task_id}'}) RETURN d\n`;
    logger.debug(query);
    db.cypher({ query }, (err, results)=>{
        if(err) return cb(err);
        console.log(JSON.stringify(results, null, 4));
        cb();
    });
}

exports.query = (dataset, cb)=>{
    //var query = `MATCH (d:Dataset{dataset_id: '${dataset._id}'})-[dr:FROM]-(parent:Task) MATCH (parent)-[r*]-(n) RETURN d,dr,parent, r, n`;
    var query = `MATCH (d:Dataset{dataset_id: '${dataset._id}'})-[dr:FROM]-(parent:Task) RETURN d,dr,parent`;
    //var query = `MATCH (parent)-[r*]-(d:Dataset{dataset_id: '${dataset._id}'}) RETURN d,r,parent`;
    logger.debug(query);
    db.cypher({ query }, cb);
}


