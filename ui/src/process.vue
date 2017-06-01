<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/processes"></sidemenu>
    <div v-if="instance && tasks">
        <div class="fixed-top">
            <el-button v-if="!instance.config.removing" @click="remove_instance()" style="float: right;" icon="delete">Remove Process</el-button>

            <h1 style="margin-bottom: 5px; color: #eee;"><icon name="send" scale="1.5"></icon> Process</h1>
            <div class="text-muted">
                <!--<span style="text-transform: uppercase;"><statusicon :status="instance.status"/> <b>{{instance.status}}</b></span> |-->
                <time style="margin-top: 15px;">Created at {{instance.create_date|date}}</time>
            </div>
        </div>

        <div class="sidebar">
            <div style="margin: 0px 10px;">
                <el-button type="primary" size="small" style="float: right; position: relative; top: -8px;"
                    @click="show_input_dialog = true" v-bind:class="{animated: true, headShake: _datasets.length == 0}" icon="plus"> Stage Datasets</el-button>
                <h3>Input Datasets</h3>
                <ul style="padding-left: 20px;">
                    <li v-for="(dataset, idx) in _datasets" :key="idx" v-if="dataset.task.name == 'brainlife.stage_input'" style="margin-bottom: 10px;">
                        <metadata :metadata="dataset.meta"/>
                        {{datatypes[dataset.datatype_id].name}} <tags :tags="dataset.datatype_tags"></tags>
                        <statusicon v-if="dataset.task.status != 'finished'" :status="dataset.task.status"/>
                        <br>
                        <small>{{dataset.name}}</small>
                    </li>
                </ul>
                <br>
                <h3>Produced Datasets</h3>
                <ul style="padding-left: 20px;">
                    <li v-for="(dataset, idx) in _datasets" :key="idx" v-if="dataset.task.name == 'brainlife.stage_output'" style="margin-bottom: 10px;">
                        <metadata :metadata="dataset.meta"/>
                        {{datatypes[dataset.datatype_id].name}} <tags :tags="dataset.datatype_tags"></tags>
                        <statusicon v-if="dataset.task.status != 'finished'" :status="dataset.task.status"/>
                    </li>
                </ul>
            </div>
        </div>

        <div class="main-section">
            <p v-if="instance.status == 'removed' || instance.config.removing">
                <el-alert type="error" title="">This process has been removed</el-alert>
            </p>
            <p>
                <el-input type="textarea" placeholder="Process Description" @change="changedesc()" v-model="instance.desc" :autosize="{minRows: 2, maxRows: 5}"/>
            </p>

            <div v-for="(task, idx) in tasks" :key="idx" class="process">
                <div v-if="task.name == 'brainlife.stage_input'"></div><!--we don't show input-->
                <task :task="task" v-if="task.name == 'brainlife.process'" style="margin-top: 5px;" @remove="remove_task">
                    <el-collapse-item title="Output Datasets" name="output" slot="output" 
                        v-if="_output_tasks[task._id] && _output_tasks[task._id].status == 'finished'">

                        <!--insert slot for output datasets-->
                        <el-card v-for="(dataset, did) in _output_tasks[task._id].config.datasets" :key="did">
                            <b>{{did}}</b> <tags :tags="dataset.datatype_tags"/>
                            <metadata :metadata="dataset.meta"/>
                            <!--{{dataset.desc || dataset.name}}-->
                            <el-button size="small" type="primary" style="float: right;" 
                                v-if="!archiving[task._id] && !dataset.dataset_id" @click="archive(task._id)">Archive</el-button>
                            <el-button size="small" style="float: right;" 
                                v-if="dataset.dataset_id" @click="go('/dataset/'+dataset.dataset_id)">See Archived Dataset <small>{{dataset.dataset_id}}</small></el-button>
                            <!--TODO - show only viewer that makes sense for each data type-->
                            <el-dropdown style="float: right; margin-right: 5px;" @command="view">
                                <el-button size="small"> View <i class="el-icon-caret-bottom el-icon--right"></i> </el-button>
                                <el-dropdown-menu slot="dropdown">
                                    <el-dropdown-item :command="_output_tasks[task._id]._id+'/fslview'">FSLView</el-dropdown-item>
                                    <el-dropdown-item :command="_output_tasks[task._id]._id+'/freeview'">FreeView</el-dropdown-item>
                                    <el-dropdown-item :command="_output_tasks[task._id]._id+'/mrview'">MRView</el-dropdown-item>
                                    <el-dropdown-item :command="_output_tasks[task._id]._id+'/fibernavigator'">FiberNavigator</el-dropdown-item>
                                    <el-dropdown-item :command="_output_tasks[task._id]._id+'/brainview'" disabled divided>BrainView</el-dropdown-item>
                                </el-dropdown-menu>
                            </el-dropdown>

                            <archiveform v-if="archiving[task._id]" 
                                :instance="instance" 
                                :app="newtask_app"
                                :output_task="_output_tasks[task._id]" 
                                :dataset_id="did"
                                :dataset="dataset" 
                                @submitted="archived(task._id)" style="margin-top: 30px;"/>
                        </el-card>
                    </el-collapse-item>
                </task>
            </div>

            <br>
            <el-button v-if="!newprocess" type="primary" @click="start_newprocess()" icon="caret-bottom">New Process</el-button>
            <el-card v-else>
                <h3 slot="header" style="color: #bbb; text-transform: uppercase; margin-bottom: 0px;">New Process</h3>

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
                    <el-form label-width="150px"> 
                        <el-form-item label="Application">
                            <app :app="this.newtask_app" :compact="true" :clickable="false"></app>
                        </el-form-item>

                        <el-form-item label="Description">
                            <el-input type="textarea" placeholder="Description" v-model="newtask_desc" :autosize="{minRows: 2, maxRows: 5}"/>
                        </el-form-item>

                        <el-form-item label="">
                            <el-tabs v-model="submit_mode" type="card">
                                <el-tab-pane label="Single" name="single"></el-tab-pane>
                                <el-tab-pane label="Bulk" name="bulk"></el-tab-pane>
                            </el-tabs> 
                        </el-form-item>

                        <div v-for="(newtask, newtask_idx) in newtasks" :key="newtask_idx" v-if="submit_mode == 'bulk' || newtask_idx == 0">
                            <!--input-->
                            <el-form-item v-if="submit_mode == 'bulk'">
                                <el-checkbox v-model="newtask.submit">Submit</el-checkbox>
                            </el-form-item>
                            <el-form-item v-for="(input, input_id) in newtask.inputs" :label="input_id" :key="input_id">
                                <el-select @change="revalidate()" v-model="newtask.inputs[input_id].dataset" placeholder="Please select input dataset" style="width: 100%;">
                                    <el-option-group key="brainlife.stage_input" label="Input Datasets">
                                        <el-option v-for="(dataset, idx) in _datasets" 
                                            v-if="dataset.datatype_id == input.datatype._id && dataset.task.name == 'brainlife.stage_input'" :key="idx"
                                                :value="idx" :label="'subject:'+dataset.meta.subject + ' | '+dataset.name">
                                            <span v-if="dataset.task.status != 'finished'">(Staging)</span>
                                            <metadata :metadata="dataset.meta"/>
                                            <b>{{dataset.name}}</b> 
                                            <tags :tags="dataset.datatype_tags"></tags> 
                                        </el-option>
                                    </el-option-group>
                                    <el-option-group key="brainlife.stage_output" label="Produced Datasets">
                                        <el-option v-for="(dataset, idx) in _datasets" 
                                            v-if="dataset.datatype_id == input.datatype._id && dataset.task.name == 'brainlife.stage_output'" :key="idx"
                                                :value="idx" :label="dataset.meta.subject+' '+dataset.name">
                                            <span v-if="dataset.task.status != 'finished'">(Processing)</span>
                                            <b>{{dataset.name}}</b> 
                                            <tags :tags="dataset.datatype_tags"></tags> | <metadata :metadata="dataset.meta"/>
                                        </el-option>
                                    </el-option-group>
                                </el-select>
                                <el-alert v-if="input.error" :title="input.error" type="error"/>
                            </el-form-item>

                            <el-form-item v-for="(v,k) in newtask.config" :label="k" :key="k" v-if="!v.type"><!-- v-if="typeof v == 'string' || typeof v == 'number'">-->
                                <el-input v-if="typeof v == 'string'" v-model="newtask.config[k]"/>
                                <el-input-number v-if="typeof v == 'number'" v-model="newtask.config[k]" :step="2"/>
                                <el-checkbox v-if="typeof v == 'boolean'" v-model="newtask.config[k]" style="margin-top: 9px;"/>
                            </el-form-item>

                            <!--
                            <el-form-item>
                                <div style="border-bottom: 1px solid #ddd;"></div>
                            </el-form-item>
                            -->
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
            <el-card v-if="config.debug">
                <div slot="header">Debug</div>
                <div v-if="newtasks">
                    <h3>newtasks</h3>
                    <pre v-highlightjs="JSON.stringify(newtasks, null, 4)"><code class="json hljs"></code></pre>
                </div>
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
        </div><!--main-section-->

        <el-dialog title="Stage Datasets" :visible.sync="show_input_dialog">
            <!--<p class="text-muted">need to stage your datasets to be processed.</p>-->
            <el-tabs v-model="input_dialog.mode">
                <el-tab-pane label="Selected Datasets" name="selected">
                    <p class="text-muted" v-if="Object.keys(selected).length == 0">Please go to <a href="#/datasets">Datasets</a> page to select datasets.</p>
                    <p class="text-muted" v-else>We will stage following datasets you have selected.</p>
                    <ul style="list-style: none;margin: 0px; padding: 0px; max-height: 200px; overflow: auto;">
                        <li v-for="(select, did) in selected" :key="did" style="margin-bottom: 2px;">
                            <metadata :metadata="select.meta"/>
                            {{select.name}} 
                            <tags :tags="select.datatype_tags"></tags>
                        </li>
                    </ul>
                </el-tab-pane>
                <el-tab-pane label="From Warehouse" name="warehouse">
                    <el-form label-width="120px">
                    <el-form-item label="Project">
                        <projectselector v-model="input_dialog.project" @change="input_project_changed(project)"/>
                    </el-form-item>
                    <el-form-item label="Dataset">
                        <el-select v-model="input_dialog.dataset" placeholder="Select Dataset" style="width: 100%;">
                            <el-option-group v-for="(datasets, subject) in input_dialog.datasets_groups" :key="subject" :label="subject">
                                <el-option v-for="dataset in datasets" 
                                    :key="dataset._id" 
                                    :label="subject+' | '+datatypes[dataset.datatype].name+' | '+dataset.name+' | '+dataset.create_date" 
                                    :value="dataset._id"><b>{{datatypes[dataset.datatype].name}}</b> {{dataset.name}} <tags :tags="dataset.datatype_tags"></tags> <span class="text-muted">{{dataset.create_date|date}}</span></el-option>
                            </el-option-group>
                        </el-select>
                    </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
            <span slot="footer" class="dialog-footer">
                <el-button @click="show_input_dialog = false">Cancel</el-button>
                <el-button type="primary" @click="stage()" icon="check">Stage</el-button>
            </span>
        </el-dialog>
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
import metadata from '@/components/metadata'
import appavatar from '@/components/appavatar'
import app from '@/components/app'
import archiveform from '@/components/archiveform'
import projectselector from '@/components/projectselector'
import statusicon from '@/components/statusicon'

import ReconnectingWebSocket from 'reconnectingwebsocket'

var debounce = null;

export default {
    components: { 
        sidemenu, 
        contact, 
        task, 
        message, 
        file, 
        tags, 
        metadata, 
        filebrowser, 
        pageheader, 
        appavatar,
        app, 
        archiveform, 
        projectselector,
        statusicon,
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
            input_dialog: {
                mode: "selected",

                //for warehouse download
                project: null,
                dataset: null, //selected dataset
                datasets_groups: {}, //group by subject
            },

            selected: JSON.parse(localStorage.getItem('datasets.selected')) || {},
            archiving: {},

            //cache
            tasks: null,
            datasets: {}, 
            datatypes: {}, 

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
            var datasets = [];
            this.tasks.forEach(task=>{
                if(task.status == "removed") return;
                if(task.status == "stopped") return;
                switch(task.name) {
                case "brainlife.stage_input": 
                case "brainlife.stage_output": 
                    for(var did in task.config.datasets) {
                        var dataset = task.config.datasets[did];
                        datasets.push({
                            datatype_id: dataset.datatype,
                            datatype_tags: dataset.datatype_tags,
                            name: dataset.name,
                            desc: dataset.desc,
                            meta: dataset.meta,
                            task: task,
                            path: did, //where inside this task the dataset is stored
                        });
                    }
                    break;
                }
            }); 
            return datasets;
        },

        //return brainlife.stage_output tasks that's keyed by the parent task for easy lookup
        _output_tasks: function() {
            var tasks = {};
            this.tasks.forEach(task=>{
                if(task.name == "brainlife.stage_output") {
                    tasks[task.deps[0]] = task;
                }
            });
            return tasks;
        }
        
        /*
        _input_tasks: function() {
            return this.tasks.filter(task=>task.name == "brainlife.stage_input");
        },
        _input_datasets: function() {
            var datasets = {};
            this._input_tasks.forEach(task=>{
                for(var did in task.config.datasets) {
                    datasets[did] = task.config.datasets[did];
                }
            });
            return datasets;
        },
        */
    },

    watch: {
        '$route': function() {
            this.load(function(err) {
                if(err) console.error(err);
            });
        },
        'input_dialog.project': function(p) {
            //load datasets under this project (TODO - we should do on-the-fly search eventually)
            this.$http.get('dataset', {params: {
                find: JSON.stringify({
                    project: p,
                    removed: false,
                }),
                limit: 1000,
            }}).then(res=>{
                //group by subject
                this.input_dialog.datasets_groups = {};
                res.body.datasets.forEach(dataset=>{
                    var subject = dataset.meta.subject;
                    if(!this.input_dialog.datasets_groups[subject]) this.input_dialog.datasets_groups[subject] = [];
                    this.input_dialog.datasets_groups[subject].push(dataset);
                });
            });
        },
    },

    methods: {
        changedesc: function() {
            clearTimeout(debounce);
            debounce = setTimeout(this.save_instance, 1000);        
        },

        save_instance: function() {
            //console.dir(this.instance.desc);
            this.$http.put(Vue.config.wf_api+'/instance/'+this.instance._id, this.instance).then(res=>{
                this.$notify({
                    title: 'Saved',
                    message: 'Updated process detail',
                    type: 'success',
                });
            });
        },

        go: function(path) {
            this.$router.push(path);
        },
        remove_instance: function() {
            this.$http.delete(Vue.config.wf_api+'/instance/'+this.instance._id).then(res=>{
                this.$router.push('/processes');
            });
        },
        remove_task: function(id) {
            //the specified task (id) is already removed by <task> component, but I need to remove all tasks that depends on it also
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
        view: function(url) {
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
                        //name: {$ne: "brainlife.novnc"},
                    })
                }})
            })
            .then(res=>{
                this.tasks = res.body.tasks;

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

        stage: function() {
            if(this.input_dialog.mode == "selected") this.stage_selected();
            if(this.input_dialog.mode == "warehouse") this.stage_dataset();
        },

        stage_dataset: function() {
            //console.log(this.input_dialog);
            this.show_input_dialog = false;
            var did = this.input_dialog.dataset;
            if(!did) return;

            //need to look for this dataset
            for(var subject in this.input_dialog.datasets_groups) {
                var datasets = this.input_dialog.datasets_groups[subject];
                datasets.forEach(dataset=>{
                    if(dataset._id == this.input_dialog.dataset) {
                        var o = {};
                        o[this.input_dialog.dataset]= dataset;
                        this.submit_stage(o);
                    }
                });
            }
        },

        stage_selected: function() {
            this.show_input_dialog = false;
            this.submit_stage(this.selected);
        },

        submit_stage: function(datasets) {
            var download = [];
            for(var did in datasets) {
                download.push({
                    url: Vue.config.api+"/dataset/download/"+did+"?at="+Vue.config.jwt,
                    untar: "gz",
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
            });
        },

        start_newprocess: function() {
            this.newprocess = true;
            this.newtasks = [];

            //create list of all datatypes that user has staged / generated
            var datatype_ids = [];
            this._datasets.forEach(dataset=>{
                if(!~datatype_ids.indexOf(dataset.datatype_id)) datatype_ids.push(dataset.datatype_id);
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
                        config[k] = v.default;        
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
            this._datasets.forEach((dataset, idx)=>{
                var newtask = {
                    submit: true,
                    config: Object.assign({}, app.config),
                    deps: [],
                    inputs: {},
                };
                this.set_default(newtask.config);
                this.newtask_app.inputs.forEach(input=>{
                    newtask.inputs[input.id] = Object.assign({dataset: null}, input); //copy
                    if(input.datatype._id == this._datasets[idx].datatype_id) {
                        newtask.inputs[input.id].dataset = idx;
                    }
                });
                this.newtasks.push(newtask); 
            });
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

        archive: function(task_id) {
            Vue.set(this.archiving, task_id, true);
        },
        archived: function(task_id) {
            Vue.set(this.archiving, task_id, false);
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
                            var dataset = this._datasets[input.dataset];
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

        submit_newprocess: function() {
            if(!this.validate()) {
                this.$notify.error({ title: 'Error', message: 'Please correct the form' });
            } else {
                this.submitting = true;
                this.newtasks.forEach((newtask, idx)=>{
                    if(!newtask.submit) return;
                    if(this.submit_mode == "single" && idx > 0) return; 

                    this.process_input_config(newtask, newtask.config);

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
                        var datasets = {};
                        //aggregate all metadata from inputs to fake output metadata
                        //TOOD - I think each app should produce this (and/or let user override it?)
                        var agg_meta = {};
                        for(var input_id in newtask.inputs) {
                            var input = newtask.inputs[input_id];
                            var dataset = this._datasets[input.dataset];
                            for(var k in dataset.meta) {
                                agg_meta[k] = dataset.meta[k];
                            }
                        }
                        this.newtask_app.outputs.forEach(output=>{
                            if(output.files) {
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
                            datasets[output.id] = output;
                        });

                        /*
                        //store some extra provenance info needed when user archive output dataset
                        var _prov = {
                            app: this.newtask_app._id,
                            deps: [],
                        };
                        for(var input_id in newtask.inputs) {
                            var input = newtask.inputs[input_id];
                            var dataset = this._datasets[input.dataset];
                            debugger;
                            _prov.deps.push({input_id, dataset: dataset._id});
                        } 
                        */
        
                        this.$http.post(Vue.config.wf_api+'/task', {
                            instance_id: this.instance._id,
                            name: "brainlife.stage_output",
                            service: "soichih/sca-product-raw",
                            config: { symlink },
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
right: 350px;
top: 140px;
bottom: 0px;
overflow: auto;
}
.fixed-top {
background-color: #666;
padding: 20px;
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
top: 140px;
bottom: 0px;
width: 350px;
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
</style>
