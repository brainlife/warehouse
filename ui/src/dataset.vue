<template>
<div v-if="dataset">
    <pageheader/>
    <sidemenu active="/datasets"></sidemenu>
    <div class="header" vi-if="dataset">
        <b-button-group style="float: right;">
            <b-button variant="" v-b-modal.viewSelecter @click="openviewsel(dataset.datatype.name)">View <icon name="caret-down"/></b-button>
            <b-button variant="" @click="download" v-if="dataset.storage" icon="document">Download</b-button>
            <b-button variant="" @click="process" v-if="dataset.storage" icon="document">Process</b-button>
        </b-button-group>
        <b-button style="float: right; margin-right: 15px;" variant="danger" @click="remove()" v-if="dataset._canedit && !dataset.removed"><icon name="trash"/></b-button>
        <h2>
            <div style="display: inline-block; border: 4px solid white; box-shadow: 3px 3px 3px rgba(0,0,0,0.3); background-color: white;">
                <div v-if="dataset.meta" style="display: inline-block; padding: 0px 10px; color: #999;">{{dataset.meta.subject}}</div><datatypetag :datatype="dataset.datatype" :tags="dataset.datatype_tags"></datatypetag>
            </div>
        </h2>
    </div>
    <div class="page-content" v-if="dataset" style="margin-top: 80px;">
        <!--
        <div style="padding: 20px 20px 10px 20px; background-color: #666; color: white;">
        </div>
        -->
        <el-alert v-if="dataset.removed" title="This dataset has been removed" type="warning" show-icon :closable="false"></el-alert>
        <table class="info">
        <tr>
            <th width="200px">Description</th>
            <td>
                <div v-if="dataset._canedit">
                    <el-row>
                        <el-col :span="20">
                            <el-input type="textarea" v-model="dataset.desc" @change="dirty.desc = true"></el-input>
                        </el-col>
                        <el-col :span="4">
                            <el-button v-if="dirty.desc" @click="update_dataset('desc')" type="primary" style="float:right;">Update</el-button>
                        </el-col>
                    </el-row>
                </div>
                <div v-else>
                    {{dataset.desc}}
                </div>
            </td>
        </tr>
        <tr>
            <th>Create Date</th>
            <td>{{new Date(dataset.create_date).toLocaleString()}}</td>
        </tr>
        <!--
        <tr>
            <th>Backup Date</th>
            <td>
                <span v-if="dataset.backup_date">{{new Date(dataset.backup_date).toLocaleString()}}</span>
                <span v-else>This dataset has not yet backed up to a permanent storage</span>
            </td>
        </tr>
        -->
        <tr v-if="dataset.size">
            <th>Download Size</th>
            <td>{{dataset.size | filesize}} </td>
        </tr>        
        <tr>
            <th>Download Count</th>
            <td>{{dataset.download_count}}</td>
        </tr>
        <tr>
            <th>Storage</th>
            <td>
                <span style="color: #2693ff;" v-if="dataset.status == 'storing'">
                    <icon name="cog" :spin="true"/> Storing ...
                </span> 
                <span v-if="dataset.status == 'stored'">
                    This dataset is currently stored in <b>{{dataset.storage}}</b>
                </span> 
                <span v-if="dataset.status == 'failed'" style="color: red;">
                    <icon name="exclamation-triangle"/> Failed to store on warehouse
                </span> 
                <span v-if="!dataset.status">
                    Status is unknown
                </span> 

                <span title="Backup of this dataset exists in Scholarly Data Archive (SDA) system." v-if="dataset.backup_date" class="text-success">
                    <icon name="bookmark"/>
                </span>
            </td>
        </tr>
        <tr>
            <th>Metadata</th>
            <td>
                <div v-if="dataset._canedit">
                    <el-row>
                        <el-col :span="6" v-for="(m, id) in dataset.meta" :key="id">
                            <el-input type="text" v-model="dataset.meta[id]" @change="dirty.meta = true">
                                <template slot="prepend"><span style="text-transform: uppercase;">{{id}}</span></template>
                            </el-input>
                        </el-col>
                    </el-row>
                    <el-button v-if="dirty.meta" @click="update_dataset('meta')" type="primary" style="float:right;">Update</el-button>
                </div>
                <metadata v-else :metadata="dataset.meta"></metadata>
            </td>
        </tr>
        <tr>
            <th>User Tags</th>
            <td>
                <div v-if="dataset._canedit && alltags">
                    <select2 :options="alltags" v-model="dataset.tags" :multiple="true" :tags="true" @input="dirty.tags = true"></select2>
                    <el-button v-if="dirty.tags" @click="update_dataset('tags')" type="primary" style="float:right;">Update</el-button>
                </div>
                <div v-else>
                    <span class="text-muted" v-if="dataset.tags.length == 0">No Tags</span>
                    <tags :tags="dataset.tags"></tags>
                </div>
            </td>
        </tr>
        <tr>
            <th>Data Type</th>
            <td>
                <datatype :datatype="dataset.datatype" :datatype_tags="dataset.datatype_tags"></datatype>
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
                    <el-button size="small" @click="download_prov()" icon="document">Download Provenance</el-button>
                </el-button-group>
                <br clear="both">

                <div v-if="dataset.prov && dataset.prov.app">
                    <el-row :gutter="10">
                        <el-col :span="8" v-for="dep in dataset.prov.deps" key="dep.dataset">
                            <div @click="go('/dataset/'+dep.dataset._id)">
                                <el-card class="clickable">
                                    <b><icon name="cubes"></icon> {{dep.input_id}}</b>
                                    <tags :tags="dep.dataset.datatype_tags"/>
                                    <br>
                                    <!--{{dep.dataset}}-->
                                </el-card>
                            </div>
                            <center class="text-muted"><icon scale="2" name="arrow-down"></icon></center>
                        </el-col>
                    </el-row>

                    <task v-if="task" :task="task">
                        <div slot="header">
                            <div v-if="task.config._app" style="padding-bottom: 10px;">
                                <app :appid="task.config._app" :compact="true">
                                    <div v-if="task.desc" class="task-desc">{{task.desc}}</div>
                                </app>
                            </div>
                            <div v-else>
                                <h3>{{task.name}}</h3>
                            </div>
                        </div>
                    </task>

                    <app v-if="!task && dataset.prov.app" :app="dataset.prov.app" :compact="true"></app>
                    <center style="padding: 10px">
                        <icon class="text-muted" scale="2" name="arrow-down"></icon>
                    </center>

                </div>
                <div v-else>
                    <center style="padding: 10px">
                        <el-card><icon name="upload"/> User Upload</el-card>
                        <icon class="text-muted" scale="2" name="arrow-down"></icon>
                    </center>
                </div>

                <center>
                    <el-card style="background-color: #2693ff; color: white;">This dataset</el-card>
                </center>

                <br>
                <div ref="vis" style="background-color: gray; height: 400px;"/>
            </td>
        </tr>
        <tr v-if="apps">
            <th>Applications</th>
            <td>
                <p v-if="apps.length > 0">You can use this data as input for following applications.</p>
                <p v-if="apps.length == 0">There are no application that uses this datatype</p>
                <div v-for="app in apps" :key="app._id" style="width: 33%; float: left;">
                    <div style="margin-right: 10px">
                        <app :app="app" :dataset="dataset" :compact="true" descheight="65px"></app>
                    </div>
                </div>
            </td>
        </tr>
        <tr>
            <th>Uploaded by</th>
            <td>
                <p>
                    <contact :id="dataset.user_id"/>
                </p> 
            </td>
        </tr>
        <!--
        <tr>
            <th>Citation</th>
            <td>
                <p>
                    <i>Hayashi, S. (2016). Brain-Life {{selfurl}}</i>
                    <el-button size="mini" type="primary" @click="bibtex()">BibTex</el-button>
                </p> 
            </td>
        </tr>
        -->
        <tr v-if="dataset.publications && dataset.publications.length">
            <th>Publications</th>
            <td>
                <p class="text-muted">This dataset is published through following publications</p>
                <pubcard v-for="pub in dataset.publications" :key="pub._id" :pub="pub" compact="true" />
            </td>
        </tr>
        </table>

        <br>
        <div v-if="config.debug">
            <h2>Debug</h2>
            <b-btn block v-b-toggle.dataset>Datasets</b-btn>
            <b-collapse id="dataset" accorion="my-accordion">
                <b-card>
                    <pre v-highlightjs="JSON.stringify(dataset, null, 4)"><code class="json hljs"></code></pre>
                </b-card>
            </b-collapse>

            <b-btn block v-b-toggle.prov>prov</b-btn>
            <b-collapse id="prov" accorion="my-accordion">
                <b-card>
                    <pre v-highlightjs="JSON.stringify(prov, null, 4)"><code class="json hljs"></code></pre>
                </b-card>
            </b-collapse>
        </div>
    </div><!--page-content-->
    <viewselecter @select="view" :datatype_name="vsel.datatype_name"></viewselecter>
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
import viewselecter from '@/components/viewselecter'
import datatypetag from '@/components/datatypetag'
import select2 from '@/components/select2'
import task from '@/components/task'
import pubcard from '@/components/pubcard'

//import vis from 'vis/dist/vis.min.js'
import vis from 'vis/dist/vis-network.min.js'
//import 'vis/dist/vis.min.css'
import 'vis/dist/vis-network.min.css'

const lib = require('./lib');

export default {
    components: { 
        sidemenu, contact, project, 
        app, tags, datatype, 
        metadata, pageheader, appavatar,
        viewselecter, datatypetag, select2, task, pubcard
     },
    data () {
        return {
            dataset: null,
            task: null, //task that produced this dataset (optional)
            apps: null,
            prov: null, 
            derivatives: {},

            vsel: {
                datatype_name: null,
            },

            selfurl: document.location.href,
            
            dirty: {
                desc: false,
                meta: false,
                tags: false
            },

            alltags: null,

            config: Vue.config,
        }
    },

    watch: {
        '$route' (to, from) {
            this.load(this.$route.params.id);
        },
    },

    mounted: function() {
        this.load(this.$route.params.id);
    },
    methods: {
        update_dataset: function(elem) {
            this.$http.put(Vue.config.api+'/dataset/'+this.dataset._id, this.dataset).then(res=>{this.$notify("saved")});
            this.dirty[elem] = false;
        },
        
        opendataset: function(dataset) {
            console.dir(dataset);
        },
        go: function(path) {
            this.$router.push(path);
        },
        download_prov: function() {
            alert("TODO..");
        },

        download: function() {
            var url = Vue.config.api+'/dataset/download/'+this.dataset._id+'?at='+Vue.config.jwt;
            document.location = url;
            console.log(url);
        },

        process: function() {
            console.log("creating new instance");
            this.$http.post(Vue.config.wf_api+'/instance', {
                config: {
                    brainlife: true,
                    type: "v2",
                },
            }).then(res=>{
                var instance = res.body;
                console.log("submitting staging task");
                this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: "Staged Datasets - "+this.dataset.datatype.name,
                    service: "soichih/sca-product-raw",
                    config: { 
                        _tid: 0 ,
                        download: [
                            {
                                url: Vue.config.api+"/dataset/download/"+this.dataset._id+"?at="+Vue.config.jwt,
                                untar: "auto",
                                dir: this.dataset._id,
                            }
                        ], 
                        _outputs: [
                            Object.assign({}, this.dataset, {
                                id: this.dataset._id, 
                                did: 0,
                                subdir: this.dataset._id, 
                                dataset_id: this.dataset._id,
                                prov: null,

                                //unpopulate
                                project: this.dataset.project._id,
                                datatype: this.dataset.datatype._id,
                            })
                        ], 
                    },
                }).then(res=>{
                    //then jump!
                    this.$router.replace("/processes/"+instance._id);
                });
            });
        },

        remove: function() {
            if(confirm("Do you really want to remove this dataset ?")) {
                this.$http.delete('dataset/'+this.dataset._id)
                .then(res=>{
                    this.go('/datasets');        
                });
            }
        },

        load_status: function(id) {
            console.log("loading dataset status");
            this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: id}),
                select: "status storage",
            }})
            .then(res=>{
                var dataset = res.body.datasets[0];
                this.dataset.status = dataset.status;
                this.dataset.storage = dataset.storage;
                if(this.dataset.status == "storing") {
                    setTimeout(()=>{ this.load_status(id); }, 5000);
                }
            });
        },

        load: function(id) {
            this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: id}),
                populate: "project datatype prov.app prov.deps.dataset publications",
            }})
            .then(res=>{
                if(res.body.count == 0) {
                    console.error("can't find dataset");
                    return;
                }
                this.dataset = res.body.datasets[0];
                this.load_status(id);

                //optionally, load task info
                if(this.dataset.prov && this.dataset.prov.task_id) {
                    this.$http.get(Vue.config.wf_api+'/task', {params: {
                        find: JSON.stringify({"_id": this.dataset.prov.task_id}),
                    }}).then(res=>{
                        this.task = res.body.tasks[0];
                    });
                }

                //load tags from other datasets in this project
                return this.$http.get('dataset/distinct', {params: {
                    find: JSON.stringify({"project": this.dataset.project}),
                    distinct: 'tags',
                }});
            }).then(res=>{
                this.alltags = res.body;
                    
                //console.log("looking for derivatives", this.dataset);
                return this.$http.get('dataset', {params: {
                    find: JSON.stringify({"prov.deps.dataset": id}),
                }});
            }).then(res=>{
                //group by task_id
                this.derivatives = {}; //reset
                res.body.datasets.forEach(dataset=>{
                    var task_id = dataset.prov.task_id || Math.random(); //create random task id if it's missing (backwared compatibility)
                    if(!this.derivatives[task_id]) this.derivatives[task_id] = [];
                    this.derivatives[task_id].push(dataset);
                });

                console.log("looking for app that uses this data", this.dataset.datatype._id);
                return this.$http.get('app', {params: {
                    "find": JSON.stringify({
                        //look for apps that uses my datatype as input
                        "inputs.datatype": this.dataset.datatype._id,
                        removed: false,
                    }),
                    "populate": "inputs.datatype", //used by filter_apps
                }})
            })
            .then(res=>{
                //should I do this via computed?
                if(!res) return;
                this.apps = lib.filter_apps(this.dataset, res.body.apps);

                //load provenance
                return this.$http.get('dataset/prov/'+this.dataset._id);
            }).then(res=>{
                this.prov = res.body;

                //initialize vis
                //console.dir(this.$refs.vis);
                //console.dir(res.body);
                var gph = new vis.Network(this.$refs.vis, res.body, {
                  //manipulation: false,
                  //width: '90%',
                  //height: '90%',
                    /*
                  layout: {
                    hierarchical: {
                        direction:"LR",
                        levelSeparation: 100,
                        sortMethod: "hubsize",
                    }
                  },
                    */
                });

             }).catch(err=>{
                console.error(err);
            });
        },
        bibtex: function() {
            document.location = '/api/warehouse/dataset/bibtex/'+this.dataset._id;
        },
        get_instance: function() {
            //first create an instance to download things to
            return this.$http.post(Vue.config.wf_api+'/instance', {
                name: "brainlife.download",
                config: {
                    selected: this.selected,
                }
            }).then(res=>res.body);
        },

        openviewsel: function(datatype_name) {
            //dialog itself is opened via ref= on b-button, but I still need to pass some info to the dialog and retain task._id
            this.vsel.datatype_name = datatype_name;
        },
        view: function(view) {
            function openview(task) {
                if(view.docker) {
                    window.open("/warehouse/novnc/"+task.instance_id+"/"+task._id+"/"+view.ui+"/output", "", "width=1200,height=800,resizable=no,menubar=no"); 
                } else {
                    window.open("/warehouse/view/"+task.instance_id+"/"+task._id+"/"+view.ui+"/output", "", "width=1200,height=800,resizable=no,menubar=no"); 
                }
            }

            //first, query for the viewing task to see if it already exist
            var name = "brainlife.view "+this.dataset._id;
            this.$http.get(Vue.config.wf_api+'/task', {params: {
                find: JSON.stringify({ name, status: { $ne: "removed" } })
            }})
            .then(res=>{
                if(res.body.count == 1) {
                    openview(res.body.tasks[0]);
                } else {
                    var download_instance = null;
                    this.get_instance().then(instance=>{
                        download_instance = instance;

                        var download = [];
                        download.push({
                            url: Vue.config.api+"/dataset/download/"+this.dataset._id+"?at="+Vue.config.jwt,
                            untar: "auto",
                            //dir: "download/"+this.dataset._id, 
                            dir: "output",
                        });

                        //remove in 48 hours (abcd-novnc should terminate in 24 hours)
                        var remove_date = new Date();
                        remove_date.setDate(remove_date.getDate()+2);

                        return this.$http.post(Vue.config.wf_api+'/task', {
                            instance_id: download_instance._id,
                            name,
                            service: "soichih/sca-product-raw",
                            //preferred_resource_id: resource,
                            config: { download },
                            remove_date: remove_date,
                        }).then(res=>res.body.task);
                        return this.stage_selected(download_instance);
                    }).then(task=>{
                        openview(task);
                    });
                }
            });
        },
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
.header {
background: #666;
padding: 20px;
padding-bottom: 20px;
margin-top: 50px;
height: 80px;
position: fixed;
top: 0px;
right: 0px;
left: 90px;
color: #666;
z-index: 1;
border-bottom: 1px solid #666;
}
.el-alert {
border-radius: inherit;
}
.task-desc {
margin-top: 10px; 
padding: 5px 10px; 
margin-left: 90px;
font-size: 90%; 
background-color: #e0e0e0;
}
</style>
