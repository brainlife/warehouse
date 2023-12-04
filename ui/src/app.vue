<template>
<div>
    <div v-if="noaccess" class="page-content">
        <b-container>
            <h3 style="padding: 50px 0 15px 0;opacity: 0.7"><icon name="lock" class="text-secondary" scale="1.5"/> Private App</h3>
            <b-alert show variant="secondary">
                The App you are trying access is a private App (belongs to a specific brainlife project). You must be logged in and also must be a member 
                of the project to which this App belongs. Please contact the current maintainer of this App.
            </b-alert>
        </b-container>
    </div>
    <div v-if="app" class="page-content">
        <div class="header">
            <b-container style="position: relative;">
                <div style="float: right; position: relative; z-index: 3">
                    <a :href="'https://github.com/'+app.github+(app.github_branch ? '/tree/'+app.github_branch:'')" :target="app.github">
                        <span class="button" title="github"><icon name="brands/github" scale="1.25"/></span>
                    </a>
                    <span class="button" @click="go('/app/'+app._id+'/edit')" v-if="app._canedit" title="Edit"><icon name="edit" scale="1.25"/></span>                
                    <b-dropdown size="sm" variant="link" toggle-class="text-decoration-none" no-caret>
                        <template v-slot:button-content style="padding: 0px;">
                            <span class="button"><icon name="ellipsis-v" scale="1.25"/></span>
                        </template>
                        <b-dropdown-item @click="copy()" v-if="app._canedit" title="Copy" style="opacity: 0.7;">
                            <icon name="copy" scale="1.25" style="width: 20px"/>&nbsp;&nbsp;&nbsp;Clone
                        </b-dropdown-item>
                        <b-dropdown-item @click="remove()" v-if="app._canedit" title="Remove" style="opacity: 0.7;">
                            <icon name="trash" scale="1.25" style="width: 20px"/>&nbsp;&nbsp;&nbsp;Remove
                        </b-dropdown-item>
                        <b-dropdown-item @click="download_app()" style="opacity: 0.7;">
                            <icon name="download" scale="1.25" style="width: 20px"/>&nbsp;&nbsp;&nbsp;Download
                        </b-dropdown-item>
                        <b-dropdown-item @click="show_badge_url('/app/'+app._id+'/badge')" style="opacity: 0.7;" >
                            <icon name="certificate" scale="1.25" style="width: 20px"/>&nbsp;&nbsp;&nbsp;Generate Badge
                        </b-dropdown-item>
                    </b-dropdown>
                    <b-btn @click="execute" variant="primary" size="sm" style="margin-top: 3px;"><icon name="play"/>&nbsp;&nbsp;&nbsp;<b>Execute</b></b-btn>    
                </div>

                <h5>
                    <b-badge v-if="app.projects && app.projects.length > 0" variant="secondary" title="Private App">
                        <icon name="lock" scale="0.8"/>
                    </b-badge>
                    {{app.name}}
                </h5>

                <div style="opacity: 0.8; font-size: 1em;">
                    <a target="github" :href="'https://github.com/'+app.github+(app.github_branch ? '/tree/'+app.github_branch:'')" style="color: gray;">{{app.github}}</a>
                    <small><b-badge variant="secondary" v-if="app.github_branch" style="position: relative; top: -2px"><icon name="code-branch" scale="0.6"/> {{app.github_branch}}</b-badge></small>
                </div>

                <b-tabs class="brainlife-tab" v-model="tab">
                    <b-tab>
                        <template v-slot:title>Detail</template>
                    </b-tab>
                    <b-tab>
                        <template v-slot:title>README</template>
                    </b-tab>
                    <b-tab>
                        <template v-slot:title>
                            Recent Jobs
                            <span style="opacity: 0.6; font-size: 80%" v-if="tasks.length > 0">{{tasks.length}}</span>
                        </template>
                    </b-tab>
                    <b-tab>
                        <template v-slot:title>
                            Example Workflow
                            <span style="opacity: 0.6; font-size: 80%">{{app.stats.examples||0}}</span>
                        </template>
                    </b-tab>
                </b-tabs>
            </b-container>
            <b-alert :show="app.removed" variant="secondary">This App has been removed.</b-alert>
        </div><!--header-->

        <div v-if="tabID == 'detail'" class="tab-content">
            <b-container>
                <appavatar :app="app" style="float: right; position: relative; top: -15px; margin-left: 15px;" :width="150" :height="150"/>

                <!--badges-->
                <p style="line-height: 250%; padding-top: 10px;">
                    <doibadge :doi="app.doi" v-if="app.doi"/>

                    <b-badge pill v-if="app.create_date" class="bigpill" title="Registration Date">
                        <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;<small>Registered</small>&nbsp;&nbsp;{{new Date(app.create_date).toLocaleDateString()}}
                    </b-badge>

                    <b-badge pill class="bigpill" v-if="app.stats && app.stats.users" title="Users who executed this App">
                        <icon name="user-cog" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;{{app.stats.users}}&nbsp;&nbsp;<small>Users</small>
                    </b-badge>

                    <b-badge pill class="bigpill" v-if="app.stats && app.stats.requested" title="Number of time this App was requested">
                        <icon name="play" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;{{app.stats.requested}}&nbsp;&nbsp;<small>Requests</small>
                    </b-badge>

                    <b-badge pill v-if="app.stats && app.stats.runtime_mean" class="bigpill" title="Average Runtime of 100 most recent jobs">
                        <icon name="clock" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;{{avgRuntime(app.stats.runtime_mean, app.stats.runtime_std)}}
                    </b-badge>
                </p>
                <p class="desc">{{app.desc_override||app.desc}}</p>

                <!--<span class="form-header">Topics</span>-->
                <p style="line-height: 250%;">
                    <b-badge v-for="tag in app.tags" :key="tag" class="topic">{{tag}}</b-badge>
                </p>

                <!--detail header-->
                <b-row>
                    <b-col>
                        <p v-if="app.stats && app.stats.success_rate" v-b-tooltip.hover.d1000.right title="finished/(failed+finished). Same request could be re-submitted / rerun.">
                            <svg width="70" height="70">
                                <circle :r="140/(2*Math.PI)" cx="35" cy="35" fill="transparent" stroke="#666" stroke-width="15"/>
                                <circle :r="140/(2*Math.PI)" cx="35" cy="35" fill="transparent" stroke="#28a745" stroke-width="15" 
                                    :stroke-dasharray="app.stats.success_rate*(140/100)+' '+(100-app.stats.success_rate)*(140/100)" stroke-dashoffset="-105"/>
                            </svg>
                            <b>{{app.stats.success_rate.toFixed(1)}}%</b> <span style="opacity: 0.5">Success Rate</span>
                        </p>
                    </b-col>
                    <b-col>
                        <div class='altmetric-embed' 
                            data-badge-type='donut' 
                            data-badge-details="right" 
                            data-hide-no-mentions="true"
                            :data-doi="app.doi||config.debug_doi"/>
                    </b-col>
                </b-row>

                <br>
                <b-card v-if="app.deprecated_by" no-body style="margin-bottom: 10px">
                    <span slot="header">
                        <icon name="regular/calendar-times"/> This App has been deprecated by the following App
                    </span>
                    <app :appid="app.deprecated_by"/>
                </b-card>

                <!--input/output-->
                <p><small class="text-muted">This App uses the following input/output datatypes</small></p>
                <div style="position: relative;">
                    <b-row>
                        <b-col>
                            <div class="iobox">
                                <div class="iobox-header" style="background-color: rgba(0,123,255,0.8); color: white;">Input</div>
                                <b-alert show variant="primary" v-if="!app.inputs || app.inputs.length == 0">No Input</b-alert>
                                <div v-if="app.inputs && app.inputs.length > 0">
                                    <div v-for="input in app.inputs" :key="input.id" class="io-card">
                                        <small class="ioid">{{input.id}}</small><!--internal output id-->
                                        <datatype :datatype="adjustedDatatype(input.datatype)" :datatype_tags="input.datatype_tags">
                                            <template slot="tag_extra">
                                                <span v-if="input.multi" style="opacity: 0.8">(multi)</span>
                                                <b-badge v-if="input.optional" style="opacity: 0.8">optional</b-badge>
                                                <p v-if="input.desc" style="margin-bottom: 0px; font-size: 80%;">{{input.desc}}</p>
                                            </template>
                                        </datatype>
                                    </div>
                                </div>
                            </div>
                        </b-col>

                        <!--output-->
                        <b-col>
                            <icon name="arrow-right" style="position: absolute; top: 50%; left: -10px; opacity: 0.5" scale="1.5"/>
                            <div class="iobox">
                                <div class="iobox-header" style="background-color: rgba(40,167,69,0.8); color: white;">Output</div>
                                <b-alert show variant="success" v-if="!app.outputs || app.outputs.length == 0">No Output</b-alert>
                                <div v-if="app.outputs && app.outputs.length > 0">
                                    <div v-for="output in app.outputs" :key="output.id" class="io-card">
                                        <small class="ioid">{{output.id}}</small><!--internal output id-->
                                        <datatype :datatype="output.datatype" 
                                                :datatype_tags="output.datatype_tags" 
                                                :tag_pass="output.datatype_tags_pass">
                                            <template slot="tag_extra">
                                                <span v-if="output.datatype_tags_pass" title="tag pass through from this input dataset"
                                                    style="color: #666; background-color: #eee;">+ all <b>{{output.datatype_tags_pass}}</b> tags</span>
                                                <p v-if="output.desc" style="margin-bottom: 0px; font-size: 80%;">{{output.desc}}</p>
                                            </template>
                                        </datatype>
                                        <div style="position: relative" v-if="output.output_on_root">
                                            <small class="text-danger">The output will be generated on the workdir root (deprecated).</small><br>
                                            <small v-if="output.files">
                                                <b>Output Mapping</b>
                                                <editor v-bind:value="JSON.stringify(output.files, null, 4)" @init="editorInit" lang="json" theme="chrome"></editor>
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </b-col>
                    </b-row>
                    <br>
                </div><!--input/ouput-->

                <div v-if="app.projects && app.projects.length > 0" style="padding: 20px">
                    <span class="form-header">Projects</span>
                    <p><small class="text-muted">Only the members of the following project(s) can view and execute this App.</small></p>
                    <div v-for="project in app.projects" :key="project._id" @click="go('/project/'+project._id)">
                        <projectcard :project="project" style="margin-bottom: 10px;"/>
                    </div>
                    <br>
                </div>

                <div v-if="app.retry">
                    <span class="form-header">Retry</span>
                    <p>If this App fails, it will automatically be rerun up to <b>{{app.retry}}</b> times.</p>
                    <br>
                </div>

                <div class="box" style="padding: 20px" v-if="Object.keys(configs).length">
                    <span class="form-header">Configuration</span>
                    <div v-for="(config, key) in configs" :for="key">
                        <div v-if="config.type != 'input'">
                            <icon name="chevron-right" scale="0.6" style="opacity: 0.5;"/> <b>{{key}}</b><span v-if="config.optional">?</span>: {{config.type}} 
                            <span v-if="config.default" style="opacity: 0.5;"> = {{config.default}}</span><br>

                            <!-- for enum-->
                            <div v-if="config.options" style="font-size: 90%;">
                                <ul>
                                    <li v-for="(o, idx) in config.options" :key="idx">
                                        {{o.label}} <small style="font-size:80%;" v-if="o.value != o.label">({{o.value}})</small>
                                        <small>{{o.desc}}</small> <b-badge v-if="o.value == config.default">Default</b-badge>
                                    </li>
                                </ul>
                            </div>
                            <p>
                                <small>{{config.desc}}</small>
                            </p>
                        </div>
                    </div>
                </div>

                <div v-if="resources_considered" class="box" style="padding: 20px">
                    <span class="form-header">Computing Resources</span>
                    <b-alert show variant="secondary" v-if="resources_considered.length == 0" style="margin-bottom: 10px;">
                        This App is not registered to run on any resource that you have access to. 
                    </b-alert>
                    <b-alert show variant="secondary" v-else-if="!preferred_resource" style="margin-bottom: 10px;">
                        This App can not run on any resources that you have access to at the moment.
                    </b-alert>
                    <b-alert show variant="secondary" v-else-if="shared_resources.length == 0" style="margin-bottom: 10px;">
                        This App is only enabled on your private resource(s). Other users may not be able to run this App.
                    </b-alert>
                    <p v-else>
                        <small class="text-muted">This App can run on the following resources.</small>
                    </p>

                    <div v-for="resource in resources_considered" :key="resource._id" class="resource-area">
                        <div v-if="resource.status != 'ok'" class="resource-status bg-danger">
                            <icon name="exclamation" style="position: relative; top: -3px;"/>
                            &nbsp;
                            <b>{{resource.status}}</b>
                            <span class="score">Score {{resource.score}}</span>
                        </div>
                        <div v-else-if="resource.detail.running >= resource.detail.maxtask" class="resource-status bg-warning" 
                            title="This App is registered to this resource but the resource is currently busy running other Apps.">
                            <icon name="hourglass" style="position: relative; top: -3px;"/>
                            &nbsp;
                            <b>Busy</b>
                        </div>
                        <div v-else-if="preferred_resource && resource.id == preferred_resource._id" 
                            class="resource-status bg-success" 
                            title="This resource will be used to execute this App.">
                            <icon name="thumbs-up" style="position: relative; top: -3px;"/>
                            &nbsp;
                            <b>BEST</b>
                            <span class="score">Score {{resource.score}}</span>
                        </div>
                        <div v-else-if="resource.score == 0" class="resource-status" style="color: #fff; background-color: #666;" 
                            title="This App is registered to this resource but currently the score set to 0 and will not run on this resource">        
                            <span class="score">Score {{resource.score}}</span>
                        </div>
                        <div v-else class="resource-status" style="color: #888;" title="Your App could be submitted to this resource if you prefer it">        
                            <span class="score">Score {{resource.score}}</span>
                        </div>

                        <b-row no-gutters>
                            <b-col>
                                <resource :resource="resource" :title="resource.config.desc"/>
                            </b-col>
                            <b-col cols="3">
                                <div style="background-color: #f0f0f0; border-bottom-right-radius: 8px; padding: 10px; height: 100%;">
                                    <span class="form-header"><b>Selection Reason</b></span>
                                    <pre style="font-size: 80%;">{{resource.detail.msg}}</pre>
                                </div>
                            </b-col>
                        </b-row>
                    </div><!--resource-->
                </div><!--resource_considered-->

                <div class="box" style="padding: 20px">
                    <b-row>
                        <b-col>
                            <span class="form-header">Maintainers</span>
                            <p style="height: 30px;"><small class="text-muted">List of users who currently maintains this App.</small></p>
                            <p v-for="c in app.admins" :key="c._id">
                                <contact :id="c"/>
                            </p>
                            <br>
                        </b-col>
                        <b-col>
                            <div v-if="app.contributors.length > 0">
                                <span class="form-header">Contributors</span>
                                <p style="height: 30px;"><small class="text-muted">List of code contributors.({{app.github}}).</small></p>
                                <p v-for="dev in app.contributors" :key="dev._id">
                                    <contact :fullname="dev.name" :email="dev.email"/>
                                </p>
                                <br>
                            </div>
                        </b-col>
                    </b-row>
                </div>
            </b-container>
        </div><!--tab0-->

        <div v-if="tabID == 'readme'" class="tab-content">
            <b-container>
                <br>
                <div v-if="readme">
                    <p style="float: right;"><small class="text-muted">From github repo / README.md</small></p>
                    <vue-markdown :source="readme" class="readme"></vue-markdown>
                </div>
                <div v-else>No README</div>
                <br>
            </b-container>
        </div>

        <div v-if="tabID == 'recentJobs'" class="tab-content">
            <b-alert :show="!config.user" variant="secondary">Please login to see recent jobs</b-alert>
            <b-container v-if="config.user">
                <br>
                <div v-if="tasks.length > 0">
                    <p style="opacity: 0.7; font-size: 80%;">Showing up to 30 most recent jobs</p>
                    <table class="table table-sm">
                        <thead style="background-color: #eee; font-size: 80%;">
                            <tr>
                                <th style="min-width: 100px;">Branch</th>
                                <th style="min-width: 80px"><!--<icon name="shield-alt"/>-->Project</th>
                                <th>Status</th>
                                <th>Resource</th>
                                <th>Submitter</th>
                                <th width="150px">Date</th>
                            </tr>
                        </thead>
                        <taskRecord :tasks="tasks" :cols="['branch', 'project', 'status', 'resource', 'submitter', 'dates']"/>
                    </table>
                </div>
                <div v-else style="opacity: 0.7;">
                    No recent jobs
                </div>
                <br>
            </b-container>
        </div>

        <div v-if="tabID == 'example'" class="tab-content">
            <exampleworkflow :appid="app._id"/>
        </div>
        <br>
        <br>
        <br>
        <br>
    </div><!--page-content-->
</div>
</template>

<script>
import Vue from 'vue'

import app from '@/components/app'
import contact from '@/components/contact'
import tags from '@/components/tags'
import datatype from '@/components/datatype'
import datatypefile from '@/components/datatypefile'
import datatypetag from '@/components/datatypetag'
import appavatar from '@/components/appavatar'
import statustag from '@/components/statustag'
import projectavatar from '@/components/projectavatar'
import doibadge from '@/components/doibadge'
import resource from '@/components/resource'
import statusicon from '@/components/statusicon'
import taskRecord from '@/components/taskrecord'
import projectcard from '@/components/projectcard'
import exampleworkflow from '@/components/exampleworkflow'

import resource_cache from '@/mixins/resource_cache'
import filters from '@/mixins/filters'

const lib = require('@/lib');

export default {
    mixins: [ resource_cache, filters ],
    components: { 
        contact, 
        tags, 
        datatype, 
        appavatar,
        VueMarkdown: ()=>import('vue-markdown'),
        statustag, 
        datatypetag, 
        datatypefile,
        projectavatar,
        doibadge, app,
        resource, 
        statusicon,
        taskRecord, 
        projectcard,
        exampleworkflow,

        editor: ()=>import('vue2-ace-editor'),
    },

    data () {
        return {
            app: null,
            noaccess: false,

            preferred_resource: null,
            resources_considered: null,
            readme: null,

            selfurl: document.location.href,

            tab: 0,
            tabs: [
                {id: "detail"},
                {id: "readme"},
                {id: "recentJobs"},
                {id: "example"},
            ],

            tasks: [], //recent tasks submitted
            //serviceinfo: null,

            config: Vue.config,
        }
    },

    watch: {
        '$route': function() {
            var app_id = this.$route.params.id;
            if(app_id && this.app && app_id != this.app._id) {
                this.open_app();
            } else {
                this.handleRouteParams();
            }
        },
        tab: function() {
            if(this.$route.params.tab != this.tabs[this.tab].id) {
                this.$router.replace("/app/"+this.app._id+"/"+this.tabs[this.tab].id);
            }
        },
    },

    mounted: function() {
        this.handleRouteParams();
        this.open_app();
    },

    computed: {
        shared_resources() {
            if(!this.resources_considered) return [];
            return this.resources_considered.filter(r=>r.gids.length > 0);
        },
        configs() {
            let configs = {};
            for(const key in this.app.config) {
                if(this.app.config[key].type == 'input') continue;
                configs[key] = this.app.config[key];
            }
            return configs;
        },
        tabID() {
            return this.tabs[this.tab].id;
        }
    },

    methods: {
        /**
         * Supports:
         * github.com/name/project
         * http://github.com/name/project
         * https://github.com/name/project
         *                   https://github.com/name/project
         * (in the last example, whitespace is automatically trimmed)
         */
        trimGit: (text) => text.replace(/^[ \t]*(https?:\/\/)?github\.com\/?/g, ''),


        open_app() {
            //load app
            this.$http.get('app', {params: {
                find: JSON.stringify({_id: this.$route.params.id}),
                populate: 'inputs.datatype outputs.datatype projects',
            }})
            .then(res=>{
                if(res.data.apps.length == 0) {
                    this.noaccess = true;
                    throw "private app";
                }

                this.app = res.data.apps[0];
                Vue.nextTick(()=>{
                    //re-initialize altmetric badge - now that we have badge <div> placed
                    _altmetric_embed_init(this.$el);
                });

                if(this.config.user) {
                    this.find_resources(this.app.github);

                    this.$http.get(Vue.config.amaretti_api+'/task/recent', {params: {service: this.app.github}}).then(res=>{
                        this.tasks = res.data;

                        //lookup resource names
                        this.tasks.forEach(task=>{
                            task._resource = {name: "N/A"};
                            if(task.resource_id) this.resource_cache(task.resource_id, (err, resource)=>{
                                task._resource = resource;
                            });
                        });                   
                    }).catch(console.error);

                    /*
                    this.$http.get(Vue.config.amaretti_api+'/service/info', {params: {service: this.app.github}}).then(res=>{
                        this.serviceinfo = res.data;
                    }).catch(console.error);
                    */

                }

                //then load github README
                var branch = this.app.github_branch||"master";
                return fetch("https://raw.githubusercontent.com/"+this.app.github+"/"+branch+"/README.md")
            }).then(res=>{
                if(res.status == "200") return res.text()
            }).then(readme=>{
                this.readme = readme;
            }).catch(err=>{
                console.error(err);
            });
        },

        handleRouteParams() {
            let tab_id = this.$route.params.tab;
            if(tab_id) this.tab = this.tabs.findIndex(tab=>tab.id == tab_id);
        },

        copy() {
            this.$router.push('/app/'+this.app._id+'/copy');
        },

        go(path) {
            this.$router.push(path);
        },

        back() {
            if(window.history.length > 1) this.$router.go(-1);
            else this.$router.push('/apps');
        },

        download_app() {
            var branch = this.app.github_branch||"master";
            document.location = "https://github.com/"+this.app.github+"/archive/"+branch+".zip";
        },

        execute() {
            if(Vue.config.user) {
                this.$root.$emit("appsubmit.open", this.app._id);
            } else {
                alert("Please sign up / login first to execute Apps.");
            }
        },

        find_resources(service) {
            this.$http.get(Vue.config.amaretti_api + '/resource/best', {params: {
                service,
                gids: [1, ...Vue.config.user.gids],
            }})
            .then(res => {
                if(res.data.resource) this.preferred_resource = res.data.resource;
                this.resources_considered = res.data.considered.sort((a, b) => {
                    if (a.score < b.score) return 1;
                    if (a.score > b.score) return -1;
                    return 0;
                });
            })
            .catch(err => {
                console.error(err);
            });
        },

        show_badge_url() {
            prompt("The Badge Markdown", "[![brainlife.io/app](https://img.shields.io/badge/brainlife.io-app-green.svg)]("+this.selfurl+")");
        },

        remove() {
            if(confirm("Do you really want to remove this app ?")) {
                this.$http.delete('app/'+this.app._id)
                .then(res=>{
                    this.go('/apps');        
                });
            }
        },

        find_by_id(list, id) {
            var item = list.find(it=>it.id == id);
            if(!item) {
                console.error("failed to find_by_id", id);
                console.error(list);
            }
            return item;
        },

        editorInit(editor) {
            lib.editorInit(editor, ()=>{
                //editor.setReadOnly(true);  // false to make it editable
                editor.setAutoScrollEditorIntoView(true);
                editor.setOption("maxLines", 30);
                editor.setOption("minLines", 3);
                editor.setShowPrintMargin(true);
            });
        },

        //override the datatype's file id with the mapping used in config.json so we can show to user the actual config.json key
        adjustedDatatype(datatype) {
            datatype.files.forEach(file=>{
                //find the config key for file.id
                for(let key in this.app.config) {
                    if(this.app.config[key].type == 'input' && this.app.config[key].file_id == file.id) file.id = key;
                }
            });
            return datatype;
        },
    },
}
</script>

<style scoped>
.page-content {
    top: 0px;
}

.header {
    background-color: white;
    padding-top: 15px;
    border-bottom: 1px solid #ddd;
    position: sticky;
    top: 0;
    z-index: 5;/*has to be above vue-ace line number*/
}
.topic {
    padding: 8px; 
    background-color: #eee;
    text-transform: uppercase;
    color: #999;
    border-radius: 0px;
    margin-right: 4px;
}
.preferred-icon {
    color: green;
    position: absolute;
    left: 0px;
    font-weight: bold;
}
.resource-area {
    background-color: white;
    margin-bottom: 10px;
    box-shadow: 2px 2px 3px #0002;
    border-radius: 8px;
}
.resource-status {
    font-size: 10pt;
    color: white;
    text-transform: uppercase;
    background-color: #ddd;
    height: 30px;
    padding: 5px 10px;
    width: 100%;
    border-top-right-radius: 8px;
    border-top-left-radius: 8px;
}
.resource-status .score {
    float: right;
}
.box {
    background-color: white;
    margin-bottom: 20px;
    margin-left: -20px;
    margin-right: -20px;
    word-break: break-word;
}
.io-card {
    padding: 8px; 
}
.io-card:not(:last-child) {
    border-bottom: 1px solid #ddd;
}
.button-page {
    position: absolute;
    left: -30px;
    z-index: 1;
    opacity: 0.6;
}
.iobox {
    background-color: white;
    box-shadow: 0 0 3px #999;
    border-radius: 4px;
    margin-bottom: 10px;
    height: 100%; /*balance input/output*/
}
.iobox .iobox-header {
    padding: 5px 15px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    font-weight: bold;
}
.iobox .ioid {
    float: right;
    margin-left: 10px;
    opacity: 0.5;
}
.tab-content {
    background-color: white; 
    min-height: 300px;
}
.desc {
    opacity: 0.8;
    line-height: 180%;
}
</style>

