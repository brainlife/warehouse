<template>
<iframe :src="'/ui/'+ui+'/'"></iframe>
</template>

<script>

import Vue from 'vue'

export default {
    props: ['uiconfig', 'ui'],
    data() {
        return {}
    },
    mounted() {

        //construct path
        var path = Vue.config.amaretti_api+"/task/download/"+this.uiconfig.task_id+"/";
        if(this.uiconfig.subdir) path += this.uiconfig.subdir+"/";
        switch(this.uiconfig.datatype) {
        case "neuro/anat/t1w":
            if(this.uiconfig.files && this.uiconfig.files.t1) path += this.uiconfig.files.t1;
            else path += "t1.nii.gz"; 
            break;
        case "neuro/anat/t2w":
            if(this.uiconfig.files && this.uiconfig.files.t2) path += this.uiconfig.files.t2;
            path += "t2.nii.gz";
            break;
        case "neuro/anat/flair":
            if(this.uiconfig.files && this.uiconfig.files.flair) path += this.uiconfig.files.flair;
            path += "flair.nii.gz";
            break;
        case "neuro/mask":
            if(this.uiconfig.files && this.uiconfig.files.mask) path += this.uiconfig.files.mask;
            path += "mask.nii.gz";
            break;
        case "neuro/peaks":
            if(this.uiconfig.files && this.uiconfig.files.peaks) path += this.uiconfig.files.peaks;
            path += "peaks.nii.gz";
            break;
        default:
            alert('unknown datatye:'+this.uiconfig.datatype);
        }
        path += "?at="+Vue.config.jwt;
        window.config = { datatype: this.uiconfig.datatype, path };
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
