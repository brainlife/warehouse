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
            //old noop doesn't have config.. let's fake it so we can go ahead and register it
            if(!task.config) {
                task.config = {
                    _outputs: [{
                        id: "noop",
                        //datatype: "59c3eae633fc1cf9ead71679", //raw..
                        //datatype_tags: [],
                        //tags: [],
                    }],
                };
            }
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
        if(task.service.startsWith("brainlife/validator-")) node.validator = true;

        nodes.push(node);
       
        if(task.service == "brainlife/app-archive") {
            for await (const datasetConfig of task.config.datasets) {

                const dirTokens = datasetConfig.dir.split("/");
                const sourceTask = dirTokens[1]; //original task that produed the output
                const subdir = dirTokens[2]; //original task's subdir that contains this ouput

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
                        "prov.subdir": subdir, 
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
                    idx: edges.length,
                    from: nodeIdx, 
                    to: datasetNodeIdx, 
                });
                node.inputs.push({task: sourceTask, subdir, datasetId: id});
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
                    idx: edges.length,
                    from: datasetNodeIdx, 
                    to: nodeIdx, 
                });
                node.inputs.push({datasetId: datasetConfig.id})
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
                    idx: edges.length,
                    from: datasetNodeIdx, 
                    to: nodeIdx, 
                });
            }
        }   

        //old validator didn't have _inputs.. let's use deps_config
        if(node.validator && !task.config._inputs) {
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
            const outputNode = {
                idx: outputNodeIdx,
                type: "output", 
                _taskId: task._id, //task that created the output
                outputId: output.id, 
                subdir: output.subdir, //subdir of the task output for this output
                datatype: output.datatype,
                datatype_tags: output.datatype_tags,
                tags: output.tags,
            }
            /*
            if(task.service == "brainlife/app-stage") {
                outputNode._datasetId = output.dataset_id;
            }
            */
            nodes.push(outputNode);
            edges.push({ 
                idx: edges.length,
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
                    idx: edges.length,
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
    console.debug("got", res.data.length, "samples");

    const provs = [];
    for await (const sample of res.data) {
        provs.push(await exports.traverseProvenance(sample._id));
    }
    return provs;
}


//setup shortcuts for some nodes
//I want UI to do this.. but I need it here for provenance analysis
//opts
// validator: remove validator and use validated output as the output from the source task
//      task>output1>validator>output2 into task>output2
// archivehop: 
//      output1>archive>dataset>stage>output2>task into just output1>task
// output
//      task1>output>task2 into task1>task2
exports.simplifyProvenance = (prov, opts)=>{

    function getParentIndices(nodeIdx) {
        return prov.edges.filter(edge=>(edge.to == nodeIdx)).map(edge=>edge.from);
    }
    function getChildIndices(nodeIdx) {
        return prov.edges.filter(edge=>(edge.from == nodeIdx)).map(edge=>edge.to);
    } 
    function findEdge(from, to) {
            return prov.edges.findIndex(edge=>(edge.from == from && edge.to == to));
    }

    if(opts.validator) {
        prov.nodes.filter(node=>node.validator).forEach(node=>{
            //validator should only have 1 input / output
            const validatorInputIdx = getParentIndices(node.idx)[0];
            const validatorSourceIdx = getParentIndices(validatorInputIdx)[0];
            const validatorOutputIdx = getChildIndices(node.idx)[0];
            const validatorOutput = prov.nodes[validatorOutputIdx];

            validatorOutput._validatorIdx = node.idx;

            const shortcut = [
                findEdge(validatorSourceIdx, validatorInputIdx),
                findEdge(validatorInputIdx, node.idx),
                findEdge(node.idx, validatorOutputIdx),
            ];
            shortcut.forEach(idx=>{
                prov.edges[idx]._simplified = true;
            });

            //create new link from validator source directly to validator output
            const shortCutIdx = prov.edges.length;
            prov.edges.push({
                idx: prov.edges.length,
                from: validatorSourceIdx, 
                to: validatorOutputIdx, 
                _shortcutEdges: shortcut
            });

            //mark simplified nodes/edges with the new shortCutEdges
            node._simplified = true;
        });
    } 

    if(opts.archivehop) {
        prov.nodes.filter(node=>node.service == "brainlife/app-archive").forEach(archiveNode=>{
            //find the parent output for this archiveNode
            archiveNode.inputs.forEach(input=>{
                const taskId = input.task;
                const subdir = input.subdir;

                //find the parent output that produced the archive-input
                const parentOutputIndices = getParentIndices(archiveNode.idx);
                parentOutputIndices.forEach(parentOutputIdx=>{
                    const parentOutput = prov.nodes[parentOutputIdx];
                    //look for archive > dataset > stage > output chain
                    const childDatasets = getChildIndices(archiveNode.idx);
                    childDatasets.forEach(datasetIdx=>{
                        const dataset = prov.nodes[datasetIdx];
                        //look for staging jobs
                        const stageTaskIndices = getChildIndices(datasetIdx);
                        stageTaskIndices.forEach(stageTaskIdx=>{
                            //look for stage output that matches the datasetid
                            const stageTask = prov.nodes[stageTaskIdx];
                            const stageOutputIndices = getChildIndices(stageTaskIdx); 
                            stageOutputIndices.forEach(stageOutputIdx=>{
                                const stageOutput = prov.nodes[stageOutputIdx]; 
                                if(dataset.datasetId == stageOutput.outputId) {
                                    const taskIndices = getChildIndices(stageOutput.idx);
                                    taskIndices.forEach(taskIdx=>{
                                        const task = prov.nodes[taskIdx];
                                        
                                        const shortcut = [
                                            findEdge(parentOutputIdx, archiveNode.idx),
                                            findEdge(archiveNode.idx, datasetIdx),
                                            findEdge(datasetIdx, stageTaskIdx),
                                            findEdge(stageTaskIdx, stageOutputIdx),
                                            findEdge(stageOutputIdx, taskIdx),
                                        ];
                                        shortcut.forEach(s=>{
                                            prov.edges[s]._simplified = true;
                                        });

                                        //now that we've established all the nodes/paths that I need to eliminate
                                        //it's just a matter of marking everything accordingly
                                        const shortCutIdx = prov.edges.length;
                                        prov.edges.push({
                                            idx: prov.edges.length,
                                            from: parentOutput.idx, 
                                            to: task.idx, 
                                            _shortcutEdges: shortcut,
                                        });
                                        archiveNode._simplified = true;
                                        dataset._simplified = true;
                                        stageTask._simplified = true;
                                        stageOutput._simplified = true;

                                        parentOutput._datasetArchiveIdx = archiveNode.idx;
                                        parentOutput._datasetId = dataset.datasetId;
                                    });
                                }
                            });
                        });
                    });
                });
            });
        });
    }

    if(opts.output) {
        prov.nodes.filter(node=>node.type == "output").forEach(output=>{
            const parentTaskIndices = getParentIndices(output.idx);
            parentTaskIndices.forEach(parentTaskIdx=>{
                const parentTask = prov.nodes[parentTaskIdx];
                if(parentTask.type != "task") return;
                if(parentTask._simplified) return;
                const childTaskIndices = getChildIndices(output.idx);
                childTaskIndices.forEach(childTaskIdx=>{
                    const childTask = prov.nodes[childTaskIdx];
                    if(childTask.type != "task") return;
                    if(childTask._simplified) return;
                    
                    //found taskP > output > taskC link between 2 tasks
                    const shortCutIdx = prov.edges.length;
                    const shortcut = [
                        findEdge(parentTaskIdx, output.idx),
                        findEdge(output.idx, childTaskIdx),
                    ];
                    prov.edges.push({
                        idx: prov.edges.length,
                        from: parentTask.idx, 
                        to: childTask.idx, 
                        _shortcutEdges: shortcut, 
                        _output: output.idx
                    });
                    output._simplified = true;
                    shortcut.forEach(s=>{
                        prov.edges[s]._simplified = true;
                    });
                });
            });
        });
    }
}



