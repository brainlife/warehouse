<template>
<div>
    <div class="page-content">
        <div v-if="!resource" class="loading">Loading ...</div>
        <div v-else>
            <div class="header header-sticky">
                <b-container style="position: relative;">
                    <div style="float: right; margin-left: 20px; margin-bottom: 20px;">
                        <b-btn size="sm" @click="test" variant="success" v-if="resource._canedit && !testing" title="Test">Test</b-btn>
                        <b-btn size="sm" v-if="testing" title="Test" disabled><icon name="cog" :spin="true"/> Testing ... </b-btn>
                        <b-btn @click="edit" v-if="resource._canedit" variant="secondary" size="sm"><icon name="edit"/> Edit</b-btn>
                    </div>

                    <div style="padding-left: 15px">
                        <h5>
                            <b-badge v-if="!resource.active">Inactive</b-badge>
                            <b-badge v-if="!resource.gids || resource.gids.length == 0" variant="secondary" title="Private resource"><icon name="lock" scale="0.9"/></b-badge>
                            {{resource.name}}
                        </h5>
                        <h6 style="opacity: 0.5;">
                            {{resource.config.username}}@{{resource.config.hostname}}
                        </h6>
                    </div>

                    <b-tabs class="brainlife-tab" v-model="tab">
                        <b-tab>
                            <template v-slot:title>Detail</template>
                        </b-tab>
                        <b-tab>
                            <template v-slot:title>
                                Apps
                                <span style="opacity: 0.6; font-size: 80%">{{resource.config.services.length}}</span>
                            </template>
                        </b-tab>
                        <b-tab>
                            <template v-slot:title>
                                Jobs
                                <span style="opacity: 0.6; font-size: 80%" v-if="tasksRunning">{{tasksRunning.length}}</span>
                            </template>
                        </b-tab>
                        <b-tab v-if="projects">
                            <template v-slot:title>Projects</template>
                        </b-tab>
                    </b-tabs>
                </b-container>
            </div>

            <div v-if="tab == 0">
                <!--Detail-->
                <div style="background-color: white; padding-top: 15px; border-bottom: 1px solid #ddd;">
                    <b-container>
                        <img v-if="resource.avatar" :src="resource.avatar" style="float: right; position: relative; top: -15px; margin-left: 15px;" width="150px" height="150px">
                        <p>
                            <b-badge pill class="bigpill">
                                <icon name="calendar"/> <small>Registered</small>&nbsp;&nbsp;{{new Date(resource.create_date).toLocaleDateString()}}
                            </b-badge>
                            <b-badge pill class="bigpill" title="Number of tasks currently running on this resource" v-if="tasksRunning">
                                <icon name="play"/>&nbsp;&nbsp;&nbsp;{{tasksRunning.length}}&nbsp;&nbsp;<small>Running / {{resource.config.maxtask}} max</small>
                            </b-badge>

                            <b-badge pill class="bigpill" v-if="resource.stats && resource.stats.total">
                                <icon name="check"/>&nbsp;
                                {{resource.stats.total.finished|formatNumber}} <span style="opacity: 0.5">Finished</span>
                            </b-badge>
                            <b-badge pill class="bigpill" v-if="resource.stats && resource.stats.total">
                                <icon name="exclamation-circle"/>&nbsp;
                                {{resource.stats.total.failed|formatNumber}} <span style="opacity: 0.5">Failed</span>
                            </b-badge>
                        </p>
                        <p class="desc">{{resource.config.desc||'no description'}}</p>
                        <p style="margin-bottom: 0;">
                            <statustag :status="resource.status" style="font-size: 150%"/>
                            <span style="padding-left: 15px; opacity: 0.7;" v-if="resource.status_update">
                                Tested <timeago :datetime="resource.status_update" :auto-update="1"/>
                            </span>
                            <pre v-if="resource.status != 'ok'" style="max-height: 300px; overflow: auto; color: #dc3545">{{resource.status_msg}}</pre>
                        </p>
                        <br clear="both">
                    </b-container>
                </div>
                <b-container>
                    <br>
                    <!--
                    <b-row>
                        <b-col cols="2">
                            <span class="form-header">Login Host</span>
                        </b-col>
                        <b-col>
                            <p class="">
                                <pre>{{resource.config.username}}@{{resource.config.hostname}}</pre>
                            </p>
                        </b-col>
                    </b-row>
                    -->

                    <b-row>
                        <b-col cols="2">
                            <span class="form-header">Owner</span>
                        </b-col>
                        <b-col>
                            <p>
                                <small>User who registered this resource and can administer this resource</small>
                            </p>
                            <p>
                                <contact :id="resource.user_id"/>
                            </p>
                            <br>
                        </b-col>
                    </b-row>

                    <b-row v-if="resource.admins && resource.admins.length > 0">
                        <b-col cols="2">
                            <span class="form-header">Admins</span>
                        </b-col>
                        <b-col>
                            <p>
                                <small>Users who can administer this resource</small>
                            </p>
                            <p v-for="c in resource.admins" :key="c._id">
                                <contact :id="c"/>
                            </p>
                            <br>
                        </b-col>
                    </b-row>

                    <b-row v-if="resource.gids && resource.gids.length > 0">
                        <b-col cols="2">
                            <span class="form-header">Projects</span>
                        </b-col>
                        <b-col>
                            <p>
                                <small>This resource will be used to run jobs submitted to the following projects.</small>
                            </p>
                            <div v-if="resource.gids.includes(1)">
                                <h5>
                                    <b-badge variant="success" 
                                        title="This is a public resource for all brainlife projects/users.">
                                        Public Resource 
                                    </b-badge>
                                </h5>
                            </div>
                            <!--<group v-for="gid in resource.gids.filter(gid=>gid!=1)" :key="gid" :id="gid" style="margin-bottom: 10px;"/>-->
                            <projectbar v-for="project in gidsProjects" :key="project.group_id" :project="project"/>
                            <div v-if="privateGids && privateGids.length">
                                <small>This resource is enabled on private projects that you do not have access to.</small>
                                <!--<group v-for="gid in privateGids" :key="gid" :id="gid" style="margin-bottom: 10px;"/>-->
                                <h5>
                                    <b-badge v-for="gid in privateGids" :key="gid">GroupID: {{gid}}</b-badge>
                                </h5>
                            </div>
                            <br>
                        </b-col>
                    </b-row>

                    <b-row>
                        <b-col cols="2">
                            <span class="form-header">Execution Counts</span>
                        </b-col>
                        <b-col cols="10">
                            <p>
                                <ExportablePlotly v-if="usage_data" :data="usage_data" :layout="usage_layout"/>
                            </p>
                        </b-col>
                    </b-row>

                    <b-row v-if="resource.config.io_hostname">
                        <b-col cols="2">
                            <span class="form-header">IO Hostname</span>
                        </b-col>
                        <b-col>
                            <p>
                                <pre class="">{{resource.config.io_hostname}}</pre> 
                                <small>Optional hostname used to transfer data in and out of this resource</small>
                            </p>
                        </b-col>
                    </b-row>

                    <b-row>
                        <b-col cols="2">
                            <span class="form-header">Workdir</span>
                        </b-col>
                        <b-col>
                            <p class="">
                                <pre>{{resource.config.workdir}}</pre>
                            </p>
                        </b-col>
                    </b-row>

                    <b-row v-if="resource.envs && Object.keys(resource.envs).length > 0">
                        <b-col cols="2">
                            <span class="form-header">ENVs</span>
                        </b-col>
                        <b-col>
                            <editor v-bind:value="JSON.stringify(resource.envs, null, 4)" @init="editorInit" lang="json" height="250"/>
                        </b-col>
                    </b-row>

                    <b-row v-if="resource.citation">
                        <b-col cols="2">
                            <span class="form-header">Citation</span>
                        </b-col>
                        <b-col>
                            <p class="" style="opacity: 0.8;">
                                <i>{{resource.citation}}</i>
                            </p>
                        </b-col>
                    </b-row>

                    <hr>
                    <p style="opacity: 0.7;">
                        <icon name="calendar"/> Updated on {{new Date(resource.update_date).toLocaleDateString()}}
                    </p>
                    <p style="opacity: 0.7;">
                        <icon name="calendar"/> Last OK date {{new Date(resource.lastok_date).toLocaleDateString()}}
                    </p>
                </b-container>
            </div>
            <div v-if="tabID == 'apps'">
                <!--apps-->
                <b-container>
                    <br>
                    <p>
                        <small>The following services are enabled to run on this resource</small>
                    </p>
                    <table class="table table-sm">
                        <thead>
                            <tr style="background-color: #eee;">
                                <th style="padding-left: 20px">Github repos <small>(priority score)</small></th>
                                <th style="padding-right: 20px;">Total Requests <small style="float: right">success rate</small></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="service in resource.config.services" :key="service.name">
                                <td style="padding-left: 20px">
                                    {{service.name}}
                                    <small>({{service.score}})</small>
                                </td>
                                <td style="padding-right: 20px;">
                                    <div v-if="resource.stats && resource.stats.services && resource.stats.services[service.name]">
                                        <span>{{resource.stats.services[service.name].running}}</span>
                                        <small style="float: right;">{{success_rate(service.name)}}</small>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </b-container>
            </div>
            <div v-if="tabID == 'jobs'">
                <!--recent jobs-->
                <b-container>
                    <br>
                    <div v-if="!tasksRunning" class="loading">Loading ...</div>
                    <table v-else class="table table-sm">
                        <thead style="background-color: #eee; font-size: 80%;">
                            <tr style="background-color: #eee;">
                                <th width="15%">Project</th>
                                <th>Service</th>
                                <th width="30%">Status</th>
                                <th>Submitter</th>
                                <th>Request&nbsp;Date</th>
                                <th>Date</th>
                            </tr>
                        </thead>

                        <tr><th colspan="6" style="background-color: #fff; padding-left: 5px; opacity: 0.5;">Running ({{ tasksRunning.length }})</th></tr>
                        <tr v-if="tasksRunning.length == 0"><td colspan="6" style="padding-left: 5px; opacity: 0.5;">(No Jobs)</td></tr>
                        <taskRecord :tasks="tasksRunning" :cols="['project', 'status', 'service', 'submitter', 'request_date', 'dates']"/>

                        <tr><th colspan="6" style="background-color: #fff; padding-left: 5px; opacity: 0.5;">Recent ({{tasksRecent.length}})</th></tr>
                        <tr v-if="tasksRecent.length == 0"><td colspan="6" style="padding-left: 5px; opacity: 0.5;">(No Jobs)</td></tr>
                        <taskRecord :tasks="tasksRecent" :cols="['project', 'status', 'service', 'submitter', 'request_date', 'dates']"/>
                    </table>
                </b-container>
            </div>
            <div v-if="tabID == 'projects'">
                <!--projects-->
                <b-container>
                    <br>
                    <p>
                        <small>This resource has been used to analyze datasets on the following projects (only showing >10 hours of usage)</small>
                    </p>
                    <div style="background-color: white">
                        <b-row style="margin-bottom: 8px; opacity: 0.7; background-color: #eee; padding: 5px;">
                            <b-col cols="6">Project Name</b-col>
                            <b-col>Admin </b-col>
                            <b-col>Total Walltime</b-col>
                        </b-row>

                        <div v-for="project in resource.stats.projects" :key="project._id">
                            <b-row v-if="projects[project._id] && project.total_walltime > 3600*1000*10" style="border-top: 1px solid #eee; padding: 2px 0px">
                                <b-col cols="6">
                                    <b>{{projects[project._id].name}}</b><br>
                                    <small class="desc">{{projects[project._id].desc}}</small>
                                </b-col>
                                <b-col>
                                    <small><contact v-for="id in projects[project._id].admins" size="small" :key="id" :id="id"/></small>
                                </b-col>
                                <b-col>
                                    {{(project.total_walltime/(1000*60*60)).toFixed(1)}} hours <small>({{project.count}} jobs)</small>
                                </b-col>
                            </b-row>
                        </div>
                    </div>
                </b-container>
            </div>
        </div>
    </div>
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import pageheader from '@/components/pageheader'
//import group from '@/components/group'
import projectbar from '@/components/projectbar'
import contact from '@/components/contact'
import app from '@/components/app'
import statustag from '@/components/statustag'
import stateprogress from '@/components/stateprogress'
import taskRecord from '@/components/taskrecord'

const lib = require('@/lib');

export default {
    components: { 
        pageheader, 
        app, 
        contact, 
        //group, 
        statustag, 
        stateprogress, 
        ExportablePlotly: ()=>import('@/components/ExportablePlotly'),
        taskRecord, 
        projectbar,

        editor: require('vue2-ace-editor'),
    },

    data () {
        return {
            resource: null, 

            tasksRecent: null,
            tasksRunning: null,

            projects: null, //only used for admin - for project tab. list of all projects and some basic info (only admin can load this)
            usage_data: null, 
            usage_layout: null, 
            
            gidsProjects: null, //list of projects that this resource is enabled on
            privateGids: null, //enabled gids that user doesn't have access to 

            tab: 0,
            tabs : [
                {id: "detail", label: "Detail"},
                {id: "apps", label: "Apps"},
                {id: "jobs", label: "Jobs"},
                {id: "projects", label: "Projects"}
            ],
            testing: false,
            config: Vue.config,
        }
    },

    computed: {
        tabID() {
            return this.tabs[this.tab].id; 
        }
    },

    mounted() {
        this.handleRouteParams();
        this.load();
    },

    methods: {
        success_rate(service) {
            if(!service) return null;
            let stat = this.resource.stats.services[service];
            if(!stat || !stat.finished || !stat.failed) return null;
            let p = stat.finished / (stat.finished + stat.failed);
            return (p*100).toFixed(1)+ "%";
        },
        handleRouteParams() {
            const tab_id = this.$route.params.tab;
            if(tab_id) this.tab = this.tabs.findIndex(tab=>tab.id == tab_id); 
        },
        load() {
            //not using resource_cache mixin because we want the latest content?
            this.$http.get(Vue.config.amaretti_api+'/resource', {params: {
                find: JSON.stringify({
                    _id: this.$route.params.id,
                }),
            }}).then(res=>{
                this.resource = res.data.resources[0];
                if(!this.resource) alert("no such resource");

                /* resource.stats might not be set.. why do I have to sort it?
                this.resource.config.services.sort((a,b)=>{
                    let a_stats = this.resource.stats.services[a.name];
                    let b_stats = this.resource.stats.services[b.name];
                    if(a_stats && b_stats) {
                        if(a_stats.running < b_stats.running) return 1;
                        if(a_stats.running > b_stats.running) return -1;
                    } else {
                        //if not stats, sort by name
                        if(a.name < b.name) return -1;
                        if(a.name > b.name) return 1;
                    }
                    return 0;
                });
                */

                //load projects specified by the group_id
                this.$http.get('/project', {params: {
                    find: JSON.stringify({
                        group_id: {$in: this.resource.gids},
                    }),
                    select: 'name desc group_id admins members create_date',
                }}).then(res=>{
                    this.gidsProjects = res.data.projects;

                    //for projects that user doesn't have access (other admins of the resource can set it)
                    //let's create a skelton project to display
                    this.privateGids = [];
                    this.resource.gids.forEach(gid=>{
                        const project = this.gidsProjects.find(p=>p.group_id == gid);
                        if(!project) this.privateGids.push(gid);
                    });
                });

                if(Vue.config.hasRole("admin")) {
                    if(!this.resource.stats.projects) return;
                    let group_ids = this.resource.stats.projects.map(p=>p._id);
                    this.$http.get('/project/', {params: {
                        find: JSON.stringify({
                            group_id: {$in: group_ids},
                        }),
                        select: 'name desc group_id admins',
                        admin: true, //return all that matches (requires admin token)
                        limit: 0,
                    }}).then(res=>{
                        this.projects = {};
                        res.data.projects.forEach(project=>{
                            this.projects[project.group_id] = project;
                        });
                    }).catch(console.error);
                }

            }).catch(console.error);

            this.$http.get(Vue.config.amaretti_api+'/resource/tasks/'+this.$route.params.id).then(res=>{
                this.tasksRunning = res.data.running;
                this.tasksRecent = res.data.recent;
                let allTasks = [...this.tasksRunning, ...this.tasksRecent];
            }).catch(console.error);

            this.$http.get(Vue.config.amaretti_api+'/resource/usage/'+this.$route.params.id).then(res=>{
                let x = [];
                let y = [];
                res.data.forEach(rec=>{
                    x.push(new Date(rec[0]*1000)); //time
                    y.push(rec[1]); //value
                });
                let line = {
                    width: 1,
                    shape: 'spline',
                };
                this.usage_data = [{x, y, type: 'scatter', mode: 'lines', line, fill: 'tozeroy', fillcolor: '#07f2'}];
                this.usage_layout = {
                    height: 200,
                    margin: {
                        t: 20, //top
                        b: 35, //bottom
                        r: 20, //right
                        l: 30,
                    },
                    xaxis: {
                        //title: 'Running Jobs',
                        //showgrid: false,
                        //linecolor: '#fff',
                        zeroline: false,
                        tickfont: {
                            color: 'gray',
                        },
                    },
                    yaxis: {
                        //title: 'Running Jobs',
                        zeroline: false,
                        tickfont: {
                            color: 'gray',
                        },
                    },
                    //font: Vue.config.plotly.font,
                    //plot_bgcolor: "#fff",
                    //paper_bgcolor: "#fff",
                };
            }).catch(console.error);
        },

        back() {
            if(window.history.length > 1) this.$router.go(-1);
            else this.$router.push('/resources');
        },

        test() {
            if(this.testing) return; //already testing
            this.testing = true;
            this.$http.put(Vue.config.amaretti_api+'/resource/test/'+this.$route.params.id).then(res=>{
                this.resource.status = res.data.status;
                this.resource.status_msg = res.data.message.trim(); 
                if(res.data.status == "ok") this.$notify({type: "success", text: "Successfully tested!"});
                else this.$notify({type: "error", text: "Resource test failed"});
                this.resource.status_update = new Date();
                this.testing = false;
            }).catch(err=>{
                this.testing = false;
                this.resource.status_update = new Date();
                this.$notify({type: "error", text: err.response.data.message});
            });
        },

        editorInit(editor) {
            lib.editorInit(editor, ()=>{
                editor.setReadOnly(true);
            });
        },

        edit() {
            //this.editing = true;
            this.$router.push('/resource/'+this.resource._id+'/edit');
        },
    },

    watch: {
        '$route': function() {
            this.handleRouteParams();
        },
        tab: function() {
            if(this.$route.params.tab != this.tabs[this.tab].id) {
                this.$router.replace("/resource/"+this.resource._id+"/"+this.tabs[this.tab].id);
            }
        }
    }
}
</script>

<style scoped>
.desc {
    line-height: 180%;
}
.page-content {
    top: 0px;
    background-color: #f9f9f9;
}
.page-content h2 {
    margin-bottom: 0px;
    padding: 10px 0px;
    font-size: 20pt;
}
.page-content h3 {
    background-color: white;
    color: gray;
    padding: 20px;
    margin-bottom: 0px;
}
.page-content h4 {
    padding: 15px 20px;
    background-color: white;
    opacity: 0.8;
    color: #999;
    font-size: 17pt;
    font-weight: bold;
}
.header {
    background-color: white;
    padding: 15px 0 0 0;
    border-bottom: 1px solid #ddd;
}
.header-sticky {
    position: sticky;
    top: 0px;
    z-index: 5; /*to clear editor linenumbers*/
}
code.json {
background-color: white;
}
.form-action {
text-align: right;
position: fixed;
bottom:0;
right:0;
left:50px;
background-color: rgba(100,100,100,0.4);
padding: 10px;
}
.loading {
padding: 50px;
font-size: 20pt;
opacity: 0.5;
}
.box {
background-color: white;
padding: 10px;
}
.resource {
background-color: white;
padding: 10px;
}
.button-page {
position: absolute;
left: -30px;
z-index: 1;
opacity: 0.6;
}
.card {
    margin-bottom: 20px;
    border: none;
}
.table {
    background-color: white;
}
.table th {
border: none;
font-size: 90%;
padding-left: 0px;
opacity: 0.7;
}
</style>

