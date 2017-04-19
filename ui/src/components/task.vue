<template>
<div>
    <!--status-->
    <el-alert title="" style="margin-bottom: 5px;" :type="alerttype" show-icon :closable="false">
        <el-button v-if="task.status == 'failed'" style="float: right;" @click="rerun()">
            <icon name="repeat"></icon>&nbsp;&nbsp;Rerun
        </el-button>
        <h4 style="margin-bottom: 0px;">
            <span style="text-transform: uppercase;">{{task.status}}</span>&nbsp; <el-tag>{{task.service}}</el-tag>
        </h4>
        <p>
            <i>{{task.status_msg}}</i>
        </p>
    </el-alert>

    <el-collapse v-model="activeSections">
        <el-collapse-item title="Configuration" name="config">
            <pre v-highlightjs><code class="json hljs">{{task.config}}</code></pre>
        </el-collapse-item>

        <el-collapse-item title="Output" name="output">
            <filebrowser v-if="task.resource_id && ~activeSections.indexOf('output')" :task="task"></filebrowser>
            <el-alert v-if="!task.resource_id" title="Not yet submitted to computing resource" type="warning"></el-alert>
        </el-collapse-item>
    </el-collapse>
    <br>
</div>
</template>

<script>
import Vue from 'vue'

import filebrowser from '@/components/filebrowser'

export default {
    components: { filebrowser },
    name: "contact",
    data () {
        return {
            activeSections: []
        }
    },
    computed: {
        alerttype: function() {
            switch(this.task.status) {
            case "finished": return "success";
            case "failed": return "error";
            default: return "info";
            }
        }
    },
    mounted: function() {
        //$(this.$el).find('.ui.accordion').accordion();
    },
    methods: {
        rerun() {
            this.$http.put(Vue.config.wf_api+'/task/rerun/'+this.task._id)
            .then(res=>{
                console.dir(res); 
            })
            .catch(err=>{
                console.error(err); 
            });
        }
    },
    props: ['task'],
}
</script>

<style>
.ui.accordion .title {
padding: 3px 0px !important;
}
.el-alert__icon {
font-size: 30px;
padding: 0px 10px 0px 5px;
}
</style>
