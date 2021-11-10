'use strict';

const axios = require('axios');
const config = require('../config');
const db = require('../models');
const mongoose = require('mongoose');

exports.traverseProvenance = async (startTaskId) => {

    console.debug("traversing from task:", startTaskId);

    const nodes = [];
    const edges = [];

    const tasks = [startTaskId];
    const taskCache = {}; //provides "guess" in case task can't be resolved
    while(tasks.length) {
        await handleTask(tasks.shift()); 
    }
    
    //pick things we want to store in nodes.config
    /*
    function filterConfig(task) {
        const filteredConfig = {};
        for(const key in task.config) {
            const v = task.config[key];
            if(key[0] == "_") continue;
            if(typeof v == "string" && v.startsWith("../")) continue;
            filteredConfig[key] = v;
        }
        return filteredConfig;
    }
    */
    function filterConfig(config, appConfig) {
        let _config = {};
        for(let key in config) {
            const v = config[key];
            if(key.startsWith("_")) continue;
            if(typeof v == "string" && v.startsWith("../")) continue;
            const spec = appConfig[key];
            let def;
            if(spec) def = spec.default;
            _config[key] = {v: config[key], default: def}
        }
        return _config;
    }

    function registerDataset(dataset) {
        let existing = nodes.find(node=>(node.type == "dataset" && node.datasetId.toString() == dataset._id.toString()));
        if(existing) {
            return existing.idx;
        }

        //register new
        const datasetNodeIdx = nodes.length;
        const node = {
            idx: datasetNodeIdx,
            type: "dataset",
            datasetId: dataset._id,
            datatype: dataset.datatype.toString(), 
            datatypeTags: dataset.datatype_tags, 
            tags: dataset.tags,
            desc: dataset.desc,
            createDate: dataset.create_date,
            storage: dataset.storage,
            project: dataset.project,
            meta: {
                subject: dataset.meta.subject,
                session: dataset.meta.session,
                run: dataset.meta.run,
            }
        };
        switch(dataset.storage){
        case "xnat":
            //XNAT dataset contains auth object with user/pass. watch out!
            node.storageLocation = dataset.storage_config.url;
            break;
        case "datalad":
            //storage_config.files[].src contain full path.. but maybe too verbose
            node.storageLocation = dataset.storage_config.path;
            break;
        }
        nodes.push(node);
        return datasetNodeIdx;
    }

    function registerFakeArchive(dataset) {

        //we didn't archive on some storage
        if(dataset.storage == "datalad") return;

        if(!dataset.prov || (!dataset.prov.task && !dataset.prov.task_id)) {
            //datalad dataset doesn't have any prov but that's ok.. it's terminal there
            console.error("can't register fake app-archive for dataset:"+dataset._id+" without prov.task or prov.task_id. storage:", dataset.storage);
            return;
        }  

        //old validator didn't have subdir set, but it should be set to "output" for linking to work properly
        if(dataset.prov.task && dataset.prov.task.service.startsWith("brain-life/validator-") && !dataset.prov.subdir) {
            dataset.prov.subdir = "output";
        }

        let dir = "../"+(dataset.prov.task_id || dataset.prov.task._id);
        if(dataset.prov.subdir) dir += "/"+dataset.prov.subdir;

        const guess = {
            _id: "fake.archive.ds-"+dataset._id,
            service: "brainlife/app-archive",
            user_id: dataset.user_id,
            name: "guess archive",
            finish_date: dataset.create_date,
            config: {
                datasets: [{
                    project: dataset.project,
                    dir,
                    dataset_id: dataset._id,
                    storage: dataset.storage,
                    storage_config: dataset.storage_config, //is this right?
                }]
            },
            deps_config: [{
                task: (dataset.prov.task_id || dataset.prov.task._id),
                subdirs: [dataset.prov.output_id],
            }],
        }
        taskCache[guess._id] = guess;
        tasks.push(guess._id);
    }

    async function handleTask(taskId) {

        //see if we already handled this task
        let existing = nodes.find(node=>(node.type == "task" && node.taskId == taskId));
        if(existing) return;

        let task = taskCache[taskId];
        if(!task) {
            const res = await axios.get(config.amaretti.api+'/task', {params: {
                find: JSON.stringify({_id: taskId})},
                headers: { authorization: "Bearer "+config.warehouse.jwt },
            });
            if(res.status != "200") throw "failed to query task:"+taskId;
            if(!res.data.tasks.length) {
                console.log("couldn't find task", taskId);
                task = { _id: taskId, service: "brainlife/app-noop", name: "fake for missing" }
            } else task = res.data.tasks[0];
        }
        if(!task) return console.error("failed to load task", taskId);

        if(task.service == "brainlife/app-noop" || task.service == "soichih/sca-service-noop") {
            if(!task.config) task.config = {};
            if(!task.config._outputs) {
                console.log("noop task", task._id, "doesn't have config set.. faking");
                task.config._outputs = [{
                    id: "noop",
                    datatype: "59c3eae633fc1cf9ead71679", //raw?
                    datatypeTags: [],
                    tags: [],
                }];
            }
        }

        if(!task.config) {
            console.error("task", taskId, "doesn't have config");
            return;
        }

        //register new task node
        const nodeIdx = nodes.length;
        const node = {
            idx: nodeIdx,
            type: "task",
            taskId: task._id,
            service: task.service, 
            serviceBranch: task.service_branch, 
            userId:task.user_id, 
            instanceId: task.instance_id, 
            groupId: task._group_id,
            name: task.name, 
            resourceId: task.resource_id, 
            finishDate: task.finish_date,
            runtime: task.runtime,
            inputs: [],
        };
        if(task.config._app) {
            const app = await db.Apps.findById(task.config._app).select({config: 1}).exec();//.lean();
            node._config = filterConfig(task.config, app.config);
            node.appId = task.config._app;
        }
        if(task.service.startsWith("brainlife/validator-") ||
           task.service.startsWith("brain-life/validator-")) node.validator = true;

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
                    inputId: id, //dataset id
                });
                node.inputs.push({
                    inputId: id,  //dataset id
                    task: sourceTask, 
                    subdir, 
                });
            }
        }

        if(task.service == "brainlife/app-stage") {
            for await (const datasetConfig of task.config.datasets) {
        
                let datasetId = datasetConfig.id;
                if(datasetConfig.outdir) {
                    //for copied dataset, id will be set to the real(source) dataset.
                    //outdir will be set to indicate the actual(copy) dataset id which we want
                    datasetId = datasetConfig.outdir;
                }

                //look for archived task that archived the data object
                const dataset = await db.Datasets.findById(datasetId).lean();
                if(!dataset) {
                    console.error("couldn't find staging dataset:", datasetId, "in task:", task._id, datasetConfig);
                    continue;
                }
                if(dataset.archive_task_id) {
                    tasks.push(dataset.archive_task_id);
                } else {
                    registerFakeArchive(dataset);
                }

                const datasetNodeIdx = registerDataset(dataset);
                edges.push({
                    idx: edges.length,
                    from: datasetNodeIdx, 
                    to: nodeIdx, 
                    inputId: datasetId,
                });
                node.inputs.push({
                    inputId: datasetId,
                    //no task/subdir for staging job as are the one producing them
                })
            }
        }

        //deprecated staging job
        if(task.service == "soichih/sca-product-raw") {
            //TODO - not always download, right?
            if(!task.config.download) {
                console.error("only handling download request for sca-product-raw.. but it's not set on ", task._id);
            } else {
                for await (const datasetConfig of task.config.download) {
                    const dataset = await db.Datasets.findById(datasetConfig.dir).lean();
                    if(!dataset) {
                        console.error("couldn't find sca-product-raw dataset:", datasetConfig.dir, "in task:", task._id);
                        //TODO - register a fake dataset?
                        continue;
                    }
                    if(dataset.archive_task_id) {
                        tasks.push(dataset.archive_task_id);
                    } else {
                        //old dataset (like dev:5a2199f06fb74f6eefd5ad5c or test:5afedfdb251f5200274d9ca8) 
                        //didn't have archive_task_id (because there was no archive service back then?)
                        //let's fake it by creating a guess in our cache
                        registerFakeArchive(dataset);
                    }

                    const datasetNodeIdx = registerDataset(dataset);
                    edges.push({
                        idx: edges.length,
                        from: datasetNodeIdx, 
                        to: nodeIdx, 
                        inputId: dataset._id, //is this right?
                    });
                }
            }
        }   

        //old validator didn't have _inputs.. let's use deps_config
        if(node.validator && !task.config._inputs) {
            if(task.deps_config) task.deps_config.forEach(dep=>{
                if(dep.subdirs) {
                    //there should be multiple subdirectories specified (for subsetting case?)
                    //but they all should have common parent. let's grab the first one and use the parent
                    //TODO - I am not too confident about this
                    let subdir;
                    if(dep.subdirs.length) {
                        const subdirFullpath = dep.subdirs[0];
                        subdir = subdirFullpath.split("/")[0]; 
                    }
                    node.inputs.push({
                        //validator only has 1 input for inputID shouldn't matter
                        task: dep.task, 
                        subdir,
                    });
                }
                //if deps_config doesn't specify any subdir, maybe it's the old rootdir app.
                //let's add task input with the whole root directory
                if(node.inputs.length == 0) node.inputs.push({
                    //again, input id doesn't matter for validator
                    task: dep.task
                });
            });         
            //really old ones used deps instead of deps_config
            if((!task.deps_config || !task.deps_config.length) && task.deps) task.deps.forEach(task=>{
                node.inputs.push({task})
            });
        }

        //old validator didn't have _outputs.. let's guess the output
        if(node.validator && !task.config._outputs) {
            console.log("validator is missing missing output .. faking");
            console.dir(node);
            task.config._outputs = [{
                id: "output",
                datatype: "whatever",
                subdir: "output",
            }];
        }

        if(task.config._inputs) task.config._inputs.forEach(input=>{
            node.inputs.push({
                inputId: input.id,
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
                datatypeTags: output.datatype_tags,
                tags: output.tags,
            }

            //fake archiver expect subdir to be set to output_id but old task didn't do this sometimes
            //if(!outputNode.subdir) outputNode.subdir = output.id;

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
                outputId: output.id,
            })
        });

        //queue its input tasks
        if(task.deps_config) task.deps_config.forEach(dep=>{
            tasks.push(dep.task);
        });
        if((!task.deps_config || !task.deps_config.length) && task.deps) {
            //legacy task only had deps
            task.deps.forEach(taskId=>{
                tasks.push(taskId);
            });
        }
    }


    //find source output for archived dataset and link it
    nodes.forEach(node=>{
        if(node.inputs) node.inputs.forEach(input=>{
            const outputs = nodes.filter(n=>(n.type == "output" && n._taskId == input.task && n.subdir == input.subdir));
            outputs.forEach(output=>{
                edges.push({
                    idx: edges.length,
                    from: output.idx, 
                    to: node.idx, 
                    inputId: input.inputId,
                    outputId: output.outputId,
                });
            });
        });
    });

    console.debug("  nodes:", nodes.length," edges:", edges.length);

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
exports.setupShortcuts = (prov)=>{
    //console.debug("setting up shortcuts");

    function getParentIndices(nodeIdx) {
        return prov.edges.filter(edge=>(edge.to == nodeIdx)).map(edge=>edge.from);
    }
    function getChildIndices(nodeIdx) {
        return prov.edges.filter(edge=>(edge.from == nodeIdx)).map(edge=>edge.to);
    } 

    //TODO
    //I think this is dangerous.. there could be multpile edges with the same from/to
    //I think it's safer to just return the edge itself, and let caller specifically use that edge.idx
    //for shortcut array 
    function findEdgeIdx(from, to) {
        return prov.edges.findIndex(edge=>(edge.from == from && edge.to == to));
    }
    /*
    function findNonsimplifiedEdge(from, to) {
        return prov.edges.findIndex(edge=>(edge.from == from && edge.to == to && !edge._smplified));
    }
    */

    //TODO get rid of this function
    function registerShortcutEdge(from, to, shortcut) {
        //if it already exists, just merge shortcut
        //create new edge
        const edge = {
            idx: prov.edges.length,
            from,
            to,
            _shortcutEdges: shortcut,
        }
        prov.edges.push(edge);
        return edge;
    }

    //repeat the whole process until no more shortcuts are added
    let beforeCount = 0;
    while(beforeCount != prov.edges.length) {
        beforeCount = prov.edges.length;
        //////////////////////////////////////////////////////////////////
        // validator shortcuts
        // source > validator > output
        //  to
        // source > output
        prov.nodes.filter(node=>(!node._simplified && node.validator)).forEach(node=>{
            //validator should only have 1 input / output
            const validatorInputIdx = getParentIndices(node.idx)[0];
            const validatorSourceIdx = getParentIndices(validatorInputIdx)[0]; 
            //const validatorInput = prov.nodes[validatorInputIdx];
            const validatorOutputIdx = getChildIndices(node.idx)[0];
            const validatorOutput = prov.nodes[validatorOutputIdx];

            validatorOutput._validatorIdx = node.idx;

            const sourceEdgeIdx = findEdgeIdx(validatorSourceIdx, validatorInputIdx);
            const sourceEdge = prov.edges[sourceEdgeIdx];

            const shortcut = [
                //should be safe to use findEdge because there is only 1 in/out of each validator?
                sourceEdgeIdx,
                findEdgeIdx(validatorInputIdx, node.idx),
                findEdgeIdx(node.idx, validatorOutputIdx),
            ];
            if(shortcut.includes(-1)) {
                console.error("validator didn't have input/output?", node, shortcut);
                return;
            }
            shortcut.forEach(idx=>{
                prov.edges[idx]._simplified = true;
            });

            //create new link from validator source directly to validator output
            const newedge = registerShortcutEdge(validatorSourceIdx, validatorOutputIdx, shortcut);
            newedge.outputId = sourceEdge.outputId;

            //mark simplified nodes/edges with the new shortCutEdges
            node._simplified = true;
        });

        //////////////////////////////////////////////////////////////////
        // output shortcuts
        // taskP > output > taskC 
        // to
        // taskP > taskC
        prov.nodes.filter(node=>(!node._simplified && node.type == "output")).forEach(output=>{
            prov.edges.filter(e=>e.to == output.idx).forEach(parentTaskEdge=>{
                const parentTask = prov.nodes[parentTaskEdge.from];
                if(parentTask.type != "task") return;
                prov.edges.filter(e=>e.from == output.idx).forEach(childTaskEdge=>{
                    const childTask = prov.nodes[childTaskEdge.to];
                    if(childTask.type != "task") return;
                    
                    //found taskP > output > taskC chain
                    const shortcut = [
                        parentTaskEdge.idx,
                        childTaskEdge.idx,
                    ];
                    const edge = registerShortcutEdge(parentTask.idx, childTask.idx, shortcut);
                    edge._output = output.idx; //TODO if it already exists, it could wipe?
                    edge.outputId = parentTaskEdge.outputId;
                    edge.inputId = childTaskEdge.inputId;

                    //if either parent or child node is simplified, mark this one simplified also.
                    if(parentTask._simplified || childTask._simplified) edge._simplified = true;

                    output._simplified = true;
                    
                    shortcut.forEach(s=>{
                        prov.edges[s]._simplified = true;
                    });
                });
            });
        });

        //////////////////////////////////////////////////////////////////
        // short cut 
        // dataset > stage > task 
        //          to 
        // dataset > task
        prov.nodes.filter(node=>(!node._simplified && node.type == "dataset")).forEach(node=>{
            const stageTaskEdges = prov.edges.filter(e=>e.from == node.idx);
            stageTaskEdges.forEach(stageTaskEdge=>{
                const stageTask = prov.nodes[stageTaskEdge.to];
                if(stageTask.service != "brainlife/app-stage" && stageTask.service != "soichih/sca-product-raw") return;
                prov.edges.filter(edge=>(edge.from == stageTask.idx && !edge._simplified)).forEach(edge=>{
                    if(!edge._output) return;
                    const output = prov.nodes[edge._output];
                    if(output.subdir == node.datasetId) {
                        const task = prov.nodes[edge.to];
                        const shortcut = [
                            stageTaskEdge.idx,
                            edge.idx,
                        ];
                        const newedge = registerShortcutEdge(node.idx, edge.to, shortcut);
                        newedge._output = edge._output;
                        newedge.inputId = edge.inputId; //not yet tested

                        //but probably needed... but not 100% sure..
                        //if(node._simplified || stageTask._simplified || output._simplified) newedge._simplified = true;

                        shortcut.forEach(s=>{
                            prov.edges[s]._simplified = true;
                        });
                        stageTask._simplified = true;
                    }
                });
            });
        });

        //short cut taskP > archive > dataset > taskC
        //make sure I follow the correct output - 
        //sample http://localhost:8080/project/5f9b09d26ce09b45b9f97170/process/617b5134e0fff00913eeaa5f
        //record archived dataset
        prov.nodes.filter(node=>(!node._simplified && node.type == "task")).forEach(parentTask=>{
            if(parentTask._simplified) return;
            const taskOutputEdges = prov.edges.filter(e=>(!e._simplified && e.from == parentTask.idx));
            taskOutputEdges.forEach(taskOutputEdge=>{
                if(!taskOutputEdge._output) return;
                const output = prov.nodes[taskOutputEdge._output];
                const archiveTask = prov.nodes[taskOutputEdge.to];
                if(archiveTask.service != "brainlife/app-archive" && archiveTask.service != "soichih/sca-product-raw") return;
                const archiveOutputEdges = prov.edges.filter(e=>(!e._simplified && e.from == archiveTask.idx)); 
                archiveOutputEdges.forEach(archiveOutputEdge=>{
                    const dataset = prov.nodes[archiveOutputEdge.to];
                    prov.edges.filter(e=>(!e._simplified && e.from == dataset.idx)).forEach(childTaskEdge=>{
                        const childTask = prov.nodes[childTaskEdge.to];

                        //make sure we came from the right path
                        const archiveInput = archiveTask.inputs.find(i=>i.inputId.toString() == dataset.datasetId.toString());
                        if(archiveInput.subdir == output.subdir) {
                            const shortcut = [
                                taskOutputEdge.idx, 
                                archiveOutputEdge.idx,
                                childTaskEdge.idx,         
                            ];
                            const newedge = registerShortcutEdge(parentTask.idx, childTask.idx, shortcut);

                            //I could use output on taskOutputEdge._output, or childTaskEdge._output
                            //but I need to use output that's closer to the childTask so that we can find
                            //the right path via subdir
                            newedge._output = childTaskEdge._output; 

                            newedge._dataset = dataset.idx;
                            newedge.outputId = taskOutputEdge.outputId;
                            newedge.inputId = childTaskEdge.inputId;
                            shortcut.forEach(s=>{
                                prov.edges[s]._simplified = true;
                            });
                            archiveTask._simplified = true;
                            dataset._simplified = true;
                        }
                    });
                });
            });
        });

        /*
        //hide unused dataset staged by app-stage
        prov.nodes.filter(node=>(!node._simplified && 
            (node.service == "brainlife/app-stage" || node.service == "soichih/sca-product-raw")
        )).forEach(stage=>{
            //look which data objects are actually used
            const datasetIdsUsed = [];
            prov.edges.filter(e=>e.from == stage.idx).forEach(edge=>{
                const output = prov.nodes.find(n=>n.idx == edge.to);
                if(output.type != "output") return; //shortcut edge might link to non-ouput
                const outputParentEdge = prov.edges.find(e=>e.from == output.idx);
                datasetIdsUsed.push(output.outputId);
            });

            prov.edges.filter(e=>e.to == stage.idx).forEach(edge=>{
                //simplify unsed edge / dataset if it's not used
                if(!datasetIdsUsed.includes(edge.inputId)) {
                    console.log("simplifiying unsed dataset/edge", edge);
                    edge._simplified = true;
                    prov.nodes[edge.from]._simplified = true;
                }
            });
        });
        */
    }

    //mark nodes that are relevant as _visited
    const root = prov.nodes[0];
    //mark root's children as visited (to show "This Data-Object")
    prov.edges.filter(e=>e.from == root.idx).forEach(edge=>{
        const c = prov.nodes[edge.to];
        c._important = true;
    });
    const nodes = [root];
    while(nodes.length) {
        const node = nodes.shift();
        node._important = true;
        prov.edges.filter(e=>e.to == node.idx).forEach(edge=>{
            const p = prov.nodes[edge.from];
            if(!p._simplified) nodes.push(p);
        });
    }
    /*
    prov.nodes.forEach(node=>{
        if(!node._visited) node._simplified = true;
    });
    */

}
//from array of provenances, construct a single tree with counts indicating number of paths for each branch
exports.countProvenances = (provs)=>{
    console.debug("counting provenances");

    function countApps(prov, pnode, cnode, pidx) {

        //find all input edges
        prov.edges.filter(e=>(e.to == pnode.idx && !e._simplified)).forEach(edge=>{

            const output = prov.nodes[edge._output];
            const input = prov.nodes[edge.from];
            const info = pullnodeinfo(input);

            let datatype = null;
            if(output) datatype = output.datatype;
            const iid = datatype+":"+edge.inputId;

            if(!cnode.inputs[iid]) cnode.inputs[iid] = [];

            let c = cnode.inputs[iid].find(a=>a.id == info.id);
            if(!c) {
                c = info;
                info.outputId = edge.outputId;

                //these will be just sample from the first task that matches the id
                if(output && output.datatypeTags) {
                    info.datatypeTags = {};
                    output.datatypeTags.forEach(tag=>{
                        info.datatypeTags[tag] = 1;
                    });
                }
                info.config = {};

                //convert all v into count of 1
                for(const key in input._config) {
                    let v = input._config[key].v;
                    //if(v === undefined) v = "__undefined__"; 
                    if(!info.config[key]) {
                        info.config[key] = Object.assign({}, input._config[key]);
                        info.config[key].vcounts = {};
                    }
                    //if(v === '') v = "__emptystring__";
                    info.config[key].vcounts = {[v]: 1};
                    delete info.config[key].v;
                }

                //add new app
                cnode.inputs[iid].push(info);
            } else {
                //merge datatype tags
                if(output && output.datatypeTags) {
                    if(!c.datatypeTags) c.datatypeTags = {};
                    output.datatypeTags.forEach(tag=>{
                        if(!c.datatypeTags[tag]) c.datatypeTags[tag] = 0;
                        c.datatypeTags[tag]++;
                    });
                } 

                //merge new config values
                if(!c.config) c.config = {};
                for(const key in input._config) {
                    let v = input._config[key].v;
                    if(!c.config[key]) {
                        c.config[key] = Object.assign({}, input._config[key]);
                        c.config[key].vcounts = {};
                    } 
                    if(!c.config[key].vcounts[v]) c.config[key].vcounts[v] = 0;
                    if(c.config[key]) c.config[key].vcounts[v]++;
                    delete c.config[key].v;
                }
            }
            //c.count++;
            c.provs.push(pidx);

            //recurse into parent
            countApps(prov, input, c, pidx);
        });
    }

    function pullnodeinfo(pnode) {
        let id = pnode.type;
        switch(pnode.type) {
        case "task":
            id+=":"+pnode.service;
            if(pnode.serviceBranch) id+=":"+pnode.serviceBranch;
            break
        case "dataset":
            id+=":"+pnode.datasetId;
        default:
            //??
        }
        return {
            id,
            appId: pnode.appId, 
            //_taskId: pnode.taskId, //first one seen
            //count: 0,
            //service: pnode.service, 
            //serviceBranch: pnode.serviceBranch, 
            inputs: {},
            provs: [],  //provIndices
            storage: pnode.storage, //for dataset
            storageLocation: pnode.storageLocation, //for dataset
        }
    }

    //create the root of count node
    const cnodes = [];
    provs.forEach((prov, pidx)=>{
        const pnode = provs[0].nodes[0];
        const info = pullnodeinfo(pnode);

        //see if we already have the app listed
        let c = cnodes.find(a=>a.id == info.id);
        if(!c) {
            c = info;
            cnodes.push(c);
        }
        //c.count++;
        c.provs.push(pidx);

        countApps(prov, pnode, c, pidx);
    });
    return cnodes;
}

//from the output of countProvenances, pick ones with highest counts
exports.computeProbabilities = (cnodes)=>{
    console.debug("picking common provenances");
    //console.dir(cnodes);

    //multiple provenance graph could end up in the same terminal nodes
    //to prevent picking similar(same) provenances with the same highest probs,
    //let's preserve the prob grouping so client can pick 1 from each groups
    const probs = []; //{prob: <conditional probability>: provs: [ <indicies for the provs> ]}

    //compute the conditional probability of each provenance
    function walk(nodes, prob = 1.0, denominator) {
        nodes.forEach(node=>{
            const nodeProvs = node.provs.length;
            let condprob = prob;
            if(denominator) condprob *= nodeProvs/denominator;
            //console.log("walking inputs", prob, node.id, nodeProvs, denominator, node.provs);
            //TODO - when an app has multiple input, the we end up walking multiple paths and come up with
            //same or different terimnal probability
            /*
            //production
            saving counts /tmp/count.59fb2f15c996d0002d47ee1d.json
            picking common provenances
            reached terminal 0.8571428571428571 [ 0, 1, 2, 3, 4, 5 ]
            reached terminal 0.14285714285714285 [ 6 ]
            reached terminal 0.14285714285714285 [ 6 ]
            reached terminal 0.2857142857142857 [ 0, 5 ]
            reached terminal 0.5714285714285714 [ 1, 2, 3, 4 ]
            reached terminal 0.14285714285714285 [ 6 ]
            (see prov 0,5 has 0.85 or 0.28)

            what should I do in this case? 
            */
            
            if(Object.keys(node.inputs).length) for(const inputId in node.inputs) {
                const inputs = node.inputs[inputId];
                if(inputs.length) {
                    walk(inputs, condprob, nodeProvs);
                }
            } else {
                //reached the terminal node.. save the probability for each provIndices
                console.log("reached terminal", condprob, node.provs);
                probs.push({prob: condprob, provs: node.provs})
            }
        });
    }
    walk(cnodes);

    //sort the probs
    probs.sort((a,b)=>{
        if(a.prob < b.prob) return 1;
        if(a.prob > b.prob) return -1;
        return 0;
    });

    return probs; 
}


