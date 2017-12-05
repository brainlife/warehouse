<template>
<div style="padding: 10px;">
    <div v-if="stats">
        <b-row>
            <b-col cols="6">
                Fibers with non-0 evidence <b>{{stats.non0_tracks.toLocaleString()}}</b> 
                out of <b>{{stats.input_tracks.toLocaleString()}}</b> total tracks
            </b-col>
            <b-col>
                <b-progress :value="Math.round(stats.non0_tracks/stats.input_tracks*10000)/100" show-progress></b-progress>
                <p class="help-block">* Should be around 20-30% range.</p>
            </b-col>
        </b-row>
    </div>
    <br>
    <b-row>
        <b-col>
            <div ref="plot"/>
        </b-col>
        <b-col>
            <div ref="w"/>
        </b-col>
    </b-row>
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
                //margin: {t: 0, b: 0, r: 0, l: 0},
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
