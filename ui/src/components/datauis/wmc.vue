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
        if(this.task.name == "brainlife.download.stage") {
            //assume we have multiple dataset requests
            //console.dir(this.task.config); 

            //find datatype from config
            var config = {};
            var wmcdir = null;
            async.forEach(this.task.config.download, (entry, next_entry)=>{
                var did = entry.dir; //directory name is did
                var datatype = this.task.config._datatypes[did];
                if(datatype.name == "neuro/wmc") {
                    wmcdir = did;
                    this.load_tracts(did, tracts=>{
                        config.tracts = tracts;
                        next_entry();
                    });
                } else if(datatype.name == "neuro/dtiinit") {

                    //items to expect out of dtiinit
                    config.layers = [
                        { name: "wmMask", filename: "wmMask.nii.gz"},
                        { name: "wmProb", filename: "wmProb.nii.gz"},
                        { name: "mdStd", filename: "mdStd.nii.gz"},
                        { name: "faStd", filename: "faStd.nii.gz"},
                        { name: "vectorRGB", filename: "vectorRGB.nii.gz"},
                        { name: "pddDispersion", filename: "pddDispersion.nii.gz"},
                        { name: "tensors", filename: "tensors.nii.gz"},
                        { name: "b0", filename: "b0.nii.gz"},
                        { name: "brainMask", filename: "brainMask.nii.gz"},
                    ];

                    //create url for each layer
                    var path = this.task.instance_id+"/"+this.task._id+"/"+did;
                    config.layers.forEach(layer=>{
                        layer.url = Vue.config.wf_api+"/resource/download?"+
                            "r="+this.task.resource_id+
                            "&p="+encodeURIComponent(path+"/dti/bin/"+layer.filename);
                            //"&at="+Vue.config.jwt;
                    });
                    next_entry();
                } else {
                    console.log("I don't care about", datatype.name);
                    next_entry();
                }
            }, ()=>{
                console.log("window.confing", config);
                window.config = config;
                this.seturl(wmcdir);
            }); 
        } else {
            //let's assume it's from single normal wmc output - just load tracts
            this.load_tracts(this.subdir, tracts=>{
                window.config = {tracts};
                this.seturl(this.subdir);
            });
        }
    },

    methods: {
        seturl: function(subdir) {
            var url = "/ui/tractview";

            //let's create parameters used by old version - until we update tractview
            url += "?taskid="+this.task._id;
            if (subdir) url += '&sdir='+subdir;

            this.url = url;
        },

        load_tracts: function(subdir, cb) {
            var path = this.task.instance_id+"/"+this.task._id;
            if(subdir) path += "/"+subdir;
            path += "/tracts";
            this.$http.get(Vue.config.wf_api+"/resource/download", {params: {
                r: this.task.resource_id, p: path+"/tracts.json",
            }})
            .then(res=>{
                var tracts = res.body;
                tracts.forEach(tract=>{
                    tract.url = Vue.config.wf_api+"/resource/download?"+
                        "r="+this.task.resource_id+
                        "&p="+encodeURIComponent(path+"/"+tract.filename)
                        //"&at="+Vue.config.jwt;
                });
                cb(tracts);
            }).catch(err=>{
                console.error("failed to load tracts.json - probably output from old afq. using afq.tract.json template");
                fetch("https://brain-life.org/ui/tractview/afq.tracts.json")
                    .then(res=>res.json())
                    .then(tracts=>{
                    tracts.forEach(tract=>{
                        tract.url = Vue.config.wf_api+"/resource/download?"+
                            "r="+this.task.resource_id+
                            "&p="+encodeURIComponent(path+"/"+tract.filename)
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

<style>
body, html {
overflow: hidden;
}
</style>
