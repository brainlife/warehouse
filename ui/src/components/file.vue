<template>
<div class="ui segment">
    <i class="file outline icon" v-if="file.filename"></i>
    <i class="folder icon" v-if="file.dirname"></i>
    <button class="ui mini button right floated primary" @click="click()"><i class="download icon"></i> Download</button>
    {{file.filename||file.dirname}}
    <p><small>{{file.desc}}</small></p>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    data() {
        return {
            url: null,
        }
    },

    props: [ 'file', 'task' ],
    
    mounted: function() {

    },
    methods: {
        click: function() {
            let url = Vue.config.wf_api+'/resource/download'+
                '?r='+this.task.resource_id+
                '&p='+encodeURIComponent(this.task.instance_id+'/'+this.task._id+'/'+(this.file.filename||this.file.dirname))+
                '&at='+Vue.config.jwt;            
            document.location = url;
        },
    },
}
</script>

<style>
/*
.file:hover {
    cursor: pointer;
    background-color: #eee !important;
}
*/
</style>
