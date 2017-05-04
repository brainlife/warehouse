<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/processes"></sidemenu>
    <div class="page-content" v-if="instance && tasks">
        <div class="margin20">
            <el-button @click="remove()" style="float: right;">
                <icon name="trash"></icon> Remove Process
            </el-button>

            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/processes' }">Processes</el-breadcrumb-item>
                <el-breadcrumb-item>{{instance.name}}</el-breadcrumb-item>
            </el-breadcrumb>

            <!--<h1><icon name="send" scale="2"></icon> {{app.name}}</h1>-->
            <h1><icon name="send" scale="2"></icon> Process</h1>
        </div>
        
        <el-form label-width="200px">
            <el-form-item label="Name">
                <el-input v-model="instance.name"/>
            </el-form-item>
            <el-form-item label="Description">
                <el-input type="textarea" v-model="instance.desc" :autosize="{minRows: 2, maxRows: 5}"/>
            </el-form-item>
            <el-form-item label="">
                <time>Created at {{instance.create_date|date}}</time>
            </el-form-item>
        </el-form>

        <div class="task task-input">
            <h2 style="color: white">Input Datasets</h2>
            <p class="text-muted">Following datasets are staged out of Brain Life warehouse and made available for processing.</p>
            <div v-for="(task, idx) in tasks" v-if="task._class == 'input'" :key="idx">
                <el-card>
                    <div slot="header" style="text-transform: uppercase; font-weight: 700; display: inline-block;">
                        <span v-if="task.status == 'finished'">Staged</span>
                        <span v-else>{{task.status}} <small>{{task.status_msg}}</small></span>
                    </div>
                    <p v-for="(input, input_id) in task.config.inputs" :key="input_id">
                        <el-row>
                        <el-col :span="6">
                            {{input.datatype.name}} <metadata :metadata="datasets[input.dataset].meta"/>
                        </el-col>
                        <el-col :span="12">
                            {{datasets[input.dataset].name}} <small class="text-muted">{{datasets[input.dataset].desc}}</small>
                        </el-col>
                        </el-row>
                    </p>
                </el-card>
            </div>
            <el-button type="primary" style="float: right;"><icon name="plus"/> Stage Other Datasets</el-button>
            <br clear="both">
        </div>

        <div class="task">
            <h2>Processing</h2>
            <div v-for="(task, idx) in tasks" v-if="task._class == 'process'" :key="idx" class="process">
                <task :task="task"/>
            </div>
            <el-button type="primary" style="float: right;"><icon name="plus"/> New Process</el-button>
            <br clear="both">
        </div>

        <br>
        <el-card v-if="config.debug">
            <div slot="header">Debug</div>
            <div v-if="instance">
                <h3>instance</h3>
                <pre v-highlightjs="JSON.stringify(instance, null, 4)"><code class="json hljs"></code></pre>
            </div>
            <div v-if="tasks">
                <h3>tasks</h3>
                <div v-for="task in tasks">
                    <pre v-highlightjs="JSON.stringify(task, null, 4)"><code class="json hljs"></code></pre>
                </div>
            </div>
        </el-card>
    </div><!--page-content-->
</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import contact from '@/components/contact'
import message from '@/components/message'
import task from '@/components/task'
import file from '@/components/file'
import filebrowser from '@/components/filebrowser'
import tags from '@/components/tags'
import pageheader from '@/components/pageheader'
import metadata from '@/components/metadata'
import appavatar from '@/components/appavatar'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    components: { sidemenu, contact, task, message, file, tags, metadata, filebrowser, pageheader, appavatar },

    data () {
        return {
            instance: null,
            tasks: null,

            //cache
            datasets: {}, 
            config: Vue.config,
        }
    },

    mounted: function() {
        //load instance first
        this.$http.get(Vue.config.wf_api+'/instance', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
            //populate: 'config.project datatype instance.config.prov.deps.dataset',
        }})
        .then(res=>{
            this.instance = res.body.instances[0];

            //load tasks
            return this.$http.get(Vue.config.wf_api+'/task', {params: {
                find: JSON.stringify({
                    instance_id: this.instance._id,
                    //name: {$ne: "brainlife.novnc"},
                })
            }})
        })
        .then(res=>{
            this.tasks = res.body.tasks;

            //classify tasks
            this.tasks.forEach(task=>{
                switch(task.name) {
                    case "brainlife.stage_input": task._class = "input"; break;
                    case "brainlife.stage_output": task._class = "output"; break;
                    case "brainlife.process": task._class = "process"; break;
                }
            });

            //load datasets used by config.input
            var dataset_ids = [];
            this.tasks.forEach(task=>{
                if(task.config.inputs) {
                    for(var input_id in task.config.inputs) { 
                        dataset_ids.push(task.config.inputs[input_id].dataset);
                    }
                }
            });
            console.log("looking for", dataset_ids);
            return this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: dataset_ids}),
                populate: ' ', //load all default
            }})
        })
        .then(res=>{
            res.body.datasets.forEach((dataset)=>{
                Vue.set(this.datasets, dataset._id, dataset);
            });
    
            //subscribe to the instance events
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            var ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
            ws.onopen = (e)=>{
                //console.log("websocket opened", this.instance._id);
                ws.send(JSON.stringify({
                    bind: {
                        ex: "wf.task",
                        key: Vue.config.user.sub+"."+this.instance._id+".#",
                    }
                }));
                //console.log("binding to instance", this.instance._id);
                ws.send(JSON.stringify({
                    bind: {
                        ex: "wf.instance",
                        key: Vue.config.user.sub+"."+this.instance._id,
                    }
                }));
            }
              
            ws.onmessage = (json)=>{
                var event = JSON.parse(json.data);
                var msg = event.msg;
                if(!msg || !msg._id) return; //odd..
                switch(event.dinfo.exchange) {
                case "wf.task":
                    //look for the task to update
                    this.tasks.forEach(function(t) {
                      if(t._id == msg._id) {
                          for(var k in msg) t[k] = msg[k];
                      }
                    });
                    break;
                case "wf.instance":
                    this.instance = msg;    
                    break;
                default:
                    console.error("unknown exchange", event.dinfo.exchange);
                }
            }

 
        }).catch((err)=>{
            console.error(err);
        });
    },

    computed: {
        output_task: function() {
            var it = null;
            this.tasks.forEach((task)=>{
                if(task._id == this.instance.config.output_task_id) it = task;
            })
            if(!it) console.error("failed to find output_task");
            return it;
        },
        input_task: function() {
            var it = null;
            this.tasks.forEach((task)=>{
                if(task.name == "Stage Input") it = task; //TODO brittle~!
            })
            if(!it) console.error("failed to find input_task");
            return it;
        }
    },

    methods: {
        go: function(path) {
            this.$router.push(path);
        },
        remove: function() {
            //this.messages.push({msg: "Removed", cls: {info: true}});
            this.$http.delete(Vue.config.wf_api+'/instance/'+this.instance._id).then(res=>{
                this.$router.push('/processes');
            });
        },
        view: function(type) {
            window.open("#/view/"+this.instance._id+"/"+this.output_task._id+"/"+type, "", "width=1200,height=800,resizable=no,menubar=no"); 
        },
    },
}
</script>

<style scope>
.task {
background-color: white;
padding: 15px;
}
.task h2 {
color: #999;
}
.task-input {
background-color: #ccc;
}
</style>
