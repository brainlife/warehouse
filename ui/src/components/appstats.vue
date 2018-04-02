<template>
<div class="appstats">
<b-row>
    <b-col cols="2" style="border-right: 1px solid #ddd;">
        <center>
            <p class="header">Since</p>
            <span class="stat">{{new Date(app.create_date).toLocaleDateString()}}</span>
        </center>
    </b-col>
    <b-col cols="2" style="border-right: 1px solid #ddd;">
        <center>
            <p class="header">App&nbsp;Status</p>

            <!-- TODO load from test status once we have it setup -->
            <statustag status="ok"/>
        </center>
    </b-col>

    <b-col cols="2" v-if="app._rate">
        <center>
            <span class="stat">{{app._rate}}</span>
            <p class="header">User&nbsp;Rating</p>
        </center>
    </b-col>

    <!--service stats (TODO - I should cache this on each app so that I don't have to load this separately)-->
    <b-col cols="6" v-if="!service_stats"> 
        <h5 class="text-muted" style="margin-top: 5px;">&nbsp;&nbsp;&nbsp;<icon name="cog" spin/> Loading..&nbsp;&nbsp;&nbsp;</h5>
    </b-col>
    <b-col cols="2" v-if="service_stats">
        <center>
            <span class="stat">{{service_stats.tasks}}</span>
            <p class="header">Total&nbsp;Runs</p>
        </center>
    </b-col>
    <b-col cols="2" v-if="service_stats">
        <center>
            <span class="stat">{{service_stats.users}}</span>
            <p class="header">Users</p>
        </center>
    </b-col>
    <b-col cols="2" v-if="service_stats">
        <center>
            <span class="stat" :class="success_rate_color">{{success_rate}}%</span>
            <p class="header">Success&nbsp;Rate</p>
        </center>
    </b-col>


    <!--
    <b-col cols="3">
        <center>
            <span class="text-muted">Average User Rating</span>
            <br>
            <br>
            <el-rate v-model="rate" @change="ratechange()"></el-rate>
        </center>
    </b-col>
    -->
</b-row>
</div>
</template>

<script>
import Vue from 'vue'

import statustag from '@/components/statustag'

export default {
    props: ['app'],
    components: { statustag },
    data() {
        return {
            service_stats: null,
        }
    },

    mounted: function() {
        //then load task stats
        this.$http.get(Vue.config.wf_api+'/task/stats', {params: {
            service: this.app.github, 
            //service_branch: this.app.github_branch, //group by branch to pull *recent* info
        }}).then(res=>{
            this.service_stats = res.body;  
            
        });
    },

    computed: {
        success_rate: function() {
            if(!this.service_stats) return 0;
            var finished = this.service_stats.counts.finished||0;
            var requested = this.service_stats.counts.requested||1;
            return ((finished / requested)*100).toFixed(1);
        },
        success_rate_color: function() {
            if(this.success_rate < 50) return "text-danger"; 
            if(this.success_rate < 80) return "text-warning"; 
            if(this.success_rate < 95) return "text-secondary"; 
            return "text-success"; 
        },
    },

    methods: {
    } 
}
</script>

<style scoped>
.appstats {
padding: 5px;
background-color: #f0f0f0;
min-height: 50px;
width: 100%;
font-size: 90%;
color: #666;
}
.header {
opacity: 0.5;
text-transform: uppercase;
margin-bottom: 0px;
font-size: 90%;
}
.stat {
font-weight: bold;
}
</style>
