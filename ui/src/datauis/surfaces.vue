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
            
            let url_surfaces_json = Vue.config.wf_api+"/task/download/"+this.task._id+"/"+basepath+"surfaces/surfaces.json"+"?at="+Vue.config.jwt;
            
            this.$http.get(url_surfaces_json)
            .then(res => {
                let surfaces = res.data;
                surfaces.forEach(surface => {
                    surface.basename = surface.name||surface.filename; //surface.filename is deprecated?
                    let filepath = surface.path||surface.filename; //surface.filename is deprecated?
                    surface.filename = Vue.config.wf_api+"/task/download/"+this.task._id+"/"+basepath+"surfaces/"+filepath+"?at="+Vue.config.jwt;
                });
                cb(surfaces);
            }).catch(err => {
                // old code to use in case surfaces.json doesn't exist
                this.$http.get(Vue.config.wf_api+"/task/ls/"+this.task._id+"?p="+encodeURIComponent(basepath+"surfaces"))
                .then(res=>{        
                    var surfaces = [];
                    res.data.files.forEach(file=>{
                        var url = Vue.config.wf_api+"/task/download/"+this.task._id+"/"+basepath+"surfaces/"+file.filename+"?at="+Vue.config.jwt;
                        surfaces.push({ name: file.filename.substring(0, file.filename.length-4), path: url }); 
                    });
                    cb(surfaces);
                }).catch(this.$notify.error);
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

