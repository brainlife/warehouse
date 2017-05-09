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
                <div v-for="(dataset, did) in _input_datasets" :key="did" style="margin-bottom: 10px; font-size: 90%;">
                    <metadata :metadata="dataset.meta"></metadata>
                    <b>{{dataset.name}}</b> <tags :tags="dataset.datatype_tags"></tags><br>
                    <small class="text-muted">{{dataset.desc}}</small>
                    <br>
                </div>

                <el-button type="primary" @click="stage_datasets()"><icon name="plus"/> Stage Datasets</el-button>
            </div>
        </div>

        <div class="main-section">
            <p>
                <el-input type="textarea" placeholder="Process Description" @change="changedesc()" v-model="instance.desc" :autosize="{minRows: 2, maxRows: 5}"/>
            </p>
            <!--<h2>Processing</h2>-->
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
                <br v-else>
            </div>

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
                <div v-if="this.newtask.app">
                    <el-form label-width="150px"> 
                        <el-form-item label="Application">
                            <app :app="this.newtask.app" :compact="true" :clickable="false"></app>
                        </el-form-item>
                        <el-form-item label="Description">
                            <el-input type="textarea" placeholder="Description" v-model="newtask.desc" :autosize="{minRows: 2, maxRows: 5}"/>
                        </el-form-item>
                        <!--input-->
                        <el-form-item v-for="(input, input_id) in newtask.inputs" :label="input_id" :key="input_id">
                            <el-select @change="revalidate()" v-model="newtask.inputs[input_id].dataset" placeholder="Please select input dataset" style="width: 100%;">
                                <el-option v-for="(dataset, idx) in _datasets" v-if="dataset.datatype_id == input.datatype._id" :key="idx"
                                    :value="idx" :label="dataset.meta.subject+' '+dataset.name">
                                    <span v-if="dataset.task.status != 'finished'">(Tentative)</span>
                                    <b>{{dataset.name}}</b> 
                                    <tags :tags="dataset.datatype_tags"></tags>
                                    <!--<small class="text-muted">{{dataset.desc}}</small>-->
                                    <!--{{dataset.name}} | {{dataset.create_date|date}}-->
                                    | <metadata :metadata="dataset.meta"/>
                                </el-option>
                            </el-select>
                            <el-alert v-if="input.error" :title="input.error" type="error"/>
                        </el-form-item>

                        <!--config-->
                        <el-form-item v-for="(v,k) in newtask.config" :label="k" :key="k">
                            <el-input v-model="newtask.config[k]"></el-input>
                        </el-form-item>

                        <el-form-item>
                            <el-button @click="close_newprocess()">Cancel</el-button>
                            <el-button type="primary" @click="submit_newprocess()">Submit</el-button>
                        </el-form-item>
                         
                        <!--<pre>{{newtask}}</pre>-->
                    </el-form>
                </div>
                </transition>
            </el-card>
            <br>
            <br>
            <el-card v-if="config.debug">
                <div slot="header">Debug</div>
                <div v-if="newtask">
                    <h3>newtask</h3>
                    <pre v-highlightjs="JSON.stringify(newtask, null, 4)"><code class="json hljs"></code></pre>
                </div>
                <!--
                <div v-if="datasets">
                    <h3>_datasets</h3>
                    <pre v-highlightjs="JSON.stringify(_datasets, null, 4)"><code class="json hljs"></code></pre>
                </div>
                <div v-if="newtask">
                    <h3>newtask</h3>
                    <pre v-highlightjs="JSON.stringify(newtask, null, 4)"><code class="json hljs"></code></pre>
                </div>
                -->
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

import ReconnectingWebSocket from 'reconnectingwebsocket'

//const lib = require('./lib');

var debounce = null;

export default {
    components: { sidemenu, contact, task, message, file, tags, metadata, filebrowser, pageheader, appavatar, app, archiveform },

    data() {
        return {
            instance: null,

            //things for newprocess
            newprocess: false, //set to true while submitting new process
            apps: null, //application user can run with selected data

            newtask: {
                name: null,
                desc: null,
                app: null,
                config: {},
                validated: false,
                inputs: {},
            },

            //cache
            tasks: null,
            datasets: {}, 
            config: Vue.config,
        }
    },

    mounted() {
        if(this.$route.params.id == "_new") {
            this.submit_instance(instance=>{
                //stage all selected
                this.stage_selected(instance, err=>{
                    this.$router.push("/process/"+instance._id);
                });
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
            this.newtask.app = null;
            this.newprocess = false;
        },

        stage_selected: function(instance, cb) {
            var selected = JSON.parse(localStorage.getItem('datasets.selected')) || {};
            var download = [];
            for(var did in selected) {
                //var selected_dataset = selected[did];
                download.push({
                    url: Vue.config.api+"/dataset/download/"+did+"?at="+Vue.config.jwt,
                    untar: "gz",
                    dir: did,
                });
            }
            //now submit task to download data from archive
            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: instance._id,
                name: "brainlife.stage_input",
                desc: "Stage Input for "+task.name,
                service: "soichih/sca-product-raw",
                config: { download, datasets: selected },
            }).then(res=>{
                console.log("submitted download", res.body.task);
                cb();
            });
        },

        stage_datasets: function() {
            alert("todo");
        },

        start_newprocess: function() {
            this.newprocess = true;

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

        generate_default: function(app) {
            var config = {};
            for(var k in app.config) {
                var v = app.config[k];
                if(v.type && v.default) config[k] = v.default;
            }
            return config;
        },

        selectapp: function(app) {
            this.apps = null;

            //load datasets with applicable datatypes (will filter later)
            //TODO --- no, I should only allow input datasets, or datasets generated from other process
            var datatype_ids = app.inputs.map(input=>input.datatype._id);
            this.$http.get('dataset', {params: {
                find: JSON.stringify({
                    datatype: {$in: datatype_ids},
                    removed: false,
                })
            }}).then(res=>{
                /*
                app.inputs.forEach(input=>{
                    Vue.set(this.datasets, input.id, lib.filter_datasets(res.body.datasets, input));
                });
                */

                //reset
                this.newtask.name = 'brainlife.process';
                this.newtask.desc = '';
                this.newtask.config = this.generate_default(app);
                this.newtask.validated = false;
                this.newtask.app = app;

                //setup inputs for newtask 
                this.newtask.inputs = {};
                app.inputs.forEach((input)=>{
                    this.newtask.inputs[input.id] = input;
                    this.$set(input, 'dataset', null);
                });
            });
        },

        revalidate: function() {
            if(this.newtask.validated) this.validate();
        },

        validate: function() {
            var valid = true;
            //make sure all inputs are selected
            for(var iid in this.newtask.inputs) {
                var input = this.newtask.inputs[iid];
                Vue.set(input, 'error', null);
                if(!input.dataset) {
                    valid = false;
                    input.error = "Please select input";
                }
            }
            this.newtask.validated = true;
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

        submit_newprocess: function() {
            if(!this.validate()) {
                this.$notify.error({ title: 'Error', message: 'Validation failed' });
            } else {
                var deps = [];

                //generate task.config from template and selected input
                function handle_obj(obj) {
                    for(var k in obj) { 
                        var node = obj[k];
                        if(!node) return;
                        if(node.isArray) {
                            console.log("todo.. array!");
                        } else if(typeof node === 'object') {
                            if(node.type) {
                                switch(node.type) {
                                case "string":
                                case "integer":
                                    obj[k] = node.value;
                                    break;
                                case "input":
                                    //find the file
                                    var input = this.newtask.inputs[node.input_id];
                                    var dataset = this._datasets[input.dataset];
                                    console.log("input", input);
                                    console.log("datasets", dataset);
                                    if(!~deps.indexOf(dataset.task._id)) deps.push(dataset.task._id);
                                    //then lookup file_id
                                    input.datatype.files.forEach(file=>{
                                        if(file.id == node.file_id) {
                                            obj[k] = "../"+dataset.task._id+"/"+dataset.path+"/"+(file.filename||file.dirname)
                                        }
                                    });
                                    break;
                                default:
                                    obj[k] = "unknown_template_type";
                                }
                            } else handle_obj(node); //recurse
                        }
                    }
                }
                handle_obj.apply(this, [this.newtask.app.config]);
                console.log("newtask", this.newtask); 
                console.log("deps", deps);

                //submit the app
                this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: this.instance._id,
                    name: this.newtask.name,
                    desc: this.newtask.desc,
                    service: this.newtask.app.github, //TODO what if it's docker?
                    config: this.newtask.app.config,
                    deps,
                }).then(res=>{
                    var task = res.body.task;
                    console.log("submitted task", task);
                    this.tasks.push(task);

                    /*
                    //store information about this task in instance.config
                    if(!this.instance.config.processes) this.instance.config.processes = {};
                    this.instance.config.processes[task._id] = {
                        app: this.newtask.app
                    };
                    this.save_instance();
                    */

                    //I also need to submit stage_output task
                    var symlink = [];
                    var datasets = {};

                    //aggregate all metadata from inputs to fake output metadata
                    //TOOD - I think each app should produce this (and/or let user override it?)
                    var agg_meta = {};
                    this.newtask.app.inputs.forEach(input=>{
                        var dataset = this._datasets[input.dataset];
                        for(var k in dataset.meta) {
                            agg_meta[k] = dataset.meta[k];
                        }
                    });

                    this.newtask.app.outputs.forEach(output=>{
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
                    
                        output.name = "process output from "+this.newtask.app.name;
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
right: 300px;
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
background-color: white;
padding-top: 20px;
position: fixed;
top: 140px;
bottom: 0px;
width: 300px;
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
