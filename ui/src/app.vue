<template>
<div v-if="app">
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/apps"></sidemenu>
    <div class="page-content">
        <div class="header">
            <b-container>
                <b-button-group style="float: right;">
                    <b-button @click="remove()" v-if="app._canedit" icon="delete">Remove</b-button>
                    <b-button @click="go('/app/'+app._id+'/edit')" v-if="app._canedit" icon="edit">Edit</b-button>
                    <b-button variant="primary" @click="go('/app/'+app._id+'/submit')">Submit</b-button>
                </b-button-group>
                <div style="float: left; margin-right: 40px; margin-bottom: 15px;">
                    <appavatar :app="app"/>
                </div>
                <div>
                    <h3 style="color: #666; margin-bottom: 10px;">{{app.name}}</h3>
                    <h6><a :href="'http://github.com/'+app.github"><icon name="github"/> {{app.github}}</a></h6>
                    <b-badge v-if="app.github_branch">{{app.github_branch}}</b-badge>
                    <p class="text-muted">{{app.desc}}</p>
                </div>
                <br clear="both">
                <tags :tags="app.tags"></tags>
            </b-container>
        </div>

        <b-container>
            <b-row>
                <b-col>
                    <!--main area-->
                    <b-tabs pills>
                        <b-tab title="Detail" active>
                            <br>
                            <b-row>
                                <b-col cols="3">
                                    <b>Developers</b>
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
                                    <b>Input Datatypes</b>
                                </b-col>
                                <b-col>
                                    <div class="item" v-for="input in app.inputs">
                                        <datatype :id="input.id" :datatype="input.datatype" :datatype_tags="input.datatype_tags"></datatype>
                                    </div>
                                    <br>
                                    <p class="text-muted">This application uses above input datasets</p>
                                </b-col>
                            </b-row>
                            <b-row>
                                <b-col cols="3">
                                    <b>Output Datatypes</b>
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
                                    <p class="text-muted">This application produces above output datasets</p>
                                </b-col>
                            </b-row>
                            <b-row v-if="app.projects && app.projects.length > 0">
                                <b-col cols="3">
                                    <b>Projects</b>
                                </b-col>
                                <b-col>
                                    <b-card>
                                        <project v-for="project in app.projects" :project="project" :key="project._id"></project>
                                    </b-card>
                                    <br>
                                    <p class="text-muted">This application belongs to above project(s).</p>
                                </b-col>
                            </b-row>
                            <!--
                            <b-row v-if="app.retry">
                                <b-col cols="3">
                                    <b>Retry</b>
                                </b-col>
                                <b-col>
                                    <p>If this application fails, it will automatically retry up to <b>{{app.retry}}</b> times</p>
                                </b-col>
                            </b-row>
                            -->
                            <b-row>
                                <b-col cols="3">
                                    <b>Computing Resources</b>
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
                                        This application currently can not run on any resource that you have access to.
                                    </b-alert>
                                    <p class="text-muted" v-else>This application could run on above resource(s)</p>
                                </b-col>
                            </b-row>

                            <b-row>
                                <b-col cols="3">
                                    <b>Configuration</b>
                                </b-col>
                                <b-col>
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
                        </b-tab>
                        <b-tab title="Read Me">
                            <br>
                            <vue-markdown v-if="readme" :source="readme" class="readme"></vue-markdown>
                        </b-tab>
                        <b-tab title="Publications">
                            <br>
                            <p class="text-muted" style="margin: 20px;">No publication registered</p>
                        </b-tab>
                        <b-tab title="Test Status">
                            <br>
                            <p class="text-muted" style="margin: 20px;">No test status available yet</p>
                        </b-tab>
                    </b-tabs>
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

export default {
    components: { 
        sidemenu, pageheader, contact, 
        project, tags, datatype, appavatar,
        VueMarkdown, statustag,
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
            populate: 'inputs.datatype outputs.datatype project',
        }})
        .then(res=>{
            this.app = res.body.apps[0];
            this.find_resources(this.app.github);
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
.header {
background-color: white;
margin-bottom: 30px;
padding: 30px 0px;
padding-bottom: 30px;
border-bottom: 1px solid #ccc;
}

</style>
