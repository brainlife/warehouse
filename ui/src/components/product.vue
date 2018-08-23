<template>
<div v-if="product">
    <div v-for="alert in alerts">
        <b-alert v-if="alert.type == 'error'" variant="danger" show>{{alert.msg}}</b-alert>
        <b-alert v-else-if="alert.type == 'info'" variant="secondary" show>{{alert.msg}}</b-alert>
        <b-alert v-else-if="alert.type == 'danger'" variant="danger" show>{{alert.msg}}</b-alert>
        <b-alert v-else-if="alert.type == 'warning'" variant="warning" show>{{alert.msg}}</b-alert>
        <b-alert v-else-if="alert.type == 'success'" variant="success" show>{{alert.msg}}</b-alert>
        <div v-else>
            <b-alert show variant="danger">Unknown brainlife product type</b-alert>
            <pre v-if="Object.keys(other_product).length != 0" v-highlightjs="JSON.stringify(other_product, null, 4)" style="max-height: 150px;"><code class="json hljs"></code></pre>
        </div>
    </div>
    <b-tabs class="brainlife-tab" v-model="tab">
        <b-tab v-for="(p, $idx) in plots" :title="p.name||$idx" :key="$idx">
            <vue-plotly :data="p.data" :layout="p.layout" :options="p.options" ref="plotrefs" :autoResize="true"/>
        </b-tab>
        <b-tab title="JSON" v-if="Object.keys(others).length > 0">
            <pre v-highlightjs="JSON.stringify(others, null, 4)" style="max-height: 150px;"><code class="json hljs"></code></pre>
        </b-tab>
    </b-tabs>
</div>
</template>

<script>

import Vue from 'vue'
import VuePlotly from '@statnett/vue-plotly'

export default {
    props: ['product'],

    components: {
        VuePlotly,
    },

    data() {
        return {
            config: Vue.config,
            tab: null,
        }
    },
    
    computed: {
        other_product() {
            let all = Object.assign({}, this.product);
            delete all.brainlife;
            return all;
        },
        alerts() {
            if(!this.product.brainlife) return [];
            return this.product.brainlife.filter(p=>p.type != 'plotly'); //hacky..
        },
        plots() {
            if(!this.product.brainlife) return [];
            return this.product.brainlife.filter(p=>p.type == 'plotly');
        },
        others() {
            let others = Object.assign({}, this.product);
            delete others.brainlife;
            return others;
        },
    },
    mounted() {
        if(!this.product) return;
        if(!this.product.brainlife) return;

        //add svg export button on plotly plots
        this.product.brainlife.forEach((p, idx)=>{
            if(p.type != 'plotly') return;
            if(p._svg_added) return;
            p._svg_added = true;
            if(!p.options) p.options = {};
            if(!p.options.modeBarButtonsToAdd) p.options.modeBarButtonsToAdd = [];
            p.options.modeBarButtonsToAdd.push({
                name: 'SVG',

                //TODO - I should find a better logo for svg export
                icon: {
                  'width': 1792,
                  'path': 'M1344 1344q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm256 0q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128-224v320q0 40-28 68t-68 28h-1472q-40 0-68-28t-28-68v-320q0-40 28-68t68-28h465l135 136q58 56 136 56t136-56l136-136h464q40 0 68 28t28 68zm-325-569q17 41-14 70l-448 448q-18 19-45 19t-45-19l-448-448q-31-29-14-70 17-39 59-39h256v-448q0-26 19-45t45-19h256q26 0 45 19t19 45v448h256q42 0 59 39z',
                'ascent': 1792,
                'descent': 0,
                },
                click: ()=>{
                    let plot = this.$refs.plotrefs[this.tab];
                    plot.downloadImage({format: 'svg', height: plot.$el.clientHeight, width: plot.$el.clientWidth});
                }
            });
        });
    },
    watch: {
        tab() {
            this.$nextTick(()=>{
                if(!this.$refs.plotrefs) return; //console.log("plotrefs not set (yet?)");
                let p = this.$refs.plotrefs[this.tab];
                if(p) p.newPlot(); //this causes it to be resized
            });
        },
    },
}

</script>
