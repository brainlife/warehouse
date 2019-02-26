<template>
<div style="height: 100%; overflow: auto;">
    <h3 style="padding: 10px;">T1PDD (Fiber Directions)</h3>
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
        var basepath = "";
        if(this.subdir) basepath+=this.subdir+"/";
        this.url = Vue.config.wf_api+'/task/download/'+this.task._id+'/'+basepath+'dti/t1pdd.png'+'?at='+Vue.config.jwt;
    }
}
</script>

