<template>
<div v-if="instance">
    <div class="task-tabs">
        <div v-if="tasks" v-for="task in tasks" :key="task._id" :class="get_tasktab_class(task)" @click="scrollto(task._id)">
            <div class="task-tab-title">
                <b style="float: right;">t.{{task.config._tid}}</b> 
                <span v-if="task.service!='soichih/sca-product-raw'">{{task.service}}</span>
            </div>
            <div v-for="(output, idx) in task.config._outputs" :key="idx">
                <b>{{output.meta.subject}}</b> <datatypetag :datatype="datatypes[output.datatype]" :tags="output.datatype_tags"/>
            </div>
        </div>
    </div>

    <div class="tasks" v-if="tasks" v-for="task in tasks" :key="task._id">
        <!--task-id and toggler-->
        <div style="float: right;" :id="task._id" :title="task._id" class="task-id" @click="toggle_task(task)">
            <icon name="caret-down" v-if="task.show"/><icon name="caret-right" v-else/> 
            t.{{task.config._tid}}
        </div>

        <!--full detail-->
        <task :task="task" class="task" v-if="task.show">
            <!--header-->
            <div slot="header" class="task-header">
                <div v-if="task.config._app && task.show" style="margin-right: 30px;">
                    <app :appid="task.config._app" :branch="task.service_branch||'master'" :compact="true">
                        <div v-if="task.desc" class="task-desc">
                            {{task.desc}}
                        </div>
                    </app>
                </div>
                <div v-else>
                    <h4 style="margin: 0px;" class="text-muted">
                        <icon name="paper-plane"/>&nbsp;&nbsp;&nbsp;{{task.name}}
                    </h4>
                </div>
            </div>

            <!--input-->
            <div slot="input" v-if="task.config._inputs">
                <div v-for="(input, idx) in task.config._inputs" :key="idx" style="padding: 5px;">
                    <div v-if="findtask(input.task_id)" class="clickable" @click="scrollto(input.task_id)">
                        <b v-if="input.meta.subject">{{input.meta.subject}}</b>
                        <datatypetag :datatype="datatypes[input.datatype]" :tags="input.datatype_tags"/>
                        <mute>
                            <small v-for="(tag,idx) in input.tags" :key="idx"> | {{tag}} </small>
                            <!--(d.{{input.did}})-->
                        </mute>
                        <mute v-if="findtask(input.task_id).status != 'finished'">
                            <statusicon :status="findtask(input.task_id).status"></statusicon> 
                        </mute>
                        <span style="opacity: 0.5;">
                            <icon style="margin: 0 5px" name="arrow-left" scale="0.8"/> 
                            <b>t.{{findtask(input.task_id).config._tid}}</b>
                            {{findtask(input.task_id).name}}
                        </span>
                    </div>
                    <div v-else>
                        <b v-if="input.meta.subject">{{input.meta.subject}}</b>
                        <datatypetag :datatype="datatypes[input.datatype]" :tags="input.datatype_tags"/>
                        <mute>
                            <small v-for="(tag,idx) in input.tags" :key="idx"> | {{tag}} </small>
                            <!--(d.{{input.did}})-->
                        </mute>
                        <b-badge variant="danger">Removed</b-badge>
                    </div>
                </div>
            </div>

            <!--output-->
            <div slot="output" v-if="task.config._outputs.length > 0">
                <div v-for="output in task.config._outputs" :key="output.id" style="padding: 5px;">
                    <div class="float-right" style="position: relative; top: -5px;" v-if="task.status == 'finished'">
                        <div class="button" v-b-modal.viewSelecter title="View" @click="set_viewsel_options(task, datatypes[output.datatype].name, output.subdir)">
                            <icon name="eye"/>
                        </div>
                        <div class="button" @click="download(task, output)" title="Download"><icon name="download"/></div>
                        <div class="button" :class="{'button-gray': archiving === output}" title="Archive" @click="archiving = output"><icon name="archive"/></div>
                    </div>

                    <b v-if="output.meta.subject">{{output.meta.subject}}</b>
                    <datatypetag :datatype="datatypes[output.datatype]" :tags="output.datatype_tags"/>
                    <mute>
                        <small v-for="(tag,idx) in output.tags" :key="idx"> | {{tag}}</small>
                        <!--(d.{{output.did}})-->
                    </mute>
                    <b-badge v-if="output.archive" variant="primary">Auto Archive: {{projects[output.archive.project].name}}</b-badge>
                    <span @click="open_dataset(output.dataset_id)" class="clickable text-muted" v-if="output.dataset_id">
                        <icon style="opacity: 0.5; margin: 0 5px" name="arrow-left" scale="0.8"/> <icon name="shield"/> <b>{{projects[output.project].name}}</b>
                    </span>
                    <span v-if="task.status == 'running'" class="text-muted">
                        <icon name="cog" :spin="true"/>
                    </span>
                    <div v-if="findarchived(task, output).length > 0" class="archived-datasets">
                        <div class="archived-datasets-title">Archived Datasets</div>
                        <ul class="archived">
                            <li v-for="dataset in findarchived(task, output)" :key="dataset._id" @click="open_dataset(dataset._id)" class="clickable">
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
                    <archiveform v-if="archiving === output" :task="task" :output="output" @done="done_archive"></archiveform>
                </div>
                <div v-if="task.product">
                    <pre v-highlightjs="JSON.stringify(task.product, null, 4)" style="max-height: 150px;"><code class="json hljs"></code></pre>
                </div>
            </div>
        </task>

        <!--task summary (hidden detail)-->
        <div v-else class="task-summary" style="color: #666;">
            <div style="display: inline-block; float: left; width: 25px;">
                <statusicon :status="task.status"/>
            </div>
            <b>
                <appname v-if="task.config._app" :appid="task.config._app"/>
                <span v-else class="text-muted">{{task.name}}</span>
            </b>
        </div>
    </div>

    <div class="new-action">
        <b-row no-gutters>
            <b-col>
                <div class="new-action-button new-action-button-newtask" @click="newtask"><icon name="paper-plane"/> Submit New Task</div>
            </b-col>
            <b-col>
                <div class="new-action-button new-action-button-newdataset" @click="newdataset"><icon name="cube"/> Stage New Dataset</div>
            </b-col>
        </b-row>
    </div>

</div>
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import message from '@/components/message'
import task from '@/components/task'
import filebrowser from '@/components/filebrowser'
import tags from '@/components/tags'
import pageheader from '@/components/pageheader'
import appavatar from '@/components/appavatar'
import app from '@/components/app'
import appname from '@/components/appname'
import archiveform from '@/components/archiveform2'
import projectselecter from '@/components/projectselecter'
import statusicon from '@/components/statusicon'
import statustag from '@/components/statustag'
import mute from '@/components/mute'
import datatypetag from '@/components/datatypetag'

import ReconnectingWebSocket from 'reconnectingwebsocket'

const lib = require('../lib');
const async = require('async');

export default {
    props: [ 'project', 'instance' ],

    components: { 
        sidemenu, task, 
        message, tags, 
        filebrowser, pageheader, 
        appavatar, app, archiveform, 
        projectselecter, statusicon, mute,
        datatypetag, appname, statustag,
    },

    data() {
        return {
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
        //don't forget to add remove listener on destroyed (debug loader won't destroy parent.. so you will end up with bunch of the same event firing)
        this.$root.$on('datasetselecter.submit', this.submit_stage);
        this.$root.$on('newtask.submit', this.submit_task);

        this.$http.get('datatype').then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach(datatype=>{
                this.datatypes[datatype._id] = datatype;
            });

            return this.$http.get('project', {params: {
                select: 'name desc',
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
        if(this.ws) {
            console.log("disconnecting from ws");
            this.ws.close();
        }

        this.$root.$off('datasetselecter.submit');
        this.$root.$off('newtask.submit');
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
                        //did: output.did, 
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
        instance: function() {
            console.log("instance updated");
            this.load();
        },
        'input_dialog.project': function(p) {
            this.input_dialog.datasets_groups = {};
        },
    },

    methods: {
        findtask: function(id) {
            var found = null;
            this.tasks.forEach(task=>{
                if(task._id == id) found = task;
            });
            return found;
        },
        scrollto: function(id) {
            var header = document.getElementsByClassName("instance-active")[0];
            var elem = document.getElementById(id);
            var top = elem.offsetTop-header.clientHeight;
            document.getElementById("scrolled-area").scrollTop = top;
        },
        open_dataset: function(id) {
            //TODO - user could be opening dataset that doesn't belong on the current project..
            //this.$root.$emit('dataset.view', id);
            this.$router.push("/project/"+this.project._id+"/dataset/"+id);
        },
        bind_ws() {
        },
        load() {
            console.log("loading process");
            this.archiving = null;

            console.log("(re)connecting to task updates");
            if(this.ws) this.ws.close();
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {/*debug: Vue.config.debug,*/ reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                console.log("(re)connected to websocket - binding (again)");
                console.log("binding to task update");
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "wf.task",
                        key: this.instance._id+".#",
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
                    var t = this.tasks.find(t=>t._id == msg._id);
                    if(!t) {
                        //new task?
                        this.$notify("new t."+msg.config._tid+"("+msg.name+") "+msg.status_msg);
                        msg.show = true;
                        this.tasks.push(msg); 
                    } else {
                        //update
                        if(t.status != msg.status) {
                            var text = "t."+msg.config._tid+"("+msg.name+") "+msg.status+" "+msg.status_msg;
                            var type = null;
                            switch(msg.status) {
                            case "failed": type = "error"; break;
                            case "finished": type = "success"; break;
                            case "stopped": type = "warn"; break;
                            }
                            console.log("notification type", type, msg.status);
                            this.$notify({type, text});
                        }
                        for(var k in msg) {
                            t[k] = msg[k];
                        }
                    }
                };
            };

            console.log("loading tasks");
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
                console.log("got tasks");

                //load show/hide status
                res.body.tasks.forEach(task=>{
                    task.show = true;
                    var show = localStorage.getItem("task.show."+task._id);
                    if(show == "false") task.show = false;
                });

                this.tasks = res.body.tasks;

                //loading archived datasets for all tasks
                var task_ids = this.tasks.map(task=>task._id); 
                this.$http.get('dataset', {params: {
                    find: JSON.stringify({
                        "prov.instance_id": this.instance._id,
                        removed: false,
                    }),
                    limit: 300,
                }}).then(res=>{
                    this.archived = res.body.datasets;

                });
            });
        },

        findarchived: function(task, output) {
            return this.archived.filter(dataset=>{
                return (dataset.prov.task_id == task._id && dataset.prov.output_id == output.id);
            });
        },

        //select all datasets that meets datatype requirement of 'input', that comes from task with name:task_name
        filter_datasets: function(input) {
            return lib.filter_datasets(this._datasets, input);
        },

        download: function(task, dataset) {
            var url = Vue.config.wf_api+'/task/download/'+task._id+'?at='+Vue.config.jwt;
            if(dataset.subdir) url+='&p='+encodeURIComponent(dataset.subdir);
            document.location = url;
        },

        notify_error: function(err) {
            console.error(err);
            this.$notify({type: 'error', text: err.body.message});
        },

        done_archive: function(dataset) {
            console.log("done archive");
            this.archiving = null;
            if(dataset) this.archived.push(dataset);
        },

        submit_stage: function(datasets) {
            console.log("received datasets", datasets);
            var download = [];
            var _outputs = [];
            //var did = this.next_did();
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
                    //did: did++,
                    subdir: dataset_id, 
                    dataset_id,
                    prov: null,
                }));
            }
            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: this.instance._id,
                name: "Staging Datasets",
                service: "soichih/sca-product-raw",
                config: { download, _outputs, _tid: this.next_tid() },
            }).then(res=>{
                console.log("submitted download", res.body.task);
                var task = res.body.task;
            });
        },

        submit_task: function(task) {
            //set last minutes stuff
            task.instance_id = this.instance._id;
            task.config._tid = this.next_tid();
            task.config._outputs.forEach(output=>{
                if(output.archive) output.archive.project = this.project._id;
            });

            console.dir(task);
            this.$http.post(Vue.config.wf_api+'/task', task).then(res=>{
                this.app = null;
                var task = res.body.task;
                //this.update_apps();
            }).catch(this.notify_error);
        },

        next_tid() {
            var next = 0;
            this.tasks.forEach(task=>{
                if(task.config._tid >= next) next = task.config._tid+1;
            });
            return next;
        },

        /*
        next_did() {
            var next = 0;
            this._datasets.forEach(dataset=>{
                if(dataset.did >= next) next = dataset.did+1;
            });
            return next;
        },
        */

        toggle_task: function(task) {
            //Vue.set(task, 'show', !task.show);
            task.show = !task.show;
            localStorage.setItem("task.show."+task._id, task.show);
        },

        set_viewsel_options: function(task, datatype_name, subdir) {
            //dialog itself is opened via ref= on b-button, but I still need to pass some info to the dialog and retain task._id
            this.$root.$emit("viewselecter.option", {
                datatype_name, task, subdir
            });
        },

        newtask() {
            this.$root.$emit("newtask.open", {
                datasets: this._datasets, 
            });
        },
        newdataset() {
            this.$root.$emit("datasetselecter.open");
        },

        get_tasktab_class(task) {
            let c = ["task-tab"];
            if(task.service == 'soichih/sca-product-raw') c.push("task-tab-stage");
            //if(task.status == "finished") c.push("bg-success");
            c.push("task-tab-"+task.status);
            return c;
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
.task-header {
margin: 0px;
padding: 15px;
background-color: #fff;
}
.new-action,
.task {
box-shadow: 0px 2px 4px #ccc;
}

/*
.task.v-enter, .task.v-leave {
height: 0;
}
*/
.task {
margin-bottom: 10px;
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
padding: 10px;
background-color: white;
box-shadow: 0px 2px 4px #ccc;
margin-bottom: 1px;
}

.new-action,
.tasks {
margin-right: 310px;
}
.new-action {
position: sticky; bottom: 0px;
background-color: white;
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
.task-tabs {
float: right;
width: 300px;
margin-top: 5px;
}
.task-tab {
font-size: 90%;
background-color: white;
box-shadow: 1px 1px 2px #ccc;
margin-bottom: 5px;
padding: 5px;
cursor: pointer;
padding-left: 10px;
/*border-radius: 10px;*/
}
.task-tab-title {
position: relative;
top: -2px;
}
.task-tab-stage {
background-color: #eee;
}
.task-tab-failed {
border-left: 2px solid #c00;
}
.task-tab-finished {
border-left: 2px solid #28a745;
}
.task-tab-waiting,
.task-tab-requested {
border-left: 2px solid #50bfff;
}
.task-tab-running {
border-left: 2px solid #007bff;
}
.task-tab-stop_requested,
.task-tab-stopped {
border-left: 2px solid gray;
}
</style>
