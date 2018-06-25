<template>
<div v-if="product && product.brainlife">
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
    <b-tabs class="brainlife-tab" v-model="plotidx">
        <b-tab v-for="(p, $idx) in plots" :title="p.name||$idx" :key="$idx">
            <vue-plotly :data="p.data" :layout="p.layout" :options="p.options" ref="plotrefs" :autoResize="true"/>
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
            plotidx: null,
        }
    },
    computed: {
        other_product: function() {
            let all = Object.assign({}, this.product);
            delete all.brainlife; 
            return all;
        },
        alerts: function() {
            return this.product.brainlife.filter(p=>p.type != 'plotly'); //hacky..
        },
        plots: function() {
            return this.product.brainlife.filter(p=>p.type == 'plotly');
        },
    },
    methods: {
        /*
        log: function(evt) {
            console.log("autosize?");
            console.dir(evt);
        }
        */
    },
    watch: {
        plotidx: function() {
            //this resizes the graph, but somehow duplicates legend.. (waiting for it to be resolved)
            //https://github.com/statnett/vue-plotly/issues/6
            this.$nextTick(()=>{
                let p = this.$refs.plotrefs[this.plotidx];
                //if(p) p.relayout();
                if(p) p.newPlot();
            });
        },
    },
}

</script>
