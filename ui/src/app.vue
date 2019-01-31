<template>
<div v-if="app">
    <pageheader/>
    <sidemenu active="/apps"></sidemenu>
    <div class="page-content">
        <b-alert :show="app.removed" variant="secondary">This App has been removed.</b-alert>
        <div class="header">
            <b-container>
                <b-row>
                    <b-col cols="3">
                        <appavatar :app="app" style="margin-bottom: 10px;" :width="200" :height="200"/>
                    </b-col>
                    <b-col cols="9" style="background-color: white;"><!--hide avatar when screen is narrow-->
                        <div style="float: right; position: relative; z-index: 3">
                            <span class="button" @click="go_github()" title="github"><icon name="brands/github" scale="1.25"/></span>
                            <span class="button" @click="copy()" v-if="app._canedit" title="Copy"><icon name="copy" scale="1.25"/></span>
                            <span class="button" @click="go('/app/'+app._id+'/edit')" v-if="app._canedit" title="Edit"><icon name="edit" scale="1.25"/></span>
                            <span class="button" @click="remove()" v-if="app._canedit" title="Remove"><icon name="trash" scale="1.25"/></span>
                        </div>
                        <h4 style="margin-bottom: 3px;">
                            <b-badge v-if="app.projects && app.projects.length > 0" variant="danger" title="Private App">
                                <icon name="lock" scale="0.8"/>
                            </b-badge>
                            {{app.name}}
                        </h4>
                        <h6 style="opacity: 0.8;">
                            <a target="github" :href="'https://github.com/'+app.github+'/tree/'+(app.github_branch||'master')" style="color: gray;">{{app.github}}</a>
                            <small><b-badge variant="secondary" v-if="app.github_branch" style="position: relative; top: -2px"><icon name="code-branch" scale="0.6"/> {{app.github_branch}}</b-badge></small>
                        </h6>
                        <p class="text">
                            {{app.desc_override||app.desc}}
                        </p>
                        <p>
                            <b-badge v-for="tag in app.tags" :key="tag" class="topic">{{tag}}</b-badge>
                        </p>
                        <p style="float: right;">
                            <b-btn @click="execute" variant="primary"><icon name="play"/>&nbsp;&nbsp;&nbsp;<b>Execute</b></b-btn>
                        </p>
                    </b-col>
                </b-row>

                <!--
                <b-tabs class="brainlife-tab" v-model="tab_index">
                    <b-tab title="Detail"/>
                    <b-tab>
                        <template slot="title">Execute</template>
                    </b-tab>
                </b-tabs>
                -->
            </b-container>
        </div><!--header-->

        <b-container>
            <!-- detail -->
            <div v-if="tab_index == 0">
                <b-row>
                    <b-col cols="3">
                        <p> 
                            <icon name="calendar"/>&nbsp;&nbsp;{{new Date(app.create_date).toLocaleDateString()}}
                        </p>
                        <!--
                        <p>
                            <contact :id="app.user_id" size="small"/> 
                        </p>
                        -->
                        <p>
                            <doibadge :doi="app.doi" v-if="app.doi"/>
                        </p>
                        <appstats :info="info" :appid="app._id"/>

                    </b-col>
                    <b-col cols="9">
                        <!--input/output-->
                        <!-- <span class="form-header">Input/Output</span>-->
                        <p><small class="text-muted">This app uses the following input/output datatypes</small></p>
                        <div style="position: relative;">
                            <b-row>
                                <!--input-->
                                <b-col>
                                    <!--<p v-else class="text-primary">This App runs with the following input dataset.</p>-->
                                    <div style="height: 100%; background-color: #cce5ff;">
                                        <div style="background-color: #007bff; color: white; padding: 5px; font-weight: bold;">Input</div>
                                        <b-alert show variant="primary" v-if="!app.inputs || app.inputs.length == 0">No Input</b-alert>
                                        <div v-if="app.inputs" style="padding: 5px">
                                            <div v-for="input in app.inputs" :key="input.id" class="io-card">
                                                <!--
                                                <datatypetag :datatype="input.datatype" :tags="input.datatype_tags"/>
                                                <p style="color: #222; margin-top: 5px; margin-bottom: 0px;">
                                                    <small>{{input.datatype.desc}}</small>
                                                </p>
                                                <small style="position: relative" v-if="input.datatype.files"> 
                                                    <pre v-highlightjs v-if="input.datatype.files"><code class="json hljs">{{input.datatype.files}}</code></pre>
                                                </small>
                                                -->
                                                <small style="opacity: 0.5; float: right;">{{input.id}}</small><!--internal output id-->
                                                <datatype :datatype="input.datatype" :datatype_tags="input.datatype_tags">
                                                    <template slot="tag_extra">
                                                        <span v-if="input.multi" style="opacity: 0.8">(multi)</span>
                                                        <span v-if="input.optional" style="opacity: 0.8">(optional)</span>
                                                    </template>
                                                </datatype>
                                            </div>
                        
                                            <!--
                                            <b-col cols="6" v-for="(con, key) in app.config" :key="key" v-if="con.type == 'input'">
                                                <div style="padding: 5px; background-color: white; margin-bottom: 5px;">
                                                    <small style="opacity: 0.5; float: right;">{{con.input_id}}</small>
                                                    <datatypetag :datatype="find_by_id(app.inputs, con.input_id).datatype" :tags="find_by_id(app.inputs, con.input_id).datatype_tags"/>
                                                    <span v-if="find_by_id(app.inputs, con.input_id).optional" class="text-muted">(optional)</span>
                                                    <span class="text-muted" v-if="find_by_id(app.inputs, con.input_id).multi">(multi)</span>
                                                    <b>config.json key: {{key}}</b>
                                                    <p style="color: #222;">
                                                        <small>{{find_by_id(app.inputs, con.input_id).datatype.desc}}</small>
                                                    </p>
                                                    <p>
                                                        <datatypefile :file="find_by_id(find_by_id(app.inputs, con.input_id).datatype.files, con.file_id)"/>
                                                    </p>
                                                </div>
                                            </b-col>
                                            -->
                                        </div>
                                    </div>
                                </b-col>

                                <!--output-->
                                <b-col>
                                    <icon name="arrow-right" style="position: absolute; top: 50%; left: -10px; opacity: 0.5" scale="1.5"/>
                                    <div style="height: 100%; background-color: #d4edda">
                                        <div style="background-color: #28a745; color: white; padding: 5px; font-weight: bold">Output</div>
                                        <b-alert show variant="success" v-if="!app.outputs || app.outputs.length == 0">No Output</b-alert>
                                        <div v-if="app.outputs" style="padding: 5px;">
                                            <div v-for="output in app.outputs" :key="output.id" class="io-card">
                                                <small style="opacity: 0.5; float: right;">{{output.id}}</small><!--internal output id-->
                                                <!--
                                                <datatypetag :datatype="output.datatype" :tags="output.datatype_tags"/>
                                                <p style="color: #222; margin-top: 5px; margin-bottom: 0px">
                                                    <small>{{output.datatype.desc}}</small>
                                                </p>
                                                -->
                                                <datatype :datatype="output.datatype" 
                                                        :datatype_tags="output.datatype_tags" 
                                                        :tag_pass="output.datatype_tags_pass">
                                                    <template slot="tag_extra">
                                                        <span v-if="output.datatype_tags_pass" title="tag pass through from this input dataset">+ <b>{{output.datatype_tags_pass}}</b></span>
                                                    </template>
                                                </datatype>
                                                <small style="position: relative" v-if="output.files"> 
                                                    <b>Output Mapping</b>
                                                    <pre v-highlightjs v-if="output.files"><code class="json hljs">{{output.files}}</code></pre>
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </b-col>
                            </b-row>
                            <br>
                        </div><!--input/ouput-->

                        <div v-if="app.projects && app.projects.length > 0">
                            <span class="form-header">Projects</span>
                            <p><small class="text-muted">Only the members of the following project(s) can view and execute this App.</small></p>
                            <div v-for="project in app.projects" :key="project._id" class="project-card" @click="go('/project/'+project._id)">
                                <b-row>
                                    <b-col cols="2">
                                        <projectavatar :project="project" :height="50" :width="50"/>
                                    </b-col>
                                    <b-col>
                                        <b>{{project.name}}</b>
                                        <p style="margin-bottom: 0px; color: gray;" class="text">{{project.desc}}</p>
                                    </b-col>
                                </b-row>
                            </div>
                            <br>
                        </div>

                        <div v-if="app.retry">
                            <span class="form-header">Retry</span>
                            <p>If this App fails, it will automatically be rerun up to <b>{{app.retry}}</b> times.</p>
                            <br>
                        </div>

                        <div v-if="resources">
                            <span class="form-header">Computing Resources</span>
                            <b-alert show variant="danger" v-if="resources.length == 0" style="margin-bottom: 10px;">
                                This App is not enabled to run on any resource that you have access to. 
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

                            <b-row>
                                <b-col cols="4" v-for="resource in resources" :key="resource._id">
                                    <div class="resource" v-b-popover.hover.d500="resource.info.desc+'\n\n'+resource.detail.msg+'\nstatus:'+resource.status" :title="null">
                                        <p style="padding: 10px; margin-bottom: 0px;">
                                            <icon v-if="resource.gids.length > 0" name="users" style="opacity: 0.4; float: right"/>
                                            <icon v-else name="lock" class="text-danger" style="float: right" title="Private resource"/>

                                            <b>{{resource.name}}</b><br>
                                            <small>{{resource.info.name}}</small>
                                        </p>

                                        <div v-if="resource.status != 'ok'" class="resource-status bg-danger">
                                            <icon name="exclamation" style="position: relative; top: -3px;"/>
                                            {{resource.status}}
                                            <span class="score">Score {{resource.score}}</span>
                                        </div>
                                        <div v-else-if="resource.score == 0" class="resource-status bg-warning">
                                            <icon name="hourglass" style="position: relative; top: -3px;"/>
                                            Busy
                                            <span class="score">Score {{resource.score}}</span>
                                        </div>
                                        <div v-else-if="resource.id == preferred_resource._id" class="resource-status bg-success" title="This resource will be used to execute this App.">
                                            <icon name="thumbs-up" style="position: relative; top: -3px;"/>
                                            <!--Best-->
                                            <span class="score">Score {{resource.score}}</span>
                                        </div>
                                        <div v-else class="resource-status" style="color: #888;">        
                                            <span class="score">Score {{resource.score}}</span>
                                        </div>
                                    </div>
                                </b-col>
                            </b-row>
                            <br>
                        </div>

                        <div v-if="config.user">
                            <span class="form-header">Administrators</span>
                            <p><small class="text-muted">List of users that can administer this App.</small></p>
                            <p v-for="c in app.admins" :key="c._id">
                                <contact :id="c"/>
                            </p>
                            <br>
                        </div>

                        <div v-if="app.contributors.length > 0">
                            <span class="form-header">Contributors</span>
                            <p><small class="text-muted">List of code contributors.({{app.github}}).</small></p>
                            <p v-for="dev in app.contributors" :key="dev._id">
                                <contact :fullname="dev.name" :email="dev.email"/>
                            </p>
                            <br>
                        </div>
 
                        <div v-if="info">
                            <span class="form-header">App execution history.</span>
                            <p><small class="text-muted">Activity over the last 180 days.</small></p>
                            <vue-plotly :data="hist_data" :layout="hist_layout" :options="{displayModeBar: false}" :autoResize="true" :watchShallow="true"/>
                            <br>
                        </div>

                        <div v-if="readme">
                            <span class="form-header">README</span>
                            <p><small class="text-muted">From github repo / README.md</small></p>
                            <vue-markdown :source="readme" class="readme"></vue-markdown>
                        </div>

                        <vue-disqus shortname="brain-life" :identifier="app._id"/>

                    </b-col>
                </b-row>

                <!--
                <div class="side-card">
                    <center>
                        <span class="text-muted">Badges</span>
                        <br>
                        <br>
                        <img :src="'https://img.shields.io/badge/brainlife.io-app-green.svg'" @click="show_badge_url()"><br>
                    </center>
                </div>
                -->
            </div>

            <!--
            <div v-if="tab_index == 1">
                <p><small class="text-muted">From github repo / README.md</small></p>
                <vue-markdown v-if="readme" :source="readme" class="readme"></vue-markdown>
            </div>
            <div v-if="tab_index == 1">
                <appsubmit v-if="config.user" :id="app._id"/>
                <p v-else class="text-muted">Please login to execute the App.</p>
            </div>
            <div v-if="tab_index == 3">
                <p class="text-muted">No test status available yet.</p>
            </div>
            -->
            <br>
            <br>
            <br>
            <br>
            <br>
        </b-container>

        <!--
        <br>
        <b-card v-if="config.debug">
            <div slot="header">Debug</div>
            <h3>App</h3>
            <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
            <h3>Preferred Resource</h3>
            <pre v-highlightjs="JSON.stringify(preferred_resource, null, 4)"><code class="json hljs"></code></pre>
        </b-card>
        -->
    </div><!--page-content-->
</div>
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import tags from '@/components/tags'
import datatype from '@/components/datatype'
import datatypefile from '@/components/datatypefile'
import datatypetag from '@/components/datatypetag'
import appavatar from '@/components/appavatar'
import VueMarkdown from 'vue-markdown'
import statustag from '@/components/statustag'
import appstats from '@/components/appstats'
import projectavatar from '@/components/projectavatar'
import doibadge from '@/components/doibadge'
import VuePlotly from '@statnett/vue-plotly'

export default {
    components: { 
        sidemenu, pageheader, contact, 
        tags, datatype, appavatar,
        VueMarkdown, statustag, 
        datatypetag, datatypefile,
        appstats, projectavatar,
        doibadge, VuePlotly,
    },

    metaInfo: {
        meta: [
            { charset: 'utf-8' },
            { name: 'here is my thing', content: 'appppp' }
        ]
    },

    data () {
        return {
            app: null,
            preferred_resource: null,
            resources: null,
            readme: null,
            info: null,

            selfurl: document.location.href,

            tab_index: 0,

            config: Vue.config,
        }
    },

    mounted: function() {
        this.$on('editor-update', c=>{
            console.log("update", c);
        });

        //load app
        this.$http.get('app', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
            populate: 'inputs.datatype outputs.datatype projects',
        }})
        .then(res=>{
            this.app = res.data.apps[0];
            if(this.config.user) this.find_resources(this.app.github);

            //then load service info
            return this.$http.get(Vue.config.wf_api+'/service/info', {params: {
                service: this.app.github,
            }});
        }).then(res=>{
            this.info = res.data;

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

    computed: {
        shared_resources() {
            if(!this.resources) return [];
            return this.resources.filter(r=>r.gids.length > 0);
        },

        hist_data() {
            let dstart = new Date(new Date().getTime() - 3600*1000*24*this.info.hist.failed.length);
            let days = [];
            for(let i = 0;i < this.info.hist.failed.length;++i) {
                days.push(new Date(dstart.getTime() + 3600*1000*24*i));
            }
            return [
                {
                    x: days,
                    y: this.info.hist.finished,
                    type: 'scatter',
                    name: 'Finished',
                    marker: {
                        color: 'green',
                    },
                    fill: 'tozeroy',
                    line: {
                        width: 0,
                    }
                },
                {
                    x: days,
                    y: this.info.hist.failed,
                    type: 'scatter',
                    name: 'Failed',
                    marker: {
                        color: '#dc3545',
                    },
                    fill: 'tozeroy',
                    line: {
                        width: 0,
                    }
                },
            ];
        },

        hist_layout() {
            return {
                //title: 'Execution History',
                //barmode: 'stack',
                height: 150,
                margin: {
                    l: 30,
                    r: 10,
                    b: 30,
                    t: 10,
                },
            }
        }, 
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
        
        copy() {
            this.$router.push('/app/'+this.app._id+'/copy');
        },

        go(path) {
            this.$router.push(path);
        },

        go_github() {
            document.location = "https://github.com/"+this.app.github;
        },

        execute() {
            if(Vue.config.user) {
                this.$root.$emit("appsubmit.open", this.app._id);
            } else {
                alert("Please sign up / login first to execute Apps.");
            }
        },

        find_resources(service) {
            this.$http.get(Vue.config.wf_api + '/resource/best', {params: {
                service,
            }})
            .then(res => {
                if(res.data.resource) this.preferred_resource = res.data.resource;
                this.resources = res.data.considered.sort((a, b) => {
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

        /*
        bibtex() {
            document.location = '/api/warehouse/app/bibtex/'+this.app._id;
        },
        */

        find_by_id(list, id) {
            var item = list.find(it=>it.id == id);
            if(!item) {
                console.error("failed to find_by_id", id);
                console.dir(list);
            }
            return item;
        }
    },
}
</script>

<style scoped>
.header {
background-color: white;
margin-bottom: 30px;
padding: 30px 0px 0px 0px;
border-bottom: 1px solid #eee;
z-index: 2;
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
.project-card {
cursor: pointer;
background-color: white;
padding: 5px;
margin-bottom: 5px;
}
.project-card:hover {
background-color: #ddd;
}
.resource {
background-color: white;
box-shadow: 2px 2px 3px #eee;
margin-bottom: 10px;
position: relative;
}
.resource-status {
font-size: 10pt;
color: white;
text-transform: uppercase;
background-color: #ddd;
height: 30px;
padding: 5px 10px;
width: 100%;
}
.resource-status .score {
float: right;
}
.readme {
background-color: white;
padding: 20px;
box-shadow: 2px 2px 5px #eee;
margin-bottom: 10px;
}
.io-card {
padding: 8px; 
background-color: white; 
margin-bottom: 5px; 
}
</style>
