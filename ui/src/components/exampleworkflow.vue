<template>
<div class="examplewf">
    <b-alert :show="provs && !provs.length" variant="secondary">Sorry, we couldn't find an example workflow.</b-alert>
    <div v-for="(prov, idx) in provs" :key="idx">
        <provgraph :prov="prov" :appid="appid" :showFull="false" style="height: 700px; background-color: #eee;"/>
        <br>
    </div>
</div>
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
        }
    },

    mounted() {
        this.$root.$emit("loading",{message: "Loading Example Workflow"});
        this.$http.get("app/example/"+this.appid).then(res=>{
            this.$root.$emit("loading", {show: false});
    
            //let's just show the very first one
            this.provs = res.data.splice(0,1);
        }).catch(console.error);
    },

    methods: {
    },
}
</script>

<style scoped>
.examplewf {
}
</style>
