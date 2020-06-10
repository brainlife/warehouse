<template>
<div>
    <div v-if="stats" style="padding:10px">
        Fibers with non-0 evidence <b>{{stats.non0_tracks.toLocaleString()}}</b> 
        out of <b>{{stats.input_tracks.toLocaleString()}}</b> total tracks
        <b-progress :value="Math.round(stats.non0_tracks/stats.input_tracks*10000)/100" show-progress></b-progress>
        <p class="help-block">* Should be around 20-30% range.</p>
    </div>
    <div style="width: 50%; float: left;" ref="plot"/>
    <div style="width: 50%; float: right;" ref="w"/>
</div>
</template>

<script>
import Vue from 'vue'

//TODO - why can't I just use vue-plotly for this?
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
        var basepath = "";
        if(this.subdir) basepath+=this.subdir+"/";
        this.url = Vue.config.wf_api+'/task/download/'+this.task._id+'/'+basepath+'life_results.json'+'?at='+Vue.config.jwt;
        this.$http.get(this.url)
        .then(res=>{
            var rmse = res.data.out.plot[0];
            var w = res.data.out.plot[1];
            this.stats = res.data.out.stats;
            
            Plotly.plot(this.$refs.plot, [{
                x: rmse.x.vals,
                y: rmse.y.vals,
            }], {
                //show "good" area
                shapes: [
                    {
                      "fillcolor": "rgba(63, 181, 81, 0.1)", 
                      "line": {"width": 0}, 
                      "type": "rect", 
                      "x0": 50,
                      "x1": 200,
                      "xref": "x", 
                      "y0": 0, 
                      "y1": 1, 
                      "yref": "paper"
                    }, 
                ],
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
            Plotly.relayout(this.$refs.plot, {width: this.$refs.plot.clientWidth});
            Plotly.relayout(this.$refs.w, {width: this.$refs.w.clientWidth});
        }    
    }
}
</script>
