<template>
<div class="appstats" v-if="app.stats">
<b-row>
    <b-col cols="2">
        <center>
            <p class="header">Since</p>
            <span class="stat">{{new Date(app.create_date).toLocaleDateString()}}</span>
        </center>
    </b-col>
    <b-col cols="2">
        <center>
            <p class="header">Status</p>
            <!-- TODO load from test status once we have it setup -->
            <statustag status="ok"/>
        </center>
    </b-col>


    <!--service stats (TODO - I should cache this on each app so that I don't have to load this separately)-->
    <!--
    <b-col cols="6">
        <center style="opacity: 0.3; padding-top: 10px;"><b>&nbsp;&nbsp;&nbsp;<icon name="cog" spin/> Loading..&nbsp;&nbsp;&nbsp;</b></center>
    </b-col>
    -->
    <b-col cols="2" v-b-tooltip.hover title="Number of time this App was requested.">
        <center>
            <span class="stat">{{app.stats.service.counts.requested||0}}</span>
            <p class="header">Total&nbsp;Runs</p>
        </center>
    </b-col>
    <b-col cols="2" v-b-tooltip.hover title="Number of unique users who ran this App.">
        <center>
            <span class="stat">{{app.stats.service.users}}</span>
            <p class="header">Users</p>
        </center>
    </b-col>
    <b-col cols="2" v-b-tooltip.hover title="finished/(failed+finished). Same request could be re-submitted / rerun.">
        <center>
            <span class="stat" :class="success_rate_color">{{app.stats.success_rate.toFixed(1)}}%</span>
            <p class="header">Success&nbsp;Rate</p>
        </center>
    </b-col>
    <b-col cols="2">
        <center>
            <!--
            <gh-btns-star :slug="app.github" show-count></gh-btns-star>
            -->
            <span class="stat">{{app.stats.stars}}</span>
            <p class="header">Github Stars</p>
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

//import 'vue-github-buttons/dist/vue-github-buttons.css'; // Stylesheet
//import VueGitHubButtons from 'vue-github-buttons'; // Component plugin
//Vue.use(VueGitHubButtons, { useCache: true });

export default {
    props: ['app'],
    components: { statustag },
    data() {
        return {
            //stats: {},
        }
    },

    mounted: function() {
        /*
        //then load task stats
        this.$http.get(Vue.config.wf_api+'/task/stats', {params: {
            service: this.app.github, 
            //service_branch: this.app.github_branch, //group by branch to pull *recent* info
        }}).then(res=>{
            this.stats = res.body;  
            conso.e.dir(res.body);
        });
        */
    },

    computed: {
        /*
        success_rate: function() {
            console.log("calculating success rate", this.app.stats)
            if(!this.app.stats.service.counts) return 0;
            var finished = this.app.stats.service.counts.finished||0;
            var failed = this.app.stats.service.counts.failed||1;   
            return ((finished / (failed+finished))*100).toFixed(1);
        },
        */
        success_rate_color: function() {
            if(this.app.stats.success_rate < 50) return "text-danger"; 
            if(this.app.stats.success_rate < 80) return "text-warning"; 
            if(this.app.stats.success_rate < 95) return "text-secondary"; 
            return "text-success"; 
        },
    },

    methods: {
    } 
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
