<template>
<div v-if="app">
    <pageheader/>
    <sidemenu active="/apps"></sidemenu>
    <div class="page-content">
        <div class="header">
            <b-container>
                <b-row>
                    <b-col cols="3">
                        <appavatar :app="app" style="margin-bottom: 10px;" :width="200" :height="200"/>
                    </b-col>
                    <b-col cols="9" style="background-color: white;"><!--hide avatar when screen is narrow-->
                        <div style="float: right;">
                            <span class="button" @click="go_github()" title="github"><icon name="brands/github" scale="1.25"/></span>
                            <span class="button" @click="go('/app/'+app._id+'/edit')" v-if="app._canedit" title="Edit"><icon name="edit" scale="1.25"/></span>
                            <span class="button" @click="remove()" v-if="app._canedit" title="Remove"><icon name="trash" scale="1.25"/></span>
                        </div>
                        <h4 style="margin-bottom: 3px;">{{app.name}}</h4>
                        <h6 style="opacity: 0.8;">
                            <a :href="'https://github.com/'+app.github+'/tree/'+(app.github_branch||'master')" style="color: gray;">{{app.github}}</a>
                            <small><b-badge variant="secondary" v-if="app.github_branch" style="position: relative; top: -2px"><icon name="code-branch" scale="0.6"/> {{app.github_branch}}</b-badge></small>
                        </h6>
                        <p class="text">
                            {{app.desc_override||app.desc}}
                        </p>
                        <p>
                            <doibadge :doi="app.doi" v-if="app.doi" style="float: right; margin-bottom: 7px;"/>
                            <b-badge v-for="tag in app.tags" :key="tag" class="topic">{{tag}}</b-badge>
                        </p>
                        <appstats :app="app" style="clear: both;"/>
                    </b-col>
                </b-row>

                <b-tabs class="brainlife-tab" v-model="tab_index">
                    <b-tab title="Detail"/>
                    <b-tab title="Readme"/>
                    <b-tab>
                        <template slot="title"><icon name="paper-plane"/> Execute</template>
                    </b-tab>
                    <!--<b-tab title="Test Status"/>-->
                    <!--<b-tab title="Citation / References"/>-->
                </b-tabs>
            </b-container>
        </div><!--header-->

        <b-container>
            <b-alert :show="app.removed" variant="warning">This app has been removed.</b-alert>

            <!-- detail -->
            <div v-if="tab_index == 0">
                <!--input/output header-->
                <b-row>
                    <b-col cols="3">
                        <span class="form-header">Input</span>
                    </b-col>
                    <b-col>
                        <b-row style="color: #999; text-transform: uppercase; font-weight: bold; font-size: 90%; margin-bottom: 10px;">
                            <b-col cols="2">ID</b-col>
                            <b-col cols="3">config.json key</b-col>
                            <b-col cols="3">Datatype</b-col>
                            <b-col cols="4">File Mapping</b-col>
                        </b-row>
                        <b-alert show variant="secondary" v-if="app.inputs.length == 0">No Inputs</b-alert>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col cols="3">
                    </b-col>
                    <b-col>
                        <div v-for="(con, key) in app.config" :key="key" v-if="con.type == 'input'" style="margin-bottom: 5px;">
                            <b-row>
                                <b-col cols="2">
                                    <span style="opacity: 0.5;">{{con.input_id}}</span><!--internal input id-->
                                </b-col>
                                <b-col cols="3">
                                    <b>{{key}} <span class="text-muted" v-if="find_by_id(app.inputs, con.input_id).multi">(multi)</span></b>
                                </b-col>
                                <b-col cols="3" v-if="app.inputs">
                                    <datatypetag :datatype="find_by_id(app.inputs, con.input_id).datatype" :tags="find_by_id(app.inputs, con.input_id).datatype_tags"/>
                                    <span v-if="find_by_id(app.inputs, con.input_id).optional" class="text-muted">(optional)</span>
                                </b-col>
                                <b-col cols="4">
                                    <datatypefile :file="find_by_id(find_by_id(app.inputs, con.input_id).datatype.files, con.file_id)"/>
                                </b-col>
                            </b-row>
                        </div>
                        <!--<icon name="arrow-down"/>-->
                        <hr>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col cols="3">
                        <span class="form-header">Output</span>
                    </b-col>
                    <b-col>
                        <div class="item" v-for="output in app.outputs" style="margin-bottom: 5px;">
                            <b-row>
                                <b-col cols="2">
                                    <span style="opacity: 0.5;">{{output.id}}</span><!--internal output id-->
                                </b-col>
                                <b-col cols="3">
                                </b-col>
                                <b-col cols="3">
                                    <datatypetag :datatype="output.datatype" :tags="output.datatype_tags"/>
                                    <span v-if="output.datatype_tags_pass" title="tag pass through from this input dataset">+ {{output.datatype_tags_pass}}</span>
                                </b-col>
                                <b-col cols="4">
                                    <div style="position: relative"> 
                                        <pre v-highlightjs v-if="output.files"><code class="json hljs">{{output.files}}</code></pre>
                                    </div>
                                </b-col>
                            </b-row>
                        </div>
                        <b-alert show variant="secondary" v-if="app.outputs.length == 0">No Outputs</b-alert>
                        <br>
                        <br>
                    </b-col>
                </b-row>

                <b-row v-if="app.projects && app.projects.length > 0">
                    <b-col cols="3">
                        <span class="form-header">Projects</span>
                    </b-col>
                    <b-col>
                        <p><small class="text-muted"><icon name="lock" /> Only the members of the following project(s) can view/execute this app.</small></p>
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
                    </b-col>
                </b-row>
                <!--
                <b-row v-if="app.retry">
                    <b-col cols="3">
                        <b>Retry</b>
                    </b-col>
                    <b-col>
                        <p>If this app fails, it will automatically retry up to <b>{{app.retry}}</b> times</p>
                    </b-col>
                </b-row>
                -->
                <!--
                <b-row v-if="resources">
                    <b-col cols="3">
                        <span class="form-header">Computing Resources</span>
                    </b-col>
                    <b-col>
                        <p v-if="preferred_resource"><small class="text-muted">This application can currently run on the following resources</small></p>
                        <b-alert show variant="warning" v-if="!preferred_resource">
                            This app currently can not run on any resource that you have access to.
                        </b-alert>
                        <b-table style="font-size: 90%;" :items="resource_table" :fields="['resource','status','score', 'detail']">
                            <template slot="resource" slot-scope="data">
                                <icon class="preferred-icon" v-if="data.item.preferred" name="thumbs-up"/>
                                <b>{{data.value}}</b>
                            </template>
                            <template slot="status" slot-scope="data">
                                <statustag :status="data.value"/>
                            </template>
                            <template slot="detail" slot-scope="data">
                                <p class="text-muted">{{data.value}}</p>
                            </template>
                        </b-table>
                    </b-col>
                </b-row>
                -->

                <b-row v-if="resources">
                    <b-col cols="3">
                        <span class="form-header">Computing Resources</span>
                    </b-col>
                    <b-col>
                        <b-alert show variant="danger" v-if="resources.length == 0">
                            This App is not registered to run on any resource that you have access to. If you are a developer of this App, please contact resource administrators and enable this App on more resources.
                        </b-alert>
                        <b-alert show variant="warning" v-else-if="!preferred_resource">
                            This App can not run on any registered resources that you have access to at this moment.
                        </b-alert>
                        <p v-else>
                            <small class="text-muted">This App is registered to run on the following resources that you have access to.</small>
                        </p>
                        <b-row>
                            <b-col cols="4" v-for="resource in resources" :key="resource._id">
                                <div class="resource" v-b-popover.hover="resource.info.desc+'\n\n'+resource.detail+'\nstatus:'+resource.status" :title="null">
                                    <icon name="server" scale="2" style="float: right; opacity: 0.5;"/>
                                    <b>{{resource.name}}</b><br>
                                    <small>{{resource.info.name}}</small>
                                    <h5><b-badge pill variant="light">Score {{resource.score}}</b-badge></h5>
                                    <div v-if="resource.status != 'ok'" class="resource-status bg-danger">Down</div>
                                    <div v-else-if="resource.score == 0" class="resource-status bg-warning">Busy</div>
                                    <div v-else-if="resource.id == preferred_resource._id" class="resource-status bg-success" title="This resource will be used to execute this App.">
                                        <icon name="thumbs-up" style="position: relative; top: -3px;"/>
                                    </div>
                                    <!--
                                    <p style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">{{resource.id}}</p>
                                    -->
                                </div>
                            </b-col>
                        </b-row>
                    </b-col>
                </b-row>


                <!--detail table-->
                <b-row v-if="config.user">
                    <b-col cols="3">
                        <span class="form-header">Administrators</span>
                    </b-col>
                    <b-col>
                        <p><small class="text-muted">The following users can administer this application registration.</small></p>
                        <p v-for="c in app.admins" :key="c._id">
                            <contact :id="c"/>
                        </p>
                    </b-col>
                </b-row>
                <br>

                <b-row>
                    <b-col cols="3">
                        <span class="form-header">Contributors</span>
                    </b-col>
                    <b-col>
                        <p><small class="text-muted">The following people have contributed to the source code ({{app.github}}).</small></p>
                        <p v-for="dev in app.contributors" :key="dev._id">
                            <contact :fullname="dev.name" :email="dev.email"/>
                        </p>
                    </b-col>
                </b-row>

                <hr>
                <b-row>
                    <b-col cols="3">
                    </b-col>
                    <b-col>
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

            <div v-if="tab_index == 1">
                <p><small class="text-muted">From github repo / README.md</small></p>
                <vue-markdown v-if="readme" :source="readme" class="readme"></vue-markdown>
            </div>
            <div v-if="tab_index == 2">
                <appsubmit v-if="config.user" :id="app._id"/>
                <p v-else class="text-muted">Please login first to execute application.</p>
            </div>
            <div v-if="tab_index == 3">
                <p class="text-muted">No test status available yet</p>
            </div>
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
import appsubmit from '@/components/appsubmit'
import appstats from '@/components/appstats'
import projectavatar from '@/components/projectavatar'
import doibadge from '@/components/doibadge'

export default {
    components: { 
        sidemenu, pageheader, contact, 
        tags, datatype, appavatar,
        VueMarkdown, statustag, 
        appsubmit, datatypetag, datatypefile,
        appstats, projectavatar,
        doibadge, 
     },

    data () {
        return {
            app: null,
            preferred_resource: null,
            resources: null,
            readme: null,

            selfurl: document.location.href,

            tab_index: 0,

            config: Vue.config,
        }
    },

    computed: {
        /*
        resource_table: function() {
            let items = [];
            if(this.resources) {
                this.resources.forEach(resource=>{
                    var item = {
                        resource: resource.name,
                        status: resource.status,
                        score: resource.score,
                        detail: resource.detail,
                        //_rowVariant: "success",
                    };

                    //b-table shows _rowVariant as column..
                    if(this.preferred_resource && resource.id == this.preferred_resource._id) {
                        //item._rowVariant = 'success';
                        item.preferred = true;
                    }
                    items.push(item);
                });
            }
            return items;
        },
        */
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
            this.app = res.body.apps[0];
            if(this.config.user) this.find_resources(this.app.github);

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
        
        go(path) {
            this.$router.push(path);
        },
        go_github() {
            document.location = "https://github.com/"+this.app.github;
        },
        
        find_resources(service) {
            this.$http.get(Vue.config.wf_api + '/resource/best', {params: {
                service,
            }})
            .then(res => {
                console.log("loaded resources");
                console.dir(res.body);
                if(res.body.resource) this.preferred_resource = res.body.resource;
                this.resources = res.body.considered.sort((a, b) => {
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
border-bottom: 1px solid #ccc;
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
box-shadow: 2px 2px 5px #ddd;
padding: 10px;
margin-bottom: 10px;
position: relative;
}
.resource-status {
position: absolute;
bottom: -5px;
right: -8px;
font-size: 10pt;
text-align: center;
padding-top: 13px;
color: white;
text-transform: uppercase;
background-color: gray;
width: 50px;
height: 50px;
border-radius: 50px;
border: 3px solid white;
box-shadow: 1px 1px 5px #999;
}
</style>
