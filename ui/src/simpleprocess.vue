<template>
<div v-if="instance && tasks">
    <div id="scrolled-area">
        <table class="info" style="box-sizing: border-box;">
        <tr v-if="app">
            <th>Application/Config</th>
            <td>
                <app :app="app"></app>
                <pre v-highlightjs style="height: 100%;"><code class="json hljs">{{instance.config.prov.config}}</code></pre>
            </td>
        </tr>
        <tr v-if="datatypes">
            <th>Inputs</th>
            <td>
                <!--
                <el-table :data="instance.config.prov.deps" style="width: 100%">
                    <el-table-column type="expand">
                        <template scope="props">
                            <el-alert v-if="input_task.status != 'finished'" title="Input datasets not yet loaded" type="warning" show-icon :closable="false"/>
                            <filebrowser v-if="input_task.status == 'finished'" :task="input_task" :path="input_task.instance_id+'/'+input_task._id+'/inputs/'+props.row.input_id"/>
                        </template>
                    </el-table-column>
                    <el-table-column prop="input_id" label="ID" width="180"></el-table-column>
                    <el-table-column prop="_dataset" label="Data Type">
                        <template scope="scope">
                            <datatypetag v-if="scope.row._dataset" :datatype="datatypes[scope.row._dataset.datatype]" :tags="scope.row._dataset.datatype_tags"></datatypetag>
                            <p v-if="!scope.row._dataset">no dataset</p>
                        </template>
                    </el-table-column>
                    <el-table-column prop="_dataset.meta" label="Metadata">
                        <template scope="scope">
                            <metadata v-if="scope.row._dataset" :metadata="scope.row._dataset.meta"></metadata>
                        </template>
                    </el-table-column>
                    <el-table-column prop="_dataset.desc" label="Description"></el-table-column>
                    <el-table-column prop="_dataset.tags" label="User Tags">
                        <template scope="scope" v-if="scope.row._dataset">
                            <tags v-if="scope.row.datatype" :tags="scope.row._dataset.tags"></tags>
                        </template>
                    </el-table-column>
                </el-table>
                -->
                <el-card v-for="dep in instance.config.prov.deps" :key="dep._id">
                    <div v-if="dep._dataset">
                        <p class="text-muted" style="float: right;">{{dep._dataset.desc}}</p>
                        <b v-if="dep._dataset && dep._dataset.meta">{{dep._dataset.meta.subject}}</b>
                        <datatypetag v-if="dep._dataset" 
                            :datatype="datatypes[dep._dataset.datatype]" 
                            :tags="dep._dataset.datatype_tags"></datatypetag>
                        <small v-for="(tag,idx) in dep._dataset.tags" :key="idx"> | {{tag}}</small>
                    </div>
                    <p v-else>no dataset</p>
                    <el-alert v-if="input_task.status != 'finished'" 
                        title="Input datasets not yet loaded" type="warning" show-icon :closable="false"/>
                    <br>
                    <filebrowser v-if="input_task.status == 'finished'"
                        :task="input_task" 
                        :path="input_task.instance_id+'/'+input_task._id+'/inputs/'+dep.input_id"/>
                </el-card>
            </td>
        </tr>
        <tr v-if="app && tasks && instance.status == 'finished'">
            <th>Outputs</th>
            <td>
                <!--
                <el-table :data="app.outputs" style="width: 100%" default-expand-all>
                    <el-table-column type="expand">
                        <template scope="props">
                            <el-row :gutter="20">
                                <el-col :span="20">
                                    <file v-for="file in props.row.datatype.files" key="file.filename" :file="file" :task="output_task" :subdir="props.row.id"></file>
                                </el-col>
                                <el-col :span="4">
                                    <viewerselect v-if="output_task.status == 'finished'" @select="view(output_task._id, $event, props.row.id)" :datatype="props.row.datatype.name"></viewerselect>
                                </el-col>
                            </el-row>
                            <br>
                            <filebrowser v-if="output_task.status == 'finished'" :task="output_task" :path="output_task.instance_id+'/'+output_task._id+'/'+props.row.id"/>
                        </template>
                    </el-table-column>
                    <el-table-column prop="id" label="ID" width="180"></el-table-column>
                    <el-table-column label="Datatype" width="180">
                        <template scope="props">
                            <datatypetag :datatype="props.row.datatype" :tags="props.row.datatype_tags"></datatypetag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="datatype.desc" label="Description"></el-table-column>
                </el-table>
                -->
                <el-card v-for="output in app.outputs" :key="output.id">
                    <!--
                    <el-col :span="6">
                        {{output.id}}
                    </el-col>
                    -->
                    <viewerselect v-if="output_task.status == 'finished'" 
                        @select="view(output_task._id, $event, output.id)" 
                        :datatype="output.datatype.name"
                        style="float: right"></viewerselect>
                    <datatypetag :datatype="output.datatype" :tags="output.datatype_tags"></datatypetag>
                    <span class="text-muted">{{output.datatype.desc}}</span>
                    <br>
                    <br>
                    <filebrowser v-if="output_task.status == 'finished'"
                        :task="output_task" 
                        :path="output_task.instance_id+'/'+output_task._id+'/'+output.id"/>
                </el-card>
            </td>
        </tr>
        <tr>
            <th width="150px">Archived Datasets</th>
            <td>
                <div v-if="!instance.config.dataset_ids && !show_archive">
                    <el-card v-if="instance.status == 'finished'" style="background-color: #def;">
                        <div slot="header"><b style="color: #2693ff;"><icon name="cubes"/> Archive Output</b></div>
                        <p>The output data will be purged within 25 days of process completion.</p>
                        <p>Please archive if you'd like to persist the output datasets as part of your project.</p>
                        <el-button type="primary" @click="show_archive = true">
                            <icon name="archive"></icon> Archive Output
                        </el-button>
                    </el-card>
                    <p class="text-muted" v-else>Not archived yet</p>
                </div>
                <div v-if="instance.config.dataset_ids">
                    <span class="text-muted">Output from this process is archived in the warehouse as dataset(s)</span>
                    <ul>
                        <li v-for="id in instance.config.dataset_ids" :key="id">
                            <el-button type="text" @click="go('/dataset/'+id)">{{id}}</el-button>
                        </li>
                    </ul>
                </div>
                <div v-if="show_archive">
                    <h3>Archive Outputs</h3>
                    <simpleprocessarchive @close="show_archive = false" :instance="instance"/>
                </div>
            </td>
        </tr>
        <tr v-if="tasks">
            <th>Task Status</th>
            <td>
                <div v-for="task in tasks" key="task._id">
                    <task :task="task"></task>
                    <br>
                </div>
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
    </div><!--scrolled-area-->
</div>
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
import mute from '@/components/mute'
import viewerselect from '@/components/viewerselect'
import statustag from '@/components/statustag'
import app from '@/components/app'
import datatypetag from '@/components/datatypetag'

import simpleprocessarchive from '@/simpleprocessarchive'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    props: [ 'instance' ],

    components: { 
        sidemenu, contact, task, 
        message, file, tags, 
        metadata, filebrowser, pageheader, 
        appavatar, mute, viewerselect, 
        statustag, app, datatypetag, 
        simpleprocessarchive,
     },

    data () {
        return {
            tasks: null,
            app: null,
            ws: null, //websocket
            show_archive: false, 
            datatypes: null,
            config: Vue.config,
        }
    },

    mounted: function() {
        //for backward compatibility
        if(this.instance.config.dataset_id) {
            this.instance.config.dataset_ids = [this.instance.config.dataset_id];
        }
        if(this.instance.config.main_task_id) {
            this.instance.config.output_task_id = this.instance.config.main_task_id;
        }

        //load datasets used for prov.deps
        var dataset_ids = [];
        if(this.instance.config.prov.deps) this.instance.config.prov.deps.forEach(dep=>{
            dataset_ids.push(dep.dataset);
        });
        this.$http.get('dataset', {params: {
            find: JSON.stringify({_id: dataset_ids}),
            populate: ' ', //load all default
        }})
        .then(res=>{
            res.body.datasets.forEach((dataset)=>{
                this.instance.config.prov.deps.forEach(dep=>{
                    if(dep.dataset == dataset._id) {
                        Vue.set(dep, '_dataset', dataset);
                    }
                });
            });
            //load datatypes
            return this.$http.get('datatype', {params: {
                find: JSON.stringify({
                    //removed: false,
                })
            }});
        })
        .then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach(datatype=>{
                this.datatypes[datatype._id] = datatype;
            });

            //lastly, load things under specified instance
            this.load();
        });
    },

    destroyed() {
        console.log("disconnecting from ws");
        this.ws.close();
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

    watch: {
        'instance': function() {
            console.log("instance updated");
            document.getElementById("scrolled-area").scrollTop = 0;

            this.app = null;
            this.load();
        },
    },

    methods: {
        load() {
            this.show_archive = false;
            if(this.ws) this.ws.close(); //reconnect

            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
            this.ws.onopen = (e)=>{

                this.$http.get(Vue.config.wf_api+'/task', {params: {
                    find: JSON.stringify({
                        instance_id: this.instance._id,
                    }),
                    sort: 'create_date',
                }})
                .then(res=>{
                    this.tasks = res.body.tasks;

                    //load apps
                    console.log("loading app", this.instance.config.prov.app);
                    return this.$http.get('app', {params: {
                        find: JSON.stringify({_id: this.instance.config.prov.app}),
                        populate: 'inputs.datatype outputs.datatype',
                    }})
                })
                .then(res=>{
                    this.app = res.body.apps[0];

                    //subscribe to the instance events
                    this.ws.send(JSON.stringify({
                        bind: {
                            ex: "wf.task",
                            key: Vue.config.user.sub+"."+this.instance._id+".#",
                        }
                    }));
                    this.ws.send(JSON.stringify({
                        bind: {
                            ex: "wf.instance",
                            key: Vue.config.user.sub+"."+this.instance._id,
                        }
                    }));
                  
                    this.ws.onmessage = (json)=>{
                        var event = JSON.parse(json.data);
                        if(event.error) {
                            console.error(event.error);
                            return;
                        }
                        var msg = event.msg;
                        if(!msg || !msg._id) return; //odd..
                        switch(event.dinfo.exchange) {
                        case "wf.task":
                            //look for the task to update
                            var t = this.tasks.find(t=>t._id == msg._id);
                            if(!t) this.tasks.push(msg); //new task?
                            else for(var k in msg) t[k] = msg[k];
                            break;
                        case "wf.instance":
                            this.instance = msg; //TODO shouldn't mutate prop
                            break;
                        default:
                            console.error("unknown exchange", event.dinfo.exchange);
                        }
                    }
                }).catch((err)=>{
                    console.error(err);
                });
            } //ws.onopen
        },

        go: function(path) {
            this.$router.push(path);
        },
        remove: function() {
            this.$emit('remove', this.instance);
        },

        view: function(taskid, view, subdir) {
            this.$emit('view', {instanceid: this.instance._id, taskid,view,subdir});
        },
    },
}
</script>

