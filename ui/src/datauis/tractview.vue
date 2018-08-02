<template>
    <iframe v-if="url" :src="url"></iframe>
</template>

<script>

import Vue from 'vue'
const async = require('async');

export default {
    props: ['task', 'subdir'],
    data()  {
        return {
            url: null,
        }
    },
    mounted() {
        this.load_tracts(this.subdir, tracts=>{
            window.config = {tracts};
            var url = "/ui/tractview";

            //let's create parameters used by old version - until we update tractview
            //url += "?taskid="+this.task._id;
            if (this.subdir) url += '?sdir='+this.subdir;

            this.url = url;
        });
    },

    methods: {
        load_tracts: function(subdir, cb) {
            var basepath = "";
            if(subdir) basepath += subdir+"/";
            this.$http.get(Vue.config.amaretti_api+"/task/download/"+this.task._id+"?p="+encodeURIComponent(basepath+"tracts/tracts.json"))
            .then(res=>{
                var tracts = res.body;
                if(!Array.isArray(tracts)) tracts = [tracts]; //make it an array if it's not.. some app just output a single tract without wrapped in []
                tracts.forEach(tract=>{
                    tract.url = Vue.config.amaretti_api+"/task/download/"+this.task._id+"?p="+encodeURIComponent(basepath+"tracts/"+tract.filename)
                });
                cb(tracts);
            }).catch(err=>{
                console.error(err);
                console.error("failed to load tracts.json - probably output from old afq. using afq.tract.json template");
                fetch("https://brainlife.io/ui/tractview/afq.tracts.json")
                    .then(res=>res.json())
                    .then(tracts=>{
                    tracts.forEach(tract=>{
                        tract.url = Vue.config.amaretti_api+"/task/download/"+this.task._id+"?p="+encodeURIComponent(basepath+"tracts/"+tract.filename)
                    });
                    cb(tracts);
                });
            });
        }
    }
}
</script>

<style scoped>
iframe {
border:none;
width:100%;
height:100%;
}
</style>
