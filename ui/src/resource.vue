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
                    <h5>
                        <b-badge v-if="!resource.active">Inactive</b-badge>
                        <b-badge v-if="!resource.gids || resource.gids.length == 0" variant="secondary" title="Private resource"><icon name="lock" scale="0.9"/></b-badge>
                        {{resource.name}}
                    </h5>
                    <h6 style="opacity: 0.5;">
                        {{resource.config.username}}@{{resource.config.hostname}}
                    </h6>

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
                                Recent Jobs
                                <span style="opacity: 0.6; font-size: 80%" v-if="tasks.length > 0">{{tasks.length}}</span>
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
                                <icon name="calendar" style="opacity: 0.4;"/> <small>Registered</small>&nbsp;&nbsp;{{new Date(resource.create_date).toLocaleDateString()}}
                            </b-badge>
                            <b-badge pill class="bigpill" title="Number of tasks currently running on this resource">
                                <icon name="play" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;{{tasksRunning.length}}&nbsp;&nbsp;<small>Running / {{resource.config.maxtask}} max</small>
                            </b-badge>
                        </p>
                        <p>{{resource.config.desc||'no description'}}</p>
                        <p style="margin-bottom: 0;">
                            <statustag :status="resource.status" style="font-size: 150%"/>
                            <span style="padding-left: 15px; opacity: 0.7;">
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
                                <contact :id="resource.user_id"/>
                            </p>
                        </b-col>
                    </b-row>

                    <b-row>
                        <b-col cols="2">
                            <span class="form-header">Execution Counts</span>
                        </b-col>
                        <b-col>
                            <p>
                                <Plotly v-if="usage_data" :data="usage_data" :layout="usage_layout" style="background-color: #fff;"/>
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
                    <b-row v-if="resource.gids && resource.gids.length > 0">
                        <b-col cols="2">
                            <span class="form-header">Groups</span>
                        </b-col>
                        <b-col>
                            <div class="">
                                <tags :tags="resource.gids"/><br>
                            </div>
                            <p>
                                <small>Group ID that this resource is shared with</small>
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

                    <div v-if="config.debug">
                        <pre>{{resource}}</pre>
                        <pre>{{tasks}}</pre>
                        <pre>{{usage_data}}</pre>
                    </div>
                </b-container>
            </div>
            <div v-if="tab == 1">
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
                                        <!--
                                        <stateprogress :states="{'finished': resource.stats.services[service.name].finished, 'failed': resource.stats.services[service.name].failed}" style="margin-right: 125px;"/>
                                        -->
                                        <small style="float: right;">{{success_rate(service.name)}}</small>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </b-container>
            </div>
            <div v-if="tab == 2">
                <!--recent jobs-->
                <b-container>
                    <br>
                    <table class="table table-sm">
                        <thead>
                            <tr style="background-color: #eee;">
                                <th style="min-width: 100px;">Project</th>
                                <th>Status</th>
                                <th>Submitter</th>
                                <th>Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tr v-for="task in tasks" :key="task._id">
                            <td>
                                <span v-if="task._project">{{task._project.name}}</span>
                                <span v-else style="opacity: 0.7;">(Private) 
                                    <small><icon name="id-badge"/> {{task._group_id}}</small>
                                </span>
                            </td>
                            <td>
                                <span class="status-color" :class="task.status" style="padding: 3px;" :title="task.status">
                                    <statusicon :status="task.status" /> 
                                    <!--<span style="text-transform: uppercase;" >{{task.status}}</span>-->
                                </span>
                                {{task.service}} <b-badge>{{task.service_branch}}</b-badge><br>
                                <small style="word-break: break-word;">{{task.status_msg}}</small>
                                <small style="font-size: 70%">{{task._id}}</small>
                            </td>
                            <td>
                                <contact :id="task.user_id" size="small"/>
                            </td>
                            <td>
                                <small>
                                    <time>Requested <timeago :datetime="task.request_date" :auto-update="1"/></time>
                                </small>
                            </td>
                            <td>
                                <small v-if="task.status == 'requested'">
                                    <time v-if="task.start_date">Started <timeago :datetime="task.start_date" :auto-update="1"/></time>
                                </small>
                                <small v-else-if="task.status == 'running'"><time>Started <timeago :datetime="task.start_date" :auto-update="1"/></time></small>
                                <small v-else-if="task.status == 'running_sync'"><time>Started <timeago :datetime="task.start_date" :auto-update="1"/></time></small>
                                <small v-else-if="task.status == 'finished'"><time>Finished <timeago :datetime="task.finish_date" :auto-update="1"/></time></small>
                                <small v-else-if="task.status == 'failed'"><time>Failed <timeago :datetime="task.fail_date" :auto-update="1"/></time></small>
                            </td>
                        </tr>
                    </table>
                    <p style="padding-left: 20px; opacity: 0.7; font-size: 80%;">Only showing up to 100 most recent jobs</p>

                </b-container>
            </div>
            <div v-if="tab == 3">
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
                                    <small>{{projects[project._id].desc}}</small>
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
import {Plotly} from 'vue-plotly'

import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import app from '@/components/app'
import tags from '@/components/tags'
import statustag from '@/components/statustag'
import statusicon from '@/components/statusicon'
import stateprogress from '@/components/stateprogress'

export default {
    components: { 
        pageheader, 
        app, 
        contact, 
        tags, 
        statustag, 
        statusicon, 
        stateprogress, 
        Plotly,

        editor: require('vue2-ace-editor'),
    },

    data () {
        return {
            resource: null, 
            //groups: null,

            tasks: [],  //recent jobs 
            tasksRunning: [],  //jobs currently running

            //report: null,
            projects: null, //list of all projects and some basic info (only admin can load this)
            usage_data: null, 
            usage_layout: null, 

            tab: 0,

            testing: false,
            config: Vue.config,
        }
    },

    computed: {
    },

    mounted() {
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
        load() {
            console.log("loading resource:"+this.$route.params.id);
            this.$http.get(Vue.config.amaretti_api+'/resource', {params: {
                find: JSON.stringify({
                    _id: this.$route.params.id,
                }),
            }}).then(res=>{
                this.resource = res.data.resources[0];
                if(!this.resource) alert("no such resource");
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

                if(Vue.config.has_role("admin")) {
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
                this.tasks = res.data.recent;
                console.log("tasks");
                console.dir(this.tasks);
                this.tasksRunning = this.tasks.filter(t=>t.status == "running" || t.status == "running_sync");

                //resolve project names
                let gids = this.tasks.map(task=>task._group_id);
                let project_find = JSON.stringify({
                    group_id: {$in: gids},
                });
                this.$http.get("/project", {params: {find: project_find, select: 'name group_id'}}).then(res=>{
                    let projects = {};
                    res.data.projects.forEach(project=>{
                        projects[project.group_id] = project;
                    });
                    this.tasks.forEach(task=>{
                        task._project = projects[task._group_id];
                    });
                });
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
                    font: Vue.config.plotly.font,
                    plot_bgcolor: "#fff0",
                    paper_bgcolor: "#fff0",
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
            require('brace/mode/json')
            editor.container.style.lineHeight = 1.25;
            editor.renderer.updateFontSize();
            editor.setReadOnly(true);
        },

        edit() {
            //this.editing = true;
            this.$router.push('/resource/'+this.resource._id+'/edit');
        },
    },

    watch: {
        '$route': function() {
            load();
        },
    }
}
</script>

<style scoped>
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

