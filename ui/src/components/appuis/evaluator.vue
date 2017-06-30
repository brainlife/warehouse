<template>
<div class="evaluator">
    <h4 class="title">Pie</h4>
    <div ref="pie"></div>
</div>
</template>

<script>
import Vue from 'vue'

//trying to load the entire plotly will cause build to fail
//bad> import Plotly from 'plotly.js' 
//Only load component you actually use
var Plotly = require('plotly.js/lib/core');
Plotly.register([
    require('plotly.js/lib/pie')
]);

export default {
    props: ['task', 'subdir'],
    data() {
        return {
            testurl: null,
        }
    },
    created() {
        //fetch data (construct /resource/download and do $http.get() to load any data
        /*
        var basepath = this.task.instance_id+'/'+this.task._id;
        if(this.subdir) basepath +='/'+this.subdir;
        this.testurl = Vue.config.wf_api+'/resource/download'+
            '?r='+this.task.resource_id+
            '&p='+encodeURIComponent(basepath+'/output.json')+
            '&at='+Vue.config.jwt;
        */
    },
    mounted() {
        Plotly.plot(this.$refs.pie,
        //pass data to draw..
        [
            {
                values: [19, 26, 55],
                labels: ['Residential', 'Non-Residential', 'Utility'],
                type: 'pie'
            }
        ], 
        //options for plot.ly
        {
            autosize: true,
            margin: { t: 0, l: 0, b: 0, r: 0 }
        }
        );
    },
}
</script>

<style scopes>
.evaluator{
}
</style>
