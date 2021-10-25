'use strict';

const axios = require('axios');
const config = require('../config');
const db = require('../models');

exports.traverseProvenance = async (startTaskId) => {

    console.debug("traversing from task:", startTaskId);

    const nodes = [];
    const edges = [];

    const tasks = [startTaskId];
    while(tasks.length) {
        await handleTask(tasks.shift()); 
    }
        
    //pick things we want to store in nodes.config
    function filterConfig(config) {
        const filteredConfig = {};
        for(const key in config) {
            const v = config[key];
            if(key[0] == "_") continue;
            if(typeof v == "string" && v.startsWith("../")) continue;
            filteredConfig[key] = v;
        }
        return filteredConfig;
    }

    function registerDataset(dataset) {
        let existing = nodes.find(node=>(node.type == "dataset" && node.datasetId.toString() == dataset._id.toString()));
        if(existing) {
            return existing.idx;
        }

        //register new
        const datasetNodeIdx = nodes.length;
        nodes.push({
            idx: datasetNodeIdx,
            type: "dataset",
            datasetId: dataset._id,
            datatype: dataset.datatype, 
            datatypeTags: dataset.datatype_tags, 
            tags: dataset.tags,
            createDate: dataset.create_date,
        });
        return datasetNodeIdx;
    }

    async function handleTask(taskId) {

        //see if we already handled this task
        let existing = nodes.find(node=>(node.type == "task" && node.taskId == taskId));
        if(existing) return;

        const res = await axios.get(config.amaretti.api+'/task', {params: {
            find: JSON.stringify({_id: taskId})},
            headers: { authorization: "Bearer "+config.warehouse.jwt },
        });
        if(res.status != "200") throw "failed to query task:"+taskId;
        if(res.data.tasks.length != 1) throw "couldn't find exactly 1 task. len="+res.data.tasks.length;
        const task = res.data.tasks[0];
        if(!task.config) {
            console.error("task", taskId, "doesn't have config");
            return;
        }

        //register new task node
        const nodeIdx = nodes.length;
        const node = {
            idx: nodes.length, 
            type: "task",
            taskId: task._id,
            service: task.service, 
            serviceBranch: task.service_branch, 
            userId:task.user_id, 
            instanceId: task.instance_id, 
            name: task.name, 
            resourceId: task.resource_id, 
            finishDate: task.finish_date,
            runtime: task.runtime,
            inputs: [],
        };
        if(task.config._app) {
            node.config = filterConfig(task.config);
            node.appId = task.config._app;
        }
        nodes.push(node);
       
        if(task.service == "brainlife/app-archive") {
            for await (const datasetConfig of task.config.datasets) {
                //figure out input task/subdir (../60874c557f09362173e40866/bold_mask)
                const dataset = await db.Datasets.findById(datasetConfig.dataset_id).lean();
                const datasetNodeIdx = registerDataset(dataset);
                edges.push({
                    from: nodeIdx, 
                    to: datasetNodeIdx, 
                });
                const tokens = datasetConfig.dir.split("/");
                node.inputs.push({task: tokens[1], subdir: tokens[2]});
            }
        }

        if(task.service == "brainlife/app-stage") {
            for await (const datasetConfig of task.config.datasets) {
                //look for archived task that archived the data object
                const dataset = await db.Datasets.findById(datasetConfig.id).lean();
                if(dataset.archive_task_id) {
                    tasks.push(dataset.archive_task_id);
                }
                const datasetNodeIdx = registerDataset(dataset);
                edges.push({
                    from: datasetNodeIdx, 
                    to: nodeIdx, 
                });
            }
        }

        //deprecated staging job
        if(task.service == "soichih/sca-product-raw") {
            for await (const datasetConfig of task.config.download) {
                const dataset = await db.Datasets.findById(datasetConfig.dir).lean();
                //TODO - old dataset (like dev:5a2199f06fb74f6eefd5ad5c) didn't have archive_task_id
                //do I need to find the archive task? or should I skip archive task and directly go
                //for prov task?
                if(dataset.archive_task_id) {
                    tasks.push(dataset.archive_task_id);
                }
                const datasetNodeIdx = registerDataset(dataset);
                edges.push({
                    from: datasetNodeIdx, 
                    to: nodeIdx, 
                });
            }
        }   

        //old validator didn't have _inputs.. let's use deps_config
        if(task.service.startsWith("brainlife/validator-") && !task.config._inputs) {
            task.deps_config.forEach(dep=>{
                if(dep.subdirs) dep.subdirs.forEach(subdir=>{
                    node.inputs.push({task: dep.task, subdir: subdir});
                });
                //if deps_config doesn't specify any subdir, let's add task input with the whole root directory
                if(node.inputs.length == 0) node.inputs.push({task: dep.task});
            });            
        }

        if(task.config && task.config._inputs) task.config._inputs.forEach(input=>{
            node.inputs.push({
                task: input.task_id,
                subdir: input.subdir,
                //datatype: input.datatype,
            })
        });

        //staging and nornmal task should have config._outputs
        if(task.config && task.config._outputs) task.config._outputs.forEach(output=>{
            const outputNodeIdx = nodes.length;
            nodes.push({
                idx: outputNodeIdx,
                type: "output", 
                _taskId: task._id, 
                outputId: output.id,
                subdir: output.subdir, 
                datatype: output.datatype,
                datatype_tags: output.datatype_tags,
                tags: output.tags,
            })
            edges.push({ 
                from: nodeIdx, 
                to: outputNodeIdx, 
                //datatype: output.datatype 
            })
        });

        //queue its input tasks
        if(task.deps_config) task.deps_config.forEach(dep=>{
            tasks.push(dep.task);
        });
        if(!task.deps_config && task.deps) {
            //legacy task only had deps
            task.deps.forEach(taskId=>{
                tasks.push(taskId);
            });
        }
    }

    //create archive links (output > dataset)
    nodes.forEach(node=>{
        //find source output for archived dataset and link it
        if(node.inputs) node.inputs.forEach(input=>{
            const outputs = nodes.filter(n=>(n.type == "output" && n._taskId == input.task && n.subdir == input.subdir));
            outputs.forEach(output=>{
                edges.push({
                    from: output.idx, 
                    to: node.idx, 
                });
            });
        });
    });

    return {nodes, edges}
}
    
//find app tasks that has no following tasks (end of the workflow)
exports.findTerminalTasks = async (appId)=>{
    /*  
    const res = await axios.get(config.amaretti.api+'/task', {
        params: {
            find: JSON.stringify({
                finish_date: {$exists: true},              
                //"config._app": {$exists: true},
                "config._app": appId,
            }),
            limit: 100,
            sort: '-finish_date',
            select: '_id service finish_date _group_id',
        },
        headers: { authorization: "Bearer "+config.warehouse.jwt },
    });
    */
    const res = await axios.get(config.amaretti.api+'/task/samples/'+appId, {
        params: {
            appId,
        }
    });
    if(res.status != "200") throw "failed to query task:"+taskId;

    const provs = [];
    for await (const group of res.data) {
        console.log("group_id", group._id);
        for await (const taskId of group.taskIds) {
            provs.push(await exports.traverseProvenance(taskId));
        }
    }
    return provs;
}


