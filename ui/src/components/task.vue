<template>
<div v-if="task">
    <slot name="header">
        <h3><icon name="paper-plane"></icon> {{task.name||task.service}}</h3>
    </slot>

    <!--status indicator-->
    <el-card :class="task.status" style="clear: both;" body-style="padding: 8px;">
        <statusicon :status="task.status" scale="1.5" style="float: left; padding: 2px 8px;" @click.native="poke"/>
        <div style="padding-left: 45px;">
            <div style="float: right;">
                <b-button size="sm" v-if="task.status == 'failed' || task.status == 'finished' || task.status == 'removed' || task.status == 'stopped'" title="Rerun Task" @click="rerun()">
                    <icon name="repeat"/></b-button>
                <b-button size="sm" v-if="task.status == 'requested' || task.status == 'running'" @click="stop()" title="Stop Task"><icon name="stop"/></b-button>
                <b-button size="sm" v-if="task.status != 'removed' && task.status != 'remove_requested'" @click="remove()" title="Remove Task"><icon name="trash"/></b-button>
            </div>
            <h4><strong style="text-transform: uppercase;">{{task.status}}</strong>
                <small>
                    <time v-if="task.status == 'finished'">at {{new Date(task.finish_date).toLocaleString()}}</time>
                    <time v-if="task.status == 'running'">since {{timeSinceStartDate(task.start_date)}} ago</time>
                    <time v-if="task.status == 'requested'">at {{new Date(task.create_date).toLocaleString()}}</time>
                    <time v-if="task.status == 'failed'">at {{new Date(task.fail_date).toLocaleString()}}</time>
                    <time v-if="task.status == 'removed'">at {{new Date(task.remove_date).toLocaleString()}}</time>
                </small>
            </h4>
            <i>{{task.status_msg.trim()||'...'}}</i>
        </div>
    </el-card>

    <!--
    <taskconfig style="margin: 10px 20px;" :task="task"/>
    -->

    <el-collapse v-model="activeSections">

        <el-collapse-item title="Configuration" name="config" class="config-area">
            <taskconfig :task="task"/>
            <!--<pre v-highlightjs style="margin-bottom: 0px"><code class="json hljs" v-if="!show_masked_config">{{task.config|mask}}</code></pre>-->
        </el-collapse-item>
        <slot name="input"></slot>
        <slot name="output"></slot>

        <el-collapse-item title="Raw Output" name="rawoutput" v-if="task.status != 'removed'">
            <filebrowser v-if="task.resource_id && ~activeSections.indexOf('rawoutput')" :task="task"></filebrowser>
            <el-alert v-if="!task.resource_id" title="Not yet submitted to computing resource" type="warning"></el-alert>
        </el-collapse-item>

    </el-collapse>
</div>
</template>

<script>
import Vue from 'vue'

import filebrowser from '@/components/filebrowser'
import statusicon from '@/components/statusicon'
import mute from '@/components/mute'
import tags from '@/components/tags'
import taskconfig from '@/components/taskconfig'

export default {
    props: ['task'],
    components: { filebrowser, statusicon, mute, tags, taskconfig },
    name: "contact",
    data () {
        return {
            activeSections: ['output', 'input'],
            show_masked_config: false,
        }
    },

    filters: {
        mask: function(config) {
            //mask config._something    
            let masked = {};
            for(let id in config) {
                if(id[0] != "_") masked[id] = config[id];
            }
            return masked;
        }
    },

    methods: {
        timeSinceStartDate(startString) {
            var timeRunning = new Date().getTime() - new Date(startString).getTime();
            
            var mill = timeRunning % 1000;
            timeRunning = (timeRunning - mill) / 1000;
            
            var seconds = timeRunning % 60;
            timeRunning = (timeRunning - seconds) / 60;
            
            var minutes = timeRunning % 60;
            timeRunning = (timeRunning - minutes) / 60;
            
            var hours = timeRunning % 24;
            timeRunning = (timeRunning - hours) / 24;
            
            if (timeRunning > 0) return `${timeRunning} days`;
            else if (hours > 0) return `${hours} hours`;
            else if (minutes > 0) return `${minutes} minutes`;
            return `${seconds} seconds`;
        },
        
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
                this.$notify({ title: 'Removing Task', text: 'Task removal requested', type: 'success', });
                this.$emit("remove", this.task._id);
            })
            .catch(err=>{
                console.error(err); 
            });
        },
        poke() {
            console.log("poking", this.task._id);
            this.$http.put(Vue.config.wf_api+'/task/poke/'+this.task._id)
            .then(res=>{
                this.$notify({text: "poked", type: 'success'});
            })
            .catch(err=>{
                console.error(err); 
            });
        }
    },
}
</script>

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
time {
color: white;
opacity: 0.8;
}
h3 {
opacity: 0.8;
font-size: 19px;
font-weight: bold;
}
h4 {
font-size: 15px;
font-weight: bold;
margin-bottom: 2px;
}

</style>

<style>
.el-card .btn-secondary {
    opacity: 0.8;
    background-color: transparent;
    border: none;
}
.el-card .btn-secondary:hover {
    opacity: 1;
}
/*
.config-area .el-collapse-item__content {
    padding: 0px;
}
*/
</style>
