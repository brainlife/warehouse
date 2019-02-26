<template>
<iframe src="/ui/volumeviewer"></iframe>
</template>

<script>

import Vue from 'vue'

export default {
    props: ['task', 'subdir', 'datatype'],
    data() {
        return {}
    },
    mounted() {
        //construct path
        var path = Vue.config.amaretti_api+"/task/download/"+this.task._id+"/";
        if(this.subdir) path += this.subdir+"/";
        switch(this.datatype) {
        case "neuro/anat/t1w":
            path += "t1.nii.gz"; 
            break;
        case "neuro/anat/t2w":
            path += "t2.nii.gz"; 
            break;
        case "neuro/mask":
            path += "mask.nii.gz"; 
            break;
        default:
            alert('unknown datatye:'+this.datatype);
        } 
        path += "?at="+Vue.config.jwt;
        window.config = { datatype: this.datatype, path };
    },
}
</script>

<style scoped>
iframe {
border:none;
width:100%;
height:100%;
}
</style>
