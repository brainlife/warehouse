<template>
<b-container>
    <b-alert :show="provs && !provs.length" variant="secondary">Sorry, we couldn't find an example workflow.</b-alert>
    <br>
    <div v-if="provs && provs.length">
        <div style="position: relative; z-index: 1">
            <div style="float: right" v-if="config.hasRole('admin')">
                <b-button variant="outline-primary" :pressed.sync="showFull" size="sm">Show Full Provenance</b-button>
            </div>
            <b-nav pills small>
                <b-nav-item v-for="(prov, idx) in provs" :key="idx" :active="(idx == selected)" @click="selected = idx">
                    {{prov.nodes.length}} nodes (prob: {{(prov._prob*100).toFixed(0)}}%)
                </b-nav-item>
            </b-nav>
        </div>
        <provgraph :prov="provs[selected]" :appid="appid" :showFull="showFull" class="page-content" style="background-color: #eee;"/>
    </div>
</b-container>
</template>

<script>

import Vue from 'vue'
import provgraph from '@/components/provgraph'

export default {
    components: { provgraph },
    props: {
        appid: String,
    },

    data() {
        return {
            provs: null,
            showFull: false,
            selected: 0,

            config: Vue.config,
        }
    },

    mounted() {
        this.$http.get("app/example/"+this.appid).then(res=>{
            this.provs = res.data;
        }).catch(console.error);
    },

    methods: {
    },
}
</script>
