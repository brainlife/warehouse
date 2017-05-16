<template>
<div class="task">
    <!--status-->
    <el-card title="" :class="task.status" show-icon :closable="false" :body-style="{}">
        <div style="float: left; padding-left: 5px;">
            <statusicon :status="task.status" scale="2"/>
        </div>
        <div style="float: right">
            <el-button v-if="task.status == 'failed'" @click="rerun()">Rerun</el-button>
            <!--<el-button v-if="task.status == 'running'" @click="stop()">Stop</el-button>-->
            <el-button v-if="task.status != 'removed' && task.status != 'remove_requested'" @click="remove()" icon="delete2"></el-button>
        </div>
        <div style="margin-left: 50px; margin-right: 100px">
            <h4>
                <small style="float: right;">
                    <time v-if="task.status == 'finished'">Finished at {{task.finish_date|date}}</time>
                    <time v-if="task.status == 'running'">Started at {{task.start_date|date}}</time>
                    <time v-if="task.status == 'requested'">Requested at {{task.create_date|date}}</time>
                    <time v-if="task.status == 'failed'">Failed at {{task.fail_date|date}}</time>
                </small>
                <span style="text-transform: uppercase;">{{task.status}}</span> | {{task.desc||task.name}} <small class="text-muted">{{task.service}}</small> 
            </h4>
            <i>{{task.status_msg}}</i>
        </div>
    </el-card>

    <el-collapse v-model="activeSections">
        <el-collapse-item title="Configuration" name="config" style="margin: 0px;">
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
import statusicon from '@/components/statusicon'
//import volumeviewer from '@/components/volumeviewer'

export default {
    components: { filebrowser, statusicon },
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
                console.dir(res); 
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
.el-card {
color: white;
background-color: gray;
}
.el-card.finished {
background-color: green;
}
.el-card.failed {
background-color: #c00;
}
.el-card.running {
background-color: #2693ff;
}
.el-card.requested {
background-color: #50bfff;
}
</style>
