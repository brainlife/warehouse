<template>
<div class="ui segment">
    <i class="file outline icon" v-if="file.filename"></i>
    <i class="folder icon" v-if="file.dirname"></i>
    <div style="float: right; position: relative; top: -8px;">
        <el-button type="primary" size="small" @click="view()"><icon name="eye"></icon></el-button>
        <el-button type="primary" size="small" @click="download()"><icon name="download"></icon></el-button>
    </div>
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
        download: function() {
            let url = Vue.config.wf_api+'/resource/download'+
                '?r='+this.task.resource_id+
                '&p='+encodeURIComponent(this.task.instance_id+'/'+this.task._id+'/'+(this.file.filename||this.file.dirname))+
                '&at='+Vue.config.jwt;            
            document.location = url;
        },
        view: function() {
            window.open("#/view/"+this.task.instance_id+"/"+this.task._id+"/", "", "width=1450,height=900,resizable=no,menubar=no"); 
        }
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
