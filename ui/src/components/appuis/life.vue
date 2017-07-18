<template>
<div class="life">
    <div v-if="stats">
        <p>
            Fibers with non-0 evidence <b>{{stats.non0_tracks.toLocaleString()}}</b> 
            out of <b>{{stats.input_tracks.toLocaleString()}}</b> total tracks
        </p>
        <el-progress :text-inside="true" :stroke-width="18" :percentage="(stats.non0_tracks/stats.input_tracks)*100" status="success"></el-progress>
    </div>
    <br>
    <el-row :gutter="10">
        <el-col :span="12">
            <div ref="plot" style="width: 100%;"/>
        </el-col>
        <el-col :span="12">
            <div ref="w" style="width: 100%;"/>
        </el-col>
    </el-row>
</div>
</template>

<script>
import Vue from 'vue'

var Plotly = require('plotly.js/lib/core');
Plotly.register([
    require('plotly.js/lib/histogram')
]);

export default {
    props: ['task', 'subdir'],
    data() {
        return {
            stats: null,
        }
    },
    mounted() {
        var basepath = this.task.instance_id+'/'+this.task._id;
        if(this.subdir) basepath +='/'+this.subdir;
        this.url = Vue.config.wf_api+'/resource/download'+
            '?r='+this.task.resource_id+
            '&p='+encodeURIComponent(basepath+'/life_results.json')+
            '&at='+Vue.config.jwt;
        this.$http.get(this.url)
        .then(res=>{
            var rmse = res.data.out.plot[0];
            var w = res.data.out.plot[1];
            this.stats = res.data.out.stats;
            
            Plotly.plot(this.$refs.plot, [{
                x: rmse.x.vals,
                y: rmse.y.vals,
            }], {
                xaxis: {title: rmse.x.label},
                yaxis: {title: rmse.y.label},
                //margin: {t: 0, b: 35, r: 0},
            });
            
            Plotly.plot(this.$refs.w, [{
                x: w.x.vals,
                y: w.y.vals,
            }], {
                xaxis: {title: 'beta weight' /*w.x.label*/}, //TODO - life.m is currently wrong
                yaxis: {title: w.y.label},
                //margin: {t: 0, b: 35, r: 0},
            });

            this.resize();
            $(window).on('resize', this.resize);
        });
    },

    methods: {
        resize: function() {
            Plotly.relayout(this.$refs.plot, {width: this.$refs.plot.clientWidth-30});
            Plotly.relayout(this.$refs.w, {width: this.$refs.w.clientWidth-30});
        }    
    }
}
</script>

<style scoped>
.life {
    margin: 10px;
}
</style>
