<template>
<div class="life">
    <table class="im_a_table">
        <tr>
            <td><div ref="plot"></div></td>
            <td><div ref="w"></div></td>
        </tr>
    </table>
    <el-card v-if="stats">
        <span style="">Fibers with non-0 evidence <b>{{stats.non0_tracks.toLocaleString()}}</b></span>
        <span style="float: right;">out of <b>{{stats.input_tracks.toLocaleString()}}</b> total tracks</span>
        <el-progress :text-inside="true" :stroke-width="18" :percentage="(stats.non0_tracks/stats.input_tracks)*100" status="success"></el-progress>
    </el-card>
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
            testurl: null,
            plot_life_rmse_title: null,
            plot_life_w_title: null,
            stats: null,
        }
    },
    mounted() {
        var basepath = this.task.instance_id+'/'+this.task._id;
        if(this.subdir) basepath +='/'+this.subdir;
        this.testurl = Vue.config.wf_api+'/resource/download'+
            '?r='+this.task.resource_id+
            '&p='+encodeURIComponent(basepath+'/life_results.json')+
            '&at='+Vue.config.jwt;
        
        this.$http.get(this.testurl)
        .then(res => {
            var rmse = res.data.out.plot[0];
            var w = res.data.out.plot[1];
            this.stats = res.data.out.stats;
            
            // don't think we need these for the vue implementation, right?
            this.plot_life_rmse_title = rmse.title;
            this.plot_life_w_title = w.title;
            
            Plotly.plot(this.$refs.plot, [{
                x: rmse.x.vals,
                y: rmse.y.vals,
                //y: rmse, 
                //type: 'histogram', 
                //marker: { color: 'blue', }
            }], {
                //title: rmse.title,
                height: 200,
                xaxis: {title: rmse.x.label},
                yaxis: {title: rmse.y.label},
                margin: {t: 0, b: 35, r: 0},
            });
            
            // (originally plot_life_w)
            Plotly.plot(this.$refs.w, [{
                x: w.x.vals,
                y: w.y.vals,
                //y: rmse, 
                //type: 'histogram', 
                //marker: { color: 'blue', }
            }], {
                //title: w.title,
                height: 200,
                xaxis: {title: 'beta weight' /*w.x.label*/}, //TODO - life.m is currently wrong
                yaxis: {title: w.y.label},
                margin: {t: 0, b: 35, r: 0},
            });

            /*
            Plotly.newPlot(this.$refs.stat, [
              {
                x: ['giraffes', 'orangutans', 'monkeys'],
                y: [20, 14, 23],
                type: 'bar',
              }
            ], {
                height: 100,
                orientation: 'h',
                margin: {t: 0, b: 35, r: 0},
            });
            */
        });
    }
}
</script>

<style scopes>
.im_a_table {
    width:100%;
}
.im_a_table td {
    width:50%;
}
</style>
