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
        if(res.data.tasks.length != 1) {
            console.log("couldn't find task", taskId);
            return;
        }
        const task = res.data.tasks[0];

        if(task.service == "brainlife/app-noop") {
            //noop doesn't have config.. let's fake it so we can go ahead and register it
            task.config = {
                _outputs: [{
                    id: "noop",
                    //datatype: "59c3eae633fc1cf9ead71679", //raw..
                    //datatype_tags: [],
                    //tags: [],
                }],
            };
        }

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

                const dirTokens = datasetConfig.dir.split("/");
                const sourceTask = dirTokens[1];
                const subdir = dirTokens[2];

                //figure out input task/subdir (../60874c557f09362173e40866/bold_mask)
                let id = datasetConfig.dataset_id;

                //we used to store the whole dataset object instead of dataset_id
                if(!id && datasetConfig.dataset) id = datasetConfig.dataset._id;

                //if we have the id, we can look up the dataset now
                let dataset;
                if(id) dataset = await db.Datasets.findById(id).lean();

                //but.. really old app-archive didn't store dataset_id in datasetConfig.. 
                //so we need to look up dataset using archive_task_id
                if(!id) {
                    dataset = await db.Datasets.findOne({
                        archive_task_id: task._id,
                        //there might be more than 1 so look for the right one
                        "prov.task.subdir": subdir, 
                    }).lean();
                    id = dataset._id;
                }

                if(!id) {
                    console.error("couldn't find dataset id for app-archive's datasetConfig", task._id, datasetConfig);
                    continue;
                }

                if(!dataset) {
                    console.error("couldn't find dataset(removed?) in task:", task._id, datasetConfig, "faking");
                    dataset = {_id: id, missing: true};
                }

                const datasetNodeIdx = registerDataset(dataset);
                edges.push({
                    from: nodeIdx, 
                    to: datasetNodeIdx, 
                });
                node.inputs.push({task: sourceTask, subdir});
            }
        }

        if(task.service == "brainlife/app-stage") {
            for await (const datasetConfig of task.config.datasets) {
                //look for archived task that archived the data object
                const dataset = await db.Datasets.findById(datasetConfig.id).lean();
                if(!dataset) {
                    console.error("couldn't find staging dataset:", datasetConfig.id, "in task:", task._id, datasetConfig);
                    continue;
                }
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
                if(!dataset) {
                    console.error("couldn't find sca-product-raw dataset:", datasetConfig.dir, "in task:", task._id);
                    continue;
                }
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

        if(task.config._inputs) task.config._inputs.forEach(input=>{
            node.inputs.push({
                task: input.task_id,
                subdir: input.subdir,
                //datatype: input.datatype,
            })
        });

        //staging and nornmal task should have config._outputs
        if(task.config._outputs) task.config._outputs.forEach(output=>{
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
exports.sampleTerminalTasks = async (appId)=>{
    console.debug("querying sample tasks")
    const res = await axios.get(config.amaretti.api+'/task/samples/'+appId, {
        headers: { authorization: "Bearer "+config.warehouse.jwt },
    });
    if(res.status != "200") throw "failed to query task:"+taskId;
    console.debug("got", res.data.lengthm,"samples");

    const provs = [];
    for await (const sample of res.data) {
        provs.push(await exports.traverseProvenance(sample._id));
    }
    return provs;
}


