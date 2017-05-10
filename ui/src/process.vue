<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/processes"></sidemenu>
    <div v-if="instance && tasks">
        <div class="fixed-top">
            <el-button @click="remove()" style="float: right;">
                <icon name="trash"></icon> Remove Process
            </el-button>

            <!--
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/processes' }">Processes</el-breadcrumb-item>
                <el-breadcrumb-item>{{instance._id}}</el-breadcrumb-item>
            </el-breadcrumb>
            -->

            <h1><icon name="send" scale="2"></icon> Process</h1>
            <span style="text-transform: uppercase;">{{instance.status}}</span> |
            <time style="margin-top: 15px;">Created at {{instance.create_date|date}}</time>
        </div>

        <div class="sidebar">
            <div style="margin: 0px 10px;">
                <h3>Input Datasets</h3>
                <el-card v-for="(dataset, idx) in _datasets" :key="idx" v-if="dataset.task.name == 'brainlife.stage_input'" style="margin-bottom: 10px; font-size: 90%;">
                    <div slot="header">
                        {{dataset.task.status}}
                        {{dataset.datatype_id}}
                        <tags :tags="dataset.datatype_tags"></tags>
                    </div> 
                    <metadata :metadata="dataset.meta"></metadata>
                    <b>{{dataset.name}}</b><br>
                    <small class="text-muted">{{dataset.desc}}</small>
                </el-card>
                <el-button type="primary" @click="show_input_dialog = true" v-bind:class="{animated: true, headShake: _datasets.length == 0}"><icon name="plus"/> Stage Datasets</el-button>
                <br>
                <br>
                <h3>Output Datasets</h3>
                <el-card v-for="(dataset, idx) in _datasets" :key="idx" v-if="dataset.task.name == 'brainlife.stage_output'" style="margin-bottom: 10px; font-size: 90%;">
                    <div slot="header">
                        {{dataset.task.status}}
                        {{dataset.datatype_id}}
                        <tags :tags="dataset.datatype_tags"></tags>
                    </div> 
                    <metadata :metadata="dataset.meta"></metadata>
                    <b>{{dataset.name}}</b><br>
                    <small class="text-muted">{{dataset.desc}}</small>
                </el-card>
            </div>
        </div>

        <div class="main-section">
            <p>
                <el-input type="textarea" placeholder="Process Description" @change="changedesc()" v-model="instance.desc" :autosize="{minRows: 2, maxRows: 5}"/>
            </p>
            <!--<h2>Processing</h2>-->
            <!--
            <p v-if="_datasets.length == 0">
                <el-alert type="info" title="Please stage datasets to process."/>
            </p>
            -->
            <div v-for="(task, idx) in tasks" :key="idx" class="process">
                <task :task="task" v-if="task.name == 'brainlife.process'"/>
                <div v-if="task.name == 'brainlife.stage_output' && task.status == 'finished'" class="process-output">
                    <h4 style="color: white;">Output Datasets</h4>
                    <el-card v-for="(dataset, input_id) in task.config.datasets">
                        <b>{{input_id}}</b> <tags :tags="dataset.datatype_tags"/> <small>{{dataset.datatype}}</small>
                        <metadata :metadata="dataset.meta"/>
                        <el-button size="small" type="primary" style="float: right;" 
                            v-if="!dataset.archiving && !dataset.dataset_id" @click="archive(dataset)">Archive ..</el-button>
                        <el-button size="small" style="float: right;" 
                            v-if="dataset.dataset_id" @click="go('/dataset/'+dataset.dataset_id)">See Archived Dataset <small>{{dataset.dataset_id}}</small></el-button>
                        <archiveform v-if="dataset.archiving == true" 
                            :instance="instance" 
                            :input_id ="input_id" 
                            :task="task" 
                            :dataset="dataset" @submitted="archived(dataset)" style="margin-top: 30px;"/>
                    </el-card>
                </div>
            </div>

            <br>
            <el-button v-if="!newprocess" type="primary" @click="start_newprocess()">New Process <icon name="caret-down"/></el-button>
            <el-card v-else>
                <h3 slot="header" style="color: #bbb; text-transform: uppercase; margin-bottom: 0px;">New Process</h3>

                <!--newprocess form-->
                <transition name="fade">
                <div v-if="apps">
                    <p class="text-muted">You can submit following application(s) with currently available dataset.</p>
                    <div v-for="app in apps" :key="app._id" @click="selectapp(app)">
                        <app :app="app" :compact="true" :clickable="false" class="clickable"/>
                    </div>
                    <el-button @click="close_newprocess()">Cancel</el-button>
                </div>
                </transition>

                <transition name="fade">
                <div v-if="this.newtask_app">
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
                                <el-tab-pane label="Bulk" name="bulk">
                                    <p class="text-muted">Submit process for each input datasets</p>
                                </el-tab-pane>
                            </el-tabs> 
                        </el-form-item>

                        <div v-for="(newtask, newtask_idx) in newtasks" :key="newtask_idx">
                            <!--input-->
                            <el-form-item v-for="(input, input_id) in newtask.inputs" :label="input_id" :key="input_id">
                                <el-select @change="revalidate()" v-model="newtask.inputs[input_id].dataset" placeholder="Please select input dataset" style="width: 100%;">
                                    <el-option-group key="brainlife.stage_input" label="Input Datasets">
                                        <el-option v-for="(dataset, idx) in _datasets" 
                                            v-if="dataset.datatype_id == input.datatype._id && dataset.task.name == 'brainlife.stage_input'" :key="idx"
                                                :value="idx" :label="dataset.name+' | subject:'+dataset.meta.subject">
                                            <span v-if="dataset.task.status != 'finished'">(Staging)</span>
                                            <b>{{dataset.name}}</b> 
                                            <tags :tags="dataset.datatype_tags"></tags>
                                            | <metadata :metadata="dataset.meta"/>
                                        </el-option>
                                    </el-option-group>
                                    <el-option-group key="brainlife.stage_output" label="Generated Datasets">
                                        <el-option v-for="(dataset, idx) in _datasets" 
                                            v-if="dataset.datatype_id == input.datatype._id && dataset.task.name == 'brainlife.stage_output'" :key="idx"
                                                :value="idx" :label="dataset.meta.subject+' '+dataset.name">
                                            <span v-if="dataset.task.status != 'finished'">(Processing)</span>
                                            <b>{{dataset.name}}</b> 
                                            <tags :tags="dataset.datatype_tags"></tags>
                                            | <metadata :metadata="dataset.meta"/>
                                        </el-option>
                                    </el-option-group>
                                </el-select>
                                <el-alert v-if="input.error" :title="input.error" type="error"/>
                            </el-form-item>

                            <el-form-item v-for="(v,k) in newtask.config" :label="k" :key="k" v-if="typeof v == 'string' || typeof v == 'number'">
                                <el-input v-if="typeof v == 'string'" v-model="newtask.config[k]"/>
                                <el-input-number v-if="typeof v == 'number'" v-model="newtask.config[k]" :step="2"/>
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
    </div>

    <el-dialog title="Stage Datasets" :visible.sync="show_input_dialog">
        <p class="text-muted">You need to stage your datasets to be processed.</p>
        <el-form label-width="120px">
            <el-form-item label="Load from">
                <el-select v-model="input_dialog.mode" placeholder="">
                    <el-option label="All Selected" value="selected"></el-option>
                    <el-option label="Warehouse" value="warehouse"></el-option>
                </el-select>
                <div v-if="input_dialog.mode == 'selected'">
                    <ul>
                        <li v-for="(select, did) in selected">
                            <metadata :metadata="select.meta"/>
                            {{select.name}} 
                            <tags :tags="select.datatype_tags"></tags>
                        </li>
                    </ul>
                </div>
            </el-form-item>
            <div v-if="input_dialog.mode == 'warehouse'">
                <el-form-item label="Project">
                    <projectselector v-model="input_dialog.project"/>
                </el-form-item>
            </div>
        </el-form>
        <span slot="footer" class="dialog-footer">
            <el-button @click="show_input_dialog = false">Cancel</el-button>
            <el-button type="primary" @click="stage_selected()">Stage</el-button>
        </span>
    </el-dialog>


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

import ReconnectingWebSocket from 'reconnectingwebsocket'

//const lib = require('./lib');

var debounce = null;

export default {
    components: { sidemenu, contact, task, message, file, tags, metadata, filebrowser, pageheader, appavatar, app, archiveform, projectselector },

    data() {
        return {
            instance: null,

            //things for newprocess
            newprocess: false, //set to true while submitting new process
            apps: null, //application user can run with selected data

            newtasks: [],
            /*
            newtask: {
                name: null,
                desc: null,
                app: null,
                config: {},
                validated: false,
                inputs: {},
            },
            */
            submit_mode: "single",
            newtask_app: null,
            newtask_desc: "",
            validated: false,

            //dialog
            show_input_dialog: false,
            input_dialog: {
                mode: "selected",
                project: null,
            },

            selected: JSON.parse(localStorage.getItem('datasets.selected')) || {},

            //cache
            tasks: null,
            datasets: {}, 

            config: Vue.config,
        }
    },

    mounted() {
        if(this.$route.params.id == "_new") {
            this.submit_instance(instance=>{
                /*
                //stage all selected
                this.stage_selected(instance, err=>{
                    this.$router.push("/process/"+instance._id);
                });
                */
                this.$router.push("/process/"+instance._id);
            });
        } else {
            this.load();
        }
    },

    /*
    event: {
        dataset_archived: function(dataset) {
            console.log("dataset_archived");
            dataset.archiving = false;
        },
    },
    */

    computed: {
        /*
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
        */

        //list of available datasets (staged, or generated)
        _datasets: function() {
            var datasets = [];
            this.tasks.forEach(task=>{
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
        
        /*
        _process_tasks: function() {
            return this.tasks.filter(task=>task.name == "brainlife.process");
        },
        */
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
    },

    watch: {
        '$route': function() {
            this.load(function(err) {
                if(err) console.error(err);
            });
        }

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
        remove: function() {
            //this.messages.push({msg: "Removed", cls: {info: true}});
            this.$http.delete(Vue.config.wf_api+'/instance/'+this.instance._id).then(res=>{
                this.$router.push('/processes');
            });
        },
        view: function(type) {
            window.open("#/view/"+this.instance._id+"/"+this.output_task._id+"/"+type, "", "width=1200,height=800,resizable=no,menubar=no"); 
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
                        //name: {$ne: "brainlife.novnc"},
                    })
                }})
            })
            .then(res=>{
                this.tasks = res.body.tasks;

                /*
                //classify tasks
                this.tasks.forEach(task=>{
                    switch(task.name) {
                        case "brainlife.stage_input": 
                            task._class = "input"; 
                            //collect list of datasets
                            for(var did in task.config.datasets) {
                                this.input_datasets[did] = task.config.datasets[did];
                            }
                            break;
                        case "brainlife.stage_output": 
                            task._class = "output"; 
                            break;
                        case "brainlife.process": 
                            task._class = "process"; 
                            break;
                    }
                });
                */

                //load datasets used by config.input
                var dataset_ids = [];
                this.tasks.forEach(task=>{
                    if(task.config.inputs) {
                        for(var input_id in task.config.inputs) { 
                            dataset_ids.push(task.config.inputs[input_id].dataset);
                        }
                    }
                });

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
        },

        stage_selected: function() {
            this.show_input_dialog = false;

            var download = [];
            for(var did in this.selected) {
                download.push({
                    url: Vue.config.api+"/dataset/download/"+did+"?at="+Vue.config.jwt,
                    untar: "gz",
                    dir: did,
                });
            }
            //now submit task to download data from archive
            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: this.instance._id,
                name: "brainlife.stage_input",
                desc: "Stage Input for "+task.name,
                service: "soichih/sca-product-raw",
                config: { download, datasets: this.selected },
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
                    case "string":
                    case "integer":
                        config[k] = v.default;        
                        break;
                    case "input":
                        config.input = this.newtask_app.inputs[v.input_id];
                        config.dataset = null;
                    }
                } else this.set_default(v); //recurse on primitive
            }
        },

        selectapp: function(app) {
            this.apps = null;
            this.newtask_app = app;
            this.validated = false;

            //load datasets with applicable datatypes (will filter later)
            //TODO --- no, I should only allow input datasets, or datasets generated from other process
            var datatype_ids = app.inputs.map(input=>input.datatype._id);
            this.$http.get('dataset', {params: {
                find: JSON.stringify({
                    datatype: {$in: datatype_ids},
                    removed: false,
                })
            }}).then(res=>{
                var newtask = {
                    name: 'brainlife.process',
                    //config: this.generate_default(app),
                    config: Object.assign({}, app.config),
                    deps: [],
                    inputs: {},
                };
                this.set_default(newtask.config);
                this.newtask_app.inputs.forEach((input)=>{
                    newtask.inputs[input.id] = Object.assign({dataset: null}, input);
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
            this.newtasks.forEach(newtask=>{
                for(var iid in newtask.inputs) {
                    var input = newtask.inputs[iid];
                    Vue.set(input, 'error', null);
                    if(input.dataset === null) {
                        valid = false;
                        input.error = "Please select input";
                    }
                }
            });
            this.validated = true;
            return valid;
        },

        archive: function(dataset) {
            console.log("opend----------------", dataset);
            Vue.set(dataset, 'archiving', true);
        },
        archived: function(dataset) {
            console.log("closed----------------", dataset);
            Vue.set(dataset, 'archiving', false);
        },

        //recursively update configuration with given newtask
        process_input_config: function(newtask, config) {
            for(var k in config) { 
                var node = config[k];
                if(!node) return;
                if(node.isArray) {
                    console.log("todo.. array!");
                } else if(typeof node === 'object') {
                    if(node.type) {
                        switch(node.type) {
                        case "input":
                            //clear this node
                            for(var _k in config) delete config[_k];
                            //find the file
                            var input = newtask.inputs[node.input_id];
                            var dataset = this._datasets[input.dataset];
                            console.log("input", input);
                            console.log("datasets", dataset);
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

                this.newtasks.forEach(newtask=>{
                    this.process_input_config(newtask, newtask.config);
                    console.log("newtask", newtask); 
                    
                    //submit the app
                    this.$http.post(Vue.config.wf_api+'/task', {
                        instance_id: this.instance._id,
                        name: newtask.name,
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
                                    output.datatype.files.forEach(datatype_file=>{
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
                        
                            output.name = "process output from "+newtask.name;
                            output.meta = agg_meta;
                            datasets[output.id] = output;
                        });
                        this.$http.post(Vue.config.wf_api+'/task', {
                            instance_id: this.instance._id,
                            name: "brainlife.stage_output",
                            service: "soichih/sca-product-raw",
                            config: { symlink, datasets },
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
background-color: white;
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
border-bottom: 1px solid #eee;
}
.process-output {
padding: 10px 20px;
background-color: #ccc;
box-shadow: inset 0px 2px 2px #999;
margin-bottom: 20px;
}
</style>
