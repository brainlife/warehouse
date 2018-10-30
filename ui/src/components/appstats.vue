<template>
<div class="appstats" v-if="info">
<b-row>
    <b-col cols="2">
        <center>
            <p class="header">Created</p>
            <span class="stat">{{new Date(create_date).toLocaleDateString()}}</span>
        </center>
    </b-col>
    <b-col cols="2">
        <center>
            <p class="header">Status</p>
            <statustag status="ok"/>
        </center>
    </b-col>
    <b-col cols="2" v-b-tooltip.hover title="Number of time this App was requested.">
        <center>
            <span class="stat">{{info.counts.requested||0}}</span>
            <p class="header">Total&nbsp;Runs</p>
        </center>
    </b-col>
    <b-col cols="2" v-b-tooltip.hover title="Number of unique users who ran this App.">
        <center>
            <span class="stat">{{info.users}}</span>
            <p class="header">Users</p>
        </center>
    </b-col>
    <b-col cols="2" v-b-tooltip.hover title="finished/(failed+finished). Same request could be re-submitted / rerun.">
        <center>
            <span class="stat" :class="success_rate_color">{{info.success_rate.toFixed(1)}}%</span>
            <p class="header">Success&nbsp;Rate</p>
        </center>
    </b-col>
    <!-- 
    <b-col cols="2">
        <center>
            <span class="stat">{{info.stars}}</span>
            <p class="header">Github Stars</p>
        </center>
    </b-col>
    -->
    <b-col cols="2">
        <center>
            <span class="stat">{{Math.round(info.runtime_mean/(1000*60))}}
                <small style="opacity: 0.8">(&plusmn;{{Math.round(info.runtime_std/(1000*60))}})</small>
                mins
            </span>
            <p class="header">Runtime</p>
        </center>
    </b-col>
</b-row>
</div>
</template>

<script>
import Vue from 'vue'
import statustag from '@/components/statustag'

export default {
    props: ['info', 'create_date'],
    components: { statustag },
    data() {
        return {}
    },

    computed: {
        success_rate_color: function() {
            if(this.info.success_rate < 50) return "text-danger"; 
            if(this.info.success_rate < 80) return "text-warning"; 
            if(this.info.success_rate < 95) return "text-secondary"; 
            return "text-success"; 
        },
    },
}
</script>

<style scoped>
.appstats {
font-size: 90%;
color: #555;
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
