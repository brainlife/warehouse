<template>
<div>
    <pageheader/>
    <sidemenu active="/apps"></sidemenu>
    <div class="page-content">
        <div ref="vis" class="graph"/>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'

import vis from 'vis/dist/vis-network.min.js'
import 'vis/dist/vis-network.min.css'

export default {
    components: { sidemenu, pageheader },
    data () {
        return {
            graph: null,
            config: Vue.config,
        }
    },

    created: function() {
        this.$http.get('app', {params: {
            find: JSON.stringify({
                $or: [
                    { removed: false },
                    { removed: {$exists: false }},
                ]
            }),
            populate: 'inputs.datatype outputs.datatype contributors',
        }})
        .then(res=>{
            this.init_vis(res.body.apps);
        }, res=>{
            console.error(res);
        });
    },

    methods: {
        init_vis: function(apps) {
            console.log("initializing");
            var nodes = [];
            var edges = [];
            var datatype_nodes = {};
            function add_datatype_node(io) {
                if(datatype_nodes[io.datatype._id]) return; //already registered
                var hash = io.datatype.name.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
                var numhash = Math.abs(hash+120)%360;
                var color = "hsl("+(numhash%360)+", 50%, 60%)"
                var node = {
                    id: io.datatype._id, 
                    shape: "box", 
                    label: io.datatype.name, color, 
                    font: {size: 11, color: "#fff"}, 
                    margin: 10
                }
                datatype_nodes[node.id] = node;
                nodes.push(node);
            }

            apps.forEach(app=>{
                nodes.push({id: app._id, shape: "box", label: app.name, color: "#fff", font: {size: 11}, margin: 10}); 
                app.inputs.forEach(input=>{
                    if(!input.datatype) return;
                    add_datatype_node(input);
                    edges.push({from: input.datatype._id, to: app._id, arrows: "to"});
                });
                app.outputs.forEach(output=>{
                    if(!output.datatype) return;
                    add_datatype_node(output);
                    edges.push({from: app._id, to: output.datatype._id, arrows: "to"});
                });
            });

            var graph = new vis.Network(this.$refs.vis, {
                nodes: new vis.DataSet(nodes), 
                edges: new vis.DataSet(edges),
            }, {
                /*
                layout: {
                hierarchical: {
                    direction:"LR",
                    levelSeparation: 100,
                    sortMethod: "hubsize",
                }
                },
                */
                //physics:{barnesHut:{/*gravitationalConstant:-3500, springConstant: 0.01, avoidOverlap: 0.02*/}},
                /*
                physics:{
                    barnesHut:{
                        gravitationalConstant: -6000,
                    }
                },
                */

                nodes: {
                    shadow: true,
                    borderWidth: 0,
                },
            });
        },
    },
}
</script>

<style scoped>
.graph {
position: fixed;
top: 50px;
left: 90px;
right: 0px;
bottom: 0px;
background-color: #333;
}
</style>

