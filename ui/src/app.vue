<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/apps"></sidemenu>
    <div class="header" v-if="app">
        <el-button-group style="float: right;">
            <el-button @click="remove()" v-if="app._canedit" icon="delete">Remove</el-button>
            <el-button @click="go('/app/'+app._id+'/edit')" v-if="app._canedit" icon="edit">Edit</el-button>
            <el-button type="primary" v-if="preferred_resource && !preferred_resource.nomatch" @click="go('/app/'+app._id+'/submit')"icon="caret-right">Submit</el-button>
        </el-button-group>
        <appavatar :app="app" style="float: left; margin-right: 20px; border: 4px solid white; box-shadow: 3px 3px 3px rgba(0,0,0,0.3);"></appavatar>
        <h1>{{app.name}}</h1>
    </div>
    <div class="page-content" v-if="app" style="margin-top: 80px;">
        <div style="margin-left: 130px; margin-bottom: 10px; min-height: 60px;">
            <br>
            <p><el-rate v-model="app._rate" @change="ratechange()"></el-rate></p>
            <p style="line-height: 150%;">{{app.desc}}</p>
        </div>

        <table class="info">
        <tr v-if="service_stats">
            <th width="175px">Stats</th>
            <td>
                <el-row>
                    <el-col :span="8">
                        <h3>{{service_stats.tasks}}</h3>
                        <h5 class="text-muted">Total Runs</h5>
                    </el-col>
                    <el-col :span="8">
                        <h3>{{service_stats.users}}</h3>
                        <h5 class="text-muted">Users</h5>
                    </el-col>
                    <el-col :span="8">
                        <h3>{{((service_stats.counts.finished||0)*100 / (service_stats.counts.requested||1)) | toFixed(1)}}% </h3>
                        <h5 class="text-muted">Success Rate</h5>
                    </el-col>
                </el-row>
            </td>
        </tr>
        <tr>
            <th>Source</th>
            <td>
                <div v-if="app.github">
                    Github
                    <a :href="'http://github.com/'+app.github">{{app.github}}</a>
                </div>
                <div v-if="app.dockerhub">
                    Dockerhub
                    <a :href="'http://hub.docker.com/'+app.dockerhub">{{app.dockerhub}}</a>
                </div>
                <el-card v-if="readme" style="margin-top: 10px;">
                    <vue-markdown :source="readme"></vue-markdown>
                </el-card>
            </td>
        </tr>
        <tr>
            <th>Input Datatypes</th>
            <td>
                <p class="text-muted">You need following input datasets to run this application</p>
                <div class="item" v-for="input in app.inputs">
                    <!--<b>{{input.id}}</b>-->
                    <datatype :id="input.id" :datatype="input.datatype" :datatype_tags="input.datatype_tags" style="margin-bottom: 10px;"></datatype>
                </div>
            </td>
        </tr>
        <tr v-if="app.outputs.length">
            <th>Output Datatypes</th>
            <td>
                <p class="text-muted">This application produces following output datasets</p>
                <div class="item" v-for="output in app.outputs">
                    <datatype :id="output.id" :datatype="output.datatype" :datatype_tags="output.datatype_tags">
                        <div v-if="output.files">
                            <small>Output mapping</small>
                            <pre v-highlightjs><code class="json hljs">{{output.files}}</code></pre>
                        </div>
                    </datatype>
                </div>
            </td>
        </tr>
        <tr>
            <th>Tags</th>
            <td><tags :tags="app.tags"></tags></td>
        </tr>
        <tr>
            <th>Developers</th>
            <td>
                <contact v-for="c in app.admins" key="c._id" :id="c"></contact>
            </td>
        </tr>
        <tr v-if="app.retry">
            <th>Retry</th>
            <td>
                <p>
                    If this application fails, it will automatically retry up to <b>{{app.retry}}</b> times
                </p> 
            </td>
        </tr>
        <tr>
            <th>Computing Resource</th>
            <td>
                <el-alert :closable="false" title="" type="error" v-if="!resources">
                    There is no computing resource to run this currently.
                </el-alert>
                <p v-else>
                    This service can currently run on 
                    <el-tag> {{preferred_resource.name}} (Best)</el-tag>
                     <el-tag v-for="resource in resources" :key="resource.id" v-if="resource.id != preferred_resource._id" style="margin-right:3px;">
                        {{resource.name}}
                    </el-tag> 
                </p> 
            </td>
        </tr>
        <tr>
            <!--TODO-->
            <th>Test Status</th>
            <td><el-tag>Unknown</el-tag></td>
        </tr>
        <tr>
            <th>Configuration Template</th>
            <td>
                <pre v-highlightjs><code class="json hljs">{{app.config}}</code></pre>
            </td>
        </tr>
        <tr>
            <th>Citation</th>
            <td>
                <p>
                    <i>Hayashi, S. (2016). Brain-Life {{selfurl}}</i> 
                    <el-button size="mini" type="primary" @click="bibtex()">BibTex</el-button>
                </p> 
            </td>
        </tr>
        </table>

        <br>
        <el-card v-if="config.debug">
            <div slot="header">Debug</div>
            <h3>App</h3>
            <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
            <h3>Preferred Resource</h3>
            <pre v-highlightjs="JSON.stringify(preferred_resource, null, 4)"><code class="json hljs"></code></pre>
        </el-card>
    </div><!--page-content-->
</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import project from '@/components/project'
import tags from '@/components/tags'
import datatype from '@/components/datatype'
import appavatar from '@/components/appavatar'
import VueMarkdown from 'vue-markdown'

export default {
    components: { 
        sidemenu, pageheader, contact, 
        project, tags, datatype, appavatar,
        VueMarkdown, 
     },

    data () {
        return {
            app: null,
            preferred_resource: null,
            resources: null,
            service_stats: null, 
            readme: null,

            selfurl: document.location.href,

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
            populate: 'inputs.datatype outputs.datatype',
        }})
        .then(res=>{
            this.app = res.body.apps[0];
            if(this.app.github) this.find_resources(this.app.github);
            if(!this.app._rate) Vue.set(this.app, '_rate', 0); //needed..

            //then load task stats
            return this.$http.get(Vue.config.wf_api+'/task/stats', {params: {
                service: this.app.github, 
                service_branch: this.app.github_branch,
            }});
        }).then(res=>{
            this.service_stats = res.body;

            //then load github README
            var branch = this.app.github_branch||"master";
            return fetch("https://raw.githubusercontent.com/"+this.app.github+"/"+branch+"/README.md")
        }).then(res=>{
            return res.text()
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
        
        go: function(path) {
            this.$router.push(path);
        },
        
        find_resources: function(service) {
            this.$http.get(Vue.config.wf_api + '/resource/best', {params: {
                service
            }})
            .then(res => {
                this.preferred_resource = res.body.resource;
                this.resources = res.body.considered
                .sort((a, b) => {
                    if (a.score < b.score) return 1;
                    if (a.score > b.score) return -1;
                    return 0;
                });
            })
            .catch(err => {
                console.error(err);
            });
        },

        remove: function() {
            this.$http.delete('app/'+this.app._id)
            .then(res=>{
                this.go('/apps');        
            });
        },

        ratechange: function() {
            this.$http.post('app/'+this.app._id+'/rate', {
                rate: this.app._rate,
            }).then(res=>{
                //console.dir(res.body);
            });
        },
        bibtex: function() {
            document.location = '/api/warehouse/app/bibtex/'+this.app._id;
        },
    },
}
</script>

<style scoped>
.ui.text.menu {
margin: 0;
}
.header {
background: #666;
padding: 20px;
margin-top: 50px;
height: 40px;
top: 0px;
position: fixed;
right: 0px;
left: 90px;
color: #666;
z-index: 1;
border-bottom: 1px solid #666;
}
.header h1 {
color: #eee;
}
.header-bottom {
height: 50px;
background-color: white;
position: fixed;
top: 140px;
right: 0px;
left: 90px;
border-bottom: 1px solid #ddd;
}
.appdesc {
margin: 20px 30px 30px 138px;
color: gray;
}
</style>
