<template>
<div class="life">
    <table class="im_a_table">
        <tr>
            <td><div ref="plot"></div></td>
            <td><div ref="w"></div></td>
        </tr>
    </table>
    <!--<img :src="testurl" width="100%" />-->
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
            plot_life_w_title: null
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
                xaxis: {title: 'beta weight' /*w.x.label*/}, //TODO - life.m is currently wrong
                yaxis: {title: w.y.label},
                margin: {t: 0, b: 35, r: 0},
            });
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
.life {
}
</style>
