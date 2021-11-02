#!/usr/bin/env node
'use strict';

const fs = require('fs');


function countApps(prov, pnode, cnode) {

    //find all input edges
    prov.edges.filter(e=>(e.to == pnode.idx && !e._simplified)).forEach(edge=>{
        if(!edge.inputId) {
            //console.log("edge", edge, "doesn't have inputId set");
            return;
        } 
        /*
        if(!edge.outputId) {
            //console.log("edge", edge, "doesn't have outputId set");
            return;
        } 
        */

        const output = prov.nodes[edge._output];
        let datatype = null;
        if(output) datatype = output.datatype;

        const iid = datatype+":"+edge.inputId;

        if(!cnode.inputs[iid]) cnode.inputs[iid] = [];

        const input = prov.nodes[edge.from];
        const info = pullnodeinfo(input);

        let c = cnode.inputs[iid].find(a=>a.id == info.id);
        if(!c) {
            c = info;
            info.outputId = edge.outputId||null;

            //these will be just sample from the first task that matches the id
            /*
            info.datatypeTags = output.datatypeTags;
            info.config = input._config;
            */

            //add new app
            cnode.inputs[iid].push(info);
        }
        c.count++;

        //recurse into parent
        countApps(prov, input, c);
    });
}

function pullnodeinfo(pnode) {
    let id = pnode.service;
    if(pnode.serviceBranch) id+=":"+pnode.serviceBranch;
    return {
        id,
        appId: pnode.appId, 
        count: 0,
        //service: pnode.service, 
        //serviceBranch: pnode.serviceBranch, 
        inputs: {},
    }
}

function run(provs) {
    /*
    const counts = {
        nodes: [],
        edges: [],
    };
    */

    //create the root of count node
    const cnode = [];

    provs.forEach(prov=>{
        const pnode = provs[0].nodes[0];
        const info = pullnodeinfo(pnode);

        //see if we already have the app listed
        let c = cnode.find(a=>a.id == info.id);
        if(!c) {
            c = info;
            cnode.push(c);
        }
        c.count++;
        countApps(prov, pnode, c);
    });

    //console.log("------------ counts------------");
    //console.log(JSON.stringify(cnode, null, 4));
    return cnode;
}

console.log("loadingprovenance");
const provs = require('/home/hayashis//Documents/testdata/provenances/app-5cc9c6b44b5e4502275edb4b.provs.json');
//console.dir(provs);

const root = run(provs);
console.log("saving");
fs.writeFileSync("/tmp/count.5cc9c6b44b5e4502275edb4b.json", JSON.stringify(root, null, 4))


