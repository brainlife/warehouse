<template>
<div>
    <sidemenu active="/dashboard"></sidemenu>
    <div class="page-content">
        <h5>New Members</h5>
        <small>Please say hi to these members!</small>
        <div v-for="user in recent_users" :key="user.sub" style="border-top: 1px solid #eee; margin: 5px; margin-bottom: 10px">
            <b-row>
                <b-col cols="2">
                    <img :src="avatar_url(user, 64)">
                </b-col>
                <b-col cols="3">
                    <b>{{user.fullname}}</b>
                    <div class="email" v-if="user.email">&lt;{{user.email}}&gt;</div>
                </b-col>
                <b-col>
                    <div v-if="user._profile">
                        <b>{{user._profile.institution}}</b>
                        <small>{{user._profile.bio||'no bio'}}</small>
                    </div>
                </b-col>
            </b-row>
        </div>

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
import contact from '@/components/contact'

import profilecache from '@/mixins/profilecache'

import vis from 'vis/dist/vis.min.js'
import 'vis/dist/vis.min.css'

const lib = require('@/lib'); //for avatar_url

export default {
    mixins: [profilecache],
    components: { 
        sidemenu, 
        pageheader, 
        statusicon,
        contact,
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

        //load recent users
        let last_3month = new Date();
        last_3month.setMonth(last_3month.getMonth()-3); 
        let where = {
            "times.register": {$gt: last_3month},
            email_confirmed: true,
        };

        if(Vue.config.debug) {
            where = {$or: [
                where, 
                {sub: 1} //pull soichi into the list to debug
            ]};
        }

        this.$http.get(Vue.config.auth_api+"/profile", {params: {where: JSON.stringify(where)}}).then(res=>{
            this.recent_users = res.data.profiles;
        
            //load public profiles for each users
            this.recent_users.forEach(u=>{
                this.profilecache(u.sub, (err, profile)=>{
                    //Vue.set(this.recent_users, '_profile', profile);
                    Vue.set(u, '_profile', profile);
                });
            });
        }).catch(console.error);
    },

    methods: {
        avatar_url: lib.avatar_url,

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
.email {
opacity: 0.8;
}
</style>
