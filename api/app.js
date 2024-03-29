
const axios = require('axios');
const config = require('./config');
const db = require('./models');
const common = require('./common');

//enumerate (and count) unique workflow that leads to targetApp
exports.enumerateWorkflows = async (targetAppId, cb)=>{

    /*
    let targetApp = await db.Apps.findById(targetAppId);
    if(!targetApp) return cb("no such app");
    apps.push(targetApp);
    */

    //random sample datasets generated by this app
    //(TODO - how can I randomize?)
    //let datasets = await db.Datasets.find({"prov.task.config._app": targetAppId}).limit(1);

    //debug
    let datasets = await db.Datasets.find({"_id": "5c3905c2aa3b325d5471c422"}).limit(1);

    //for each dataset, generate provenance graph that leads to it
    let provs = [];
    for(let i = 0;i < datasets.length; ++i) {
        let prov = {nodes: [], edges: []};
        await exports.provDataset(null, datasets[i], prov);
        provs.push(exports.simplifyProvGraph(prov));
    }

    //console.dir(provs);
    provs.forEach(prov=>{
        console.log("prov-----------------------------_");
        prov.nodes.forEach(node=>{
            //console.log("  node", node.id, "task_name", node.task.name, node.task.service);
            console.log("  node", node.id, "type", node.type);
            if(node.type == "dataset") console.log("    dtype:", node.dataset.datatype, node.dataset.desc);
            if(node.type == "task") console.log("    ", node.task.name, node.task.service);
        });
        prov.edges.forEach(edge=>{
            console.log("  edge", "from", edge.from, "to", edge.to, "as", edge.as);
        });
    });

    //analyze and find *common* workflow
    let workflows = [];
    //workflows.push({nodes, edges});
    cb(null, {workflows});
}

exports.provTask = async (from, task, as, prov)=>{
    console.debug("provTask", task);

    let id = "task."+task._id;
    prov.nodes.push({type: "task", id, task});
    prov.edges.push({from, to: id, as});

    let headers = {Authorization: "Bearer "+config.warehouse.jwt};

    if(task.config._inputs) {
        for(let i = 0;i < task.config._inputs.length; ++i) {
            let inputTaskId = task.config._inputs[i].task_id;
            let taskRes = await axios.get(config.amaretti.api+"/task/"+inputTaskId, {headers});
            await exports.provTask(id, taskRes.data, task.config._inputs[i].id, prov);
        }
    }

    /*
    //old tasks used tasks.deps
    for(let i = 0;i < task.deps.length; ++i) {
        let inputTaskId = task.deps[i];
        let taskRes = await axios.get(config.amaretti.api+"/task/"+inputTaskId, {headers});
        await exports.provTask(id, taskRes.data, prov);
    }
    */
    
    //staging task doesn't have _inputs but _outputs shows where the data came from
    if(task.service == "soichih/sca-product-raw" || task.service == "brainlife/app-stage") {
        for(let i = 0;i < task.config._outputs.length; ++i) {
            let dataset_id = task.config._outputs[i].dataset_id;
            let dataset = await db.Datasets.findById(dataset_id).populate('prov.app project');
            if(!dataset) console.debug("no such dataset", dataset_id);
            await exports.provDataset(id, dataset, prov);
        }
    }

    //
}

//just walk the provenance graph and return all the hairly details
//(client is responsible for simplifying them)
exports.provDataset = async (from, dataset, prov)=>{
    console.debug("provDatase", dataset);
    
    /*
    //ignore broken dataset (TODO - what about upload?)
    if(!dataset.prov) return;
    if(!dataset.prov.task) return;
    if(!dataset.prov.task.config) return;
    if(!dataset.prov.task.config._app) return;
    if(!dataset.prov.task.config._inputs) return;
    */

    let id = "dataset."+dataset._id;
    prov.nodes.push({type: "dataset", id, dataset});
    prov.edges.push({from, to: id});

    //let appId = dataset.prov.task.config._app;
    //let inputs = dataset.prov.task.config._inputs;
    await exports.provTask(id, dataset.prov.task, dataset.prov.output_id, prov);
}

//take the dataset provenance grap and simplify
exports.simplifyProvGraph = (prov)=>{
    //TODO..
    return prov;
}
