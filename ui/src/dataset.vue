<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/datasets"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
        <div class="margin20" v-if="dataset">
            <el-button-group style="float: right;">
                <el-button @click="remove()" v-if="dataset._canedit"><icon name="trash"></icon> Remove</el-button>
                <el-button type="primary" @click="download()"><icon name="download"></icon> Download</el-button>
            </el-button-group>

            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/datasets' }">Datasets</el-breadcrumb-item>
                <el-breadcrumb-item> {{dataset._id}}</el-breadcrumb-item>
            </el-breadcrumb>
            <br>

            <h1><icon name="cube" scale="2"></icon> {{dataset.name}}</h1>
            <br clear="both">
            <el-alert v-if="dataset.removed" title="This dataset has been removed" type="warning" show-icon :closable="false"></el-alert>

            <table class="info">
            <tr>
                <th width="180px">Create Date</th>
                <td>{{dataset.create_date|date}}</td>
            </tr>
            <tr>
                <th>Description</th>
                <td>{{dataset.desc}}</td>
            </tr>
            <tr>
                <th>Owner</th>
                <td><contact :id="dataset.user_id"></contact></td>
            </tr>
            <tr>
                <th>Storage</th>
                <td>This dataset is currently stored on <b>{{dataset.storage}}</b></td>
            </tr>
            <tr>
                <th>DOI</th>
                <td>10.1006/br.d.{{dataset._id}} </td>
            </tr>
            <tr>
                <th>User Tags</th>
                <td>
                    <span class="text-muted" v-if="dataset.tags.length == 0">No Tags</span>
                    <tags :tags="dataset.tags"></tags>
                </td>
            </tr>
            <tr>
                <th>Data Type</th>
                <td>
                    <datatype :datatype="dataset.datatype" :datatype_tags="dataset.datatype_tags"></datatype>
                </td>
            </tr>
            <tr>
                <th>Metadata</th>
                <td>
                    <metadata :metadata="dataset.meta"></metadata>
                </td>
            </tr>
            <tr>
                <th>Project</th>
                <td>
                    <p class="text-muted">This dataset belongs to following project.</p>
                    <el-card>
                        <project :project="dataset.project"></project>
                    </el-card>
                </td>
            </tr>
            <tr>
                <th>Provenance / Derivative</th>
                <td>
                    <el-button-group style="float: right;">
                        <el-button size="small" @click="downloadprov()"><icon name="download"></icon> Download Provenance (.sh)</el-button>
                    </el-button-group>
                    <br clear="both">

                    <div v-if="dataset.prov.app">
                        <el-row :gutter="10">
                            <el-col :span="8" v-for="dep in dataset.prov.deps" key="dep.dataset">
                                <div @click="go('/dataset/'+dep.dataset)">
                                    <el-card class="clickable">
                                        <b><icon name="cubes"></icon> {{dep.input_id}}</b><br>
                                        {{dep.dataset}}
                                    </el-card>
                                </div>
                                <center class="text-muted"><icon scale="2" name="arrow-down"></icon></center>
                            </el-col>
                        </el-row>
                        <app :app="dataset.prov.app" :compact="true"/>
                        <center>
                            <icon class="text-muted" scale="2" name="arrow-down"></icon>
                        </center>
                    </div>
                    <div v-else>
                        <center>
                            <el-card><icon name="upload"/> User Upload</el-card>
                            <icon class="text-muted" scale="2" name="arrow-down"></icon>
                        </center>
                    </div>

                    <center>
                        <el-card style="background-color: #2693ff; color: white;">This dataset</el-card>
                    </center>

                    <div v-if="Object.keys(derivatives).length > 0">
                        <el-row :gutter="10">
                            <el-col :span="8" v-for="(datasets, task_id) in derivatives" :key="task_id">
                                <center><icon class="text-muted" scale="2" name="arrow-down"></icon></center>
                                <app :appid="datasets[0].prov.app" :compact="true" style="max-height: 150px;"/>
                                <center><icon class="text-muted" scale="2" name="arrow-down"></icon></center>
                                <el-card class="clickable-record" v-for="dataset in datasets" :key="dataset._id" style="margin-bottom: 10px;">
                                    <div @click="go(dataset._id)">
                                        <icon name="cube"></icon>
                                        <b>{{dataset.name}}</b>
                                        <time class="text-muted">{{dataset.create_date|date}}</time>
                                    </div>
                                </el-card>
                            </el-col>
                        </el-row>
                    </div>
                </td>
            </tr>
            </table>

            <br>
            <div v-if="apps">
                <h2>Applications</h2>
                <p v-if="apps.length > 0">You can use this data as input for following applications.</p>
                <p v-if="apps.length == 0">There are no application that uses this datatype</p>
                <div v-for="app in apps" key="app._id" class="card">
                    <app :app="app" :dataset="dataset"></app>
                </div>
            </div>
            <br clear="all">

            <el-card v-if="config.debug">
                <div slot="header">Debug</div>
                <h3>dataset</h3>
                <pre v-highlightjs="JSON.stringify(dataset, null, 4)"><code class="json hljs"></code></pre>
                <h3>derivatives</h3>
                <pre v-highlightjs="JSON.stringify(derivatives, null, 4)"><code class="json hljs"></code></pre>
            </el-card>
        </div><!--margin20-->
        </div><!--page-content-->
    </div>
</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import contact from '@/components/contact'
import project from '@/components/project'
import tags from '@/components/tags'
import app from '@/components/app'
import datatype from '@/components/datatype'
import metadata from '@/components/metadata'
import pageheader from '@/components/pageheader'
import appavatar from '@/components/appavatar'

const lib = require('./lib');

export default {
    components: { sidemenu, contact, project, app, tags, datatype, metadata, pageheader, appavatar },
    data () {
        return {
            dataset: null,
            apps: null,
            derivatives: {},

            config: Vue.config,
        }
    },

    watch: {
        '$route' (to, from) {
            //console.log(to, from);
            this.load(this.$route.params.id);
        }
    },

    mounted: function() {
        this.load(this.$route.params.id);
    },
    methods: {
        opendataset: function(dataset) {
            console.dir(dataset);
        },
        go: function(path) {
            console.log(path);
            this.$router.push(path);
        },
        download: function() {
            let url = Vue.config.api+'/dataset/download/'+this.dataset._id+'?at='+Vue.config.jwt;
            document.location = url;
        },
        remove: function() {
            this.$http.delete('dataset/'+this.dataset._id)
            .then(res=>{
                this.go('/datasets');        
            });
        },
        load: function(id) {
            console.log("looking for ", id);
            this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: id}),
                populate: "project datatype prov.app",
            }})
            .then(res=>{
                if(res.body.count == 0) {
                    console.error("can't find dataset");
                    return;
                }
                this.dataset = res.body.datasets[0];

                //console.log("looking for derivatives", this.dataset);
                this.$http.get('dataset', {params: {
                    find: JSON.stringify({"prov.deps.dataset": id}),
                }}).then(res=>{
                    //group by task_id
                    this.derivatives = {}; //reset
                    res.body.datasets.forEach(dataset=>{
                        var task_id = dataset.prov.task_id || Math.random(); //create random task id if it's missing (backwared compatibility)
                        if(!this.derivatives[task_id]) this.derivatives[task_id] = [];
                        this.derivatives[task_id].push(dataset);
                    });
                }); 

                console.log("looking for app that uses this data", this.dataset.datatype._id);
                return this.$http.get('app', {params: {
                    "find": JSON.stringify({
                        //look for apps that uses my datatype as input
                        "inputs.datatype": this.dataset.datatype._id,
                    }),
                    "populate": "inputs.datatype", //used by filter_apps
                }})
            })
            .then(res=>{
                //should I do this via computed?
                if(!res) return;
                console.dir(this.dataset);
                this.apps = lib.filter_apps(this.dataset, res.body.apps);
            }).catch(err=>{
                console.error(res);
            });
        }
    },
}
</script>

<style scoped>
.ui.text.menu {
    margin: 0;
}
.dataset:hover {
    cursor: pointer;
    background-color: #ddd;
}
.card {
    width: 325px; 
    float: left;
    margin-right: 10px;
}
</style>
