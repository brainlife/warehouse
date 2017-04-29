<template>
<div class="task">
    <!--status-->
    <el-alert class="status" title="" :type="alerttype" show-icon :closable="false" style="padding: 15px;">
        <el-button v-if="task.status == 'failed'" style="float: right;" @click="rerun()">
            <icon name="repeat"></icon>&nbsp;&nbsp;Rerun
        </el-button>
        <h4>
            <span style="text-transform: uppercase;">{{task.status}}</span> |
            {{task.name}} <small class="text-muted">{{task.service}}</small> 
        </h4>
        <i>{{task.status_msg}}</i>
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
.task .status {
margin-bottom: 5px;
}
.task .status .el-alert__icon {
font-size: 30px;
padding: 5px;
}
</style>
