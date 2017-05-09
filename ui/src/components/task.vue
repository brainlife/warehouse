<template>
<div class="task">
    <!--status-->
    <el-alert title="" :class="task.status" show-icon :closable="false" style="padding: 15px;">
        <el-button v-if="task.status == 'failed'" style="float: right;" @click="rerun()">
            <icon name="repeat"></icon>&nbsp;&nbsp;Rerun
        </el-button>
        <h4>
            <div style="float: right;">
                <time v-if="task.status == 'finished'">Finished at {{task.finish_date|date}}</time>
                <time v-if="task.status == 'running'">Started at {{task.start_date|date}}</time>
                <time v-if="task.status == 'requested'">Requested at {{task.create_date|date}}</time>
                <time v-if="task.status == 'failed'">Failed at {{task.fail_date|date}}</time>
            </div>
            <span style="text-transform: uppercase;">{{task.status}}</span> | {{task.desc||task.name}} <small class="text-muted">{{task.service}}</small> 
        </h4>
        <i>{{task.status_msg}}</i>
    </el-alert>

    <el-collapse v-model="activeSections">
        <el-collapse-item title="Configuration" name="config">
            <!--<el-alert title="todo">display this in more user friendly way</el-alert>-->
            <pre v-highlightjs><code class="json hljs">{{task.config}}</code></pre>
        </el-collapse-item>

        <el-collapse-item title="Raw Output" name="output">
            <filebrowser v-if="task.resource_id && ~activeSections.indexOf('output')" :task="task"></filebrowser>
            <el-alert v-if="!task.resource_id" title="Not yet submitted to computing resource" type="warning"></el-alert>
        </el-collapse-item>

        <!--
        <el-collapse-item title="View" name="viewer">
            <volumeviewer :task="task"/>
        </el-collapse-item>
        -->
    </el-collapse>
</div>
</template>

<script>
import Vue from 'vue'

import filebrowser from '@/components/filebrowser'
//import volumeviewer from '@/components/volumeviewer'

export default {
    components: { filebrowser, /*volumeviewer*/ },
    name: "contact",
    data () {
        return {
            activeSections: []
        }
    },
    computed: {
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
.task .el-alert {
margin-top: 5px;
margin-bottom: 5px;
padding: 10px !important;
}
.el-alert.finished {
background-color: green;
}
.el-alert.failed {
background-color: #c00;
}
.el-alert.running {
background-color: #2693ff;
}

.task .el-alert .el-alert__icon {
font-size: 30px;
padding: 5px;
}
</style>
