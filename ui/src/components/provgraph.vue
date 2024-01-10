<template>
<div ref="prov"/>
</template>

<script>
import Vue from 'vue'

const getVis = ()=>import('vis/dist/vis-network.min')
import 'vis/dist/vis-network.min.css'

export default {
    //components: { provgraph },
    props: {
        prov: Object,
        showFull: Boolean,

        //if you want to highlight an output as "This Data-Object", set this
        dataset: Object,

        //if you want to highlight the app as "This App", set this
        appid: String,

        //if you want to highlight specific task as "This Task", set this
        taskid: String,
    },

    data() {
        return {
            //gph: null, //dragging stops working if I store this with vue
        }
    },

    watch: {
        showFull() {
            this.load();
        },
        prov() {
            console.log("prov updated.. reloading");
            this.load();
        },
    },

    mounted() {
        this.load();
    },

    methods: {
        load() {
            //debug
            console.log("provgraph");
            console.dir(this.prov); 

            let hideSimplified = true;
            let hideShortcut = false;
            if(this.showFull) {
                hideSimplified = false;
            }

            let datasetTaskId = null;
            let datasetOutputId = null;
            if(this.dataset && this.dataset.prov) {
                datasetTaskId = this.dataset.prov.task_id || this.dataset.prov.task._id;
                datasetOutputId = this.dataset.prov.output_id; 
            }

            //need to reset in case use toggles showFull
            this.prov.edges.forEach(edge=>{
                edge._hide = false;
            });
            this.prov.nodes.forEach(node=>{
                node._hide = false;
            });

            //hide dangling output except for "this"
            this.prov.edges.forEach(edge=>{
                const node = this.prov.nodes[edge.to];

                if(node._taskId == datasetTaskId && node.outputId == datasetOutputId) {
                    //keep the "this data-object"
                } else {
                    //hide if there are no children
                    const next = this.prov.edges.find(next=>(edge.to == next.from));
                    if(!next && hideSimplified) {
                        edge._hide = true;
                        node._hide = true;
                    }
                }
            });

            if(hideSimplified) {
                //hide simplifiedNodes / edges
                this.prov.edges.filter(edge=>edge._simplified).forEach(edge=>{
                    edge._hide = true;
                });
                this.prov.nodes.filter(node=>node._simplified).forEach(node=>{
                    node._hide = true;
                });
                //hide irrelevant nodes
                this.prov.nodes.filter(node=>!node._important).forEach(node=>{
                    node._hide = true;
                });
            } 
            if(hideShortcut) {
                this.prov.edges.filter(edge=>edge._shortcutEdges).forEach(edge=>{
                    edge._hide = true;
                });
            }
            if(!hideSimplified && !hideShortcut) {
                //hide shortcuts that are itself is simplified
                this.prov.edges.filter(edge=>(edge._shortcutEdges&&edge._simplified)).forEach(edge=>{
                    edge._hide = true;
                });
            }

            //apply styles
            const graphNodes = [];
            const graphEdges = [];
            this.prov.nodes.forEach(node=>{
                if(node._hide) return;
                const graphNode = {
                    shape: "box",
                    id: node.idx,
                    font: {
                       size: 12,
                       color: "#333",
                    },
                    color: "#fff",
                }

                switch(node.type) {
                case "task":
                    if(this.appid && node.appId == this.appid) {
                        graphNode.label = "This App";
                        graphNode.color = "#2693ff";
                        graphNode.font.color = "#fff";
                        graphNode.x = 2000;
                        graphNode.y = 3000;

                        delete node._config; //hide config parameter used by "This app"
                    } else if(this.taskid && node.taskId == this.taskid) {
                        graphNode.label = "This Task";
                        graphNode.color = "#2693ff";
                        graphNode.font.color = "#fff";
                        graphNode.x = 2000;
                        graphNode.y = 3000;
                    } else {
                        graphNode.label = "";
                        //if(node.name) graphNode.label += node.name+"\n"; //gets too long
                        if(node.service == "brainlife/app-noop") {
                            //don't show "app-noop" service name..
                            graphNode.label += "noop";
                        } else {
                            let service = node.service;
                            if(service.startsWith("brainlife/")) service = service.substring(10);
                            if(service.startsWith("brain-life/")) service = service.substring(11);
                            graphNode.label += service;
                            if(node.serviceBranch && node.serviceBranch != "master") graphNode.label += ":"+node.serviceBranch;
                        }
                    }
                    if(node.runtime) graphNode.label += "\n"+(node.runtime/(1000*60)).toFixed(2)+" mins\n";
                    break;

                case "dataset":
                    graphNode.color = "#159957";
                    graphNode.font.color = "#fff";
                    graphNode.label = "";
                    if(node.project) graphNode.label += node.project.name+"\n";
                    if(node.meta) {
                        if(node.meta.subject) graphNode.label += "sub-"+node.meta.subject;
                        if(node.meta.session) graphNode.label += " / ses-"+node.meta.session;
                        if(node.meta.run) graphNode.label += " / run-"+node.meta.run;
                        graphNode.label += "\n";
                    }

                    graphNode.label += node.datatype.name; 
                    if(node.datatypeTags && node.datatypeTags.length) graphNode.label += " "+node.datatypeTags.map(t=>"<"+t+">").join(" ");
                    if(node.tags && node.tags.length) graphNode.label += "\n("+node.tags.join()+")";
                    graphNode.label+="\n";

                    if(node.storage == "copy") {
                        graphNode.label = "(copy) "+graphNode.label;
                        graphNode.color = {
                            border: "#159957",
                            background: "#fff",
                        }
                        graphNode.borderWidth = 1;
                        graphNode.font.color = "#159957";
                    } else {
                        //attach source node
                        if(node.storage) {
                            const storageNode = {
                                shape: "box",
                                id: graphNode.id+".storage",
                                font: {
                                    size: 10,
                                    color: "#fff",
                                },
                                color: "#999",
                                label: node.storage,
                            }
                            if(node.storageLocation) storageNode.label += "\n"+node.storageLocation;
                            graphNodes.push(storageNode);
                            graphEdges.push({
                                arrows: "to", 
                                from: storageNode.id, 
                                to: graphNode.id, 
                                //label: "Upload\n("+node.name+")",
                                //font: { size: 10, color: '#000a'}
                            })
                        }
                    }

                    break;

                case "output":
                    graphNode.color = "#ff9957";
                    graphNode.font = {size: 10, color: "#fff"};
                    if(node._taskId == datasetTaskId && node.outputId == datasetOutputId) {
                        graphNode.label = "This Data-Object";
                        graphNode.color = "#2693ff";
                        //graphNode.margin = 10;
                        graphNode.font.color = "#fff";
                        graphNode.font.size = 12;
                        graphNode.x = 2000;
                        graphNode.y = 3000;
                    } else {
                        graphNode.label = node.outputId+"\n";
                        graphNode.label += node.datatype.name;
                        if(node.datatypeTags && node.datatypeTags.length) graphNode.label += " "+node.datatypeTags.map(t=>"<"+t+">").join(" ");
                        if(node.tags && node.tags.length) graphNode.label += "\n("+node.tags.join()+")";
                    }
                    graphNode.label += "\n";
                }

                if(node._simplified && !hideSimplified) {
                    graphNode.font.size -= 5;
                }

                //construct tooltip
                let tooltip = "";
                if(node.name) tooltip += node.name+"<br>";
                let service = "";
                if(node.service) service += node.service;
                if(node.serviceBranch) service += ":"+node.serviceBranch;
                tooltip += "<pre>"+service+"</pre>";
                if(node.desc) tooltip += "<p>"+node.desc+"</p>";
                if(node._config) {
                    //node.label += "\n";
                    let recs = [];
                    for(let key in node._config) {
                        let conf = node._config[key];
                        if(typeof conf.v == "string" && conf.v.startsWith("../")) continue;
                        let rec = "";
                        rec += "<tr><td><pre>"+key+"</pre></td>";
                        if(conf.default !== undefined && conf.default == conf.v) {
                            rec+= "<td>"+conf.v+"</td>"
                        } else {
                            rec+= "<td><b>"+conf.v+"</b> (default: "+conf.default+")</td>"
                            //graphNode.label += key+":"+conf.v+"\n"; //could become too big
                        }
                        rec += "</tr>";
                        recs.push(rec);
                    }
                    if(recs.length > 0) {
                        tooltip += "<table class='table table-sm'>";
                        tooltip += recs.join("\n");
                        tooltip += "</table>";
                    }
                }
                if(node.datasetId) tooltip += "<p>datasetid:"+node.datasetId+"</p>";
                if(node.user) {
                    tooltip += "<p>"+node.user.fullname+" &lt;"+node.user.email+"&gt;</p>" ;
                } else if(node.userId) tooltip += "<p>userId:"+node.userId+"</p>";
                if(node._taskId) tooltip += "<p>taskId:"+node._taskId+"</p>";
                tooltip += "<p>idx:"+node.idx+" "+node.type+"</p>";
                graphNode.title = "<div>"+tooltip+"</div>";
                graphNodes.push(graphNode);
            });
            
            this.prov.edges.forEach(edge=>{
                if(edge._hide) return;

                const nodeFrom = this.prov.nodes[edge.from];
                const nodeTo = this.prov.nodes[edge.to];

                let label = "";
                
                switch(nodeTo.type) {
                case "output":
                    if(hideSimplified) {
                        label += nodeTo.datatype.name;
                        if(nodeTo.datatypeTags && nodeTo.datatypeTags.length) label += " "+nodeTo.datatypeTags.map(t=>"<"+t+">").join(" ");
                        if(nodeTo.tags && nodeTo.tags.length) label += "\n"+nodeTo.tags.join(",")
                        label += "\n";
                    }
                default:
                    //if it's not leading to output node, then I need to figure out myself
                    if(edge._dataset) {
                        if(nodeFrom.service == "brainlife/app-noop" || nodeFrom.service == "soichih/sca-service-noop") {
                            //I don't need to put datatype info on the edge if it's coming from upload
                        } else {
                            const dataset = this.prov.nodes[edge._dataset];
                            if(dataset.datasetId) label += "🟢 ";
                            label += dataset.datatype.name;
                            if(dataset.datatypeTags && dataset.datatypeTags.length) label += " "+dataset.datatypeTags.map(t=>"<"+t+">").join(" ");
                            if(dataset.tags && dataset.tags.length) label += "\n("+dataset.tags.join()+")";
                            label += "\n";
                        }
                    } else if(edge._output) {
                        if(nodeFrom.type != "dataset") {
                            const output = this.prov.nodes[edge._output];
                            label += output.datatype.name;
                            if(output.datatypeTags && output.datatypeTags.length) label += " "+output.datatypeTags.map(t=>"<"+t+"> ").join(" ");
                            if(output.tags && output.tags.length) label += "\n("+output.tags.join()+")";
                            label+="\n";
                        }
                    }
                    break;
                }

                //put from/to ids
                if(edge.outputId == "noop") delete edge.outputId;
                if(edge.outputId) label += "from "+edge.outputId;
                if(edge.inputId) {
                    if(edge.outputId) label += " ";
                    label += "to "+edge.inputId;
                }

                const graphEdge = {
                    label,
                    font: {
                        size: 8,
                        color: '#000a',
                    },
                    arrows: "to",
                    to: edge.to,
                    from: edge.from,
                    //color: '#ff0',
                    edgeIdx: edge.idx,
                }
    
                if(edge._simplified && !hideSimplified) {
                    graphEdge.font.size -= 7;
                }
                if(edge._shortcutEdges && !hideSimplified) {
                    graphEdge.dashes = true;
                }
                graphEdge.title = "(eidx:"+edge.idx+" "+edge.from+"-"+edge.to+")";
                if(edge._simplified) graphEdge.title += "(simplified)\n";
                if(edge._shortcutEdges) graphEdge.title += "\nshortcut:"+edge._shortcutEdges.join()+"\n";
                if(edge._dataset) {
                    const dataset = this.prov.nodes[edge._dataset];
                    if(dataset.datasetId) graphEdge.title += "archived as datasetid:"+dataset.datasetId+"\n";
                }
                graphEdges.push(graphEdge);
            })

            //modify provenance for UI purpose
            //handle terminal tasks differently
            graphNodes.forEach(gnode=>{
                const node = this.prov.nodes[gnode.id];
                if(!node) return; //maybe user/storage nodes
                const outputEdges = graphEdges.filter(e=>e.from == gnode.id);
                switch(node.service) {
                case "brainlife/app-noop":
                case "soichih/sca-service-noop":
                    //turn the task into "dataset", basically
                    gnode.color = "#159957";
                    gnode.font.color = "#fff";

                    outputEdges.splice(0).forEach(outputEdge=>{
                        const edge = this.prov.edges[outputEdge.edgeIdx];
                        const dataset = this.prov.nodes[edge._dataset];

                        if(!dataset) return;

                        gnode.label = "";
                        if(dataset.project) gnode.label += dataset.project.name+"\n";
                        if(dataset.meta) {
                            if(dataset.meta.subject) gnode.label += `sub-${dataset.meta.subject}`;
                            if(dataset.meta.session) gnode.label += ` / ses-${dataset.meta.session}`;
                            if(dataset.meta.run) gnode.label += ` / run-${dataset.meta.run}`;
                            gnode.label += '\n';
                        }
                        gnode.label += dataset.datatype.name; 
                        if(dataset.datatypeTags && dataset.datatypeTags.length) gnode.label += " "+dataset.datatypeTags.map(t=>"<"+t+">").join(" ");
                        if(dataset.tags && dataset.tags.length) gnode.label += "\n("+dataset.tags.join()+")";
                        if(dataset.datasetId) gnode.title += "<p>datasetId:"+dataset.datasetId+"</p>";
                        gnode.label += '\n';
                    });
                    
                    //add user node
                    if(node.user) {
                        const userNode = {
                            shape: "box",
                            id: gnode.id+".user",
                            font: {
                               size: 10,
                               color: "#fff",
                            },
                            color: "#999",
                            label: node.user.fullname,//+" <"+node.user.email+">",
                        }
                        //userNode.y = -2000;
                        graphNodes.push(userNode);
                        graphEdges.push({
                            arrows: "to", 
                            from: userNode.id, 
                            to: gnode.id, 
                            label: node.name,
                            font: { size: 10, color: '#000a'}
                        })
                    }
                    break;
                } 
            });

            graphEdges.forEach(gedge=>{
                const inputs = graphEdges.filter(e=>e.from == gedge.from);
                const outputs = graphEdges.filter(e=>e.to == gedge.to);
                gedge.length = 30*(inputs.length+outputs.length);
            })

            getVis().then(vis=>{
                const gph = new vis.Network(this.$refs.prov, {
                    nodes: graphNodes,
                    edges: graphEdges,
                }, {
                    layout: {
                        randomSeed: 0,
                    },
                    physics: {
                        barnesHut:{
                            //springLength: 300,
                            //springConstant: 0.04,
                            //avoidOverlap: 0.5,
                            //damping: 1.0,
                            gravitationalConstant: -4000,
                        }
                    },
                    nodes: {
                        shadow: {
                            enabled: true,
                            //make it less pronounced than default
                            size: 3,
                            x: 1,
                            y: 1 ,
                            color: 'rgba(0,0,0,0.2)',
                        },
                        borderWidth: 0,
                    },
                });
            });
        }

    },
}
</script>

<style scoped>
/deep/ .table-sm td {
    line-height: 150%;
    padding: 0 5px;
}
/deep/ .vis-tooltip {
    max-width: 500px;
}
/deep/ .vis-tooltip p {
    white-space: pre-wrap;
}
</style>
