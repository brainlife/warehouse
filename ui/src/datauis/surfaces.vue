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
        this.load_surfaces(this.subdir, surfaces=>{
            window.config = {surfaces};
            this.url = "/ui/surfaces";
        });
    },

    methods: {
        load_surfaces: function(subdir, cb) {
            var basepath = "";
            if(subdir) basepath += subdir+"/";
            //3dsurfaces app doesn't produce surfaces.json.. I need to enumerate myself
            this.$http.get(Vue.config.wf_api+"/task/ls/"+this.task._id+"?p="+encodeURIComponent(basepath+"surfaces"))
            .then(res=>{        
                var surfaces = [];
                res.body.files.forEach(file=>{
                    var url = Vue.config.wf_api+"/task/download/"+this.task._id+"?p="+encodeURIComponent(basepath+"surfaces/"+file.filename)+"&at="+Vue.config.jwt;
                    surfaces.push({ name: file.filename.substring(0, file.filename.length-4), path: url }); 
                });
                cb(surfaces);
            }).catch(this.$notify.error);

            /* 
            this.$http.get(Vue.config.wf_api+"/task/download/"+this.task._id+"?p="+encodeURIComponent(basepath+"tracts/tracts.json"))
            .then(res=>{
                var tracts = res.body;
                tracts.forEach(tract=>{
                    tract.url = Vue.config.wf_api+"/task/download/"+this.task._id+"?p="+encodeURIComponent(basepath+"tracts/"+tract.filename)
                });
                cb(tracts);
            }).catch(err=>{
                console.error("failed to load tracts.json - probably output from old afq. using afq.tract.json template");
                fetch("https://brainlife.io/ui/tractview/afq.tracts.json")
                    .then(res=>res.json())
                    .then(tracts=>{
                    tracts.forEach(tract=>{
                        tract.url = Vue.config.wf_api+"/task/download/"+this.task._id+"?p="+encodeURIComponent(basepath+"tracts/"+tract.filename)
                    });
                    cb(tracts);
                });
            });
            */
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

