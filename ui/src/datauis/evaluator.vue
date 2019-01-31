<template>
<div class="evaluator">
    <!-- TODO - show rmse / nnz?-->
    <div ref="plot" style="height: 100%;"></div>
</div>
</template>

<script>
import Vue from 'vue'

//TODO - maybe I should use vue-plotly?
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
            rmse: null,
            nnz: null,
        }
    },
    created() {
        var basepath = "";
        if(this.subdir) basepath +=this.subdir+"/";
        var url = Vue.config.wf_api+'/task/download/'+this.task._id+
            '?p='+encodeURIComponent(basepath+'out.json')+
            '&at='+Vue.config.jwt;
        this.$http.get(url).then(res=>{
            //console.dir(res.data);
            this.nnz = res.data.nnz;
            this.rmse = res.data.rmse;
            var ref = res.data.reference;
    
            //organize out.json into dataformat that plotly likes
            var data = [];
            var gid = 0;
            ["HCP3T", "STN", "HCP7T"].forEach(group=>{
                var subgid = 0;
                ["Subj1", "Subj2", "Subj3", "Subj4"].forEach(subgroup=>{
                    data.push({
                        mode: 'markers',
                        name: group+' - '+subgroup,
                        x: ref.rmse[gid].mean[subgid],
                        y: ref.nnz[gid].mean[subgid],
                        error_x: {
                            array: ref.rmse[gid].std[subgid],
                            thickness: 0.5,
                            width: 1,
                        },
                        error_y: {
                            array: ref.nnz[gid].std[subgid],
                            thickness: 0.5,
                            width: 1,
                        },
                        marker: {
                            sizemode: 'area',
                            size: 10, 
                            opacity: 0.25,
                            color: 'hsl('+gid*60+', '+(100-(subgid*25+25))+'%, 30%)',
                        }
                    });
                    subgid++;
                });
                gid++;
            });

            data.push({
                mode: 'markers',
                name: 'Your Data',
                x: [this.rmse],
                y: [this.nnz],
                marker: {
                    sizemode: 'area',
                    size: 20, 
                    opacity: 0.9,
                    color: '#008cba',
                }
            });

            this.plot(data);
        });
    },

    mounted() {
    },

    methods: {
        plot: function(data) {
            Plotly.plot(this.$refs.plot, data, {
                xaxis: {title: "Connectome Error (r.m.s.e.)"},
                yaxis: {title: "Fascicles Number"},
                margin: {t: 20, l: 50, b: 35}, //, l: 30, r:10, b:30},
                background: '#f00',
            });
            this.resize();
            $(window).on('resize', this.resize);
        },

        resize: function() {
            Plotly.relayout(this.$refs.plot, {width: this.$refs.plot.clientWidth, height: this.$refs.plot.clientHeight});
        }    
    },
}
</script>

<style scoped>
.evaluator {
}
</style>

