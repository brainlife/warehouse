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
    //console.log(JSON.stringify(task, null, 4));

    if(!task.config) return; //noop?
    if(task.config._app) {
        if(!task.config._app) return cb(); //for old tasks
        
        //make sure task exists
        var query = `MERGE (t:Task { task_id: '${task._id.toString()}', app_id: '${task.config._app}' }) `;
        
        //make sure relationships to input tasks exists
        if(task.config._inputs) {
            task.config._inputs.forEach((input,idx)=>{
                if(input.dataset_id) {
                    //input from dataset
                    query += `MERGE (d${idx}:Dataset {dataset_id: '${input.dataset_id}'}) `;
                    query += `MERGE (t)-[:INPUT {input_id: '${input.id}'}]->(d${idx}) `;
                } else {
                    if(!input.app_id) return cb(); //for old tasks
                    
                    //input from other task
                    //TODO input.app_id doesn't seem to be set...
                    query += `MERGE (t2${idx}:Task {task_id: '${input.task_id}', app_id: '${input.app_id}'}) `;
                    query += `MERGE (t)-[:INPUT {input_id: '${input.id}', output_id: '${input.output_id}'}]->(t2${idx}) `;
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
    //dataset
    var query = `MERGE (d:Dataset {dataset_id: '${dataset._id.toString()}'`
    if(dataset.prov.subdir) query += `,subdir: '${dataset.prov.subdir}'`;
    query += "}) ";
    
    //task
    query += `MERGE (t:Task { task_id: '${dataset.prov.task_id}', app_id: '${dataset.prov.app}'}) `;

    //relationship
    query += `MERGE (d)-[:FROM {output_id: '${dataset.prov.output_id}'}]->(t) RETURN d`;
    logger.debug(query);
    db.cypher({ query }, (err, results)=>{
        if(err) return cb(err);
        //console.log(JSON.stringify(results, null, 4));
        cb();
    });
}

exports.query = (dataset, cb)=>{
    var query = `MATCH (d:Dataset{dataset_id: '${dataset._id}'}) MATCH (d)-[*]->(n) MATCH (s)-[r]->(n) RETURN s,r,n`;
    logger.debug(query);
    db.cypher({ query }, cb);
}


