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
        //for multiple input .. I think it's deprecated now
        if(this.task.name == "brainlife.download.stage") {

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
                    var basepath = "";
                    if(did) basepath += did+"/";
                    config.layers.forEach(layer=>{
                        layer.url = Vue.config.wf_api+"/task/download/"+this.task._id+"?p="+encodeURIComponent(basepath+"dti/bin/"+layer.filename);
                    });
                    next_entry();
                } else if(datatype.name == "neuro/dwi/recon") { //TODO - maybe we should define noddi output?
                    //items to expect out of raw:noddi
                    config.layers = [
                        { name: "fa.nii.gz", filename: "fa.nii.gz"},
                        { name: "dt.nii.gz", filename: "dt.nii.gz"},
                        { name: "whitematter.nii.gz", filename: "whitematter.nii.gz"},
                        { name: "brainmask.nii.gz", filename: "brainmask.nii.gz"},
                        { name: "csd.nii.gz", filename: "csd.nii.gz"},
                    ];

                    //create url for each layer
                    var basepath = "";
                    if(did) basepath += did+"/";
                    config.layers.forEach(layer=>{
                        layer.url = Vue.config.wf_api+"/task/download/"+this.task._id+"?p="+encodeURIComponent(basepath+layer.filename);
                    });
                    next_entry();
                } else if(datatype.name == "raw") { //TODO - maybe we should define noddi output?
                    //items to expect out of raw:noddi
                    config.layers = [
                        { name: "FIT_ICVF_NEW", filename: "FIT_ICVF_NEW.nii.gz"},
                        { name: "FIT_OD_NEW", filename: "FIT_OD_NEW.nii.gz"},
                        { name: "FIT_ISOVF_NEW", filename: "FIT_ISOVF_NEW.nii.gz"},
                        { name: "FIT_dir", filename: "FIT_dir.nii.gz"},
                    ];

                    //create url for each layer
                    var basepath = "";
                    if(did) basepath += did+"/";
                    config.layers.forEach(layer=>{
                        layer.url = Vue.config.wf_api+"/task/download/"+this.task._id+"?p="+encodeURIComponent(basepath+layer.filename);
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
            var basepath = "";
            if(subdir) basepath += subdir+"/";
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
