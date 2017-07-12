<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/processes"></sidemenu>
    <div v-if="instance && tasks">
        <div class="fixed-top">
            <el-button v-if="!instance.config.removing" @click="remove_instance()" style="float: right;" icon="delete">Remove Process</el-button>

            <div style="float: right; margin-right: 20px; margin-top: 10px;">
                <time style="margin-top: 15px;">Created at <b>{{instance.create_date|date}}</b></time>
            </div>
            <h1>
                <icon name="send" scale="1.7"></icon> Process
                <statustag :status="instance.status"></statustag>
            </h1>
        </div>

        <div class="sidebar">
            <div style="margin: 0px 10px;">
                <el-button type="primary" size="small" style="float: right; position: relative; top: -8px;"
                    @click="show_input_dialog = true" v-bind:class="{animated: true, headShake: _datasets.length == 0}" icon="plus"> Stage Datasets</el-button>
                <h3>Input Datasets</h3>
                <div v-for="(dataset, idx) in _datasets" :key="idx" class="dataset clickable"
                    @click="go('/dataset/'+dataset.did)"
                    v-if="dataset.task.name == 'brainlife.stage_input'">
                    <mute>D{{idx}}</mute> 
                    <b>{{dataset.meta.subject}}</b>
                    <datatypetag :datatype="datatypes[dataset.datatype]" :tags="dataset.datatype_tags"></datatypetag>
                    <time>{{dataset.create_date|date('%x')}}</time>
                    <mute>
                        <small v-if="dataset.task.status != 'finished'">
                            <statusicon :status="dataset.task.status"></statusicon> Staging
                        </small>
                        <!--<icon v-else-if="dataset.task.status == 'finished'" name="check" style="color: green;"/>-->
                    </mute>
                </div>

                <br>
                <h3>Output Datasets</h3>
                <div v-for="(dataset, idx) in _datasets" :key="idx" class="dataset clickable"
                    @click="scrollto(dataset.task._id)"
                    v-if="dataset.task.name == 'brainlife.stage_output'">
                    <!-- 
                        tasks used to organize generated output datasets are hidden, 
                        so to display the actual task ID of the apps themselves, I assume that 
                        (task id) - 1 will yeild the correct task ID.
                        I should probaly generate a unique task ID (within the process)
                        for each task submitted, then use that as more permanent ID
                    -->
                    <mute><b>T{{tasks.indexOf(dataset.task)-1}}</b> <icon name="arrow-right" scale="0.8"></icon></mute> D{{idx}}
                    <b v-if="dataset.meta">{{dataset.meta.subject}}</b>
                    <datatypetag :datatype="datatypes[dataset.datatype]" :tags="dataset.datatype_tags"></datatypetag>
                    <time v-if="dataset.create_date">{{dataset.create_date|date('%x')}}</time>
                    <mute>
                        <small v-if="dataset.task.status != 'finished'">
                            <statusicon :status="dataset.task.status"/>Processing
                        </small>

                        <span v-if="dataset.dataset_id">
                            <el-button size="mini" @click="go('/dataset/'+dataset.dataset_id)" type="success" icon="check">Archived</el-button>
                        </span>
                        <!--
                        <icon v-else-if="dataset.task.status == 'finished'" name="check" style="color: green;"/>
                        -->
                    </mute>
                </div>
            </div>
        </div>

        <div class="main-section" id="scrolled-area">
            <p v-if="instance.status == 'removed' || instance.config.removing">
                <el-alert type="error" title="">This process has been removed</el-alert>
            </p>
            <p>
                <el-input type="textarea" placeholder="Process Description" 
                    @change="changedesc()" 
                    v-model="instance.desc" 
                    :autosize="{minRows: 2, maxRows: 5}"></el-input>
            </p>

            <div v-for="(task, idx) in tasks" :key="idx" class="process">
                <div v-if="task.name == 'brainlife.stage_input'"></div><!--we don't show input-->

                <task style="margin-top: 5px;" 
                    :task="task" :prov="task.config._prov" v-if="task._id && task.name == 'brainlife.process'" @remove="task_removed">

                    <!--header-->
                    <div slot="header" class="task-header">
                        <div style="float: left" v-if="_output_tasks[task._id]">
                            <!--why using _output_task's id? I use this to jump from the output dataset list on the sidebar.. 
                            and I am too lazy to lookup the main task id from the output task id-->
                            <h3 :id="_output_tasks[task._id]._id"><mute>T{{idx}}</mute></h3>
                        </div>
                        <div v-if="task.config._prov" style="margin-left: 50px;">
                            <!--task.config._prov.app.id is deprecated -->
                            <app :appid="task.config._prov.app.id || task.config._prov.app" :compact="true"></app>
                        </div>
                        <div v-if="!task.config._prov" style="margin-left: 50px">
                            <h3 style="margin-bottom: 0px; color: #666;">{{task.service}} <mute>{{task.name}}</mute></h3>
                            <mute>{{task.desc}}</mute>
                        </div>
                    </div>

                    <!--input-->
                    <el-collapse-item title="Input" name="input" slot="input" v-if="task.config._prov">
                        <div v-for="(did, input_id) in task.config._prov.inputs" :key="input_id" 
                        v-if="find_dataset(did)" style="min-height: 30px;">
                            <el-row>
                            <el-col :span="4">
                                <b>{{input_id}}</b>
                            </el-col>
                            <el-col :span="20" v-if="find_dataset(did)">
                                <mute>D{{find_dataset_idx(did)}}</mute>
                                <b>{{find_dataset(did).meta.subject}}</b>
                                <datatypetag :datatype="datatypes[find_dataset(did).datatype]" 
                                    :tags="find_dataset(did).datatype_tags"></datatypetag>
                                <el-button size="small" @click="download(did)" style="float: right">Download</el-button>
                            </el-col>
                            </el-row>
                        </div>
                    </el-collapse-item>

                    <!--output-->
                    <el-collapse-item title="Output" name="output" slot="output" v-if="_output_tasks[task._id]">
                        <!--
                        <p v-if="_output_tasks[task._id].status != 'finished'" class="text-muted">
                            <statusicon :status="_output_tasks[task._id].status"></statusicon> Organizing Output
                        </p>
                        -->

                        <div v-for="(dataset, output_id) in _output_tasks[task._id].config._prov.output_datasets" :key="output_id" 
                            style="min-height: 30px;" :class="{'text-muted': _output_tasks[task._id].status != 'finished'}">
                            <el-row>
                            <el-col :span="4">
                                <b>{{output_id}}</b>
                            </el-col>
                            <el-col :span="20">
                                <!-- id is used to jump to this data from the sidebar output datasets list -->
                                <mute :id="_output_tasks[task._id]._id+'/'+output_id">
                                    D{{find_dataset_idx(_output_tasks[task._id]._id+"/"+output_id)}}
                                </mute>

                                <b>{{dataset.meta.subject}}</b>
                                <datatypetag :datatype="datatypes[dataset.datatype]" 
                                    :tags="dataset.datatype_tags"></datatypetag>

                                <div style="float: right;">
                                    <div v-if="_output_tasks[task._id].status == 'finished'">
                                        <viewerselect @select="view(_output_tasks[task._id]._id, $event)" style="margin-right: 5px;"></viewerselect>
                                        <el-button size="small" type="primary"
                                            v-if="!dataset.archiving && !dataset.dataset_id" @click="show_archiveform(dataset)">Archive</el-button>
                                        <el-button size="small" 
                                            v-if="dataset.dataset_id" @click="go('/dataset/'+dataset.dataset_id)" icon="check">Archived</el-button>
                                    </div>
                                    <statustag v-else :status="_output_tasks[task._id].status"/>
                                </div>

                                <archiveform v-if="dataset.archiving" 
                                    :instance="instance" 
                                    :app_id="_output_tasks[task._id].config._prov.app"
                                    :output_task="_output_tasks[task._id]" 
                                    :dataset_id="output_id"
                                    :dataset="dataset" 
                                    @submitted="hide_archiveform(dataset)" style="margin-top: 30px;"></archiveform>
                            </el-col>
                            </el-row>

                            <datatypeui v-if="_output_tasks[task._id].status == 'finished'" 
                                :datatype="datatypes[dataset.datatype].name" :task="_output_tasks[task._id]" :subdir="output_id"></datatypeui>
                        </div>
                    </el-collapse-item>
                </task>
            </div>

            <el-button v-if="!newprocess" type="primary" @click="start_newprocess()" icon="caret-bottom">New Task</el-button>
            <el-card v-else>
                <h3 slot="header" style="color: #bbb; text-transform: uppercase; margin-bottom: 0px;">New Task</h3>

                <!--newprocess form-->
                <transition name="fade">
                <div v-if="apps">
                    <p class="text-muted">You can submit following application(s) with currently available dataset.</p>
                    <div v-for="app in apps" :key="app._id" @click="selectapp(app)">
                        <app :app="app" :compact="true" :clickable="false" class="clickable"/>
                    </div>
                    <br>
                    <el-button @click="close_newprocess()">Cancel</el-button>
                </div>
                </transition>

                <transition name="fade">
                <div v-if="this.newtask_app && !this.submitting">
                    <el-form label-width="200px"> 
                        <el-form-item label="Application">
                            <app :app="this.newtask_app" :compact="true" :clickable="false"></app>
                        </el-form-item>

                        <el-form-item label="Description">
                            <el-input type="textarea" placeholder="Description" v-model="newtask_desc" :autosize="{minRows: 2, maxRows: 5}"></el-input>
                        </el-form-item>

                        <div v-for="(newtask, newtask_idx) in newtasks" :key="newtask_idx" v-if="submit_mode == 'bulk' || newtask_idx == 0">
                            <!--input-->
                            <el-form-item v-if="submit_mode == 'bulk'">
                                <el-checkbox v-model="newtask.submit">Submit</el-checkbox>
                            </el-form-item>
                            <el-form-item v-for="(input, input_id) in newtask.inputs" :label="input_id+' '+input.datatype_tags" :key="input_id">
                                <el-select @change="revalidate()" v-model="newtask.inputs[input_id].dataset" 
                                    no-data-text="No dataset available for this datatype / tags"
                                    placeholder="Please select input dataset" 
                                    style="width: 100%;">
                                    <el-option-group key="brainlife.stage_input" label="Input Datasets">
                                        <el-option v-for="(dataset, idx) in filter_datasets(input)"
                                            v-if="dataset.task.name == 'brainlife.stage_input'" :key="idx"
                                                :value="dataset.did" :label="'D'+find_dataset_idx(dataset.did)+' '+dataset.meta.subject+' '+dataset.datatype_tags">
                                            <span v-if="dataset.task.status != 'finished'">(Staging)</span>
                                            D{{find_dataset_idx(dataset.did)}}
                                            <b>{{dataset.meta.subject}}</b> 
                                            <small>{{dataset.datatype_tags.toString()}}</small>
                                        </el-option>
                                    </el-option-group>
                                    <el-option-group key="brainlife.stage_output" label="Output Datasets">
                                        <el-option v-for="(dataset, idx) in filter_datasets(input)" 
                                            v-if="dataset.task.name == 'brainlife.stage_output'" :key="idx"
                                                :value="dataset.did" :label="'T'+(tasks.indexOf(dataset.task)-1)+' > D'+find_dataset_idx(dataset.did)+' | '+dataset.meta.subject+' | '+dataset.datatype_tags">
                                            <span v-if="dataset.task.status != 'finished'">(Processing)</span>
                                            T{{tasks.indexOf(dataset.task)-1}} <icon name="arrow-right" scale="0.8"></icon>
                                            D{{find_dataset_idx(dataset.did)}}
                                            <b>{{dataset.meta.subject}}</b> 
                                            <small>{{dataset.datatype_tags.toString()}}</small>
                                        </el-option>
                                    </el-option-group>
                                </el-select>
                                <el-alert v-if="input.error" :title="input.error" type="error"></el-alert>
                            </el-form-item>

                            <!--TODO - handle nested config? -->
                            <el-form-item v-for="(v,k) in newtask_app.config" :label="k" :key="k" v-if="v.type && v.type != 'input'">
                                <input v-if="v.type == 'float'" type="number" v-model.number="newtask.config[k]" step="0.01">
                                <el-input-number v-if="v.type == 'integer'" v-model="newtask.config[k]"/>
                                <el-input v-if="v.type == 'string'" v-model="newtask.config[k]"/>
                                <el-checkbox v-if="v.type == 'boolean'" v-model="newtask.config[k]" style="margin-top: 9px;"/>
                            </el-form-item>
                        </div>

                        <el-form-item>
                            <el-button @click="close_newprocess()">Cancel</el-button>
                            <el-button type="primary" @click="submit_newprocess()">Submit</el-button>
                        </el-form-item>
                         
                    </el-form>
                </div>
                </transition>
            </el-card>
            <br>
            <br>
            <div v-if="config.debug">
                <h3>Debug</h3>
                <el-collapse v-if="config.debug">
                    <el-collapse-item title="newtasks" name="newtasks" v-if="newtasks">
                        <pre v-highlightjs="JSON.stringify(newtasks, null, 4)"><code class="json hljs"></code></pre>
                    </el-collapse-item> 
                    <el-collapse-item title="instance" name="instance" v-if="instance">
                        <pre v-highlightjs="JSON.stringify(instance, null, 4)"><code class="json hljs"></code></pre>
                    </el-collapse-item> 
                    <el-collapse-item title="_datasets" name="_datasets" v-if="_datasets">
                        <pre v-highlightjs="JSON.stringify(_datasets, null, 4)"><code class="json hljs"></code></pre>
                    </el-collapse-item> 
                    <el-collapse-item title="tasks" name="tasks" v-if="tasks">
                        <pre v-highlightjs="JSON.stringify(tasks, null, 4)"><code class="json hljs"></code></pre>
                    </el-collapse-item> 
                </el-collapse>
            </div>
        </div><!--main-section-->
        <datasetselecter @submit="submit_stage" :visible.sync="show_input_dialog"></datasetselecter>
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
import pageheader from '@/components/pageheader'
import appavatar from '@/components/appavatar'
import app from '@/components/app'
import archiveform from '@/components/archiveform'
import projectselecter from '@/components/projectselecter'
import datasetselecter from '@/components/datasetselecter'
import statusicon from '@/components/statusicon'
import statustag from '@/components/statustag'
import mute from '@/components/mute'
import viewerselect from '@/components/viewerselect'
import datatypeui from '@/components/datatypeui'
import datatypetag from '@/components/datatypetag'

import ReconnectingWebSocket from 'reconnectingwebsocket'

const lib = require('./lib');
var debounce = null;

export default {
    components: { 
        sidemenu, contact, task, 
        message, file, tags, 
        filebrowser, pageheader, statustag,
        appavatar, app, archiveform, 
        projectselecter, statusicon, mute,
        viewerselect, datasetselecter, datatypeui,
        datatypetag,
    },

    data() {
        return {
            instance: null,

            //things for newprocess
            newprocess: false, //set to true while submitting new process
            apps: null, //application user can run with selected data

            newtasks: [],

            submit_mode: "single",
            newtask_app: null,
            newtask_desc: "",
            validated: false,
            submitting: false,

            //dialog
            show_input_dialog: false,

            //cache
            tasks: null,
            datatypes: {}, 
            
            selected_subjects: [],
            selected_datatypes: [],
            selected_tags: [],

            config: Vue.config,
        }
    },

    mounted() {
        //load datatypes
        this.$http.get('datatype', {params: {
            find: JSON.stringify({
                //removed: false,
            })
        }}).then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach(datatype=>{
                this.datatypes[datatype._id] = datatype;
            });

            //then load process
            if(this.$route.params.id == "_new") {
                this.submit_instance(instance=>{
                    this.$router.push("/process/"+instance._id);
                });
            } else {
                this.load();
            }
        });
    },

    computed: {
        //list of available datasets (staged, or generated)
        _datasets: function() {
            console.log("computing _datasets");
            var datasets = [];
            this.tasks.forEach(task=>{
                if(task.status == "removed") return;
                if(task.status == "stopped") return;
                switch(task.name) {
                case "brainlife.stage_input": 
                    //TODO - I should probably store this in config._prov.input_dataset instead of config.dataset?
                    for(var did in task.config.datasets) {
                        var dataset = task.config.datasets[did];
                        datasets.push({
                            did, //"12313123810237128321", "123441aq234234", etc...
                            datatype: dataset.datatype,
                            datatype_tags: dataset.datatype_tags,
                            name: dataset.name,
                            desc: dataset.desc,
                            meta: dataset.meta,
                            create_date: dataset.create_date,
                            dataset_id: dataset.dataset_id, //if archived already
                            task,
                            path: did, //where inside this task the dataset is stored
                            //idx: datasets.length,
                        });
                    }
                    break;
                case "brainlife.stage_output": 
                    for(var did in task.config._prov.output_datasets) {
                        var dataset = task.config._prov.output_datasets[did];
                        datasets.push({
                            did: task._id+"/"+did, //"t1", "dwi", etc..
                            datatype: dataset.datatype,
                            datatype_tags: dataset.datatype_tags,
                            name: dataset.name,
                            desc: dataset.desc,
                            meta: dataset.meta,
                            create_date: task.finish_date, //not sure if this is set?
                            dataset_id: dataset.dataset_id, //if archived already
                            task,
                            path: did, //where inside this task the dataset is stored
                            //idx: datasets.length,
                        });
                    }
                    break;
                }
            }); 
            return datasets;
        },

        //return brainlife.stage_output tasks that's keyed by the parent task for easy lookup
        _output_tasks: function() {
            console.log("_output_tasks computing");
            var tasks = {};
            this.tasks.forEach(task=>{
                if(task.name == "brainlife.stage_output") {
                    tasks[task.deps[0]] = task;
                }
            });
            return tasks;
        },
    },

    watch: {
        '$route': function() {
            this.load(function(err) {
                if(err) console.error(err);
            });
        },
        'input_dialog.project': function(p) {
            this.input_dialog.datasets_groups = {};
        }
    },

    methods: {
        changedesc: function() {
            clearTimeout(debounce);
            debounce = setTimeout(this.save_instance, 1000);        
        },

        save_instance: function() {
            this.$http.put(Vue.config.wf_api+'/instance/'+this.instance._id, this.instance).then(res=>{
                this.$notify({
                    title: 'Saved',
                    message: 'Updated process detail',
                    type: 'success',
                });
            });
        },

        find_dataset_idx: function(did) {
            var idx = null;
            this._datasets.forEach((dataset, _idx)=>{
                if(dataset.did == did) idx = _idx;
            });
            return idx;
        }, 
        find_dataset: function(did) {
            return this._datasets.find(dataset=>{
                return dataset.did == did;
            });
        },

        scrollto: function(id) {
            var elem = document.getElementById(id);
            var top = elem.offsetTop-30;
            document.getElementById("scrolled-area").scrollTop = top;
        },

        go: function(path) {
            this.$router.push(path);
        },

        remove_instance: function() {
            this.$http.delete(Vue.config.wf_api+'/instance/'+this.instance._id).then(res=>{
                this.$router.push('/processes');
            });
        },

        task_removed: function(id) {
            //task component has made removal request
            this.tasks.forEach(task=>{
                if(task._id == id) task.status = "pending_removal"; //psudo status
            });

            //we also need to remove dep tasks
            this.tasks.forEach(task=>{
                if(task.name == "brainlife.stage_output" && task.deps[0] == id) { //assume we only have 1 dep..
                    console.log("found dep to remove", task);
                    this.$http.delete(Vue.config.wf_api+'/task/'+task._id)
                    .then(res=>{
                        console.log("removed dep task", task._id);
                    })
                    .catch(err=>{
                        console.error(err); 
                    });
                }
            });
        },

        view: function(taskid, event) {
            var url = taskid+'/'+event;
            window.open("#/view/"+this.instance._id+"/"+url, "", "width=1200,height=800,resizable=no,menubar=no"); 
        },

        load: function() {
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
                        status: {$ne: "removed"},
                    }),
                    limit: 2000,
                }})
            })
            .then(res=>{
                this.tasks = res.body.tasks;

                //for backward compatibility (remove this eventually)
                this.tasks.forEach(task=>{
                    if(task.name != "brainlife.stage_output") return;
                    if(!task.config) task.config = {};
                    if(!task.config._prov) task.config._prov = {
                        app: null,  //I don't think we have this info
                        output_datasets: task.config.datasets, 
                    };
                });

                if(this._datasets.length == 0) {
                    this.show_input_dialog = true;
                }

                //subscribe to the instance events
                var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
                var ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
                ws.onopen = (e)=>{
                    console.log("websocket opened. binding things for", this.instance._id);
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
                    if(event.error) {
                        console.error(event.error);
                        return;
                    }
                    var msg = event.msg;
                    if(!msg || !msg._id) return; //odd..
                    switch(event.dinfo.exchange) {
                    case "wf.task":
                        //look for the task to update
                        //console.log("received task update", this.tasks);
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

        submit_instance: function(cb) {
            //first create an instance to host all tasks 
            var instance = null;
            this.$http.post(Vue.config.wf_api+'/instance', {
                name: "brainlife.process",
                config: {
                    brainlife: true,
                },
            }).then(res=>{
                console.log("created instance", res.body);
                cb(res.body);
            });
        },

        close_newprocess: function(cb) {
            this.newtask_app = null;
            this.newprocess = false;
            this.submitting = false;
        },

        submit_stage: function(datasets) {
            var download = [];
            for(var did in datasets) {
                //ignore already staged dataset
                if(this.find_dataset(did)) {
                    console.log("ignoring staging request on existing dataset", did);
                    this.$notify.info({ title: 'Info', message: 'Dataset '+did+' is already staged. Skipping.' });
                    return;
                }

                download.push({
                    url: Vue.config.api+"/dataset/download/"+did+"?at="+Vue.config.jwt,
                    untar: "auto",
                    dir: did,
                });
            }
            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: this.instance._id,
                name: "brainlife.stage_input",
                desc: "Stage Input for "+task.name,
                service: "soichih/sca-product-raw",
                config: { download, datasets },
            }).then(res=>{
                console.log("submitted download", res.body.task);
                var task = res.body.task;
                this.tasks.push(task); 

                if(this.newprocess) this.start_newprocess();
            });
        },

        start_newprocess: function() {
            this.newprocess = true;
            this.newtasks = [];

            //create list of all datatypes that user has staged / generated
            var datatype_ids = [];
            this._datasets.forEach(dataset=>{
                if(!~datatype_ids.indexOf(dataset.datatype)) datatype_ids.push(dataset.datatype);
            });

            //now find apps that user can submit
            this.$http.get('app', {params: {
                find: JSON.stringify({
                    "inputs.datatype": {$in: datatype_ids},
                    $or: [
                        { removed: false },
                        { removed: {$exists: false }},
                    ],
                }),
                populate: 'inputs.datatype',
            }})
            .then(res=>{
                //now, pick apps that we have *all* input data types for
                this.apps = [];
                res.body.apps.forEach(app=>{
                    var cansubmit = true;
                    app.inputs.forEach(input=>{
                        if(!~datatype_ids.indexOf(input.datatype._id)) cansubmit = false;

                        //TODO - also check for datatype_tags (set cansubmit to false if it's not compatible)
                    });
                    if(cansubmit) this.apps.push(app);
                });
            }).catch(err=>{
                console.error(err);
            });
        },

        set_default: function(config) {
            for(var k in config) {
                var v = config[k];
                if(v.type) {
                    //assume it's edge
                    switch(v.type) {
                    case "input":
                        //don't do anything for input
                        break;
                    default:
                        config[k] = v.default;//||"";        
                    }
                } else this.set_default(v); //recurse on primitive
            }
        },

        selectapp: function(app) {
            this.apps = null;
            this.newtask_app = app;
            this.validated = false;

            //create task for each input dataset
            //TODO - hide dataset that doesn't apply to this app
            /*
            this._datasets.forEach((dataset, idx)=>{
                var newtask = {
                    submit: true,
                    config: Object.assign({}, app.config),
                    deps: [],
                    inputs: {},
                };
                this.set_default(newtask.config);

                //preselect the dataset
                this.newtask_app.inputs.forEach(input=>{
                    newtask.inputs[input.id] = Object.assign({dataset: null}, input); //copy
                    var applicable_datasets = this.filter_datasets(input);
                    newtask.inputs[input.id].dataset = applicable_datasets.find(dataset=>{return dataset.datatype == input.datatype._id});
                });
                this.newtasks.push(newtask); 
            });
            */
            var newtask = {
                submit: true,
                config: Object.assign({}, app.config),
                deps: [],
                inputs: {},
            };
            this.set_default(newtask.config);
            this.newtask_app.inputs.forEach(input=>{
                newtask.inputs[input.id] = Object.assign({dataset: null}, input); //copy
                //preselect dataset
                //var applicable_datasets = this.filter_datasets(input);
                //newtask.inputs[input.id].dataset = applicable_datasets.find(dataset=>{return dataset.datatype == input.datatype._id});
            });
            this.newtasks.push(newtask); 
        },

        revalidate: function() {
            if(this.validated) this.validate();
        },

        validate: function() {
            var valid = true;
            //make sure all inputs are selected
            this.newtasks.forEach((newtask,idx)=>{
                if(this.submit_mode == "single" && idx > 0) return; 

                for(var iid in newtask.inputs) {
                    var input = newtask.inputs[iid];
                    Vue.set(input, 'error', null);
                    if(newtask.submit && input.dataset === null) {
                        valid = false;
                        input.error = "Please select input";
                    }
                }
            });
            this.validated = true;
            return valid;
        },

        show_archiveform: function(dataset) {
            Vue.set(dataset, 'archiving', true);
        },
        hide_archiveform: function(dataset) {
            Vue.set(dataset, 'archiving', false);
        },

        //select all datasets that meets datatype requirement of 'input', that comes from task with name:task_name
        filter_datasets: function(input) {
            return lib.filter_datasets(this._datasets, input);
        },

        //recursively update configuration with given newtask
        process_input_config: function(newtask, config) {
            for(var k in config) { 
                var node = config[k];
                //if(node) return;
                if(node instanceof Array) {
                    console.log("todo.. array!");
                } else if(typeof node === 'object') {
                    if(node.type) {
                        switch(node.type) {
                        case "input":
                            //find the file
                            var input = newtask.inputs[node.input_id];
                            //var dataset = this._datasets[input.dataset];
                            var dataset = this.find_dataset(input.dataset);
                            if(!~newtask.deps.indexOf(dataset.task._id)) newtask.deps.push(dataset.task._id);
                            //then lookup file_id
                            input.datatype.files.forEach(file=>{
                                if(file.id == node.file_id) {
                                    config[k] = "../"+dataset.task._id+"/"+dataset.path+"/"+(file.filename||file.dirname)
                                }
                            });
                            break;
                        default:
                            config[k] = "unknown_template_type";
                        }
                    } else this.process_input_config(newtask, node); //recurse to child node
                }
            }
        },

        download: function(did) {
            var dataset = this.find_dataset(did);
            var task = dataset.task;
            var path = task.instance_id+'/'+task._id+'/'+did
            var url = Vue.config.wf_api+'/resource/download'+
                '?r='+task.resource_id+
                '&p='+encodeURIComponent(path)+
                '&at='+Vue.config.jwt;
            document.location = url;
        },

        submit_newprocess: function() {
            if(!this.validate()) {
                this.$notify.error({ title: 'Error', message: 'Please correct the form' });
            } else {
                this.submitting = true;
                this.newtasks.forEach((newtask, idx)=>{
                    if(!newtask.submit) return;
                    if(this.submit_mode == "single" && idx > 0) return; 

                    this.process_input_config(newtask, newtask.config);

                    //prepare _prov
                    //TODO - I should probably store this provenance collection on warehouse service 
                    var prov = {
                        //app: this.newtask_app, //this puts everthhing... too much!
                        app: this.newtask_app._id,
                        inputs: {},
                    };
                    for(var id in newtask.inputs) {
                        prov.inputs[id] = newtask.inputs[id].dataset;
                    }
                    newtask.config._prov = prov;

                    console.log("submitting newtask", newtask); 
                    this.$http.post(Vue.config.wf_api+'/task', {
                        instance_id: this.instance._id,
                        name: "brainlife.process",
                        desc: this.newtask_desc,
                        service: this.newtask_app.github, //TODO what if it's docker?
                        config: newtask.config,
                        deps: newtask.deps,
                    }).then(res=>{
                        var task = res.body.task;
                        console.log("submitted task", task);
                        this.tasks.push(task);

                        //////////////////////////////////////////////////////////////////////////////////////////////////
                        //
                        // I also need to submit stage_output task
                        //
                        var symlink = [];
                        var output_datasets = {};
                        //aggregate all metadata from inputs to fake output metadata
                        //TOOD - I think each app should produce this (and/or let user override it?)
                        var agg_meta = {};
                        for(var input_id in newtask.inputs) {
                            var input = newtask.inputs[input_id];
                            var dataset = this.find_dataset(input.dataset);
                            for(var k in dataset.meta) {
                                agg_meta[k] = dataset.meta[k];
                            }
                        }
                        this.newtask_app.outputs.forEach(output=>{
                            if(output.files) {
                                //orgnaize symlink file/dir
                                for(var file_id in output.files) {
                                    //find datatype file id
                                    var datatype = this.datatypes[output.datatype];
                                    datatype.files.forEach(datatype_file=>{
                                        if(datatype_file.id == file_id) {
                                            var name = datatype_file.filename||datatype_file.dirname;
                                            symlink.push({ 
                                                "src": "../"+task._id+"/"+output.files[file_id], 
                                                "dest": output.id+"/"+name 
                                            });
                                        }
                                    });
                                }
                            } else {
                                //copy everything..
                                symlink.push({"src": "../"+task._id, "dest": output.id});
                            }
                        
                            //output.name = "process output from ..";
                            output.meta = agg_meta;
                            output_datasets[output.id] = output;
                        });

                        //store some extra provenance info needed when user archive output dataset
                        var _prov = {
                            app: this.newtask_app._id,
                            output_datasets,
                        };
        
                        this.$http.post(Vue.config.wf_api+'/task', {
                            instance_id: this.instance._id,
                            name: "brainlife.stage_output",
                            service: "soichih/sca-product-raw",
                            config: { symlink, _prov },
                            deps: [ task._id ],
                        }).then(res=>{
                            var output_task = res.body.task;
                            console.log("submitted stage_output task", output_task);
                            this.tasks.push(output_task);
                            this.close_newprocess();
                        });
                    });
                });
            }
        },
    },
}
</script>

<style scoped>
.main-section {
position: fixed;
padding: 20px;
left: 90px;
right: 375px;
top: 125px;
bottom: 0px;
overflow: auto;
}
.fixed-top {
background-color: #666;
padding: 20px;
padding-bottom: 5px;
color: white;
position: fixed;
top: 50px;
left: 90px;
right: 0px;
height: 50px;
z-index: 1;
border-bottom: 1px solid #666;
}
.sidebar {
box-shadow: inset 3px 0px 3px #ccc;
background-color: #ddd;
padding-top: 20px;
position: fixed;
top: 125px;
bottom: 0px;
width: 375px;
right: 0px;
overflow: auto;
}
.sidebar h3 {
color: #999;
padding-bottom: 10px;
margin-bottom: 15px;
border-bottom: 1px solid #ccc;
}
.process-output {
padding: 10px 20px;
background-color: #ccc;
box-shadow: inset 0px 2px 2px #999;
}
.task-header {
margin: 0px;
padding: 15px;
border: 1px solid rgb(230, 230, 230);
border-bottom: none;
background-color: #fff;
border-radius: 8px 8px 0 0;
}
.dataset {
border-bottom: 1px solid #d5d5d5; 
padding: 5px;
}
.dataset.clickable:hover {
background-color: #eee;
}
/*
.el-card.output {
background-color: #d4e4d4;
border: none;
}
.el-card.output.clickable:hover {
background-color: green;
color: white;
}
*/
</style>
