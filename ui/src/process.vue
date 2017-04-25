<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/processes"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
        <div class="margin20" v-if="instance && tasks && app">
            <el-button-group style="float: right;">
                <!--
                <el-button v-if="instance.config.dataset_id" @click="go('/dataset/'+instance.config.dataset_id)">
                    <icon name="archive"></icon> See Archived
                </el-button>
                -->
                <el-button @click="remove()">
                    <icon name="trash"></icon> Remove Process
                </el-button>
                <!--
                <el-button type="primary" v-if="!instance.config.dataset_id && instance.status == 'finished'" @click="go('/process/'+instance._id+'/archive')"> 
                    <icon name="archive"></icon> Archive Output
                </el-button>
                -->
            </el-button-group>

            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/processes' }">Processes</el-breadcrumb-item>
                <el-breadcrumb-item>{{instance.name}}</el-breadcrumb-item>
            </el-breadcrumb>

            <!--<h1><icon name="send" scale="2"></icon> {{app.name}}</h1>-->
            <h1><icon name="send" scale="2"></icon> Process</h1>

            <table class="info">
            <tr>
                <th width="150px">Description</th>
                <td>
                    {{instance.desc}}
                </td>
            </tr>
            <tr>
                <th>Dataset ID</th>
                <td>
                    <div v-if="!instance.config.dataset_ids">
                        <p class="text-muted">Not archived yet</p>
                        <el-card v-if="instance.status == 'finished'" style="background-color: #def;">
                            <div slot="header"><b style="color: #2693ff;"><icon name="cubes"/> Archive Output</b></div>
                            <p>The output data will be purged within 25 days of process completion.</p>
                            <p>Please archive if you'd like to persist the output datasets as part of your project.</p>
                            <el-button size="large" type="primary" @click="go('/process/'+instance._id+'/archive')">
                                <icon name="archive"></icon> Archive Output
                            </el-button>
                        </el-card>
                    </div>
                    <div v-if="instance.config.dataset_ids">
                        <span class="text-muted">Output from this process is archived in the warehouse with dataset ID of</span>
                        <el-button v-for="id in instance.config.dataset_ids" type="text" @click="go('/dataset/'+id)">{{id}}</el-button>
                    </div>
                </td>
            </tr>
            <tr>
                <th>Application</th>
                <td>
                    <appavatar :app="app" style="float: right; margin-left: 10px;"></appavatar>
                    <h3>{{app.name}}</h3>
                    <p>{{app.desc}}</p>
                </td>
            </tr>
            <tr>
                <th width="180px">Submit Date</th>
                <td>
                    <p>{{instance.create_date|date}}</p>
                </td>
            </tr>
            <tr v-if="instance.status == 'finished'">
                <th>Outputs</th>
                <td>
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
                                            <el-dropdown-item command="fibernavigator">FiberNavigator</el-dropdown-item>
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

                </td>
            </tr>
            <tr>
                <th>Task Status</th>
                <td>
                    <task v-for="task in tasks" key="task._id" :task="task"></task>
                </td>
            </tr>
            <tr>
                <th>Inputs</th>
                <td>
                    <el-table :data="instance.config.prov.deps" style="width: 100%">
                        <el-table-column type="expand">
                            <template scope="props">
                                <el-alert v-if="input_task.status != 'finished'" title="Input datasets not yet loaded" type="warning" show-icon :closable="false"/>
                                <filebrowser v-if="input_task.status == 'finished'" :task="input_task" :path="input_task.instance_id+'/'+input_task._id+'/inputs/'+props.row.input_id"/>
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
                </td>
            </tr>
            <tr>
                <th>Configuration</th>
                <td>
                    <pre v-highlightjs><code class="json hljs">{{instance.config.prov.config}}</code></pre>
                </td>
            </tr>
            </table>

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
                <div v-if="app">
                    <h3>app</h3>
                    <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
                </div>
            </el-card>
        </div><!--margin20-->
        </div><!--page-content-->
    </div><!--pusher-->
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
    mixins: [
        //require("vue-toaster")
    ],
    components: { sidemenu, contact, task, message, file, tags, metadata, filebrowser, pageheader, appavatar },

    data () {
        return {
            instance: null,
            tasks: null,
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

            //for backward compatibility
            if(this.instance.config.dataset_id) {
                this.instance.config.dataset_ids = [this.instance.config.dataset_id];
            }

            //load datasets used for prov.deps
            console.dir(this.instance.config.prov);
            //if(!this.instance.config.prov.deps.map) this.instance.config.prov.deps = [this.instance.config.prov.deps];
            var dataset_ids = this.instance.config.prov.deps.map(dep=>dep.dataset);
            return this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: dataset_ids}),
                populate: ' ', //load all default
            }})
        })
        .then(res=>{
            res.body.datasets.forEach((dataset)=>{
                this.instance.config.prov.deps.forEach(dep=>{
                    if(dep.dataset == dataset._id) {
                        Vue.set(dep, '_dataset', dataset);
                    }
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
            console.error(err);
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
        remove: function() {
            //this.messages.push({msg: "Removed", cls: {info: true}});
            this.$http.delete(Vue.config.wf_api+'/instance/'+this.instance._id).then(res=>{
                this.$router.push('/processes');
            });
        },
        view: function(type) {
            window.open("#/view/"+this.instance._id+"/"+this.main_task._id+"/"+type, "", "width=1200,height=800,resizable=no,menubar=no"); 
        },
    },
}
</script>
