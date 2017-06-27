<<<<<<< HEAD
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
                <ul style="padding-left: 0px; list-style: none;">
                    <li v-for="(dataset, idx) in _datasets" :key="idx" v-if="dataset.task.name == 'brainlife.stage_input'" style="margin-bottom: 10px;">
                        <!-- removing task will remove all input datasets that are staged together.. I need to only remove 1.. but how?
                        <div @click="remove_task(dataset.task._id)" style="display: inline; cursor: pointer;" title="Remove">
                            <icon name="close"></icon>
                        </div>
                        -->
                        <mute>D{{idx}}</mute> 
                        <b>{{dataset.meta.subject}}</b>
                        <!--<el-tag type="primary">{{dataset.meta.subject}}</el-tag>-->
                        {{datatypes[dataset.datatype].name}} <tags :tags="dataset.datatype_tags"></tags>
                        <time>{{dataset.create_date|date('%x')}}</time>
                        <mute>
                            <small v-if="dataset.task.status != 'finished'">
                                <statusicon :status="dataset.task.status"/> Staging ..
                            </small>
                        </mute>
                        <!--
                        <br>
                        <small>{{dataset.name}}</small>
                        -->
                    </li>
                </ul>
                <br>
                <h3>Output Datasets</h3>
                <ul style="padding-left: 0px; list-style: none;">
                    <li v-for="(dataset, idx) in _datasets" :key="idx" v-if="dataset.task.name == 'brainlife.stage_output'" style="margin-bottom: 10px;">
                        <!--
                        <div @click.stop="remove_task(dataset.task._id)" style="display: inline; cursor: pointer;" title="Unselect">
                            <icon name="close"></icon>
                        </div>
                        -->
                        <mute>D{{idx}}</mute> 
                        <b v-if="dataset.meta">{{dataset.meta.subject}}</b>
                        <!--<metadata :metadata="dataset.meta"/>-->
                        <!--<b>{{dataset.did}}</b>-->
                        {{datatypes[dataset.datatype].name}} <tags :tags="dataset.datatype_tags"></tags>
                        <time v-if="dataset.create_date">{{dataset.create_date|date('%x')}}</time>
                        <mute>
                            <small v-if="dataset.task.status != 'finished'">
                                <statusicon :status="dataset.task.status"/> Processing ..
                            </small>
                        </mute>
                        <p v-if="dataset.dataset_id">
                            <el-button size="mini" @click="go('/dataset/'+dataset.dataset_id)" icon="check">Archived</el-button>
                        </p>
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
                <task :task="task" :prov="task.config._prov" v-if="task.name == 'brainlife.process'" style="margin-top: 5px;" @remove="remove_task_deps">
                    <div slot="header" class="task-header">
                        <div style="float: left">
                            <h3><mute>T{{idx}}</mute></h3>
                        </div>
                        <div v-if="task.config._prov" style="margin-left: 50px;">
                            <app :appid="task.config._prov.app.id" :compact="true" :clickable="false"></app>
                        </div>
                        <div v-if="!task.config._prov" style="margin-left: 50px">
                            <!-- 
                            <app :appid="task.config._prov.app.id" :compact="true" :clickable="false"></app>
                            -->
                            <h3 style="margin-bottom: 0px; color: #666;">{{task.service}} <mute>{{task.name}}</mute></h3>
                            <mute>{{task.desc}}</mute>
                        </div>
                    </div><!--header-->

                    <!--input-->
                    <el-collapse-item title="Input Datasets" name="input" slot="input" v-if="task.config._prov">
                        <el-card v-for="(did, input_id) in task.config._prov.inputs" :key="input_id">
                            <el-row>
                            <el-col :span="4">
                                <b>{{input_id}}</b>
                            </el-col>
                            <el-col :span="20">
                                <mute>D{{find_dataset_idx(did)}}</mute>
                                <!--<metadata :metadata="find_dataset(did).meta"></metadata>-->
                                <b>{{find_dataset(did).meta.subject}}</b>
                                {{datatypes[find_dataset(did).datatype].name}}
                                <tags :tags="find_dataset(did).datatype_tags"></tags>
                            </el-col>
                            </el-row>
                        </el-card>
                    </el-collapse-item>

                    <!--output-->
                    <el-collapse-item title="Output Datasets" name="output" slot="output" v-if="_output_tasks[task._id] && task.status == 'finished'">
                        <p v-if="_output_tasks[task._id].status != 'finished'" class="text-muted">
                            <statusicon :status="_output_tasks[task._id].status"/> Organizing Output <small>{{_output_tasks[task._id].status_msg||'&nbsp;'}}</small>
                        </p>

                        <!--insert slot for output datasets-->
                        <el-card v-if="_output_tasks[task._id].status == 'finished'" 
                            v-for="(dataset, output_id) in _output_tasks[task._id].config._prov.output_datasets" :key="output_id">
                            <el-row>
                            <el-col :span="4">
                                <b>{{output_id}}</b>
                            </el-col>
                            <el-col :span="20">
                                <mute>D{{find_dataset_idx(_output_tasks[task._id]._id+"/"+output_id)}}</mute>
                                <b>{{dataset.meta.subject}}</b>
                                {{datatypes[dataset.datatype].name}} 
                                <tags :tags="dataset.datatype_tags"/>

                                <el-button size="small" type="primary" style="float: right;" 
                                    v-if="!archiving[task._id] && !dataset.dataset_id" @click="archive(task._id, true)">Archive</el-button>
                                <el-button size="small" style="float: right;" 
                                    v-if="dataset.dataset_id" @click="go('/dataset/'+dataset.dataset_id)" icon="check">Archived</el-button>
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
                                    :app_id="_output_tasks[task._id].config._prov.app"
                                    :output_task="_output_tasks[task._id]" 
                                    :dataset_id="output_id"
                                    :dataset="dataset" 
                                    @submitted="archive(task._id, false)" style="margin-top: 30px;"/>
                            </el-col>
                            </el-row>
                        </el-card>
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
                            <el-form-item v-for="(input, input_id) in newtask.inputs" :label="input_id+' '+input.datatype_tags" :key="input_id">
                                <el-select @change="revalidate()" v-model="newtask.inputs[input_id].dataset" 
                                    no-data-text="No dataset available for this datatype / tags"
                                    placeholder="Please select input dataset" 
                                    style="width: 100%;">
                                    <el-option-group key="brainlife.stage_input" label="Input Datasets">
                                        <el-option v-for="(dataset, idx) in filter_datasets(input)"
                                            v-if="dataset.task.name == 'brainlife.stage_input'" :key="idx"
                                                :value="dataset.did" :label="'D'+find_dataset_idx(dataset.did)+' | '+dataset.meta.subject+' | '+dataset.datatype_tags">
                                            <span v-if="dataset.task.status != 'finished'">(Staging)</span>
                                            D{{find_dataset_idx(dataset.did)}}
                                            <b>{{dataset.meta.subject}}</b> 
                                            <!--<metadata :metadata="dataset.meta"/>-->
                                            <small>{{datatypes[dataset.datatype].name}}</small>
                                            <!--<b>{{dataset.name||''}}</b> -->
                                            <tags :tags="dataset.datatype_tags"></tags> 
                                        </el-option>
                                    </el-option-group>
                                    <el-option-group key="brainlife.stage_output" label="Output Datasets">
                                        <el-option v-for="(dataset, idx) in filter_datasets(input)" 
                                            v-if="dataset.task.name == 'brainlife.stage_output'" :key="idx"
                                                :value="dataset.did" :label="'D'+find_dataset_idx(dataset.did)+' | '+dataset.meta.subject+' | '+dataset.datatype_tags">
                                            <span v-if="dataset.task.status != 'finished'">(Processing)</span>
                                            D{{find_dataset_idx(dataset.did)}}
                                            <b>{{dataset.meta.subject}}</b> 
                                            <small>{{datatypes[dataset.datatype].name}}</small>
                                            <tags :tags="dataset.datatype_tags"></tags> <!--| <metadata :metadata="dataset.meta"/>-->
                                        </el-option>
                                    </el-option-group>
                                </el-select>
                                <el-alert v-if="input.error" :title="input.error" type="error"/>
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
                    <el-form-item label="Subject">
                        <select2 style="width: 100%; max-width: 100%;" @input="update_selected_subjects" ref="select2_subjects" :dataAdapter="debounce_grab_subjects"></select2>
                    </el-form-item>
                    <el-form-item label="Datatype">
                        <select2 style="width: 100%; max-width: 100%;" @input="update_selected_datatypes" ref="select2_datatypes" :dataAdapter="debounce_grab_datatypes"></select2>
                    </el-form-item>
                    <el-form-item label="Datatype Tags">
                        <select2 style="width: 100%; max-width: 100%;" @input="update_selected_tags" ref="select2_datatypes" :dataAdapter="debounce_grab_tags"></select2>
                    </el-form-item>
                    <el-form-item label="Dataset">
                        <select2 ref="select2_datasets" style="width: 100%; max-width: 100%;" :dataAdapter="debounce_grab_datasets" @input="update_selected_datasets"></select2>
                        <!--<el-select v-model="input_dialog.dataset" placeholder="Select Dataset" style="width: 100%;">
                            <el-option-group v-for="(datasets, subject) in input_dialog.datasets_groups" :key="subject" :label="subject">
                                <el-option v-for="dataset in datasets" 
                                    :key="dataset._id" 
                                    :label="subject+' '+datatypes[dataset.datatype].name+' | '+dataset.datatype_tags+ ' | '+dataset.create_date" 
                                    :value="dataset._id"><b>{{datatypes[dataset.datatype].name}}</b> <tags :tags="dataset.datatype_tags"></tags> <span class="text-muted">{{dataset.create_date|date}}</span></el-option>
                            </el-option-group>
                        </el-select>-->
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
import mute from '@/components/mute'
import select2 from '@/components/select2'

import ReconnectingWebSocket from 'reconnectingwebsocket'

const lib = require('./lib');
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
        mute,
        select2
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
                datatypes_groups: {},
                subjects_groups: {},
                tags_groups: {}
            },
            
            tmp: {
                debounce: {}
            },
            
            selected: JSON.parse(localStorage.getItem('datasets.selected')) || {},
            archiving: {},

            //cache
            tasks: null,
            //datasets: {}, 
            datatypes: {},
            limit: 1000,    // number of datasets/subjects/datatypes/datatype_tags to load in chunks
            
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
        // 'input_dialog.project': function(p) {
        //     this.dataset_options = [];
        //     this.dataset_subjects = [];
            
        //     $(this.$refs.select2_subjects.$el).val('').trigger('change');
        //     $(this.$refs.select2_datasets.$el).val('').trigger('change');
        //     console.log(this.$refs.select2_subjects.$el);
            
        //     //load datasets under this project (TODO - we should do on-the-fly search eventually)
        //     this.$http.get('dataset', {params: {
        //         find: JSON.stringify({
        //             project: p,
        //             removed: false,
        //         }),
        //         limit: 1000,
        //         sort: 'meta.subject -create_date'
        //     }}).then(res=>{
        //         //group by subject
        //         this.input_dialog.datasets_groups = {};
        //         var option_group_by_subject = {};
                
        //         res.body.datasets.forEach(dataset=>{
        //             var subject = dataset.meta.subject;
        //             if(!this.input_dialog.datasets_groups[subject]) this.input_dialog.datasets_groups[subject] = [];
        //             option_group_by_subject[subject] = option_group_by_subject[subject] || [];
                    
        //             this.input_dialog.datasets_groups[subject].push(dataset);
                    
        //             var text_tags = dataset.datatype_tags.length != 0 ?
        //                             dataset.datatype_tags.toString()
        //                                                   .replace(/\[/g, "<")
        //                                                   .replace(/\]/g, ">")
        //                                                   .replace(/,/g, "> <")
        //                             : "";
        //             var date_text = new Date(dataset.create_date).toString()
        //                                                          .replace(/[ ]*GMT\-.*?$/g, "");
                    
        //             option_group_by_subject[subject].push({ id: dataset._id, text: `${this.datatypes[dataset.datatype].name} ${text_tags} | ${date_text}` });
        //         });
                
        //         for (var k in option_group_by_subject) {
        //             this.dataset_subjects.push(k);
        //             this.dataset_options.push({ text: k, children:option_group_by_subject[k] })
        //         }
        //     });
        // },
    },

    methods: {
        grab_datasets: function(params, cb) {
            if (!('page' in params)) {
                params.page = 1;
                this.input_dialog.datasets_groups = {};
            }
            
            var data = {};
            var criteria = this.selected_subjects.map((value) => { return { "meta.subject": value }; });
            var criteria2 = this.selected_datatypes.map((value) => { return { "datatype": value } })
            var criteria3 = this.selected_tags.map((value) => { return { "datatype_tags": value } })
            
            var and = [];
            
            var find = {
                project: this.input_dialog.project,
                removed: false
            };
            if (params.term)
                find.$text = { $search: params.term || "" };
            if (this.selected_subjects.length > 0)
                and.push( { $or: criteria } );
            if (this.selected_datatypes.length > 0)
                and.push( { $or: criteria2 } );
            if (this.selected_tags.length > 0)
                and.push( { $or: criteria3 } );
            
            if (and.length > 0)
                find.$and = and;
            
            this.$http.get('dataset', { params: {
                find: JSON.stringify(find),
                limit: this.limit,
                skip: (params.page - 1) * this.limit,
                sort: 'meta.subject -create_date'
            } }).then(res => {
                var data = [];
                var option_group_by_subject = {};
                
                var shownUp = {};
                var titlesFor = {};
                
                var howMany = 0;
                
                res.body.datasets.forEach(dataset=>{
                    var subject = dataset.meta.subject;
                    
                    if(!this.input_dialog.datasets_groups[subject]) {
                        titlesFor[subject] = false;
                        this.input_dialog.datasets_groups[subject] = [];
                    }
                    else if (!shownUp[subject])
                        titlesFor[subject] = true;
                    shownUp[subject] = true;
                    
                    option_group_by_subject[subject] = option_group_by_subject[subject] || [];
                    
                    this.input_dialog.datasets_groups[subject].push(dataset);
                    
                    var text_tags = dataset.datatype_tags.length != 0 ?
                                    dataset.datatype_tags.toString()
                                                          .replace(/\[/g, "<")
                                                          .replace(/\]/g, ">")
                                                          .replace(/,/g, "> <")
                                    : "";
                    var date_text = new Date(dataset.create_date).toString()
                                                                 .replace(/[ ]*GMT\-.*?$/g, "");
                    
                    var object = { id: dataset._id, text: `${this.datatypes[dataset.datatype].name} ${text_tags} | ${date_text}` };
                    
                    if (this.query_filter(object, params.term) || this.query_filter({ text: subject }, params.term)) {
                        ++howMany;
                        option_group_by_subject[subject].push(object);
                    }
                });
                
                for (var k in option_group_by_subject) {
                    var group = option_group_by_subject[k];
                    var toBeAdded = { text: k, children:group };
                    if (group.length == 0)
                        continue;
                    
                    if (titlesFor[k])
                        toBeAdded = group
                    
                    data.push(toBeAdded);
                }
                
                var r = {};
                r.results = data;
                r.pagination = {};
                r.pagination.more = data.length != 0 && howMany == this.limit;
                cb(r);
            });
            
        },
        
        grab_subjects: function(params, cb) {
            if (!('page' in params)) {
                params.page = 1;
                this.input_dialog.subjects_groups = {};
            }
            
            var data = {};
            var find = { $match: {
                    // project: this.input_dialog.project,
                    // removed: false
                    name: {
                        $regex: params.term || "",
                        $options: 'i'
                    }
                }
            };
            
            this.$http.get('dataset', { params: {
                find: JSON.stringify(find),
                limit: this.limit,
                skip: (params.page - 1) * this.limit,
                sort: JSON.stringify({ meta: -1 }),
                distinct: '$meta',
            } }).then(res => {
                var data = [];
                var howMany = 0;
                
                res.body.forEach(obj => {
                    var subject = obj._id.subject;
                    var object = { id: subject, text: subject };
                    
                    if (!this.input_dialog.subjects_groups[subject])
                        this.input_dialog.subjects_groups[subject] = true;
                    else
                        return;
                    
                    if (this.query_filter(object, params.term)) {
                        ++howMany;
                        data.push(object);
                    }
                });
                
                var r = {};
                r.results = data;
                r.pagination = {};
                r.pagination.more = data.length != 0 && howMany == this.limit;
                cb(r);
            });
        },
        
        grab_datatypes: function(params, cb) {
            if (!('page' in params)) {
                params.page = 1;
                this.input_dialog.datatypes_groups = {};
            }
            
            var data = {};
            var find = {
                project: this.input_dialog.project,
                removed: false,
                $text: {
                    $search: params.term || ""
                }
            };
            
            this.$http.get('datatype', { params: {
                limit: this.limit,
                skip: (params.page - 1) * this.limit,
                sort: "name",
            } }).then(res => {
                var data = [];
                var howMany = 0;
                
                res.body.datatypes.forEach(datatype => {
                    var name = datatype.name;
                    var object = { id: datatype._id, text: name };
                    
                    if (!this.input_dialog.datatypes_groups[name])
                        this.input_dialog.datatypes_groups[name] = true;
                    else
                        return;
                    
                    if (this.query_filter(object, params.term)) {
                        ++howMany;
                        data.push(object);
                    }
                });
                
                var r = {};
                r.results = data;
                r.pagination = {};
                r.pagination.more = data.length != 0 && howMany == this.limit;
                cb(r);
            });
        },
        
        grab_tags: function(params, cb) {
            if (!('page' in params)) {
                params.page = 1;
                this.input_dialog.tags_groups = {};
            }
            
            var data = {};
            var find = { $match: {
                    // project: this.input_dialog.project,
                    // removed: false
                    datatype_tags: {
                        $regex: params.term || "",
                        $options: 'i'
                    }
                }
            };
            
            this.$http.get('dataset', { params: {
                find: JSON.stringify(find),
                limit: this.limit,
                skip: (params.page - 1) * this.limit,
                distinct: '$datatype_tags'
            } }).then(res => {
                var data = [];
                var howMany = 0;
                
                res.body.forEach(obj => {
                    var name = obj._id[0];
                    var object = { id: name, text: name };
                    
                    if (!this.input_dialog.tags_groups[name])
                        this.input_dialog.tags_groups[name] = true;
                    else
                        return;
                    
                    if (this.query_filter(object, params.term)) {
                        ++howMany;
                        data.push(object);
                    }
                });
                
                var r = {};
                r.results = data;
                r.pagination = {};
                r.pagination.more = data.length != 0 && howMany == this.limit;
                cb(r);
            });
        },
        
        debounce_grab_subjects: function(params, cb) {
            let self = this;
            this.debounce(() => self.grab_subjects(params, cb), 300);
        },
        debounce_grab_datasets: function(params, cb) {
            let self = this;
            this.debounce(() => self.grab_datasets(params, cb), 300);
        },
        debounce_grab_datatypes: function(params, cb) {
            let self = this;
            this.debounce(() => self.grab_datatypes(params, cb), 300);
        },
        debounce_grab_tags: function(params, cb) {
            let self = this;
            this.debounce(() => self.grab_tags(params, cb), 300);
        },
        
        query_filter: function(object, term) {
            if (!term)
                return true;
            
            return !!~object.text.replace(/[ \t]+/g, "").toLowerCase().indexOf(term.replace(/[ \t]+/g, "").toLowerCase());
        },
        
        debounce: function(f, timeout) {
            let self = this;
            let token = Math.random();
            
            this.tmp.debounce[f] = token;
            
            setTimeout(function() {
                if (token != self.tmp.debounce[f])
                    return;
                f();
            }, timeout);
        },
        
        // match_dataset: function(term, text) {
        //     if (this.selected_subjects.length == 0)
        //         return text;
            
        //     for (var subject of this.selected_subjects) {
        //         var associated_datasets = this.input_dialog.datasets_groups[subject];
        //         for (var dataset of associated_datasets) {
        //             if (dataset._id == text.children[0].id)
        //                 return text;
        //         }
        //     }
            
        //     return false;
        // },
        
        update_selected_datasets: function(selected) {
            this.input_dialog.dataset = selected;
        },
        
        update_selected_subjects: function(selected) {
            this.selected_subjects = selected;
        },
        
        update_selected_datatypes: function(selected) {
            this.selected_datatypes = selected;
        },
        
        update_selected_tags: function(selected) {
            this.selected_tags = selected;
        },
        
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

        go: function(path) {
            this.$router.push(path);
        },
        remove_instance: function() {
            this.$http.delete(Vue.config.wf_api+'/instance/'+this.instance._id).then(res=>{
                this.$router.push('/processes');
            });
        },
        remove_task: function(id) {
            this.$http.delete(Vue.config.wf_api+'/task/'+id)
            .then(res=>{
                console.log("removed task", task._id);
            })
            .catch(err=>{
                console.error(err); 
            });
        },
        remove_task_deps: function(id) {
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

        stage: function() {
            if(this.input_dialog.mode == "selected") this.stage_selected();
            if(this.input_dialog.mode == "warehouse") this.stage_dataset();
        },

        stage_dataset: function() {
            //console.log(this.input_dialog);
            this.show_input_dialog = false;
            var dids = this.input_dialog.dataset;
            
            if(!dids) return;
            if (!(dids instanceof Array))
                dids = [dids];
            
            this.$http.get('dataset', { params: {
                find: JSON.stringify({
                    _id: { $in: dids }
                })
            }}).then(res => {
                var datasets = res.body.datasets;
                var o = {};
                
                datasets.forEach(dataset => {
                    o[dataset._id]= dataset;
                });
                
                this.submit_stage(o);
            });
            
            //need to look for this dataset
            // for(var subject in this.input_dialog.datasets_groups) {
            //     var datasets = this.input_dialog.datasets_groups[subject];
            //     datasets.forEach(dataset=>{
            //         if(dataset._id == this.input_dialog.dataset) {
            //             var o = {};
            //             o[this.input_dialog.dataset]= dataset;
            //             this.submit_stage(o);
            //         }
            //     });
            // }
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

        archive: function(task_id, b) {
            Vue.set(this.archiving, task_id, b);
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
                        app: {
                            id: this.newtask_app._id,
                            name: this.newtask_app.name,
                            desc: this.newtask_app.desc,
                            github: this.newtask_app.github,
                        },
                        //outputs: {},
                        inputs: {},
                    };
                    for(var id in newtask.inputs) {
                        /*
                        prov.inputs[id] = {
                            //datatype: newtask.inputs[id].datatype._id,
                            //datatype_tags: newtask.inputs[id].datatype_tags,
                            //dataset: newtask.inputs[id].dataset, //only set if it comes from warehouse dataset
                        }
                        */
                        prov.inputs[id] = newtask.inputs[id].dataset;
                    }
                    /*
                    this.newtask_app.outputs.forEach(output=>{
                        prov.outputs[output.id] = {
                            datatype: output.datatype,
                            datatype_tags: output.datatype_tags,
                        }
                    });
                    */
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
                            //var dataset = this._datasets[input.dataset];
                            var dataset = this.find_dataset(input.dataset);
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
.task-header {
margin: 0px;
padding: 15px;
border: 1px solid rgb(230, 230, 230);
border-bottom: none;
background-color: #fff;
border-radius: 8px 8px 0 0;
}
</style>
=======
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
                <ul style="padding-left: 0px; list-style: none;">
                    <li v-for="(dataset, idx) in _datasets" :key="idx" v-if="dataset.task.name == 'brainlife.stage_input'" style="margin-bottom: 10px;">
                        <!-- removing task will remove all input datasets that are staged together.. I need to only remove 1.. but how?
                        <div @click="remove_task(dataset.task._id)" style="display: inline; cursor: pointer;" title="Remove">
                            <icon name="close"></icon>
                        </div>
                        -->
                        <mute>D{{idx}}</mute> 
                        <b>{{dataset.meta.subject}}</b>
                        <!--<el-tag type="primary">{{dataset.meta.subject}}</el-tag>-->
                        {{datatypes[dataset.datatype].name}} <tags :tags="dataset.datatype_tags"></tags>
                        <time>{{dataset.create_date|date('%x')}}</time>
                        <mute>
                            <small v-if="dataset.task.status != 'finished'">
                                <statusicon :status="dataset.task.status"/> Staging ..
                            </small>
                        </mute>
                        <!--
                        <br>
                        <small>{{dataset.name}}</small>
                        -->
                    </li>
                </ul>
                <br>
                <h3>Output Datasets</h3>
                <ul style="padding-left: 0px; list-style: none;">
                    <li v-for="(dataset, idx) in _datasets" :key="idx" v-if="dataset.task.name == 'brainlife.stage_output'" style="margin-bottom: 10px;">
                        <!--
                        <div @click.stop="remove_task(dataset.task._id)" style="display: inline; cursor: pointer;" title="Unselect">
                            <icon name="close"></icon>
                        </div>
                        -->
                        <mute>D{{idx}}</mute> 
                        <b v-if="dataset.meta">{{dataset.meta.subject}}</b>
                        <!--<metadata :metadata="dataset.meta"/>-->
                        <!--<b>{{dataset.did}}</b>-->
                        {{datatypes[dataset.datatype].name}} <tags :tags="dataset.datatype_tags"></tags>
                        <time v-if="dataset.create_date">{{dataset.create_date|date('%x')}}</time>
                        <mute>
                            <small v-if="dataset.task.status != 'finished'">
                                <statusicon :status="dataset.task.status"/> Processing ..
                            </small>
                        </mute>
                        <p v-if="dataset.dataset_id">
                            <el-button size="mini" @click="go('/dataset/'+dataset.dataset_id)" icon="check">Archived</el-button>
                        </p>
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
                <task :task="task" :prov="task.config._prov" v-if="task.name == 'brainlife.process'" style="margin-top: 5px;" @remove="remove_task_deps">
                    <div slot="header" class="task-header">
                        <div style="float: left">
                            <h3><mute>T{{idx}}</mute></h3>
                        </div>
                        <div v-if="task.config._prov" style="margin-left: 50px;">
                            <app :appid="task.config._prov.app.id" :compact="true" :clickable="false"></app>
                        </div>
                        <div v-if="!task.config._prov" style="margin-left: 50px">
                            <!-- 
                            <app :appid="task.config._prov.app.id" :compact="true" :clickable="false"></app>
                            -->
                            <h3 style="margin-bottom: 0px; color: #666;">{{task.service}} <mute>{{task.name}}</mute></h3>
                            <mute>{{task.desc}}</mute>
                        </div>
                    </div><!--header-->

                    <!--input-->
                    <el-collapse-item title="Input Datasets" name="input" slot="input" v-if="task.config._prov">
                        <el-card v-for="(did, input_id) in task.config._prov.inputs" :key="input_id">
                            <el-row>
                            <el-col :span="4">
                                <b>{{input_id}}</b>
                            </el-col>
                            <el-col :span="20">
                                <mute>D{{find_dataset_idx(did)}}</mute>
                                <!--<metadata :metadata="find_dataset(did).meta"></metadata>-->
                                <b>{{find_dataset(did).meta.subject}}</b>
                                {{datatypes[find_dataset(did).datatype].name}}
                                <tags :tags="find_dataset(did).datatype_tags"></tags>
                            </el-col>
                            </el-row>
                        </el-card>
                    </el-collapse-item>

                    <!--output-->
                    <el-collapse-item title="Output Datasets" name="output" slot="output" v-if="_output_tasks[task._id] && task.status == 'finished'">
                        <p v-if="_output_tasks[task._id].status != 'finished'" class="text-muted">
                            <statusicon :status="_output_tasks[task._id].status"></statusicon> Organizing Output <small>{{_output_tasks[task._id].status_msg||'&nbsp;'}}</small>
                        </p>

                        <!--insert slot for output datasets-->
                        <el-card v-if="_output_tasks[task._id].status == 'finished'" 
                            v-for="(dataset, output_id) in _output_tasks[task._id].config._prov.output_datasets" :key="output_id">
                            <el-row>
                            <el-col :span="4">
                                <b>{{output_id}}</b>
                            </el-col>
                            <el-col :span="20">
                                <mute>D{{find_dataset_idx(_output_tasks[task._id]._id+"/"+output_id)}}</mute>
                                <b>{{dataset.meta.subject}}</b>
                                {{datatypes[dataset.datatype].name}} 
                                <tags :tags="dataset.datatype_tags"></tags>

                                <el-button size="small" type="primary" style="float: right;" 
                                    v-if="!archiving[task._id] && !dataset.dataset_id" @click="archive(task._id, true)">Archive</el-button>
                                <el-button size="small" style="float: right;" 
                                    v-if="dataset.dataset_id" @click="go('/dataset/'+dataset.dataset_id)" icon="check">Archived</el-button>
                                <!--TODO - show only viewer that makes sense for each data type-->
                                <!--
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
                                -->
                                <viewerselect @select="view(_output_tasks[task._id]._id, $event)" style="float: right; margin-right: 5px;"></viewerselect>
                                <archiveform v-if="archiving[task._id]" 
                                    :instance="instance" 
                                    :app_id="_output_tasks[task._id].config._prov.app"
                                    :output_task="_output_tasks[task._id]" 
                                    :dataset_id="output_id"
                                    :dataset="dataset" 
                                    @submitted="archive(task._id, false)" style="margin-top: 30px;"></archiveform>
                            </el-col>
                            </el-row>
                        </el-card>
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
                            <el-form-item v-for="(input, input_id) in newtask.inputs" :label="input_id+' '+input.datatype_tags" :key="input_id">
                                <el-select @change="revalidate()" v-model="newtask.inputs[input_id].dataset" 
                                    no-data-text="No dataset available for this datatype / tags"
                                    placeholder="Please select input dataset" 
                                    style="width: 100%;">
                                    <el-option-group key="brainlife.stage_input" label="Input Datasets">
                                        <el-option v-for="(dataset, idx) in filter_datasets(input)"
                                            v-if="dataset.task.name == 'brainlife.stage_input'" :key="idx"
                                                :value="dataset.did" :label="'D'+find_dataset_idx(dataset.did)+' | '+dataset.meta.subject+' | '+dataset.datatype_tags">
                                            <span v-if="dataset.task.status != 'finished'">(Staging)</span>
                                            D{{find_dataset_idx(dataset.did)}}
                                            <b>{{dataset.meta.subject}}</b> 
                                            <!--<metadata :metadata="dataset.meta"/>-->
                                            <small>{{datatypes[dataset.datatype].name}}</small>
                                            <!--<b>{{dataset.name||''}}</b> -->
                                            <tags :tags="dataset.datatype_tags"></tags> 
                                        </el-option>
                                    </el-option-group>
                                    <el-option-group key="brainlife.stage_output" label="Output Datasets">
                                        <el-option v-for="(dataset, idx) in filter_datasets(input)" 
                                            v-if="dataset.task.name == 'brainlife.stage_output'" :key="idx"
                                                :value="dataset.did" :label="'D'+find_dataset_idx(dataset.did)+' | '+dataset.meta.subject+' | '+dataset.datatype_tags">
                                            <span v-if="dataset.task.status != 'finished'">(Processing)</span>
                                            D{{find_dataset_idx(dataset.did)}}
                                            <b>{{dataset.meta.subject}}</b> 
                                            <small>{{datatypes[dataset.datatype].name}}</small>
                                            <tags :tags="dataset.datatype_tags"></tags> <!--| <metadata :metadata="dataset.meta"/>-->
                                        </el-option>
                                    </el-option-group>
                                </el-select>
                                <el-alert v-if="input.error" :title="input.error" type="error"/>
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
                                    :label="subject+' '+datatypes[dataset.datatype].name+' | '+dataset.datatype_tags+ ' | '+dataset.create_date" 
                                    :value="dataset._id"><b>{{datatypes[dataset.datatype].name}}</b> <tags :tags="dataset.datatype_tags"></tags> <span class="text-muted">{{dataset.create_date|date}}</span></el-option>
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
import mute from '@/components/mute'
import viewerselect from '@/components/viewerselect'

import ReconnectingWebSocket from 'reconnectingwebsocket'

const lib = require('./lib');
var debounce = null;

export default {
    components: { 
        sidemenu, contact, task, 
        message, file, tags, 
        metadata, filebrowser, pageheader, 
        appavatar, app, archiveform, 
        projectselector, statusicon, mute,
        viewerselect,
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
            //datasets: {}, 
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

        go: function(path) {
            this.$router.push(path);
        },
        remove_instance: function() {
            this.$http.delete(Vue.config.wf_api+'/instance/'+this.instance._id).then(res=>{
                this.$router.push('/processes');
            });
        },
        remove_task: function(id) {
            this.$http.delete(Vue.config.wf_api+'/task/'+id)
            .then(res=>{
                console.log("removed task", task._id);
            })
            .catch(err=>{
                console.error(err); 
            });
        },
        remove_task_deps: function(id) {
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
            console.log(taskid, event);
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

        archive: function(task_id, b) {
            Vue.set(this.archiving, task_id, b);
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
                        app: {
                            id: this.newtask_app._id,
                            name: this.newtask_app.name,
                            desc: this.newtask_app.desc,
                            github: this.newtask_app.github,
                        },
                        //outputs: {},
                        inputs: {},
                    };
                    for(var id in newtask.inputs) {
                        /*
                        prov.inputs[id] = {
                            //datatype: newtask.inputs[id].datatype._id,
                            //datatype_tags: newtask.inputs[id].datatype_tags,
                            //dataset: newtask.inputs[id].dataset, //only set if it comes from warehouse dataset
                        }
                        */
                        prov.inputs[id] = newtask.inputs[id].dataset;
                    }
                    /*
                    this.newtask_app.outputs.forEach(output=>{
                        prov.outputs[output.id] = {
                            datatype: output.datatype,
                            datatype_tags: output.datatype_tags,
                        }
                    });
                    */
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
                            //var dataset = this._datasets[input.dataset];
                            var dataset = this.find_dataset(input.dataset);
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
.task-header {
margin: 0px;
padding: 15px;
border: 1px solid rgb(230, 230, 230);
border-bottom: none;
background-color: #fff;
border-radius: 8px 8px 0 0;
}
</style>
>>>>>>> 8cdf1cc0e1e2cc8d7e031563372748784dd2d051
