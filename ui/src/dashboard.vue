<template>
<div>
    <sidemenu active="/dashboard"></sidemenu>
    <div class="page-content">
        <h5>New Members</h5>
        <small>Please say hi to these members!</small>
        {{recent_users}}

        <h5>Resources</h5>
        <small>This graph shows number of jobs executed on resources that you have access to</small>
        <!--
        <b-row v-for="resource in resources" :key="resource._id">
            <b-col cols="6">
                <statusicon :status="resource.status"/>
                {{resource.name}}<br>
                <small>{{resource.status_msg}}</small>
                <small>{{resource.config.desc}}</small>
            </b-col>
            <b-col cols="6">
                <resourcegraph :id="resource._id"/>
            </b-col>
        </b-row>
        -->
        <div ref="resource_vis"/>
    </div><!--page-content-->
</div>
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import statusicon from '@/components/statusicon'

import vis from 'vis/dist/vis.min.js'
import 'vis/dist/vis.min.css'

export default {
    components: { 
        sidemenu, 
        pageheader, 
        statusicon,
        vis,
    },

    data () {
        return {
            recent_users: [],
            resources: null,
            config: Vue.config,
        }
    },

    mounted() {
        console.log("loading resources");
        let find = JSON.stringify({
            status: {$ne: "removed"},
            active: true,
        });
        this.$http.get(Vue.config.amaretti_api+'/resource', {params: {find}}).then(res=>{
            this.resources = res.data.resources;
            this.update_resource_vis();
        }).catch(console.error);

        /*
        find = JSON.stringify({
        });
        this.$http.get(Vue.config.auth_api, {params: {find}}).then(res=>{
            this.resources = res.data.resources;
            this.update_resource_vis();
        }).catch(console.error);
        */

    },

    methods: {
        async update_resource_vis() {
            var groups = new vis.DataSet();
            let gid = 0;
            let items = [];
            //let min_time = null;
            //let max_time = null;
            for(let gid = 0; gid < this.resources.length;++gid) {
                let resource = this.resources[gid];
                groups.add({
                    id: gid,
                    content: resource.name,
                    options: {
                        shaded: {
                            orientation: 'bottom'
                        }
                    }
                });
                let res = await this.$http.get(Vue.config.amaretti_api+'/resource/'+resource._id+'/metrics');
                res.data.forEach(d=>{
                    let count = d[0];
                    let time = d[1]*1000;
                    //if(min_time === null || min_time > time) min_time = time;
                    //if(max_time === null || max_time < time) max_time = time;
                    items.push({
                        y: count,
                        x: time,
                        group: gid,
                    });   
                });
            }
            let dataset = new vis.DataSet(items);
            let graph2d = new vis.Graph2d(this.$refs.resource_vis, dataset, groups, {
                drawPoints: false,
                legend: true,
                //start: min_time,
                //end: max_time,
            });
        },
    },
}
</script>

<style scoped>
.page-content {
padding: 10px;
top: 0px;
}
</style>
