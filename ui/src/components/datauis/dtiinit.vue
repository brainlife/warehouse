<template>
<div class="dtiinit">
    <h3 style="margin: 10px;">T1PDD (Fiber Directions)</h3>
    <a :href="url" target="_black">
        <img v-if="url" :src="url" width="100%"/>
    </a>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    props: ['task', 'subdir'],
    data() {
        return {
            url: null,
        }
    },
    mounted() {
        var basepath = this.task.instance_id+'/'+this.task._id;
        if(this.subdir) basepath +='/'+this.subdir;
        this.url = Vue.config.wf_api+'/resource/download'+
            '?r='+this.task.resource_id+
            '&p='+encodeURIComponent(basepath+'/dti/t1pdd.png')+
            '&at='+Vue.config.jwt;
    }
}
</script>

