<template>
<div>
    <sidemenu active="/processes"></sidemenu>
    <div class="ui pusher">
        <div class="margin20" v-if="instance && tasks && app">
            <message v-for="(msg, idx) in messages" key="idx" :msg="msg"></message>
            <button class="ui button primary right floated"
                v-if="!instance.config.dataset_id && instance.status == 'finished'" @click="archive()"> 
                <i class="archive icon"></i> Archive Output
            </button>
            <button class="ui button right floated"
                v-if="instance.config.dataset_id" @click="go('/dataset/'+instance.config.dataset_id)">
                <i class="archive icon"></i> See Archived
            </button>
            <button class="ui button right floated" @click="remove()">
                <i class="trash icon"></i> Remove Process
            </button>

            <h1><i class="send icon"></i> {{app.name}} <!--<small class="text-muted">{{instance.name}}</small>--></h1>
            <!--<p>{{app.desc}}</p>-->
            <p>{{instance.desc}}</p>

            <el-card class="box-card" v-if="instance.status == 'finished'">
                <div slot="header"> <span>Outputs</span> </div>
                <el-table :data="app.outputs" style="width: 100%" default-expand-all>
                    <el-table-column type="expand">
                        <template scope="props">
                        <el-row :gutter="20">
                            <el-col :span="20">
                                <file v-for="file in props.row.datatype.files" key="file.filename" :file="file" :task="main_task"></file>
                            </el-col>
                            <el-col :span="4">
                                <el-dropdown style="float: right;" @command="view">
                                    <el-button type="primary">
                                        View <i class="el-icon-caret-bottom el-icon--right"></i>
                                    </el-button>
                                    <el-dropdown-menu slot="dropdown">
                                        <!--<div v-if="props.row.datatype.name == 'neuro/anat'">-->
                                        <el-dropdown-item command="fslview">FSLView</el-dropdown-item>
                                        <el-dropdown-item command="freeview">FreeView</el-dropdown-item>
                                        <el-dropdown-item command="mrview">MRView</el-dropdown-item>
                                        <el-dropdown-item command="brainview" disabled divided>BrainView</el-dropdown-item>
                                    </el-dropdown-menu>
                                </el-dropdown>
                            </el-col>
                        </el-row>
                        </template>
                    </el-table-column>
                    <el-table-column prop="id" label="ID" width="180"></el-table-column>
                    <el-table-column prop="datatype.name" label="Name" width="180"></el-table-column>
                    <el-table-column prop="datatype.desc" label="Description"></el-table-column>
                    <el-table-column prop="datatype_tags" label="Tags"></el-table-column>
                </el-table>
            </el-card>
            <br>

            <el-card class="box-card">
                <div slot="header"> <span>Task Statuses</span> </div>
                <task v-for="task in tasks" key="task._id" :task="task"></task>
            </el-card>
            <br>

            <el-card class="box-card">
                <div slot="header"> <span>Application</span> </div>
                <img style="float: left; margin-right: 20px;" :src="app.avatar">
                <h3 style="margin: 0px;">{{app.name}}</h3>
                <p>{{app.desc}}</p>
                <br clear="both">
            </el-card>
            <br>

            <el-card class="box-card">
                <div slot="header"> <span>Inputs</span> </div>
                <el-table :data="instance.config.prov.deps" style="width: 100%">
                    <el-table-column type="expand">
                        <template scope="props">
                            <filebrowser :task="input_task" :path="input_task.instance_id+'/'+input_task._id+'/inputs/'+props.row.input_id"></filebrowser>
                        </template>
                    </el-table-column>
                    <el-table-column prop="input_id" label="ID" width="180"></el-table-column>
                    <el-table-column prop="_dataset.name" label="Name" width="180"></el-table-column>
                    <el-table-column prop="_dataset.desc" label="Description"></el-table-column>
                    <el-table-column prop="_dataset.meta" label="Metadata">
                        <template scope="scope" v-if="scope.row._dataset">
                            <metadata :metadata="scope.row._dataset.meta"></metadata>
                        </template>
                    </el-table-column>
                    <el-table-column prop="_dataset.datatype_tags" label="Data Type Tags">
                        <template scope="scope" v-if="scope.row._dataset">
                            <tags :tags="scope.row._dataset.datatype_tags"></tags>
                        </template>
                    </el-table-column>
                    <el-table-column prop="_dataset.tags" label="User Tags">
                        <template scope="scope" v-if="scope.row._dataset">
                            <tags :tags="scope.row._dataset.tags"></tags>
                        </template>
                    </el-table-column>
                </el-table>
            </el-card>
            <br>

            <el-card class="box-card">
                <div slot="header"> <span>Configuration</span> </div>
                <p>TODO.. display this in more user friendly way</p>
                <pre v-highlightjs><code class="json hljs">{{instance.config.prov.config}}</code></pre>
            </el-card>

            <div class="ui segments" v-if="config.debug">
                <div class="ui segment" v-if="instance">
                    <h3>instance</h3>
                    <pre v-highlightjs="JSON.stringify(instance, null, 4)"><code class="json hljs"></code></pre>
                </div>
                <div class="ui segment" v-if="tasks">
                    <h3>tasks</h3>
                    <div v-for="task in tasks">
                        <pre v-highlightjs="JSON.stringify(task, null, 4)"><code class="json hljs"></code></pre>
                    </div>
                </div>
                <div class="ui segment" v-if="app">
                    <h3>app</h3>
                    <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
                </div>
                <!--
                <div class="ui segment" v-if="datasets">
                    <h3>datasets</h3>
                    <pre v-highlightjs="JSON.stringify(datasets, null, 4)"><code class="json hljs"></code></pre>
                </div>
                -->
            </div>
        </div>
    </div>
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
import metadata from '@/components/metadata'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    mixins: [
        //require("vue-toaster")
    ],
    components: { sidemenu, contact, task, message, file, tags, metadata, filebrowser },

    data () {
        return {
            instance: null,
            tasks: null,
            messages: [],
            app: null,

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

            //load datasets used for prov.deps
            var dataset_ids = this.instance.config.prov.deps.map(dep=>dep.dataset);
            this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: dataset_ids}),
                populate: ' ',
            }})
            .then(res=>{
                //this.datasets = res.body.datasets;
                res.body.datasets.forEach((dataset)=>{
                    this.instance.config.prov.deps.forEach(dep=>{
                        if(dep.dataset == dataset._id) {
                            Vue.set(dep, '_dataset', dataset);
                        }
                    });
                });
            });

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

            //load app
            return this.$http.get('app', {params: {
                find: JSON.stringify({_id: this.instance.config.prov.app}),
                populate: 'inputs.datatype outputs.datatype',
            }})
        })
        .then(res=>{
            this.app = res.body.apps[0];

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
            console.error(res);
        });
    },

    computed: {
        main_task: function() {
            var it = null;
            this.tasks.forEach((task)=>{
                if(task._id == this.instance.config.main_task_id) it = task;
            })
            if(!it) console.error("failed to find main_task");
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
        archive: function() {
            //construct metadata for the new output dataset
            //TODO - I think I should let the app take care of this (via products.json?) but metadata is more or less warehouse
            //specific concept - so maybe I should define mapping rule inside app record somehow.
            //for now, I just concat all metadata from input datasets used
            var meta = {}
            this.instance.config.prov.deps.forEach(function(dep) {
                Object.assign(meta, dep._dataset.meta);
            });

            //finally, make a request to finalize the task directory
            //currently only deals with outputs[0]
            var params = {
                instance_id: this.instance._id,
                //name: "data from "+this.instance.name,
                name: this.app.name+" output", 
                desc: "Data archived from "+this.instance.name,
                tags: ['xyz123', 'test', 'dev'], //TODO - let use set this?
                project: this.instance.config.project,
                task_id: this.instance.config.main_task_id,
                prov: this.instance.config.prov, 
                meta: meta,
                datatype: this.app.outputs[0].datatype,
                datatype_tags: this.app.outputs[0].datatype_tags,
            }
            this.$http.post('dataset', params).then(res=>{
                this.messages.push({msg: "Archiving Request Sent!", cls: {info: true}});

                //update instance to store dataset_id
                this.instance.config.dataset_id = res.body._id;
                this.$http.put(Vue.config.wf_api+'/instance/'+this.instance._id, {
                    config: this.instance.config,
                }).then(res=>{
                    console.log("done updating instance");
                });
            }, res=>{
                console.error(res);
            });
        },
        remove: function() {
            //this.messages.push({msg: "Removed", cls: {info: true}});
            this.$http.delete(Vue.config.wf_api+'/instance/'+this.instance._id).then(res=>{
                this.$router.push('/processes');
            });
        },
        view: function(type) {
            window.open("#/view/"+this.instance._id+"/"+this.main_task._id+"/"+type, "", "width=1250,height=800,resizable=no,menubar=no"); 
        },
    },
}
</script>

<style scoped>
</style>
