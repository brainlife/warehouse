<template>
<div v-if="projects && instance" style="position: relative;">
    <div v-if="!loading" ref="process-header" class="process-header onRight" :style="{left: splitter_pos+'px'}">
        <div class="instance-action">
            <div @click.stop="remove()" class="button" title="Remove this process and all tasks inside it">
                <icon name="trash"/>
            </div>
        </div>
        <div style="margin-right: 40px;">
            <b-form-textarea v-model="desc" @input="updatedesc" 
                placeholder="Enter process name"
                style="background-color: #f6f6f6; border: none; border-radius: 0; border: 1px solid #d8d8d8; height: 60px;"/>
        </div>
    </div>

    <div ref="process" class="process onRight" :style="{left: splitter_pos+'px'}">
        <p class="loading" v-if="loading"><icon name="cog" scale="1.25" spin/> Loading...</p>
        <b-alert variant="secondary" :show="!loading && tasks && tasks.length == 0">Please start by &nbsp;&nbsp;<b-button size="sm" variant="success" @click="newdataset"><icon name="cube"/> Staging Data</b-button> to process.</b-alert>
        <div v-if="!loading && tasks">
            <div class="task-area" v-for="task in tasks.filter(t=>Boolean(t.config._tid))" :key="task._id" :id="task._id">
                <div v-if="!task.show" class="task-id" @click="toggle_task(task)">
                    <b-badge variant="light"><icon name="caret-right"/> {{task.config._tid}}</b-badge>
                </div>

                <!--full detail-->
                <task :task="task" class="task" v-if="task.show">
                    <!--header-->
                    <div slot="header" style="background-color: white;">
                        <!--task-id and toggler-->
                        <div :title="task._id" class="task-id" @click="toggle_task(task)">
                            <b-badge variant="light"><icon name="caret-down" v-if="task.show"/> {{task.config._tid}}</b-badge>
                        </div>

                        <div v-if="task.app && task.show">
                            <app :app="task.app" :branch="task.service_branch||'master'" :compact="true"/>
                        </div>
                        <div v-else>
                            <h4 style="padding: 7px; margin-bottom: 0px; opacity: 0.8;">
                                <icon name="paper-plane"/>&nbsp;&nbsp;{{task.name}}
                            </h4>
                        </div>
                    </div>

                    <!--input-->
                    <div slot="input" v-if="task.config._inputs">
                        <div v-for="(input, idx) in task.config._inputs" :key="idx" class="input">
                            <b v-if="input.meta && input.meta.subject">{{input.meta.subject}}</b>
                            <small v-if="input.meta && input.meta.session" style="opacity: 0.8"> / {{input.meta.session}}</small>

                            <div style="display: inline-block;" v-if="find_task(input.task_id)" class="clickable" @click="scrollto(find_real_task(input.task_id)._id)">
                                <datatypetag :datatype="datatypes[input.datatype]" :tags="input.datatype_tags" :clickable="false"/>
                                <span style="opacity: 0.5;">
                                    <small v-for="(tag,idx) in input.tags" :key="idx"> | {{tag}} </small>
                                    <icon style="margin: 0 5px" name="arrow-left" scale="0.8"/> 
                                    <b>{{find_real_task(input.task_id).config._tid}}</b>
                                    <statustag v-if="find_task(input.task_id).status != 'finished'" :status="find_task(input.task_id).status"/>
                                    
                                    {{find_task(input.task_id).name}}
                                </span>
                            </div>

                            <!--can't find the task... then assume it's removed-->
                            <div v-else style="display: inline-block;">
                                <small v-if="input.meta && input.meta.session" style="opacity: 0.8"> / {{input.meta.session}}</small>
                                <datatypetag :datatype="datatypes[input.datatype]" :tags="input.datatype_tags" :clickable="false"/>
                                <span style="opacity: 0.5;">
                                    <small v-for="(tag,idx) in input.tags" :key="idx"> | {{tag}} </small>
                                </span>
                                <b-badge variant="danger">Unstaged</b-badge>
                            </div>
                            <small class="ioid" v-if="task.app">({{compose_desc(task.app.inputs, input.id)}})</small>
                        </div>
                    </div>

                    <!--output-->
                    <div slot="output" v-if="task.config._outputs">
                        <div v-for="(output, idx) in task.config._outputs" :key="idx" class="output">
                            <div class="output-actions">
                                <div class="button" v-if="output.dataset_id" 
                                    @click="open_dataset(output.dataset_id)" 
                                    title="Show Data-object Detail">
                                    <icon name="cubes"/>
                                </div>
                                <div class="button" v-if="!output.dataset_id" 
                                    v-b-toggle="task._id+'.'+output.id" 
                                    title="Show Metadata">
                                   <icon name="cube"/>
                                </div>

                                <div v-if="task.status == 'finished'" style="display: inline-block;">
                                    <div class="button" title="View" 
                                        @click="set_viewsel_options(task, output)">
                                        <icon name="eye"/>
                                    </div>
                                    <div class="button" 
                                        @click="download(task, output)" title="Download">
                                        <icon name="download"/>
                                    </div>

                                    <!--archive button-->
                                    <!-- 
                                        validator task could get removed, then we can't archive it anymore ..
                                        technically, the data is still validated even if it's removed, but archive will fail
                                        if we let user archive it.
                                    -->
                                    <div v-if="output.dtv_task && output.dtv_task.status == 'finished'" style="display: inline-block;">
                                        <div class="button" title="Archive this output (validated)" 
                                            @click="open_archiver(output.dtv_task, output.dtv_task.config._outputs[0])">
                                            <icon name="archive"/>
                                            <icon name="check" scale="0.5"/>
                                        </div>
                                    </div>
                                    <div v-else style="display: inline-block;">
                                        <div class="button" title="Archive this output" 
                                            @click="open_archiver(task, output)">
                                            <icon name="archive"/>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <b v-if="output.meta && output.meta.subject">{{output.meta.subject}}</b>
                            <small v-if="output.meta && output.meta.session" style="opacity: 0.8"> / {{output.meta.session}}</small>
                            <datatypetag :datatype="datatypes[output.datatype]" :tags="output.datatype_tags" :clickable="false"/>
                            <mute>
                                <small v-for="(tag,idx) in output.tags" :key="idx"> | {{tag}}</small>
                            </mute>

                            <div style="display: inline-block;" v-if="datatypes[output.datatype].validator" :title="datatypes[output.datatype].validator">
                                <small style="opacity: 0.5"><icon name="arrow-right" scale="0.8" style="position: relative; top: -2px;"/> Validate</small>
                            </div>

                            <div v-if="output.archive" style="display: inline-block;">
                                <small style="opacity: 0.5"><icon name="arrow-right" scale="0.8" style="position: relative; top: -2px;"/> Archive</small>
                                <small v-if="project._id != output.archive.project">{{projectname(output.archive.project)}}</small>
                            </div>

                            <!--foreign project-->
                            <span class="text-muted" v-if="output.dataset_id && output.project != project._id">
                                <icon style="opacity: 0.5; margin: 0 5px" name="arrow-left" scale="0.8"/><small>from</small> <icon name="shield-alt"/> <b>{{projectname(output.project)}}</b>
                            </span>
                            <small class="ioid" v-if="task.app">({{compose_desc(task.app.outputs, output.id)}})</small>

                            <dtv v-if="task.status == 'finished' && output.dtv_task" :task="output.dtv_task" :output="output"/>

                            <div v-if="findarchived(task, output).length > 0">
                                <ul class="archived">
                                    <li v-for="dataset in findarchived(task, output)" :key="dataset._id" 
                                        @click="open_dataset(dataset._id)" class="clickable">
                                        <timeago class="text-muted" style="float: right" :datetime="dataset.create_date" :auto-update="10"/>
                                        <div class="subtitle" style="margin-bottom: 5px;"><icon name="cubes"/> Output Archived</div>

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
                                        <small>({{dataset._id}})</small>
                                    </li>
                                </ul>
                            </div>

                            <b-collapse :id="task._id+'.'+output.id" style="margin-top: 8px;">
                                <div class="subtitle">Metadata</div>
                                <small>from config._output</small>
                                <pre style="max-height: 300px; background-color: #eee; padding: 5px 10px;">{{JSON.stringify(output.meta, null, 4)}}</pre>
                                <p v-if="Object.keys(findProductMeta(task, output.id)).length">
                                    <small>from product.json</small>
                                    <pre style="max-height: 300px; background-color: #eee; padding: 5px 10px;">{{JSON.stringify(findProductMeta(task, output.id), null, 4)}}</pre>
                                </p>
                            </b-collapse>

                            <div v-if="output.secondary_task" style="font-size: 90%; padding: 5px 10px; border: 2px solid #eee; border-radius: 5px; margin-top: 5px; color: #888;">
                                <span v-if="output.secondary_task.finish_date">
                                    Ready for Analysis
                                </span>
                                <span v-else>
                                    <statusicon :status="output.secondary_task.status"/>
                                    {{output.secondary_task.status_msg}}
                                </span>
                                <small style="opacity: 0.5; font-size:70%;">{{output.secondary_task._id}}</small>
                            </div>

                        </div><!--output-->

                        <!-- 
                            Task level (native) product
                            We will be replacing this soon with product from validator..
                            But we still want to let App generates their own product.
                            We will be merging product from the App and validator before
                            storing them on datasetproduct collection
                        -->
                        <product :product="task.product"/>
                        <div v-if="task.config._outputs.length == 0 && !task.product" style="padding: 10px; opacity: 0.5">No output</div>
                    </div><!--outputs-->
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

                <div class="task-joint">
                    <div v-if="!task.desc && editing_taskdesc[task.config._tid] === undefined" style="opacity: 0.3; cursor: pointer;" @click="edit_taskdesc(task)">
                        <icon name="edit" class="edit_taskdesc"/>
                    </div>
                    <div v-if="editing_taskdesc[task.config._tid] !== undefined" style="padding: 5px 0">
                        <b-form-textarea v-model="editing_taskdesc[task.config._tid]" 
                            :ref="'textarea-focus-'+task.config._tid"
                            rows="2"
                            max-rows="10"
                            placeholder="Enter Notes in Markdown" 
                            style="background-color: #f0f0f0; border: none; border-radius: 0;"/>
                        <div style="padding-top: 5px;">
                            <b-button-group style="float: right">
                                <b-button size="sm" @click="editing_taskdesc[task.config._tid] = undefined" variant="secondary"><icon name="times"/></b-button>
                                <b-button size="sm" @click="update_taskdesc(task)" variant="primary">Save</b-button>
                            </b-button-group>
                        </div>
                        <br clear="both">
                    </div>
                    <div v-if="task.desc && editing_taskdesc[task.config._tid] === undefined" @click="edit_taskdesc(task)" style="padding: 5px 0;">
                        <vue-markdown :source="task.desc" class="readme" style="margin: 0px 5px;"/>
                    </div>
                </div>
            </div>
        </div>
        <!--give it a bit of space after the last task-->
        <br>
        <br>
        <br>
    </div>

    <div class="new-action onRight" :style="{left: splitter_pos+'px'}">
        <b-row no-gutters>
            <b-col v-if="_datasets.length > 0">
                <div class="new-action-button new-action-button-newtask" @click="newtask"><icon name="play"/>&nbsp;&nbsp;Submit App</div>
            </b-col>
            <b-col>
                <div class="new-action-button new-action-button-newdataset" @click="newdataset"><icon name="cube"/>&nbsp;&nbsp;Stage Data</div>
            </b-col>
        </b-row>
    </div>

</div>
</template>

<script>
import Vue from 'vue'

//import message from '@/components/message'
import task from '@/components/task'
import tags from '@/components/tags'
import app from '@/components/app'
import appname from '@/components/appname'
import statusicon from '@/components/statusicon'
import statustag from '@/components/statustag'
import mute from '@/components/mute' //deprecate?
import datatypetag from '@/components/datatypetag'
import product from '@/components/product'
import VueMarkdown from 'vue-markdown'
import dtv from '@/components/dtv'

import appcache from '@/mixins/appcache'

import ReconnectingWebSocket from 'reconnectingwebsocket'

const lib = require('../lib');
const async = require('async');

//store full list of datatypes / projects names...
let cache_datatypes = null;
let cache_projects = null;

export default {
    mixins: [appcache],
    props: [ 'project', 'instance', 'splitter_pos' ],

    components: { 
        task, 
        tags, 
        app, 
        statusicon, mute,
        datatypetag, appname, statustag,
        product, 
        VueMarkdown,
        dtv,
    },

    data() {
        return {
            tasks: null,

            editing_taskdesc: {},

            datatypes: {}, 
            archived: [], //archived datasets from this process
            projects: null,

            //selected_task_id: null,
            
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
            //this.selected_task_id = id;
            this.scrollto(id);
        }); 

        //don't load datatype / projects if we already loaded it
        if(cache_datatypes && cache_projects) {
            this.datatypes = cache_datatypes;
            this.projects = cache_projects;
            return this.load(err=>{
                this.readHash();
            });
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
            this.load(()=>{
                this.readHash();
            });
        });


    },

    destroyed() {
        this.$root.$off('datasetselecter.submit');
        this.$root.$off('newtask.submit');
        this.$root.$off('showtask');
        if(this.ws) this.ws.close();
    },

    computed: {
        //list of available datasets (staged, or generated)
        _datasets: function() {
            if(!this.tasks) return [];

            var datasets = [];
            this.tasks.forEach(task=>{
                if(task.status == "removed") return;
                if(task.status == "stop_requested") return;
                if(task.status == "stopped") return;
                if(task.status == "failed") return; 
                if(task.follow_task_id) return; //don't let user select validator directly (we will fake it)
                if(!task.config._outputs) return;
                task.config._outputs.forEach(output=>{

                    let t = task;

                    //if this output has validator, then use that instead
                    if(output.dtv_task) {
                        t = output.dtv_task;
                        output = output.dtv_task.config._outputs[0];
                        t.name = task.name + " (validated)";
                    }

                    /*
                    //merge product.json content to output meta
                    if(task.product && task.product[output.id] && task.product[output.id].meta) {
                        Object.assign(output.meta, task.product[output.id].meta);
                    }
                    */

                    datasets.push({
                        task: t,
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
        instance: function(nv, ov) {
            this.load(err=>{
                this.readHash();
            });
        },
        'input_dialog.project': function(p) {
            this.input_dialog.datasets_groups = {};
        },
    },

    methods: {
        findProductMeta(task, output_id) {
            const meta = {};
            if(task.product) {
                //root level meta
                if(task.product.meta) Object.assign(meta, task.product.meta);
                //object specific meta
                if(task.product[output_id] && task.product[output_id].meta) Object.assign(meta, task.product[output_id].meta);
            }
            return meta;
        },

        //find the task that the dtv_task belongs to (follow_task_id) and set dtv_tak on 
        //the parent tasks's config._outputs[output_id]
        set_dtv_task(dtv_task) {
            if(!this.tasks) return;
            if(!dtv_task.config._outputs) return; //for dev
            if(!dtv_task.follow_task_id) return; //for dev
            
            //first find the task and output that dtv follows
            let task = this.tasks.find(task=>task._id == dtv_task.follow_task_id);
            if(!task) return; //for dev?

            //then find the output that dtv ran for
            let output_id = dtv_task.config._outputs[0].id;
            let output = task.config._outputs.find(out=>out.id == output_id);
            if(output.dtv_task) {
                //updating
                if(output.dtv_task.status != dtv_task.status) {
                    this.playNotification(dtv_task.status);
                }
            }
            Vue.set(output, 'dtv_task', dtv_task);
        },

        playNotification(status) {
            switch(status) {
            case "running": this.$root.playNotification("running"); break;
            case "failed": this.$root.playNotification("failed"); break;
            case "finished": this.$root.playNotification("finished"); break;
            }
        },

        //store the secondary_task object under the task that produced it.
        //there are two app-archive-secondary tasks. 
        //  1. validator/secondary output (mainly used to create UI content)
        //  2. content from the datatype with groupAnalysis enabled

        set_secondary_task(secondary_task) {
            if(!this.tasks) return;
            if(secondary_task.config.validator_task) {
                //validator_task is deprecated (remove eventually)
                let dtv_task = secondary_task.config.validator_task;

                if(!dtv_task.follow_task_id) return; 
                let task = this.tasks.find(task=>task._id == dtv_task.follow_task_id);
                if(!task) return; //for dev?
                let output_id = dtv_task.config._outputs[0].id;
                let output = task.config._outputs.find(out=>out.id == output_id);
                Vue.set(output, 'secondary_task', secondary_task);
            } else {
                secondary_task.config.requests.forEach(request=>{

                    //we really care about case 2
                    if(request.validator) return;

                    //find the task that this output belongs to
                    let task = this.tasks.find(task=>task._id == request.task_id)
                    if(!task) return; //maybe removed?

                    //find the output that this output belongs to (subdir should be the output_id)
                    let output = task.config._outputs.find(out=>out.id == request.subdir);

                    //now I can set it to the output
                    Vue.set(output, 'secondary_task', secondary_task);
                });
            }
        },

        updatedesc() {
            this.$emit("updatedesc", this.desc);
        },

        edit_taskdesc(task) {
            Vue.set(this.editing_taskdesc, task.config._tid, task.desc||'');
            this.$nextTick(()=>{
                this.$refs['textarea-focus-'+task.config._tid][0].$el.focus();
            });
        },
        update_taskdesc(task) {
            task.desc = this.editing_taskdesc[task.config._tid];
            this.$http.put(Vue.config.amaretti_api+'/task/'+task._id, {desc: this.editing_taskdesc[task.config._tid].trim()})
            .then(res=>{
                this.editing_taskdesc[task.config._tid] = undefined;
            }).catch(err=>{
                //revert to edit?
                console.error(err); 
            });
        },

        find_task(id) {
            var found = null;
            this.tasks.forEach(task=>{
                if(task._id == id) found = task;
            });
            return found;
        },

        find_real_task(id) {
            let task = this.find_task(id);
            if(!task) return null;
            if(task.follow_task_id) {
                let parent_task = this.find_real_task(task.follow_task_id);
                if(parent_task) return parent_task;

                //return the task we know..
                console.error("couldn't find parent task of", task.follow_task_id)
            }
            return task;
        },

        compose_desc(iolist, id) {
            let entry = iolist.find(it=>it.id == id);
            let desc = id;
            if(entry && entry.desc) desc += " / "+entry.desc;
            return desc;
        },

        scrollto(id) {
            let elem = document.getElementById(id);
            if(!elem) return; //maybe not loaded yet?
            this.$refs.process.scrollTop = elem.offsetTop;//top;
            history.replaceState(null, null, '#'+id);
        },

        open_dataset(id) {
            this.$root.$emit('dataset.view', {id});
        },

        open_archiver(task, output) {
            this.$root.$emit('archiver.show', {task, output, project: this.project._id});
        },

        readHash() {
            this.$nextTick(()=>{
                let hash = document.location.hash;
                if(hash) {
                    let id = hash.substring(1);
                    this.scrollto(id);
                }
            });
        },

        load(cb) {
            this.loading = true;
            if(this.ws) this.ws.close();

            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {/*debug: Vue.config.debug,*/ reconnectInterval: 3000});
            this.ws.onopen = (e)=>{

                //wf.task will be deprecated by ex:amaretti
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "wf.task",
                        key: this.instance._id+".#",
                    }
                }));

                //TODO - maybe I should listen to dataset events in project.vue? (components/datasets.vue also listens to dataset events)
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "warehouse",
                        key: "dataset.*.*."+this.project._id+".#",
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
                        if(task.service.startsWith("brainlife/validator-")) {
                            var t = this.tasks.find(t=>t._id == task._id);
                            if(!t) {
                                this.tasks.push(task); 
                                this.set_dtv_task(task);
                            } else {
                                if(t.status != task.status && task.status == "finished") {
                                    this.loadProducts([task]);
                                }
                                for(var k in task) {
                                    if(k == "config") continue;
                                    t[k] = task[k]; //apply updates
                                }
                            }
                        } else if(task.service == "brainlife/app-archive-secondary") {
                            this.set_secondary_task(task);
                        } else if(task.config._tid) {
                            //ui task
                            var t = this.tasks.find(t=>t._id == task._id);
                            if(!t) {
                                //new task?
                                this.$notify("new t."+task.config._tid+"("+task.name+") "+task.status_msg);
                                task.show = true;
                                if(task.config._app) this.appcache(task.config._app, (err, app)=>{
                                    if(err) return console.error(err);
                                    Vue.set(task, 'app', app); //see if this cures the missing app info bug
                                    this.$forceUpdate();
                                });
                                this.tasks.push(task); 
                                this.loadProducts([task]);
                                Vue.nextTick(()=>{
                                    this.scrollto(task._id);
                                });
                            } else {
                                //update
                                if(t.status != task.status) {
                                    var text = "t."+task.config._tid+"("+task.name+") "+task.status+" "+task.status_msg;
                                    var type = null;
                                    this.playNotification(task.status);
                                    switch(task.status) {
                                    case "running":
                                        break;
                                    case "failed": 
                                        type = "error"; 
                                        break;
                                    case "finished": 
                                        this.loadProducts([t]);
                                        type = "success"; 
                                        break;
                                    case "stopped": 
                                        type = "warn"; 
                                        break;
                                    default: 
                                        type = "";
                                    }
                                    this.$notify({type, text});
                                }
                                for(var k in task) {
                                    if(k == "config") continue; //config should not change, and we are storing dtv_task under config._outputs.. so I don't want it get overwritten
                                    t[k] = task[k]; //apply updates
                                }
                            }
                        }
                        break;
                    case "warehouse":
                        //see if we care..
                        let routingKey = event.dinfo.routingKey.split(".");
                        let dataset_id = routingKey[4];  
                        let archived_dataset = this.archived.find(d=>d._id == dataset_id);
                        if(archived_dataset) {
                            for(var k in event.msg) archived_dataset[k] = event.msg[k]; //update 
                        } else {
                            this.archived.push(event.msg);
                        }
                        break;
                    default:
                        console.log("unknown event");
                        console.error(event);
                    }
                };
            };

            //load all tasks for this instance (including removed ones - we need to load validator)
            this.$http.get(Vue.config.amaretti_api+'/task', {params: {
                find: JSON.stringify({
                    instance_id: this.instance._id,
                }),
                limit: 1000, //should be enough.. for now?
                sort: 'create_date',
            }})
            .then(res=>{
                //load products
                this.tasks = res.data.tasks.filter(task=>{
                    //we want to load validator product as long as follow_task_id isn't removed yet
                    if(task.service.includes("brainlife/validator-")) {
                        const followed = res.data.tasks.find(t=>t._id == task.follow_task_id);
                        if(followed.status != "removed") return true;
                    }
                    if(task.status == 'removed') return false; //for other tasks, load product if it's not removed
                    return true;
                });
                this.loadProducts(this.tasks);

                //sort dtv tasks into corresponding task
                this.dtv_tasks = {};
                res.data.tasks.filter(task=>task.service.startsWith('brainlife/validator-')).map(this.set_dtv_task);
                res.data.tasks.filter(task=>task.service == 'brainlife/app-archive-secondary').map(this.set_secondary_task);

                //load show/hide status
                this.tasks.forEach(task=>{
                    task.show = true;
                    var show = localStorage.getItem("task.show."+task._id);
                    if(show == "false") task.show = false;
                });

                this.loading = false;
                this.desc = this.instance.desc;
                this.editing_taskdesc = {};

                //load app detail
                this.tasks.forEach(task=>{
                    if(task.config._app) this.appcache(task.config._app, (err, app)=>{
                        if(err) return console.error(err);
                        Vue.set(task, 'app', app); //see if this cures the missing app info bug
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
                    if(cb) cb();
                });
            });
        },

        loadProducts(tasks) {
            let ids = tasks.map(task=>task._id);
            this.$http.get(Vue.config.amaretti_api+'/task/product/', {params: {ids}}).then(res=>{
                res.data.forEach(rec=>{
                    if(!rec.product) return;
                    let task = this.tasks.find(t=>t._id == rec.task_id);
                    Vue.set(task, 'product', rec.product);

                    /* //let's do this in amaretti/task
                    //apply product to _output.meta so subsequent jobs gets correct set of meta
                    if(!task.config._outputs) return;
                    task.config._outputs.forEach(output=>{
                        if(!output.meta) output.meta = {};
                        if(rec.product[output.id] && rec.product[output.id].meta) {
                            Object.assign(output.meta, rec.product[output.id].meta);
                        }
                    });
                    */
                });
            });
        },

        findarchived(task, output) {
            return this.archived.filter(dataset=>{
                if(dataset.removed) return false;
                if(!dataset.prov) return false;
                if(dataset.prov.task._id != task._id && dataset.prov.task.follow_task_id != task._id) return false;
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
            var url = Vue.config.amaretti_api+'/task/download/'+task._id+'/';
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
                //console.dir(res.data);
                this.$notify({text:'Datasets staged'});
            });
        },

        submit_task(task) {
            //set last minutes stuff
            task.instance_id = this.instance._id;
            task.config._tid = this.next_tid();

            //figure out which gids to use
            task.gids = [this.project.group_id];
            if(!this.project.noPublicResource) task.gids.push(1);
            console.log("using gids", task.gids);

            this.$http.post(Vue.config.amaretti_api+'/task', task).then(res=>{
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
            this.$forceUpdate();
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
                //remove for real
                this.$http.delete(Vue.config.amaretti_api+'/instance/'+this.instance._id).then(res=>{
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
.process {
scroll-behavior: smooth;
position: fixed;
bottom: 45px;
top: 175px;
overflow-y: auto;
overflow-x: hidden;
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
.dataset.clickable:hover {
background-color: #eee;
}
.truncate {
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis; 
}
.subtitle {
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
margin-top: 10px;
padding: 10px 15px;
background-color: #eee;
border-radius: 4px;
/*border: 2px solid #ddd;*/
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
color: #666;
margin: 3px 5px;
font-weight: bold;
float: right;
position: relative;
z-index: 1;
text-shadow: 1px 1px 3px white;
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
position: fixed;
bottom: 0px;
height: 45px;
z-index: 7;
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
.task-joint {
border-left: 3px solid #ddd;
padding: 2px 5px;
margin-left: 20px;
padding-left: 15px;
}
.task-joint .edit_taskdesc {
opacity: 0;
transition: 0.3s opacity;
}
.task-joint:hover .edit_taskdesc {
opacity: 1;
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
.process-header {
padding: 10px; 
padding-left: 0px;
position: fixed; 
top: 95px; 
left: 600px;
height: 80px;
z-index: 7; 
background-color: #eee;
}

</style>
