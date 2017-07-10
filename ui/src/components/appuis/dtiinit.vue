<template>
<div class="dtiinit">
    <!-- I am not sure how useful this is..
    <a :href="testurl" target="_black">
        <img v-if="testurl" :src="testurl" width="50%"/>
    </a>
    <b class="text-muted">T1PDD (Fiber Directions)</b>
    -->
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
