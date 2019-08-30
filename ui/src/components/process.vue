<template>
<div v-if="projects && instance" ref="process">
    <p class="loading" v-if="loading"><icon name="cog" scale="1.25" spin/> Loading...</p>
    <div v-if="!loading" style="padding: 10px;">
        <div class="instance-action">
            <div @click.stop="remove()" class="button">
                <icon name="trash"/>
            </div>
        </div>
        <div style="margin-right: 40px;">
            <b-form-textarea v-model="desc" @input="updatedesc" placeholder="Enter process description" rows="2" max-rows="4"></b-form-textarea>
        </div>
    </div>

    <b-alert variant="secondary" :show="!loading && tasks && tasks.length == 0">Please stage datasets by clicking "Stage New dataset" button below.</b-alert>
    <div class="task-area" v-if="!loading && tasks" v-for="task in tasks" :key="task._id">

        <div v-if="!task.show" class="task-id" @click="toggle_task(task)">
            <icon name="caret-right"/>
            t.{{task.config._tid}}
        </div>
        <!--full detail-->
        <task :task="task" class="task" v-if="task.show">
            <!--header-->
            <div slot="header" style="background-color: white;">
                <!--task-id and toggler-->
                <div :id="task._id" :title="task._id" class="task-id" @click="toggle_task(task)">
                    <icon name="caret-down" v-if="task.show"/>
                    t.{{task.config._tid}}
                </div>

                <div v-if="task.app && task.show">
                    <app :app="task.app" :branch="task.service_branch||'master'" :compact="true"/>
                </div>
                <div v-else>
                    <h4 style="padding: 7px; margin-bottom: 0px;" class="text-muted">
                        <icon name="paper-plane"/>&nbsp;&nbsp;{{task.name}}
                    </h4>
                </div>
            </div>

            <!--input-->
            <div slot="input" v-if="task.config._inputs">
                <div v-for="(input, idx) in task.config._inputs" :key="idx" class="input">
                    <b v-if="input.meta && input.meta.subject">{{input.meta.subject}}</b>
                    <div style="display: inline-block;" v-if="find_task(input.task_id)" class="clickable" @click="scrollto(input.task_id)">
                        <datatypetag :datatype="datatypes[input.datatype]" :tags="input.datatype_tags"/>
                        <span style="opacity: 0.5;">
                            <small v-for="(tag,idx) in input.tags" :key="idx"> | {{tag}} </small>
                            <statusicon v-if="find_task(input.task_id).status != 'finished'" :status="find_task(input.task_id).status"/>
                            <icon style="margin: 0 5px" name="arrow-left" scale="0.8"/> 
                            <b>t.{{find_task(input.task_id).config._tid}}</b>
                            {{find_task(input.task_id).name}}
                        </span>
                    </div>
                    <div v-else style="display: inline-block;">
                        <small v-if="input.meta && input.meta.session" style="opacity: 0.8"> / {{input.meta.session}}</small>
                        <datatypetag :datatype="datatypes[input.datatype]" :tags="input.datatype_tags"/>
                        <span style="opacity: 0.5;">
                            <small v-for="(tag,idx) in input.tags" :key="idx"> | {{tag}} </small>
                        </span>
                        <b-badge variant="danger">Removed</b-badge>
                    </div>
                    <small class="ioid" v-if="task.app">({{compose_desc(task.app.inputs, input.id)}})</small>
                </div>
            </div>

            <!--output-->
            <div slot="output">
                <div v-for="(output, idx) in task.config._outputs" :key="idx" class="output">
                    <div class="output-actions">
                        <div class="button" v-if="output.dataset_id" @click="open_dataset(output.dataset_id)" title="Show Dataset Detail">
                            <icon name="cubes"/>
                        </div>
                        <div v-if="task.status == 'finished'" style="display: inline-block;">
                            <div class="button" title="View" @click="set_viewsel_options(task, output)">
                                <icon name="eye"/>
                            </div>
                            <div class="button" @click="download(task, output)" title="Download"><icon name="download"/></div>
                            <div class="button" title="Archive" @click="open_archiver(task, output)"><icon name="archive"/></div>
                        </div>
                    </div>


                    <b v-if="output.meta && output.meta.subject">{{output.meta.subject}}</b>
                    <small v-if="output.meta && output.meta.session" style="opacity: 0.8"> / {{output.meta.session}}</small>
                    <datatypetag :datatype="datatypes[output.datatype]" :tags="output.datatype_tags"/>
                    <mute>
                        <small v-for="(tag,idx) in output.tags" :key="idx"> | {{tag}}</small>
                    </mute>
                    <div v-if="output.archive" style="display: inline-block;">
                        <small style="opacity: 0.5"><icon name="arrow-right" scale="0.8" style="position: relative; top: -2px;"/> will archive to</small>
                        <icon style="opacity: 0.5; margin-left: 3px;" name="shield-alt" scale="1.0"/>
                        <small v-if="project._id != output.archive.project">{{projectname(output.archive.project)}}</small>
                        <small v-else style="opacity: 0.6">This Project</small>
                    </div>

                    <!--foreign project-->
                    <span class="text-muted" v-if="output.dataset_id && output.project != project._id">
                        <icon style="opacity: 0.5; margin: 0 5px" name="arrow-left" scale="0.8"/><small>from</small> <icon name="shield-alt"/> <b>{{projectname(output.project)}}</b>
                    </span>
                    <small class="ioid" v-if="task.app">({{compose_desc(task.app.outputs, output.id)}})</small>

                    <div v-if="findarchived(task, output).length > 0" class="archived-datasets">
                        <div class="archived-datasets-title">Archived Datasets</div>
                        <ul class="archived">
                            <li v-for="dataset in findarchived(task, output)" :key="dataset._id" @click="open_dataset(dataset._id)" class="clickable">
                                <timeago class="text-muted" style="float: right" :since="dataset.create_date" :auto-update="10"/>

                                <icon name="cubes"/>
                                <mute>{{dataset.desc||'(no desc)'}}</mute>

                                <tags :tags="dataset.tags"/>
                                <span class="text-muted" v-if="dataset.project != project._id">
                                    <small>on</small> <icon name="shield-alt"/> <b>{{projectname(dataset.project)}}</b>
                                </span>

                                <!--show dataset status if it's not stored-->
                                <small style="font-size: 80%; color: #2693ff;" v-if="dataset.status == 'storing'">
                                    <icon name="cog" :spin="true"/> {{dataset.status_msg||dataset.status||'no status'}}
                                </small> 
                                <span v-else-if="dataset.status == 'stored'"></span>
                                <span v-else><statustag :status="dataset.status"/></span>
                            </li>
                        </ul>
                    </div>
                </div>
                <product :product="task.product"/>
                <div v-if="task.config._outputs.length == 0 && !task.product" style="padding: 10px; opacity: 0.5">No output</div>
            </div>
        </task>

        <!--task summary (hidden detail)-->
        <div v-else class="task-summary">
            <div style="display: inline-block; float: left; width: 25px;">
                <statusicon :status="task.status"/>
            </div>
            <span>
                <appname v-if="task.app" :app="task.app"/>
                <b v-else style="padding: 7px;" class="text-muted">
                    {{task.name}}
                </b>
            </span>
        </div>
    </div>
    <!--make sure the bottom end of task-area won't be overwrapped-->

    <div class="new-action">
        <b-row no-gutters>
            <b-col>
                <div class="new-action-button new-action-button-newtask" @click="newtask"><icon name="play"/>&nbsp;&nbsp;Submit App</div>
            </b-col>
            <b-col>
                <div class="new-action-button new-action-button-newdataset" @click="newdataset"><icon name="cube"/>&nbsp;&nbsp;Stage Dataset</div>
            </b-col>
        </b-row>
    </div>

</div>
</template>

<script>
import Vue from 'vue'

import message from '@/components/message'
import task from '@/components/task'
import tags from '@/components/tags'
import app from '@/components/app'
import appname from '@/components/appname'
import statusicon from '@/components/statusicon'
import statustag from '@/components/statustag'
import mute from '@/components/mute' //deprecate?
import datatypetag from '@/components/datatypetag'
import product from '@/components/product'

import appcache from '@/mixins/appcache'

import ReconnectingWebSocket from 'reconnectingwebsocket'

const lib = require('../lib');
const async = require('async');

//store full list of datatypes / projects names...
let cache_datatypes = null;
let cache_projects = null;

export default {
    mixins: [appcache],
    props: [ 'project', 'instance' ],

    components: { 
        task, 
        message, tags, 
        app, 
        statusicon, mute,
        datatypetag, appname, statustag,
        product, 
    },

    data() {
        return {
            tasks: null,
            datatypes: {}, 
            archived: [], //archived datasets from this process
            projects: null,

            selected_task_id: null,
            
            ws: null, //websocket
            desc: "",

            loading: false,
            config: Vue.config,
        }
    },

    mounted() {

        //don't forget to add remove listener on destroyed (debug loader won't destroy parent.. so you will end up with bunch of the same event firing)
        this.$root.$on('datasetselecter.submit', this.submit_stage);
        this.$root.$on('newtask.submit', this.submit_task);
        this.$root.$on('showtask', id=>{
            this.selected_task_id = id;
            this.scrollto(id);
        }); 

        //load full list of datatypes and projects
        if(cache_datatypes && cache_projects) {
            this.datatypes = cache_datatypes;
            this.projects = cache_projects;
            return this.load();
        }

        this.$http.get('datatype').then(res=>{
            this.datatypes = {};
            res.data.datatypes.forEach(datatype=>{
                this.datatypes[datatype._id] = datatype;
            });
            cache_datatypes = this.datatypes;

            return this.$http.get('project', {params: {
                select: 'name desc',
                limit: 500,
            }});
        }).then(res=>{
            this.projects = {};
            res.data.projects.forEach(project=>{
                this.projects[project._id] = project;
            });
            cache_projects = this.projects;

            this.load();
        });

    },

    destroyed() {
        this.$root.$off('datasetselecter.submit');
        this.$root.$off('newtask.submit');
        this.$root.$off('showtask');

        if(this.ws) {
            console.log("disconnecting from ws - process");
            this.ws.close();
        }
    },

    computed: {
        //list of available datasets (staged, or generated)
        _datasets: function() {
            if(!this.tasks) return [];

            var datasets = [];
            this.tasks.forEach(task=>{
                if(task.status == "removed") return;
                if(task.status == "stopped") return;
                if(task.status == "failed") return; //this is bit tricky.. but if task failed, let's consider it to be failed
                if(!task.config._outputs) return; //probably only needed during dev.
                task.config._outputs.forEach(output=>{
                    datasets.push({
                        task,
                        id: output.id,
                        idx: datasets.length, //for filtered list to find the index (may not be the same as did if dataset is removed)

                        datatype: output.datatype,
                        datatype_tags: output.datatype_tags,
                        desc: output.desc,
                        tags: output.tags||[],
                        meta: output.meta||{},
                        create_date: output.create_date,
                        subdir: output.subdir, //set if the dataset is stored under subdir of task_dir
                        files: output.files, //set if output file mapping (file id=>path under the task_dir/subdir)

                        //only set if it's archived (or from stage in)
                        dataset_id: output.dataset_id, 
                        project: output.project,
                    });
                });
            }); 
            return datasets;
        },
    },

    watch: {
        instance: function() {
            this.load();
        },
        'input_dialog.project': function(p) {
            this.input_dialog.datasets_groups = {};
        },
    },

    methods: {
        updatedesc() {
            this.$emit("updatedesc", this.desc);
        },

        find_task(id) {
            var found = null;
            this.tasks.forEach(task=>{
                if(task._id == id) found = task;
            });
            return found;
        },

        compose_desc(iolist, id) {
            let entry = iolist.find(it=>it.id == id);
            let desc = id;
            if(entry && entry.desc) desc += " / "+entry.desc;
            return desc;
        },

        scrollto(id) {
            var header = document.getElementsByClassName("instance-active")[0];
            var elem = document.getElementById(id);
            if(!elem || !header) return; //maybe not loaded yet?
            var top = elem.offsetTop-header.clientHeight;
            this.$refs.process.scrollTop = top;
        },
        open_dataset(id) {
            this.$root.$emit('dataset.view', {id});
        },

        open_archiver(task, output) {
            this.$root.$emit('archiver.show', {task, output});
        },

        load() {
            this.loading = true;
            if(this.ws) this.ws.close();
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {/*debug: Vue.config.debug,*/ reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "wf.task",
                        key: this.instance._id+".#",
                    }
                }));
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "warehouse.dataset",
                        key: this.project._id+".#",
                    }
                }));
                this.ws.onmessage = (json)=>{
                    var event = null;
                    try {
                        event = JSON.parse(json.data);
                    } catch(err) {
                        console.error(err);
                        return;
                    }
                    if(!event) {
                        console.error("can't parse event", json);
                        return;
                    }
                    if(event.error) return console.error(event.error);
                    if(!event.dinfo) {
                        console.error("event.dinfo not set");
                        return;
                    }
                    switch(event.dinfo.exchange) {
                    case "wf.task":
                        var task = event.msg;
                        var t = this.tasks.find(t=>t._id == task._id);
                        if(!task.config._tid) break; //not ui task
                        if(!t) {
                            //new task?
                            this.$notify("new t."+task.config._tid+"("+task.name+") "+task.status_msg);
                            task.show = true;
                            if(task.config._app) this.appcache(task.config._app, (err, app)=>{
                                if(err) return console.error(err);
                                task.app = app;
                            });
                            this.tasks.push(task); 
                            Vue.nextTick(()=>{
                                this.scrollto(task._id);
                            });
                        } else {
                            //update
                            if(t.status != task.status) {
                                var text = "t."+task.config._tid+"("+task.name+") "+task.status+" "+task.status_msg;
                                var type = null;
                                switch(task.status) {
                                case "failed": type = "error"; break;
                                case "finished": type = "success"; break;
                                case "stopped": type = "warn"; break;
                                default: 
                                    type = "";
                                }
                                this.$notify({type, text});
                            }
                            for(var k in task) t[k] = task[k]; //apply updates
                            //for(var k in task) Vue.set(t, k, task[k]);
                        }
                        break;
                    case "warehouse.dataset":
                        //see if we care..
                        let archived_dataset = this.archived.find(d=>d._id == event.msg._id);
                        if(archived_dataset) {
                            for(var k in event.msg) archived_dataset[k] = event.msg[k]; //update 
                        } else {
                            this.archived.push(event.msg);
                        }
                        break;
                    }
                };
            };

            this.$http.get(Vue.config.wf_api+'/task', {params: {
                find: JSON.stringify({
                    instance_id: this.instance._id,
                    status: {$ne: "removed"},
                    'config._tid': {$exists: true}, //use _tid to know that it's meant for process view
                }),
                limit: 1000, //should be enough.. for now
                sort: 'create_date',
            }})
            .then(res=>{

                //load show/hide status
                res.data.tasks.forEach(task=>{
                    task.show = true;
                    var show = localStorage.getItem("task.show."+task._id);
                    if(show == "false") task.show = false;
                });

                this.tasks = res.data.tasks;
                this.loading = false;
                this.desc = this.instance.desc;

                //load app detail
                this.tasks.forEach(task=>{
                    if(task.config._app) this.appcache(task.config._app, (err, app)=>{
                        task.app = app;
                    });
                });

                //loading archived datasets for all tasks
                var task_ids = this.tasks.map(task=>task._id); 
                this.$http.get('dataset', {params: {
                    select: '-product',
                    find: JSON.stringify({
                        project: this.project._id,
                        removed: false,
                        "prov.task.instance_id": this.instance._id,
                    }),
                    limit: 300,
                }}).then(res=>{
                    this.archived = res.data.datasets;
                    this.$nextTick(()=>{
                        console.log("trying to scroll to", this.selected_task_id);
                        this.scrollto(this.selected_task_id);
                    });
                });
            });
        },

        findarchived(task, output) {
            return this.archived.filter(dataset=>{
                if(dataset.removed) return false;
                if(!dataset.prov) return false;
                if(dataset.prov.task_id != task._id) return false;
                if(dataset.prov.output_id != output.id) return false;
                return true;
            });
        },

        projectname(project) {
            var project = this.projects[project];
            if(!project) return "(private project)"; //user don't have access to this project
            return project.name; 
        },

        //select all datasets that meets datatype requirement of 'input', that comes from task with name:task_name
        filter_datasets(input) {
            return lib.filter_datasets(this._datasets, input);
        },

        download(task, output) {
            var url = Vue.config.wf_api+'/task/download/'+task._id+'/';
            this.$notify({type: 'info', text: "Download should start soon.."});
            if(output.subdir) url+=output.subdir;
            url+='?at='+Vue.config.jwt;
            document.location = url;
        },

        notify_error(err) {
            console.error(err);
            this.$notify({type: 'error', text: err.body.message});
        },

        submit_stage(datasets) {
            let dataset_ids = [];
            for(var dataset_id in datasets) {
                //skip already staged dataset
                var found = this._datasets.find(dataset=>dataset.dataset_id == dataset_id);
                if(found) {
                    this.$notify({type: 'warn', text:'Dataset(s) specified is already staged. Skipping.'});
                    continue;
                }
                dataset_ids.push(dataset_id);
            }
            if(dataset_ids.length == 0) return;
            this.$http.post('dataset/stage', {
                instance_id: this.instance._id,
                dataset_ids,
            }).then(res=>{
                console.dir(res.data);
            });
        },

        submit_task(task) {
            //set last minutes stuff
            task.instance_id = this.instance._id;
            task.config._tid = this.next_tid();
            this.$http.post(Vue.config.wf_api+'/task', task).then(res=>{
                var _task = res.data.task;
            }).catch(this.notify_error);
        },

        next_tid() {
            var next = 0;
            this.tasks.forEach(task=>{
                if(task.config._tid >= next) next = task.config._tid+1;
            });
            return next;
        },

        toggle_task(task) {
            task.show = !task.show;
            localStorage.setItem("task.show."+task._id, task.show);
        },

        set_viewsel_options(task, output) {
            let datatype = this.datatypes[output.datatype];
            this.$root.$emit("viewselecter.open", { datatype, task, subdir: output.subdir, files: output.files });
        },

        newtask() {
            this.$root.$emit("newtask.open", {
                datasets: this._datasets, 
                project: this.project,
            });
        },

        newdataset() {
            this.$root.$emit("datasetselecter.open");
        },

        remove() {
            if(confirm("Do you really want to remove this process and all tasks?")) {
                //unselect if selected
                //if(this.selected == this.instance) this.toggle_instance(instance);

                //remove for real
                this.$http.delete(Vue.config.wf_api+'/instance/'+this.instance._id).then(res=>{
                    this.$notify({type: "success", text: "Removing the process.."});
                    this.$emit("remove"); 
                }).catch(err=>{
                    console.error(err);
                    this.notify_error(err);
                });
            }
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
padding-bottom: 50px; /*so it won't be covered by notification*/
}
.sidebar h6 {
font-weight: bold;
color: #999;
padding: 10px;
margin: 0px;
}
.task {
box-shadow: 1px 1px 5px #ccc;
}
.task-desc {
margin-top: 5px;
margin-left: 95px;
border-left: 5px solid #ccc;
padding-left: 10px;
font-style: italic;
}
.sidebar .dataset {
border-bottom: 1px solid #d5d5d5; 
padding: 3px;
padding-left: 7px;
font-size: 85%;
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
font-size: 95%;
}
ul.archived {
list-style: none;
margin: 0px;
padding: 0px;
}
ul.archived li {
padding: 5px;
}
ul.archived li:hover {
cursor: pointer;
background-color: #ddd;
}
.sidebar .statusicon-failed {
color: #c00;
}
.sidebar .statusicon-running {
color: #2693ff;
}
.task-id {
cursor: pointer;
color: gray;
margin: 5px 10px;
font-weight: bold;
float: right;
position: relative;
z-index: 1;
}
.task-id:hover {
color: black;
}
.task-summary {
padding: 5px 10px;
background-color: white;
box-shadow: 0px 2px 4px #ccc;
margin-bottom: 1px;
}

.new-action {
background-color: white;
position: sticky;
bottom: 0px;
z-index: 6;
}

.new-action-button {
font-size: 120%;
text-align: center;
transition: background 0.5s ease;
cursor: pointer;
font-weight: bold;
padding: 10px;
border-right: 1px solid #eee;
}
.new-action-button:hover {
color: white;
}
.new-action-button-newtask {
color: #007bff;
}
.new-action-button-newtask:hover {
background-color: #007bff;
}
.new-action-button-newdataset{
color: #28a745;
}
.new-action-button-newdataset:hover {
background-color: #28a745;
}
.loading {
position: absolute;
padding: 10px 20px;
font-size: 125%;
color: #999;
}
.task-area {
padding: 5px 0 0 1px;
}
.instance-action {
float: right;
}
.input, 
.output {
padding: 6px 10px; 
font-size: 92%;
position: relative;
}
.output .output-actions {
transition: opacity 0.5s;
background-color: #fcfcfc;
float: right;
position: relative;
top: -3px;
}
span.ioid {
opacity: 0.6;
margin-right: 5px;
}
</style>
