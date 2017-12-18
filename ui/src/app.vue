<template>
<div v-if="app">
    <pageheader/>
    <sidemenu active="/apps"></sidemenu>
    <div class="page-content">
        <div class="header">
            <b-container>
                <b-row>
                    <b-col>
                        <div style="float: left; margin-right: 40px; margin-bottom: 15px; height: 100%;">
                            <appavatar :app="app"/>
                        </div>
                        <div>
                            <h3 style="color: #666; margin-bottom: 10px;">{{app.name}}</h3>
                            <h6>
                                <a :href="'http://github.com/'+app.github"><icon name="github"/> {{app.github}}</a>
                                <b-badge variant="primary" v-if="app.github_branch">{{app.github_branch}}</b-badge>
                            </h6>
                            <p style="opacity: 0.8">{{app.desc}}</p>
                        </div>
                        <p>
                            <b-badge v-for="tag in app.tags" :key="tag" class="topic">{{tag}}</b-badge>
                        </p>
                    </b-col>
                    <b-col cols="3">
                        <div style="float: right;">
                            <span class="button button-danger" @click="remove()" v-if="app._canedit" title="Remove"><icon name="trash" scale="1.25"/></span>
                            <span class="button" @click="go('/app/'+app._id+'/edit')" v-if="app._canedit" title="Edit"><icon name="pencil" scale="1.25"/></span>
                            <span class="button" @click="go('/app/'+app._id+'/submit')" title="Process"><icon name="paper-plane" scale="1.25"/></span>
                        </div>
                    </b-col>
                </b-row>

                <br>
                <b-tabs class="brainlife-tab" v-model="tab_index">
                    <b-tab title="Detail"/>
                    <b-tab title="README"/>
                    <b-tab title="Publication"/>
                    <b-tab title="Status"/>
                </b-tabs>
            </b-container>
        </div><!--header-->

        <b-container>
            <b-row>
                <b-col :cols="9">
                    <el-alert v-if="app.removed" title="This app has been removed" type="warning" show-icon :closable="false"></el-alert>
                    <!-- detail -->
                    <div v-if="tab_index == 0">
                        <b-row v-if="config.user">
                            <b-col cols="3">
                                <b class="text-muted">Administrators</b>
                            </b-col>
                            <b-col>
                                <ul style="list-style: none; padding: 0px;">
                                    <li v-for="c in app.admins" key="c._id">
                                        <contact :id="c"></contact>
                                    </li>
                                </ul>
                            </b-col>
                        </b-row>
                        <b-row>
                            <b-col cols="3">
                                <b class="text-muted">Contributors</b>
                            </b-col>
                            <b-col>
                                <ul style="list-style: none; padding: 0px;">
                                    <li v-for="dev in app.contributors" key="c._id">
                                        <contact :fullname="dev.name" :email="dev.email"></contact>
                                    </li>
                                </ul>
                            </b-col>
                        </b-row>
                        <b-row>
                            <b-col cols="3">
                                <b class="text-muted">Input</b>
                            </b-col>
                            <b-col>
                                <div class="item" v-for="input in app.inputs">
                                    <datatype :id="input.id" :datatype="input.datatype" :datatype_tags="input.datatype_tags"></datatype>
                                </div>
                                <br>
                                <p class="text-muted">This app uses above input datasets</p>
                            </b-col>
                        </b-row>
                        <b-row>
                            <b-col cols="3">
                                <b class="text-muted">Output</b>
                            </b-col>
                            <b-col>
                                <div class="item" v-for="output in app.outputs">
                                    <datatype :id="output.id" :datatype="output.datatype" :datatype_tags="output.datatype_tags">
                                        <div v-if="output.files">
                                            <small>Output mapping</small>
                                            <pre v-highlightjs><code class="json hljs">{{output.files}}</code></pre>
                                        </div>
                                    </datatype>
                                </div>
                                <br>
                                <p class="text-muted">This app produces above output datasets</p>
                            </b-col>
                        </b-row>
                        <b-row v-if="app.projects && app.projects.length > 0">
                            <b-col cols="3">
                                <b class="text-muted">Projects</b>
                            </b-col>
                            <b-col>
                                <p class="alert alert-danger"><icon name="lock" /> Only the members of following project(s) can see / submit this app.</p>
                                <b-card no-body>
                                    <b-list-group flush>
                                        <b-list-group-item v-for="project in app.projects" :key="project._id">
                                            <project :project="project" :key="project._id"/>
                                        </b-list-group-item>
                                    </b-list-group>
                                </b-card>
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
                        <b-row v-if="resources">
                            <b-col cols="3">
                                <b class="text-muted">Computing Resources</b>
                            </b-col>
                            <b-col>
                                <b-table style="font-size: 90%;" :items="resource_table" :fields="['resource','status','score', 'detail']">
                                    <template slot="resource" slot-scope="data">
                                        <b>{{data.value}}</b>
                                    </template>
                                    <template slot="status" slot-scope="data">
                                        <statustag :status="data.value"/>
                                    </template>
                                    <template slot="detail" slot-scope="data">
                                        <p class="text-muted">{{data.value}}</p>
                                    </template>
                                </b-table>
                                <b-alert show variant="danger" v-if="!preferred_resource">
                                    This app currently can not run on any resource that you have access to.
                                </b-alert>
                                <p class="text-muted" v-else>This app could run on above resource(s)</p>
                            </b-col>
                        </b-row>

                        <b-row>
                            <b-col cols="3">
                                <b class="text-muted">UI Configuration</b>
                            </b-col>
                            <b-col cols="9">
                                <pre v-highlightjs><code class="json hljs">{{app.config}}</code></pre>
                            </b-col>
                        </b-row>

                        <!--
                        <b-row>
                            <b-col cols="3">
                                <b>Citation</b>
                            </b-col>
                            <b-col>
                                <i>Hayashi, S. (2017). Brain-Life {{selfurl}}</i>
                                
                                <pre>
    @Misc{ bl.app.{{app._id}},
    author =   {Hayashi, S.},
    title =    { {{app.name}} },
    howpublished = {\url{http://github.com/{{app.github}} } },
    year = {2017}
    }
                                </pre> 
                            </b-col>
                        </b-row>
                        -->

                        <!--
                        <tr>
                            <th>Test Status</th>
                            <td><el-tag>Unknown</el-tag></td>
                        </tr>
                        -->
                        <b-row>
                            <b-col cols="3">
                                <b class="text-muted">Comments</b>
                            </b-col>
                            <b-col>
                                <vue-disqus shortname="brain-life" :identifier="app._id"/>
                            </b-col>
                        </b-row>

                    </div>
                    <div v-if="tab_index == 1">
                        <vue-markdown v-if="readme" :source="readme" class="readme"></vue-markdown>
                    </div>
                    <div v-if="tab_index == 2">
                        <p class="text-muted">No publication registered</p>
                    </div>
                    <div v-if="tab_index == 3">
                        <p class="text-muted">No test status available yet</p>
                    </div>
                </b-col>

                <b-col cols="3">
                    <b-card v-if="service_stats">
                        <center>
                            <p class="text-muted">Total Runs</p>
                            <h5>{{service_stats.tasks}}</h5>
                            <br>

                            <p class="text-muted">Users Used By</p>
                            <h5>{{service_stats.users}}</h5>
                            <br>

                            <p class="text-muted">Success Rate</p>
                            <h5>{{((service_stats.counts.finished||0)*100 / (service_stats.counts.requested||1)).toFixed(1)}}%</h5>
                        </center>
                    </b-card>
                    <br>

                    <b-card>
                        <center>
                            <span class="text-muted">Average User Rating</span>
                            <br>
                            <br>
                            <el-rate v-model="app._rate" @change="ratechange()"></el-rate>
                        </center>
                    </b-card>
                    <br>
                </b-col>
            </b-row>
        </b-container>

        <br>
        <b-card v-if="config.debug">
            <div slot="header">Debug</div>
            <h3>App</h3>
            <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
            <h3>Preferred Resource</h3>
            <pre v-highlightjs="JSON.stringify(preferred_resource, null, 4)"><code class="json hljs"></code></pre>
        </b-card>
    </div><!--page-content-->
</div>
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
import statustag from '@/components/statustag'

import VueDisqus from 'vue-disqus/VueDisqus.vue'

export default {
    components: { 
        sidemenu, pageheader, contact, 
        project, tags, datatype, appavatar,
        VueMarkdown, statustag, VueDisqus,
     },

    data () {
        return {
            app: null,
            preferred_resource: null,
            resources: null,
            service_stats: null, 
            readme: null,

            selfurl: document.location.href,

            tab_index: 0,

            config: Vue.config,
        }
    },

    computed: {
        resource_table: function() {
            let items = [];
            if(this.resources) {
                this.resources.forEach(resource=>{
                    var item = {
                        resource: resource.name,
                        status: resource.status,
                        score: resource.score,
                        detail: resource.detail,
                    };

                    //b-table shows _rowVariant as column..
                    if(this.preferred_resource && resource.id == this.preferred_resource._id) {
                        item._rowVariant = 'success';
                    }
                    items.push(item);
                });
            }
            return items;
        },
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
        
        go: function(path) {
            this.$router.push(path);
        },
        
        find_resources: function(service) {
            this.$http.get(Vue.config.wf_api + '/resource/best', {params: {
                service
            }})
            .then(res => {
                if(res.body.resource) this.preferred_resource = res.body.resource;
                this.resources = res.body.considered.sort((a, b) => {
                    if (a.score < b.score) return 1;
                    if (a.score > b.score) return -1;
                    return 0;
                });
                //console.dir(this.resources);
            })
            .catch(err => {
                console.error(err);
            });
        },

        remove: function() {
            if(confirm("Do you really want to remove this app ?")) {
                this.$http.delete('app/'+this.app._id)
                .then(res=>{
                    this.go('/apps');        
                });
            }
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
.header {
background-color: white;
margin-bottom: 30px;
padding: 30px 0px 0px 0px;
border-bottom: 1px solid #ccc;
}
.topic {
padding: 8px; 
background-color: #eee;
text-transform: uppercase;
color: #999;
border-radius: 0px;
margin-right: 5px;
}
</style>
