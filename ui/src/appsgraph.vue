<template>
<div>
    <div class="page-content">
        <div ref="vis" class="graph"/>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import pageheader from '@/components/pageheader'

const getVis = ()=>import('vis/dist/vis-network.min')
import 'vis/dist/vis-network.min.css'

export default {
    components: { pageheader },
    data () {
        return {
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
            limit: 500, //TODO - this is not sustailable
        }})
        .then(res=>{
            this.init_vis(res.data.apps);
        }, res=>{
            console.error(res);
        });
    },

    methods: {

        hash: function(str) {
            return str.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
        },

        dtid: function(datatype, datatype_tags) {
            var key = datatype._id;
            datatype_tags.forEach(tag=>{
                key += tag;
            });
            return this.hash(key);
        },

        init_vis: function(apps) {
            var $it = this;

            var nodes = [];
            var edges = [];
            var datatype_nodes = {};
            function add_datatype_node(io) {
                io.datatype_tags = io.datatype_tags.filter(tag=>{ return (tag[0] != '!') });
                var dtid = $it.dtid(io.datatype, io.datatype_tags);
                if(datatype_nodes[dtid]) return dtid; //already registered
                var hash = $it.hash(io.datatype.name);
                var numhash = Math.abs(hash+120)%360;
                var color = "hsl("+(numhash%360)+", 50%, 60%)"
                var node = {
                    id: dtid,
                    shape: "box", 
                    label: io.datatype.name, color, 
                    font: {size: 11, color: "#fff"}, 
                    margin: 10
                }
                if(io.datatype_tags.length > 0) {
                    node.label += " : " + io.datatype_tags.join(" ");
                }
                datatype_nodes[dtid] = node;
                nodes.push(node);
                return dtid;
            }

            apps.forEach(app=>{
                nodes.push({id: app._id, shape: "box", label: app.name, color: "#fff", font: {size: 11}, margin: 10}); 

                var dtids = [];
                app.inputs.forEach(input=>{
                    if(!input.datatype) return;
                    var dtid = add_datatype_node(input);
                    if(!~dtids.indexOf(dtid)) {
                        dtids.push(dtid);
                        edges.push({from: dtid, to: app._id, arrows: "to"});
                    }
                });

                dtids = [];
                app.outputs.forEach(output=>{
                    if(!output.datatype) return;
                    var dtid = add_datatype_node(output);
                    if(!~dtids.indexOf(dtid)) {
                        dtids.push(dtid);
                        edges.push({from: app._id, to: dtid, arrows: "to"});
                    }
                });
            });

            getVis().then(vis=>{
                new vis.Network(this.$refs.vis, {
                    nodes: new vis.DataSet(nodes), 
                    edges: new vis.DataSet(edges),
                }, {
                    layout: {  
                        improvedLayout: false,
                    },
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
            });
        },
    },
}
</script>

<style scoped>
.graph {
background-color: #ccc;
position: fixed;
top: 0px;
bottom: 0px;
width: 100%;
}
</style>

