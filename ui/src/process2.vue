<template>
<div v-if="instance">
    <div class="sidebar">
        <h6>Datasets</h6>
        <div v-for="dataset in _datasets" :key="dataset.did" class="dataset clickable" @click="scrollto(dataset.task._id)" :title="dataset.task.name">
            <mute>t.{{dataset.task.config._tid}} <icon name="arrow-right" scale="0.8"></icon></mute>
            <b v-if="dataset.meta.subject">{{dataset.meta.subject}}</b>
            <b v-else class="text-muted">(no subject)</b>
            <datatypetag :datatype="datatypes[dataset.datatype]" :tags="dataset.datatype_tags"></datatypetag>
            <small v-for="(tag,idx) in dataset.tags" :key="idx"> | {{tag}}</small>
            <mute>(d.{{dataset.did}})</mute> 
            <time v-if="dataset.create_date">{{new Date(dataset.create_date).toLocaleString()}}</time>
            <mute>
                <small v-if="dataset.task.status != 'finished'">
                    <statusicon :status="dataset.task.status"></statusicon> 
                </small>
            </mute>
        </div>

        <b-button variant="primary" v-b-modal.datasetSelecter size="sm" style="margin: 10px;" :class="{animated: true, headShake: _datasets.length == 0}">Stage Datasets</b-button>
    </div>
    <p v-if="instance.status == 'removed' || instance.config.removing">
        <el-alert type="error" title="">This process has been removed</el-alert>
    </p>

    <div v-if="tasks" v-for="task in tasks" :key="task._id">
        <!--task-id and toggler-->
        <div style="float: right" :id="task._id" :title="task._id" class="task-id" @click="toggle_task(task)">
            <icon name="caret-down" v-if="task.show"/><icon name="caret-right" v-else/> 
            t.{{task.config._tid}}
        </div>

        <!--full detail-->
        <task :task="task" class="task" v-if="task.show">
            <!--header-->
            <div slot="header" class="task-header">
                <div v-if="task.config._app && task.show" style="margin-right: 30px;">
                    <app :appid="task.config._app" :compact="true">
                        <div v-if="task.desc" class="task-desc">{{task.desc}}</div>
                    </app>
                </div>
                <div v-else>
                    <h4 style="margin: 0px;" class="text-muted">
                        <icon name="paper-plane"/>&nbsp;&nbsp;&nbsp;{{task.name}}
                    </h4>
                </div>
            </div>

            <!--input-->
            <el-collapse-item title="Input" name="input" slot="input" v-if="task.config._inputs">
                <div v-for="input in task.config._inputs" :key="input.did" style="padding: 3px 5px;">
                    <div v-if="findtask(input.task_id)" class="clickable" @click="scrollto(input.task_id)">
                        <mute>t.{{findtask(input.task_id).config._tid}} <icon name="arrow-right" scale="0.8"></icon></mute>
                        <b v-if="input.meta.subject">{{input.meta.subject}}</b>
                        <datatypetag :datatype="datatypes[input.datatype]" :tags="input.datatype_tags"></datatypetag>
                        <mute>
                            <small v-for="(tag,idx) in input.tags" :key="idx"> | {{tag}} </small>
                            (d.{{input.did}})
                        </mute>
                        <mute v-if="findtask(input.task_id).status != 'finished'">
                            <statusicon :status="findtask(input.task_id).status"></statusicon> 
                        </mute>
                    </div>
                    <div v-else>
                        <b v-if="input.meta.subject">{{input.meta.subject}}</b>
                        <datatypetag :datatype="datatypes[input.datatype]" :tags="input.datatype_tags"></datatypetag>
                        <mute>
                            <small v-for="(tag,idx) in input.tags" :key="idx"> | {{tag}} </small>
                            (d.{{input.did}})
                        </mute>
                        <b-badge variant="danger">Removed</b-badge>
                    </div>
                </div>
            </el-collapse-item>

            <!--output-->
            <el-collapse-item title="Output" name="output" slot="output" v-if="task.config._outputs.length > 0">
                <div v-for="output in task.config._outputs" :key="output.id" style="min-height: 35px;">
                    <div class="float-right" style="position: relative; top: -4px;">
                        <b-button-group size="sm" v-if="task.status == 'finished'">
                            <b-button v-b-modal.viewSelecter @click="openviewsel(task, datatypes[output.datatype].name, output.subdir)">View</b-button>
                            <b-button @click="download(task, output)">Download</b-button>
                            <b-button :pressed="archiving === output.did" variant="primary" @click="archiving = output.did">Archive</b-button>
                        </b-button-group>
                    </div>

                    <b v-if="output.meta.subject">{{output.meta.subject}}</b>
                    <datatypetag :datatype="datatypes[output.datatype]" :tags="output.datatype_tags"></datatypetag>
                    <mute>
                        <small v-for="(tag,idx) in output.tags" :key="idx"> | {{tag}}</small>
                        (d.{{output.did}})
                    </mute>
                    <el-tag v-if="output.archive" type="primary">Auto Archive <icon name="arrow-right" scale="0.8"/> {{projects[output.archive.project].name}}</el-tag>
                    <span @click="go('/dataset/'+output.dataset_id)" class="clickable">
                        <el-tag v-if="output.dataset_id">From <b>{{projects[output.project].name}}</b></el-tag>
                    </span>

                    <!--list of archived datasets-->
                    <div v-if="findarchived(task, output).length > 0" class="archived-datasets">
                        <div class="archived-datasets-title">Archived Datasets</div>
                        <ul class="archived">
                            <li v-for="dataset in findarchived(task, output)" _key="dataset._id" @click="go('/dataset/'+dataset._id)" class="clickable">
                                <icon name="cubes"></icon>
                                <b>{{projects[dataset.project].name}}</b>
                                <mute>{{dataset.desc}}</mute>
                                <tags :tags="dataset.tags"/>

                                <span style="color: #2693ff;" v-if="dataset.status == 'storing'">
                                    <icon name="cog" :spin="true"/> Storing ...
                                </span> 
                                <span v-else>{{dataset.status}}</span>
                            </li>
                        </ul>
                    </div>
                    <archiveform v-if="archiving === output.did" :task="task" :output="output" @done="done_archive"></archiveform>
                </div>
                <div v-if="task.product">
                    <pre v-highlightjs="JSON.stringify(task.product, null, 4)" style="max-height: 150px;"><code class="json hljs"></code></pre>
                </div>
            </el-collapse-item>
        </task>

        <div v-else class="task-summary" style="color: #666;">
            <statusicon :status="task.status"/>
            <b>
                <appname v-if="task.config._app" :appid="task.config._app"/>
                <span v-else class="text-muted">{{task.name}}</span>
            </b>
        </div>
    </div>

    <div v-if="apps && apps.length == 0" style="margin: 20px;">
        <p class="text-muted">You have no application that you can submit with currently staged datasets. Please try staging more datasets.</p>
    </div>
    <el-card v-if="apps && apps.length > 0">
        <h5 id="newtaskdialog" slot="header" style="color: #bbb; text-transform: uppercase; margin-bottom: 0px;">Run Application</h5>

        <!--newprocess form-->
        <transition name="fade">
        <div v-if="!newtask.app">
            <p class="text-muted">You can submit following application(s) with currently available dataset.</p>
            <div style="width: 50%; float: left;" v-for="app in apps" :key="app._id">
                <div @click="selectapp(app)" style="padding-bottom: 5px; padding-right: 10px;">
                    <app :app="app" :compact="true" :clickable="false" class="clickable" :descheight="50"/>
                </div>
            </div>
            <br clear="both">
        </div>
        </transition>

        <transition name="fade">
        <div v-if="newtask.app">
            <b-row>
                <b-col cols="3">Application</b-col>
                <b-col>
                    <app :app="newtask.app" :compact="false"/>
                </b-col>
            </b-row>
            <br>

            <!--input-->
            <b-row v-for="(input, input_id) in newtask.inputs" :key="input_id" style="margin-bottom: 5px;">
                <b-col cols="3">
                    <datatypetag :datatype="input.datatype" :tags="input.datatype_tags"/>
                </b-col>
                <b-col>
                    <el-select @change="validate()" v-model="input.dataset_idx" 
                        no-data-text="No dataset available for this datatype / tags"
                        placeholder="Please select input dataset" 
                        style="width: 100%;">
                        <el-option v-for="dataset in filter_datasets(input)" :key="dataset.idx"
                                :value="dataset.idx" 
                                :label="dataset.task.name+' (t.'+dataset.task.config._tid+') '+' > '+dataset.meta.subject+' > '+dataset.datatype_tags+' | '+dataset.tags+' (d.'+dataset.did+')'">
                            <span v-if="dataset.task.status != 'finished'">(Processing)</span>
                            {{dataset.task.name}} (t.{{dataset.task.config._tid}}) <icon name="arrow-right" scale="0.8"></icon>
                            <b>{{dataset.meta.subject}}</b> 
                            <small>{{dataset.datatype_tags.toString()}}</small>
                            (d.{{dataset.did}})
                        </el-option>
                    </el-select>
                </b-col>
            </b-row>

            <!--config-->
            <b-row v-for="(v,k) in newtask.app.config" :key="k" v-if="v.type && v.type != 'input'">
                <b-col cols="3">{{k}}</b-col>
                <b-col>
                    <input v-if="v.type == 'float'" type="number" v-model.number="newtask.config[k]" step="0.01" :placeholder="v.placeholder">
                    <el-input type="number" v-if="v.type == 'integer'" v-model.number="newtask.config[k]" :placeholder="v.placeholder"/>
                    <el-input v-if="v.type == 'string'" v-model="newtask.config[k]" :placeholder="v.placeholder"/>
                    <div v-if="v.type == 'boolean'">
                        <el-checkbox v-model="newtask.config[k]" style="margin-top: 9px;"/> {{v.desc}}
                    </div>
                    <el-select v-if="v.type == 'enum'" v-model="newtask.config[k]" :placeholder="v.placeholder" style="width: 100%;">
                        <el-option v-for="option in v.options" :key="option.value" :label="option.label" :value="option.value">
                            <b>{{option.label}}</b>
                            <small> - {{option.desc}}</small>
                        </el-option>
                    </el-select>

                    <b-form-text v-if="v.type != 'boolean'">{{v.desc}}</b-form-text>
                </b-col>
            </b-row>

            <hr>

            <b-row>
                <b-col cols="3">Task Description</b-col>
                <b-col>
                    <b-form-textarea placeholder="Optional description for this task submission" v-model="newtask.desc" :rows="2" :max-rows="6"></b-form-textarea>
                </b-col>
            </b-row>
            <br>

            <b-row>
                <b-col cols="3"><!--archive--></b-col>
                <b-col>
                    <div v-if="!newtask.archive.enable">
                        <el-checkbox v-model="newtask.archive.enable"></el-checkbox> Archive all output datasets when finished
                    </div>
                    <el-card v-if="newtask.archive.enable">
                        <el-checkbox v-model="newtask.archive.enable"></el-checkbox> Archive all output datasets when finished
                        <p>
                            <b>Dataset Description</b>
                            <el-input type="textarea" placeholder="Optional" v-model="newtask.archive.desc" :autosize="{minRows: 2, maxRows: 5}"></el-input>
                        </p>
                        <p>
                            <b>Project</b> <mute>where you'd like to store this datasets</mute>
                            <projectselecter v-model="newtask.archive.project"/>
                        </p>
                        <!-- I need to let user specify tags for each output datsets, and tags are now set under config.output - not config.output.archive
                        <p>
                            <b>Tags</b> <mute>you'd like to add to this dataset to make it easier to search / organize</mute>
                            <el-select v-model="newtask.archive.tags" style="width: 100%"
                                multiple filterable allow-create placeholder="Optional">
                                <el-option v-for="tag in newtask.archive.tags" key="tag" :label="tag" :value="tag"></el-option>
                            </el-select>
                        </p>
                        -->
                    </el-card>
                </b-col>
            </b-row>
            <br>

            <b-row>
                <b-col cols="3"><!--submit--></b-col>
                <b-col>
                    <el-button @click="reset_newprocess()">Cancel</el-button>
                    <el-button type="primary" @click="submit_newprocess()" :disabled="!newtask.valid">Submit</el-button>
                </b-col>
            </b-row>
            <br>
        </div>
        </transition>
    </el-card>
    <br>
    <br>
    <div v-if="config.debug">
        <h5>Debug</h5>
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
    <datasetselecter @submit="submit_stage"></datasetselecter>
    <viewselecter @select="view" :datatype_name="vsel.datatype_name"></viewselecter>
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
import appavatar from '@/components/appavatar'
import app from '@/components/app'
import appname from '@/components/appname'
import archiveform from '@/components/archiveform2'
import projectselecter from '@/components/projectselecter'
import datasetselecter from '@/components/datasetselecter'
import statusicon from '@/components/statusicon'
import statustag from '@/components/statustag'
import mute from '@/components/mute'
import viewselecter from '@/components/viewselecter'
import datatypetag from '@/components/datatypetag'

import ReconnectingWebSocket from 'reconnectingwebsocket'

const lib = require('./lib');

export default {
    props: [ 'instance' ],

    components: { 
        sidemenu, contact, task, 
        message, file, tags, 
        filebrowser, pageheader, statustag,
        appavatar, app, archiveform, 
        projectselecter, statusicon, mute,
        viewselecter, datasetselecter,
        datatypetag, appname,
    },

    data() {
        return {
            //things for newprocess
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


            vsel: {
                datatype_name: null,
                task: null,
                subdir: null,
            },

            //cache
            tasks: null,
            datatypes: {}, 
            archived: [], //archived datasets from this processj
            projects: null,
            
            archiving: null, //currently open archiving form (_output_tasks[task._id]._id+'/'+output_id)
            ws: null, //websocket
            
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

            this.load();
        });
    },

    destroyed() {
        console.log("disconnecting from ws");
        this.ws.close();
    },

    computed: {
        //list of available datasets (staged, or generated)
        _datasets: function() {
            if(!this.tasks) return [];

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
                        idx: datasets.length, //for filtered list to find the index (may not be the same as did if dataset is removed)
                        dataset_id: output.dataset_id, //only set if it's archived (or from stage in)
                        datatype: output.datatype,
                        datatype_tags: output.datatype_tags,
                        desc: output.desc,
                        tags: output.tags||[],
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
        'instance': function() {
            console.log("instance updated");
            document.getElementById("scrolled-area").scrollTop = 0;
            this.load();
        },
        'input_dialog.project': function(p) {
            this.input_dialog.datasets_groups = {};
        },
    },

    methods: {
        preselect_single_items: function(input, newtask) {
            var datasets = this.filter_datasets(input);
            if (datasets.length == 1) {
                Vue.set(newtask.inputs[input.id], 'dataset_idx', datasets[0].idx);
            }
        },
        
        findtask: function(id) {
            var found = null;
            this.tasks.forEach(task=>{
                if(task._id == id) found = task;
            });
            return found;
        },

        scrollto: function(id) {
            var elem = document.getElementById(id);
            var top = elem.offsetTop-30;
            console.log("scrolling to ", id, top);
            document.getElementById("scrolled-area").scrollTop = top;
        },

        go: function(path) {
            this.$router.push(path);
        },


        load() {
            //(re)connect to websocket
            if(this.ws) this.ws.close();
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {/*debug: Vue.config.debug,*/ reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                console.log("connected to websocket ..loading tasks");

                this.$http.get(Vue.config.wf_api+'/task', {params: {
                    find: JSON.stringify({
                        instance_id: this.instance._id,
                        status: {$ne: "removed"},
                        'config._tid': {$exists: true}, //use _tid to know that it's meant for process view
                    }),
                    limit: 2000,
                    sort: 'create_date',
                }})
                .then(res=>{

                    //load show/hide status
                    res.body.tasks.forEach(task=>{
                        task.show = true;
                        var show = localStorage.getItem("task.show."+task._id);
                        if(show == "false") task.show = false;
                    });

                    this.tasks = res.body.tasks;
                    this.update_apps();

                    //loading archived datasets for all tasks
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

                    this.ws.send(JSON.stringify({
                        bind: {
                            ex: "wf.task",
                            key: Vue.config.user.sub+"."+this.instance._id+".#",
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
                        //console.log(msg._id, msg.status, msg.status_msg);
                        var t = this.tasks.find(t=>t._id == msg._id);
                        if(!t) {
                            //new task?
                            this.$notify("new t."+msg.config._tid+"("+msg.name+") "+msg.status_msg);
                            msg.show = true;
                            this.tasks.push(msg); 
                            this.update_apps();
                            Vue.nextTick(()=>{
                                this.scrollto(msg._id);
                            });
                        } else {
                            //update
                            if(t.status != msg.status) this.$notify("t."+msg.config._tid+"("+msg.name+") "+msg.status+" "+msg.status_msg);
                            for(var k in msg) {
                                t[k] = msg[k];
                            }
                        }
                    }
                }).catch((err)=>{
                    console.error(err);
                });
            } //websocket onopen
        },
        findarchived: function(task, output) {
            return this.archived.filter(dataset=>{
                return (dataset.prov.task_id == task._id && dataset.prov.output_id == output.id);
            });
        },

        reset_newprocess: function() {
            this.newtask.app = null;
            this.scrollto("newtaskdialog");
        },

        update_apps: function() {
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
                populate: 'inputs.datatype outputs.datatype',
            }})
            .then(res=>{
                //now, pick apps that we have *all* input datasets that matches the input datatype/tags
                this.apps = [];
                res.body.apps.forEach(app=>{
                    var match = true;
                    app.inputs.forEach(input=>{
                        //if(!~datatype_ids.indexOf(input.datatype._id)) match = false;
                        var matching_dataset = this._datasets.find(dataset=>{
                            if(dataset.datatype != input.datatype._id) return false;
                            var match_tag = true;
                            input.datatype_tags.forEach(tag=>{
                                //make sure tag matches
                                if(tag[0] == "!" && ~dataset.datatype_tags.indexOf(tag.substring(1))) match_tag = false;
                                if(tag[0] != "!" && !~dataset.datatype_tags.indexOf(tag)) match_tag = false;
                            });
                            return match_tag;
                        }); 
                        if(!matching_dataset) match = false;
                    });
                    if(match) {
                        //console.log("can run", app.name);
                        this.apps.push(app);
                    }
                });
            }).catch(err=>{
                console.error(err);
            });
        },

        set_default: function(config) {
            for(var k in config) {
                var v = config[k];
                if(!v.type) this.set_default(v); //primitive should recurse
                else if(v.type != "input") Vue.set(config, k, v.default);
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
                    desc: "",
                },

                valid: false,
            };
            this.set_default(this.newtask.config);
            this.newtask.app.inputs.forEach(input=>{
                var input_copy = Object.assign({dataset_idx: ''}, input);
                Vue.set(this.newtask.inputs, input.id, input_copy);
                this.preselect_single_items(input, this.newtask);
            });
            this.validate(); //for preselect
            this.scrollto("newtaskdialog");
        },

        validate: function(val) {
            var valid = true; //innocent until proven guilty
            //make sure all inputs are selected
            for(var input_id in this.newtask.inputs) {
                var input = this.newtask.inputs[input_id];
                if(input.dataset_idx === '') valid = false;
            }
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
                            if(!file) {
                                console.error("failed to find file id", node.file_id);
                                config[k] = "no such file_id:"+node.file_id;
                                break;
                            }
                            config[k] = base+"/"+(file.filename||file.dirname);
                            //but override it if filemapping from the input dataset is provided
                            if(dataset.files && dataset.files[node.input_id]) {
                                config[k] = base+"/"+dataset.files[node.file_id];
                            }
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
                    this.$notify('Dataset(s) specified is already staged. Skipping.');
                    return;
                }
                download.push({
                    url: Vue.config.api+"/dataset/download/"+dataset_id+"?at="+Vue.config.jwt,
                    untar: "auto",
                    dir: dataset_id,
                });
                _outputs.push(Object.assign(datasets[dataset_id], {
                    id: dataset_id, 
                    did: did++,
                    subdir: dataset_id, 
                    dataset_id,
                    prov: null,
                }));
            }
            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: this.instance._id,
                name: "Staged Datasets",
                service: "soichih/sca-product-raw",
                config: { download, _outputs, _tid: this.next_tid() },
            }).then(res=>{
                console.log("submitted download", res.body.task);
                var task = res.body.task;
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
                copy_dataset.app_id = dataset.task.config._app; //testing..
                copy_dataset.output_id = copy_dataset.id; //this becomes output_id
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
                    datatype: output.datatype._id,
                    datatype_tags: output.datatype_tags,
                    desc: output.id+ " from "+this.newtask.app.name,
                    meta,
                    files: output.files,
                };
                if(this.newtask.archive.enable) output_req.archive = {
                    project: this.newtask.archive.project,
                    desc: this.newtask.archive.desc,
                    //tags: this.newtask.archive.tags, //deprecated - store this under output_req
                }
                _outputs.push(output_req);
            });
            this.newtask.config._outputs = _outputs;

            console.log("submitting newtask", this.newtask); 
            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: this.instance._id,
                name: this.newtask.app.name,
                desc: this.newtask.desc,
                service: this.newtask.app.github, 
                service_branch: this.newtask.app.github_branch, 
                config: this.newtask.config,
                deps: this.newtask.deps,
                retry: this.newtask.app.retry,
            }).then(res=>{
                this.newtask.app = null;
                var task = res.body.task;
                this.update_apps();
            });
        },

        toggle_task: function(task) {
            //Vue.set(task, 'show', !task.show);
            task.show = !task.show;
            localStorage.setItem("task.show."+task._id, task.show);
        },

        openviewsel: function(task, datatype_name, subdir) {
            //dialog itself is opened via ref= on b-button, but I still need to pass some info to the dialog and retain task._id
            this.vsel.datatype_name = datatype_name;
            this.vsel.task = task;
            this.vsel.subdir = subdir;
        },

        view: function(v) {
            this.$emit('view', {
                instanceid: this.vsel.task.instance_id, 
                taskid: this.vsel.task._id,
                view: v.ui,
                subdir: this.vsel.subdir,
            });
        },
    },
}
</script>

<style scoped>
.sidebar {
background-color: #ddd;
position: fixed;
top: 110px;
bottom: 0px;
width: 300px;
right: 0px;
overflow: auto;
font-size: 90%;
padding-bottom: 50px; /*so it won't be covered by notification*/
}
.sidebar h6 {
font-weight: bold;
color: #999;
padding: 10px;
margin: 0px;
}
.task-header {
margin: 0px;
padding: 15px;
border: 1px solid rgb(230, 230, 230);
border-bottom: none;
background-color: #fff;
}
.task {
box-shadow: 0px 2px 4px #999;
margin: 0px;
margin-bottom: 15px;
transition: height 0.5s ease;
}
.task.v-enter, .task.v-leave {
height: 0;
}

.task-desc {
margin-top: 5px;
margin-left: 95px;
border-left: 5px solid #ccc;
padding-left: 10px;
font-style: italic;
}
.dataset {
border-bottom: 1px solid #d5d5d5; 
padding: 3px;
padding-left: 7px;
}
.dataset.clickable:hover {
background-color: #eee;
}
.truncate {
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis; 
}
.archived-datasets {
border-left: 3px solid #ddd;
padding-left: 8px;
margin: 3px;
}
.archived-datasets-title {
color: #aaa;
font-weight: bold;
}
ul.archived {
list-style: none;
margin: 0px;
padding: 0px;
}
ul.archived li {
padding: 5px;
}
.sidebar .statusicon-failed {
color: #c00;
}
.sidebar .statusicon-running {
color: #2693ff;
}
.el-collapse-item__content {
line-height: inherit;
}
.el-card {
border: none;
}
.task-id {
cursor: pointer;
color: gray;
margin: 5px 10px;
font-weight: bold;
}
.task-id:hover {
color: black;
}
.task-summary {
padding: 5px 10px;
background-color: white;
margin-bottom: 4px;
/*border: 1px solid rgb(230, 230, 230);*/
}
</style>
