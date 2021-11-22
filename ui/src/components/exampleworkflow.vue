<template>
<b-container>
    <b-alert :show="provs && !provs.length" variant="secondary">Sorry, we couldn't find an example workflow.</b-alert>
    <br>
    <div v-if="provs && provs.length">
        <div style="position: relative; z-index: 1">
            <div style="float: right">
                <b-button variant="outline-primary" :pressed.sync="showFull" size="sm">Show Full Provenance</b-button>
            </div>
            <b-nav pills small>
                <b-nav-item v-for="(prov, idx) in provs" :key="idx" :active="(idx == selected)" @click="selected = idx">{{prov.nodes.length}} nodes (prob: {{(prov._prob*100).toFixed(0)}}%)</b-nav-item>
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
    //mixins: [appcache],
    components: { provgraph },
    props: {
        appid: String,
    },

    /*
    watch: {
        appid() {
            if(this.appid) this.load_app();
        },
        app() {
            if(this.app) this.app_ = this.app;
        }
    },
    */

    data() {
        return {
            provs: null,
            showFull: false,
            selected: 0,
        }
    },

    mounted() {
        //this.$root.$emit("loading",{message: "Loading Example Workflow"});
        this.$http.get("app/example/"+this.appid).then(res=>{
            //this.$root.$emit("loading", {show: false});
            this.provs = res.data;
        }).catch(console.error);
        /*
        fetch("https://dev1.soichi.us/tmp/prov.json").then(res=>res.json()).then(res=>{
        //fetch("https://dev1.soichi.us/tmp/app-5ed02bb20a8ed87a11482d81.json").then(res=>res.json()).then(res=>{
            console.dir(res);
            this.$root.$emit("loading", {show: false});
            this.provs = [res];
            this.appid = "5ed02b780a8ed88a57482c92";
            //this.appid = "5ed02bb20a8ed87a11482d81";
        });
        */
    },

    methods: {
    },
}
</script>

<style scoped>
</style>
