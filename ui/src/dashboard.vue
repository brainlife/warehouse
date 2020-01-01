<template>
<div>
    <!--inspiration
        https://dribbble.com/shots/1262299-Spear/attachments/172826
    -->
    <div class="page-content">
        <h5>New Members</h5>
        <small>The following members joined brainlife recently (in the last 60 days). Please say hi!</small>
        <br>
        <b-card-group columns>
            <b-card v-for="user in recent_users" :key="user.sub" no-body style="padding: 5px;">
                <img :src="avatar_url(user, 50)" style="float: left; padding-right: 15px;">
                <p>
                    <b>{{user.fullname}}</b><br>
                    <span v-if="user._profile">{{user._profile.institution}}</span>
                    <small v-if="user.email" >{{user.email}}</small>
                </p>
                <div slot="footer" v-if="user._profile && user._profile.bio">
                    <small v-if="" class="text-muted">{{user._profile.bio}}</small>
                </div>
            </b-card>
        </b-card-group>
        <br clear="both">
        <small style="float: right; margin-top: 10px;">{{recent_users.length}} users</small>
        <hr>

        <!--
        <h5>Resources</h5>
        <small>This graph shows number of jobs executed on resources that you have access to</small>
        <div ref="resource_vis"/>
        -->
    </div><!--page-content-->
</div>
</template>

<script>
import Vue from 'vue'
import pageheader from '@/components/pageheader'
import statusicon from '@/components/statusicon'
import contact from '@/components/contact'

import authprofilecache from '@/mixins/authprofilecache'

import vis from 'vis/dist/vis.min.js'
import 'vis/dist/vis.min.css'

const lib = require('@/lib'); //for avatar_url

export default {
    mixins: [authprofilecache],
    components: { 
        pageheader, 
        statusicon,
        contact,
        vis,
    },

    data () {
        return {
            recent_users: [],
            //resources: null,
            config: Vue.config,

        }
    },

    mounted() {
        /*
        console.log("loading resources");
        let find = JSON.stringify({
            status: {$ne: "removed"},
            active: true,
        });
        this.$http.get(Vue.config.amaretti_api+'/resource', {params: {find}}).then(res=>{
            this.resources = res.data.resources;
            this.update_resource_vis();
        }).catch(console.error);
        */

        /*
        //load recent users
        let recent = new Date();
        recent.setMonth(recent.getMonth()-2); 
        let where = {
            "times.register": {$gt: formatDateForMongo(recent)},
            email_confirmed: true,
        };
        */

        let days = 60;
        if(Vue.config.debug) days = 360;
        this.$http.get(Vue.config.auth_api+"/profile/recreg/"+days).then(res=>{
            this.recent_users = res.data.users;
        
            //load public profiles for each users
            this.recent_users.forEach(u=>{
                this.authprofilecache(u.sub, (err, profile)=>{
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
.recent_user {
border-top: 1px solid #eee; 
margin: 3px; 
padding: 3px;
margin-bottom: 10px;
/*
display: inline-block;
width: 40%;
float: left;
position: relative;
*/
}
</style>
