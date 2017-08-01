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
                    :class="{animated: true, headShake: _datasets.length == 0}" 
                    @click="show_input_dialog = true" icon="plus"> Stage Datasets</el-button>

                <h3>Datasets</h3>
                <div v-for="dataset in _datasets" :key="dataset.did" class="dataset clickable" @click="scrollto(dataset.task._id)">
                    t.{{dataset.task.config._tid}} <icon name="arrow-right" scale="0.8"></icon>
                    <b v-if="dataset.meta.subject">{{dataset.meta.subject}}</b>
                    <b v-else class="text-muted">(no subject)</b>
                    <datatypetag :datatype="datatypes[dataset.datatype]" :tags="dataset.datatype_tags"></datatypetag>
                    <mute>(d.{{dataset.did}})</mute> 
                    <time v-if="dataset.create_date">{{dataset.create_date|date('%x')}}</time>
                    <mute>
                        <small v-if="dataset.task.status != 'finished'">
                            <statusicon :status="dataset.task.status"></statusicon> 
                        </small>
                    </mute>
                </div>
            </div>
        </div>

        <div class="main-section" id="scrolled-area">
            <p v-if="instance.status == 'removed' || instance.config.removing">
                <el-alert type="error" title="">This process has been removed</el-alert>
            </p>
            <p>
                <el-input type="textarea" 
                    placeholder="Process Description" 
                    @change="changedesc()" 
                    v-model="instance.desc" 
                    :autosize="{minRows: 2, maxRows: 5}"></el-input>
            </p>

            <div v-for="task in tasks" :key="task._id" class="process">
                <p class="text-muted" v-if="task.desc">{{task.desc}}</p>

                <task style="margin-top: 5px;" :task="task">
                    <!--header-->
                    <div slot="header" class="task-header">
                        <div style="float: right">
                            <h4 :id="task._id" :title="task._id"><mute>t.{{task.config._tid}}</mute></h4>
                        </div>
                        <div v-if="task.config._app" style="margin-right: 80px;">
                            <app :appid="task.config._app" :compact="true"></app>
                        </div>
                        <div v-else style="margin-right: 80px;">
                            <h3>{{task.name}}</h3>
                        </div>
                    </div>

                    <!--input-->
                    <el-collapse-item title="Input" name="input" slot="input" v-if="task.config._inputs">
                        <div v-for="input in task.config._inputs" :key="input.did" 
                            style="padding: 3px 5px;" class="clickable" @click="scrollto(input.task_id)">
                            <el-row>
                            <el-col :span="4" class="truncate">
                                {{input.id}}
                            </el-col>
                            <el-col :span="20">
                                t.{{findtask(input.task_id).config._tid}} <icon name="arrow-right" scale="0.8"></icon>
                                <b v-if="input.meta.subject">{{input.meta.subject}}</b>
                                <datatypetag :datatype="datatypes[input.datatype]" :tags="input.datatype_tags"></datatypetag>
                                <mute>
                                    (d.{{input.did}})
                                </mute>
                                <mute v-if="findtask(input.task_id).status != 'finished'">
                                    <statusicon :status="findtask(input.task_id).status"></statusicon> 
                                </mute>
                                <!--
                                <div style="float: right">
                                    <div style="display: inline-block;">
                                        <viewerselect @select="view(input.task_id, $event, input.subdir)" :datatype="datatypes[input.datatype].name" size="small" style="margin-right: 5px;"></viewerselect>
                                        <el-button v-if="findtask(input.task_id).status == 'finished'" size="small" @click.stop="download(findtask(input.task_id), input)">Download</el-button>
                                    </div>
                                </div>
                                -->
                            </el-col>
                            </el-row>
                        </div>
                    </el-collapse-item>

                    <!--output-->
                    <el-collapse-item title="Output" name="output" slot="output">
                        <div v-for="output in task.config._outputs" :key="output.id" style="min-height: 30px;">
                            <el-row>
                            <el-col :span="4" class="truncate">
                                {{output.id}}
                            </el-col>
                            <el-col :span="20">
                                <b v-if="output.meta.subject">{{output.meta.subject}}</b>
                                <datatypetag :datatype="datatypes[output.datatype]" :tags="output.datatype_tags"></datatypetag>
                                <mute>(d.{{output.did}})</mute>
                                <el-tag v-if="output.archive" type="primary">Auto Archive</el-tag>
                                <div style="float: right;">
                                    <div v-if="task.status == 'finished'">
                                        <viewerselect @select="view(task._id, $event, output.subdir)" :datatype="datatypes[output.datatype].name" size="small" style="margin-right: 5px;"></viewerselect>
                                        <el-button size="small" @click="download(task, output)">Download</el-button>
                                        <el-button size="small" type="primary"
                                            :disable="archiving == output.did" @click="archiving = output.did">Archive</el-button>

                                    </div>
                                    <!--<statustag v-else :status="task.status"/>-->
                                </div>

                                <!--list of archived datasets-->
                                <div v-if="findarchived(task, output).length > 0">
                                    <br>
                                    <b><mute>Archived Datasets</mute></b>
                                    <ul class="archived">
                                        <li v-for="dataset in findarchived(task, output)" _key="dataset._id" @click="go('/dataset/'+dataset._id)" class="clickable">
                                            <icon name="cubes"></icon>
                                            <b>{{projects[dataset.project].name}}</b>
                                            <mute>{{dataset.desc}}</mute>
                                            <tags :tags="dataset.tags"/>
                                            <!--<small>{{dataset._id}}</small>-->
                                        </li>
                                    </ul>
                                </div>

                                <archiveform v-if="archiving == output.did" 
                                    :task="task" 
                                    :output="output" 
                                    @done="done_archive" style="margin-top: 30px;"></archiveform>
                            </el-col>
                            </el-row>
                        </div>
                    </el-collapse-item>
                </task>
            </div>

            <el-button v-if="!newprocess" type="primary" @click="start_newprocess()" icon="caret-bottom">New Task</el-button>
            <el-card v-else>
                <h3 id="newtaskdialog" slot="header" style="color: #bbb; text-transform: uppercase; margin-bottom: 0px;">New Task</h3>

                <!--newprocess form-->
                <transition name="fade">
                <div v-if="!newtask.app">
                    <p class="text-muted">You can submit following application(s) with currently available dataset.</p>
                    <div v-for="app in apps" :key="app._id" @click="selectapp(app)">
                        <app :app="app" :compact="true" :clickable="false" class="clickable"/>
                    </div>
                    <br>
                    <el-button @click="close_newprocess()">Cancel</el-button>
                </div>
                </transition>

                <transition name="fade">
                <div v-if="newtask.app">
                    <el-form label-width="200px"> 
                        <el-form-item label="Application">
                            <app :app="newtask.app" :compact="true" :clickable="false"></app>
                        </el-form-item>

                        <el-form-item label="Task Description">
                            <el-input type="textarea" placeholder="Optional" v-model="newtask.desc" :autosize="{minRows: 2, maxRows: 5}"></el-input>
                        </el-form-item>

                        <!--input-->
                        <el-form-item v-for="(input, input_id) in newtask.inputs" :label="input_id+' '+input.datatype_tags" :key="input_id">
                            <el-select @change="validate()" v-model="input.dataset_idx" 
                                no-data-text="No dataset available for this datatype / tags"
                                placeholder="Please select input dataset" 
                                style="width: 100%;">
                                <el-option v-for="dataset in filter_datasets(input)" :key="dataset.idx"
                                        :value="dataset.idx" 
                                        :label="dataset.task.name+' (t.'+dataset.task.config._tid+') '+' > '+dataset.meta.subject+' | '+dataset.datatype_tags+' (d.'+dataset.did+')'">
                                    <span v-if="dataset.task.status != 'finished'">(Processing)</span>
                                    {{dataset.task.name}} (t.{{dataset.task.config._tid}}) <icon name="arrow-right" scale="0.8"></icon>
                                    <b>{{dataset.meta.subject}}</b> 
                                    <small>{{dataset.datatype_tags.toString()}}</small>
                                    (d.{{dataset.did}})
                                </el-option>
                            </el-select>
                            <!--<el-alert v-if="input.error" :title="input.error" type="error"></el-alert>-->
                        </el-form-item>

                        <!--TODO - handle nested config? -->
                        <el-form-item v-for="(v,k) in newtask.app.config" :label="k" :key="k" v-if="v.type && v.type != 'input'">
                            <input v-if="v.type == 'float'" type="number" v-model.number="newtask.config[k]" step="0.01">
                            <el-input-number v-if="v.type == 'integer'" v-model="newtask.config[k]"/>
                            <el-input v-if="v.type == 'string'" v-model="newtask.config[k]"/>
                            <el-checkbox v-if="v.type == 'boolean'" v-model="newtask.config[k]" style="margin-top: 9px;"/>
                        </el-form-item>

    
                        <el-form-item label=" ">
                            <div v-if="!newtask.archive.enable">
                                <el-checkbox v-model="newtask.archive.enable"></el-checkbox> Archive output dataset when finished
                            </div>
                            <el-card v-if="newtask.archive.enable">
                                <el-checkbox v-model="newtask.archive.enable"></el-checkbox> Archive output dataset when finished
                                <p>
                                    <b>Dataset Description</b>
                                    <el-input type="textarea" placeholder="Optional" v-model="newtask.archive.desc" :autosize="{minRows: 2, maxRows: 5}"></el-input>
                                </p>
                                <p>
                                    <b>Project</b> <mute>where you'd like to store this datasets</mute>
                                    <projectselecter v-model="newtask.archive.project"/>
                                </p>
                                <p>
                                    <b>Tags</b> <mute>you'd like to add to this dataset to make it easier to search / organize</mute>
                                    <el-select v-model="newtask.archive.tags" style="width: 100%"
                                        multiple filterable allow-create placeholder="Optional">
                                        <el-option v-for="tag in newtask.archive.tags" key="tag" :label="tag" :value="tag"></el-option>
                                    </el-select>
                                </p>
                            </el-card>
                        </el-form-item>

                        <el-form-item label=" ">
                            <el-button @click="close_newprocess()">Cancel</el-button>
                            <el-button type="primary" @click="submit_newprocess()" :disabled="!newtask.valid">Submit</el-button>
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
                    <el-collapse-item title="newtask" name="newtask" v-if="newtask">
                        <pre v-highlightjs="JSON.stringify(newtask, null, 4)"><code class="json hljs"></code></pre>
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
import archiveform from '@/components/archiveform2'
import projectselecter from '@/components/projectselecter'
import datasetselecter from '@/components/datasetselecter'
import statusicon from '@/components/statusicon'
import statustag from '@/components/statustag'
import mute from '@/components/mute'
import viewerselect from '@/components/viewerselect'
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
        viewerselect, datasetselecter,
        datatypetag,
    },

    data() {
        return {
            instance: null,

            //things for newprocess
            newprocess: false, //set to true while submitting new process
            apps: null, //application user can run with selected data
            newtask: {
                app: null,
                desc: null,
                submit: true,
                config: {},
                inputs: {},
                deps: [],
                valid: false, //form is ready to submit or not
            },

            show_input_dialog: false,

            //cache
            tasks: null,
            datatypes: {}, 
            archived: [], //archived datasets from this processj
            projects: null,
            
            //currently open archiving form (_output_tasks[task._id]._id+'/'+output_id)
            archiving: null,

            config: Vue.config,
        }
    },

    mounted() {
        this.$http.get('datatype').then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach(datatype=>{
                this.datatypes[datatype._id] = datatype;
            });

            return this.$http.get('project', {params: {
                select: 'name',
            }});
        }).then(res=>{
            this.projects = {};
            res.body.projects.forEach(project=>{
                this.projects[project._id] = project;
            });
            console.dir(this.projects);
            this.load();
        });
    },

    computed: {
        //list of available datasets (staged, or generated)
        _datasets: function() {
            var datasets = [];
            this.tasks.forEach(task=>{
                if(task.status == "removed") return;
                if(task.status == "stopped") return;
                if(!task.config._outputs) return; //probably only needed during dev.
                task.config._outputs.forEach(output=>{
                    datasets.push({
                        task,
                        id: output.id,
                        did: output.did, 
                        idx: datasets.length, //for filtered list to find the index
                        dataset_id: output.dataset_id, //only set if it's archived (or from stage in)
                        datatype: output.datatype,
                        datatype_tags: output.datatype_tags,
                        desc: output.desc,
                        meta: output.meta||{},
                        create_date: output.create_date,
                        subdir: output.subdir, //set if the dataset is stored under subdir of task_dir
                        files: output.files, //set if output file mapping (file id=>path under the task_dir/subdir)
                    });
                });
            }); 
            return datasets;
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
        findtask: function(id) {
            var found = null;
            this.tasks.forEach(task=>{
                if(task._id == id) found = task;
            });
            return found;
        },

        changedesc: function() {
            clearTimeout(debounce);
            debounce = setTimeout(this.save_instance, 2000);        
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

        view: function(taskid, view, subdir) {
            view = view.replace('/', '.');
            var path = "#/view/"+this.instance._id+"/"+taskid+'/'+view;
            if(subdir) path += '/'+subdir;
            window.open(path, "", "width=1200,height=800,resizable=no,menubar=no"); 
        },

        load() {
            //load instance first
            this.$http.get(Vue.config.wf_api+'/instance', {params: {
                find: JSON.stringify({_id: this.$route.params.id}),
            }})
            .then(res=>{
                this.instance = res.body.instances[0];

                //load tasks
                return this.$http.get(Vue.config.wf_api+'/task', {params: {
                    find: JSON.stringify({
                        instance_id: this.instance._id,
                        status: {$ne: "removed"},
                        'config._tid': {$exists: true}, //use _tid to know that it's meant for process view
                    }),
                    limit: 2000,
                    sort: 'create_date',
                }})
            })
            .then(res=>{
                this.tasks = res.body.tasks;

                //load datasets archived from this process
                var task_ids = this.tasks.map(task=>task._id); 
                return this.$http.get('dataset', {params: {
                    find: JSON.stringify({
                        "prov.instance_id": this.instance._id,
                        removed: false,
                    })
                }})
            })
            .then(res=>{
                this.archived = res.body.datasets;

                //open input dialog if there are no datasets (new process?)
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

        close_newprocess: function(cb) {
            this.newprocess = false;
        },

        findarchived: function(task, output) {
            return this.archived.filter(dataset=>{
                return (dataset.prov.task_id == task._id && dataset.prov.output_id == output.id);
            });
        },

        start_newprocess: function() {
            this.newtask.app = null;
            this.newprocess = true;

            //create list of all datatypes that user has staged / generated
            var datatype_ids = [];
            this._datasets.forEach(dataset=>{
                if(!~datatype_ids.indexOf(dataset.datatype)) datatype_ids.push(dataset.datatype);
            });

            //now find apps that user can submit
            this.$http.get('app', {params: {
                find: JSON.stringify({
                    "inputs.datatype": {$in: datatype_ids},
                    removed: false,
                }),
                populate: 'inputs.datatype',
            }})
            .then(res=>{
                //now, pick apps that we have *all* input data types for
                this.apps = [];
                res.body.apps.forEach(app=>{
                    var match = true;
                    app.inputs.forEach(input=>{
                        if(!~datatype_ids.indexOf(input.datatype._id)) match = false;
                        input.datatype_tags.forEach(tag=>{
                            if(tag[0] == "!" && ~input.datatype_tags.indexOf(tag.substring(1))) match = false;
                            if(tag[0] != "!" && !~input.datatype_tags.indexOf(tag)) match = false;
                        });
                    });
                    if(match) this.apps.push(app);
                });
                console.log("matching apps", this.apps);
                Vue.nextTick(()=>{
                    this.scrollto("newtaskdialog");
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
            this.newtask = {
                app,
                desc: "", //task desk
                config: Object.assign({}, app.config),
                deps: [], //list of task ids that provides data
                inputs: {},

                archive: {
                    enable: false,
                    project: null,
                    tags: "",
                    desc: "",
                },

                valid: false,
            };
            this.set_default(this.newtask.config);
            this.newtask.app.inputs.forEach(input=>{
                var input_copy = Object.assign({dataset_idx: ''}, input);
                Vue.set(this.newtask.inputs, input.id, input_copy);
            });
        },

        validate: function(val) {
            var valid = true; //innocent until proven guilty
            //make sure all inputs are selected
            for(var input_id in this.newtask.inputs) {
                var input = this.newtask.inputs[input_id];
                if(input.dataset_idx === '') {
                    console.log(input_id, " set to empty", input);
                    valid = false;
                }
            }
            console.log("validating", valid);
            this.newtask.valid = valid;
        },

        //select all datasets that meets datatype requirement of 'input', that comes from task with name:task_name
        filter_datasets: function(input) {
            return lib.filter_datasets(this._datasets, input);
        },

        //recursively update configuration with given newtask
        process_input_config: function(config) {
            for(var k in config) { 
                var node = config[k];
                if(node instanceof Array) {
                    console.log("todo.. array!");
                } else if(typeof node === 'object') {
                    if(node.type) {
                        switch(node.type) {
                        case "input":
                            var input = this.newtask.inputs[node.input_id];
                            var dataset = this._datasets[input.dataset_idx];

                            var base = "../"+dataset.task._id;
                            if(dataset.subdir) base+="/"+dataset.subdir;
                            if(!~this.newtask.deps.indexOf(dataset.task._id)) this.newtask.deps.push(dataset.task._id);

                            //use file path specified in datatype..
                            var file = input.datatype.files.find(file=>file.id == node.file_id);
                            //but override it if filemapping from the input dataset is provided
                            if(dataset.files && dataset.files[node.input_id]) file = dataset.files[node.file_id];
                            config[k] = base+"/"+(file.filename||file.dirname);
                            break;
                        default:
                            config[k] = "unknown_template_type";
                        }
                    } else this.process_input_config(node); //recurse to child node
                }
            }
        },

        download: function(task, dataset) {
            var path = task.instance_id+'/'+task._id;
            if(dataset.subdir) path+='/'+dataset.subdir;
            var url = Vue.config.wf_api+'/resource/download'+
                '?r='+task.resource_id+
                '&p='+encodeURIComponent(path)+
                '&at='+Vue.config.jwt;
            document.location = url;
        },

        done_archive: function(dataset) {
            this.archiving = null;
            if(dataset) this.archived.push(dataset);
        },

        submit_stage: function(datasets) {
            var download = [];
            var _outputs = [];
            var did = this.next_did();
            for(var dataset_id in datasets) {

                //ignore already staged dataset
                var found = false;
                this._datasets.forEach(dataset=>{
                    if(dataset.dataset_id == dataset_id) found = true;
                });
                if(found) {
                    this.$notify.info({ title: 'Info', message: 'Dataset '+dataset_id+' is already staged. Skipping.' });
                    return;
                }

                download.push({
                    url: Vue.config.api+"/dataset/download/"+dataset_id+"?at="+Vue.config.jwt,
                    untar: "auto",
                    dir: dataset_id,
                });

                var dataset = Object.assign({
                    id: dataset_id, 
                    did: did++,
                    subdir: dataset_id, 
                    dataset_id
                }, datasets[dataset_id]);
                _outputs.push(dataset);
            }
            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: this.instance._id,
                name: "brainlife.stage_input",
                desc: "Stage Input for "+task.name,
                service: "soichih/sca-product-raw",
                config: { download, _outputs, _tid: this.next_tid() },
            }).then(res=>{
                console.log("submitted download", res.body.task);
                var task = res.body.task;
                this.tasks.push(task); 

                if(this.newprocess) this.start_newprocess();
            });
        },

        next_tid() {
            var next = 0;
            this.tasks.forEach(task=>{
                if(task.config._tid >= next) next = task.config._tid+1;
            });
            return next;
        },
        next_did() {
            var next = 0;
            this._datasets.forEach(dataset=>{
                if(dataset.did >= next) next = dataset.did+1;
            });
            return next;
        },

        submit_newprocess: function() {
            this.process_input_config(this.newtask.config);

            var meta = {};
            var _inputs = [];
            for(var input_id in this.newtask.inputs) {
                var input = this.newtask.inputs[input_id];
                var dataset = this._datasets[input.dataset_idx];

                var copy_dataset = Object.assign({}, dataset);
                copy_dataset.task_id = dataset.task._id;
                copy_dataset.id = input_id;
                delete copy_dataset.task;
                _inputs.push(copy_dataset);

                //aggregating meta
                //TODO - I need a better way to discover meta (like letting app to decide)
                //TODO - if 2 inputs has different value for the same meta (like subject) the latterr wins.. bad!
                for(var k in dataset.meta) meta[k] = dataset.meta[k];
            }
            this.newtask.config._inputs = _inputs;
            this.newtask.config._app = this.newtask.app._id;
            this.newtask.config._tid = this.next_tid();
            var _outputs = [];
            var did = this.next_did();
            this.newtask.app.outputs.forEach(output=>{
                var output_req = {
                    id: output.id,
                    did: did++,
                    datatype: output.datatype,
                    datatype_tags: output.datatype_tags,
                    desc: output.id+ " from "+this.newtask.app.name,
                    meta,
                    files: output.files,
                };
                if(this.newtask.archive.enable) output_req.archive = {
                    project: this.newtask.archive.project,
                    desc: this.newtask.archive.desc,
                    tags: this.newtask.archive.tags,
                }
                _outputs.push(output_req);
            });
            this.newtask.config._outputs = _outputs;

            console.log("submitting newtask", this.newtask); 
            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: this.instance._id,
                name: this.newtask.app.name,
                desc: this.newtask.desc,
                service: this.newtask.app.github, //TODO what if it's docker?
                config: this.newtask.config,
                deps: this.newtask.deps,
                retry: this.newtask.app.retry,
            }).then(res=>{
                var task = res.body.task;
                console.log("submitted task", task);
                this.tasks.push(task);
                this.close_newprocess();
            });
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
}
.dataset {
border-bottom: 1px solid #d5d5d5; 
padding: 5px;
}
.dataset.clickable:hover {
background-color: #eee;
}
.truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis; 
}
ul.archived {
list-style: none;
margin: 0px;
padding: 0px;
}
ul.archived li {
padding: 5px;
}
</style>
