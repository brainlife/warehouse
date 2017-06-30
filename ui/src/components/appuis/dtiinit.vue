<template>
<div class="dtiinit">
    <h5>dti_trilin/t1pdd.png</h5>
    <img :src="testurl" width="100%"/>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    props: ['task', 'subdir'],
    data() {
        return {
            testurl: null,
        }
    },
    mounted() {
        var basepath = this.task.instance_id+'/'+this.task._id;
        if(this.subdir) basepath +='/'+this.subdir;
        this.testurl = Vue.config.wf_api+'/resource/download'+
            '?r='+this.task.resource_id+
            '&p='+encodeURIComponent(basepath+'/dti_trilin/t1pdd.png')+
            '&at='+Vue.config.jwt;
    }
}
</script>

<style scopes>
.dtiinit {
}
</style>
