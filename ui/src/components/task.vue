<template>
<div class="task">
    <slot name="header">
        <h3>{{task.name||task.service}}</h3>
    </slot>

    <!--status indicator-->
    <el-card :class="task.status" style="clear: both;" body-style="padding: 8px;">
        <statusicon :status="task.status" scale="1.5" style="float: left; padding: 2px 8px;"/>
        <div style="padding-left: 45px;">
            <div style="float: right;">
                <el-button size="small" type="primary" v-if="task.status == 'failed'" @click="rerun()">Rerun</el-button>
                <el-button size="small" type="" v-if="task.status != 'removed' && task.status != 'remove_requested'" @click="remove()" icon="delete2"></el-button>
            </div>
            <h4><strong style="text-transform: uppercase;">{{task.status}}</strong>
                <small>
                    <time v-if="task.status == 'finished'">at {{task.finish_date|date}}</time>
                    <time v-if="task.status == 'running'">since {{task.start_date|date}}</time>
                    <time v-if="task.status == 'requested'">at {{task.create_date|date}}</time>
                    <time v-if="task.status == 'failed'">at {{task.fail_date|date}}</time>
                    <time v-if="task.status == 'removed'">at {{task.remove_date|date}}</time>
                </small>
            </h4>
            <i>{{task.status_msg||'&nbsp;'}}</i>
        </div>
    </el-card>

    <el-collapse v-model="activeSections">

        <el-collapse-item title="Configuration" name="config" style="margin: 0px;">
            <!--<el-alert title="todo">display this in more user friendly way</el-alert>-->
            <pre v-highlightjs><code class="json hljs">{{task.config}}</code></pre>
        </el-collapse-item>
        <slot name="input"></slot>
        <slot name="output"></slot>

        <el-collapse-item title="Raw Output" name="rawoutput" v-if="task.status != 'removed'">
            <filebrowser v-if="task.resource_id && ~activeSections.indexOf('rawoutput')" :task="task"></filebrowser>
            <el-alert v-if="!task.resource_id" title="Not yet submitted to computing resource" type="warning"></el-alert>
        </el-collapse-item>

    </el-collapse>
    <br clear="both">
</div>
</template>

<script>
import Vue from 'vue'

import filebrowser from '@/components/filebrowser'
import statusicon from '@/components/statusicon'
import mute from '@/components/mute'
import tags from '@/components/tags'
//import volumeviewer from '@/components/volumeviewer'

export default {
    components: { filebrowser, statusicon, mute, tags },
    name: "contact",
    data () {
        return {
            activeSections: ['output', 'input'],
            app: null,
        }
    },
    computed: {
    },

    mounted: function() {
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
        },
        stop() {
            this.$http.put(Vue.config.wf_api+'/task/stop/'+this.task._id)
            .then(res=>{
                console.dir(res); 
            })
            .catch(err=>{
                console.error(err); 
            });
        },
        remove() {
            this.$http.delete(Vue.config.wf_api+'/task/'+this.task._id)
            .then(res=>{
                this.$notify({ title: 'Removing Tak', message: 'Task removal requested', type: 'success', });
                this.$emit("remove", this.task._id);
            })
            .catch(err=>{
                console.error(err); 
            });
        },
    },
    props: ['task'],
}
</script>

<style>
.el-card {
margin-bottom: 0px !important;
}
</style>

<style scoped>
.el-card.finished {
color: white;
background-color: green;
}
.el-card.failed {
color: white;
background-color: #c00;
}
.el-card.running {
color: white;
background-color: #2693ff;
}
.el-card.requested {
color: white;
background-color: #50bfff;
}
.el-card.removed,
.el-card.stopped {
color: white;
background-color: gray;
}
</style>
