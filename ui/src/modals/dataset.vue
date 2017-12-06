<template>
<transition name="fade">
<div v-if="dataset" class="dataset-overlay">
    <b-container>
        <div class="dataset-header">
            <icon name="close" style="float: right; opacity: 0.6; cursor: pointer;" scale="2" @click.native="close"/>
            <b-button-group style="float: right; margin-right: 30px;">
                <b-button variant="default" v-b-modal.viewSelecter @click="set_viewsel_options(dataset.datatype.name)">View <icon name="caret-down"/></b-button>
                <b-button variant="default" @click="download" v-if="dataset.storage" icon="document">Download 
                    <small style="opacity: 0.5" v-if="dataset.size">({{dataset.size|filesize}})</small>
                </b-button>
                <b-button variant="default" @click="process" v-if="dataset.storage" icon="document">Process</b-button>
            </b-button-group>
            <b-button style="float: right; margin-right: 15px;" variant="outline-danger" @click="remove()" v-if="dataset._canedit && !dataset.removed"><icon name="trash"/></b-button>
            <h2>
                <div style="display: inline-block; border: 4px solid white; box-shadow: 3px 3px 3px rgba(0,0,0,0.3); background-color: white;">
                    <div v-if="dataset.meta" style="display: inline-block; padding: 0px 10px; color: #999;">{{dataset.meta.subject}}</div><datatypetag :datatype="dataset.datatype" :tags="dataset.datatype_tags"></datatypetag>
                </div>
            </h2>
        </div><!--header-->

        <div class="dataset-content">
            <!-- detail -->
            <el-alert v-if="dataset.removed" title="This dataset has been removed" type="warning" show-icon :closable="false"></el-alert>

            <b-row>
                <b-col cols="3">
                    <b class="text-muted">Description</b>
                </b-col>
                <b-col>
                    <div v-if="dataset._canedit">
                        <b-form-textarea v-model="dataset.desc" @input="dirty.desc = true"/>
                        <el-button v-if="dirty.desc" @click="update_dataset('desc')" type="primary" style="float:right;">Update</el-button>
                    </div>
                    <div v-else>
                        {{dataset.desc}}
                    </div>
                    <br>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3"><b class="text-muted">User Tags</b></b-col>
                <b-col cols="9">
                    <div v-if="dataset._canedit && alltags">
                        <select2 :options="alltags" v-model="dataset.tags" :multiple="true" :tags="true" @input="dirty.tags = true"></select2>
                        <el-button v-if="dirty.tags" @click="update_dataset('tags')" type="primary" style="float:right;">Update</el-button>
                    </div>
                    <div v-else>
                        <span class="text-muted" v-if="dataset.tags.length == 0">No Tags</span>
                        <tags :tags="dataset.tags"></tags>
                    </div>
                    <br>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3"><b class="text-muted">Uploaded By</b></b-col>
                <b-col>
                    <p>
                        <contact :id="dataset.user_id"/> at <b>{{new Date(dataset.create_date).toLocaleString()}}</b>
                    </p>
                </b-col>
            </b-row>

            <b-row v-if="dataset.download_count > 0">
                <b-col cols="3"><b class="text-muted">Download Count</b></b-col>
                <b-col>
                    <p>{{dataset.download_count}}</p>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3"><b class="text-muted">Storage</b></b-col>
                <b-col>
                    <p>
                        <span style="color: #2693ff;" v-if="dataset.status == 'storing'">
                            <icon name="cog" :spin="true"/> Storing ...
                        </span> 
                        <span v-if="dataset.status == 'stored'">
                            This dataset is currently stored in <b>{{dataset.storage}}</b> 
                            <span class="test-muted" v-if="dataset.size">({{dataset.size | filesize}})</span>
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
                    </p>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3"><b class="text-muted">Metadata</b></b-col>
                <b-col>
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
                    <br>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3"><b class="text-muted">Datatype</b></b-col>
                <b-col>
                    <datatype :datatype="dataset.datatype" :datatype_tags="dataset.datatype_tags"></datatype>
                    <br>
                </b-col>
            </b-row>

            <!--
            <tr>
                <th>Project</th>
                <td>
                    <p class="text-muted">This dataset belongs to following project.</p>
                    <el-card>
                        <project :project="dataset.project"></project>
                    </el-card>
                </td>
            </tr>
            -->

            <b-row>
                <b-col cols="3"><b class="text-muted">Provenance</b></b-col>
                <b-col>
                    <div ref="vis" style="height: 700px; background-color: white;"/>
                    <br>
                </b-col>
            </b-row>

            <b-row v-if="apps">
                <b-col cols="3"><b class="text-muted">Applications</b></b-col>
                <b-col>
                    <p v-if="apps.length > 0">You can use this data as input for following applications.</p>
                    <p v-if="apps.length == 0">There are no application that uses this datatype</p>
                    <div v-for="app in apps" :key="app._id" style="width: 33%; float: left;">
                        <div style="margin-right: 10px">
                            <app :app="app" :dataset="dataset" :compact="true" descheight="65px"></app>
                        </div>
                    </div>
                    <br>
                </b-col>
            </b-row>

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

            <!-- I need to populate pub.project .. and I think it's a bit redundant since there is publications tab
            <b-row v-if="dataset.publications && dataset.publications.length">
                <b-col cols="3"><b class="text-muted">Publications</b></b-col>
                <b-col>
                    <p class="text-muted">This dataset is published on following publications</p>
                    <pubcard v-for="pub in dataset.publications" :key="pub._id" :pub="pub" compact="true" />
                    <br>
                </b-col>
            </b-row>
            -->

            <!--
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
            -->
        </div>
    </b-container>
</div>
</transition>
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
import datatypetag from '@/components/datatypetag'
import select2 from '@/components/select2'
import task from '@/components/task'
import pubcard from '@/components/pubcard'

import vis from 'vis/dist/vis-network.min.js'
import 'vis/dist/vis-network.min.css'

const lib = require('@/lib');

export default {
    components: { 
        sidemenu, contact, project, 
        app, tags, datatype, 
        metadata, pageheader, appavatar,
        datatypetag, select2, task, pubcard
    },
    data () {
        return {
            dataset: null,
            task: null, //task that produced this dataset (optional)
            apps: null,
            prov: null, 
            derivatives: {},

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

    mounted() {
        //document.body.appendChild(this.$refs.modal.$el); //move to root
        this.$root.$on("dataset.view", id=>{
            console.log("requested to view", id);
            this.load(id);
        });
    },
    
    watch: {
        '$route': function() {
            this.dataset = null;
        }
    },

    methods: {
        update_dataset: function(elem) {
            this.$http.put(Vue.config.api+'/dataset/'+this.dataset._id, this.dataset).then(res=>{this.$notify("saved")});
            this.dirty[elem] = false;
        },
        
        close: function() {
            this.dataset = null;
            this.$root.$emit("dataset.close");
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
                    //then jump! (TODO - should move to /project soon)
                    this.$router.replace("/processes/"+instance._id);
                });
            });
        },

        remove: function() {
            if(confirm("Do you really want to remove this dataset ?")) {
                this.$http.delete('dataset/'+this.dataset._id)
                .then(res=>{
                    this.$refs.modal.close();
                });
            }
        },

        load_status: function(id) {
            console.log("loading dataset status");
            this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: id}),
                //select: "status storage size desc",
            }})
            .then(res=>{
                var dataset = res.body.datasets[0];
                this.dataset.size = dataset.size;
                this.dataset.status = dataset.status;
                this.dataset.storage = dataset.storage;
                this.dataset.desc = dataset.desc;
                if(this.dataset.status == "storing") {
                    setTimeout(()=>{ this.load_status(id); }, 5000);
                } else {
                    this.$notify({type: "success", text: "Dataset successfully stored on "+dataset.storage});
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
                if(this.dataset.status == "storing") this.load_status(id);

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
                Vue.nextTick(()=>{
                    var gph = new vis.Network(this.$refs.vis, res.body, {
                        /*
                      layout: {
                        hierarchical: {
                            direction:"LR",
                            levelSeparation: 100,
                            sortMethod: "hubsize",
                        }
                      },
                        */
                        physics:{barnesHut:{gravitationalConstant:-3000}}
                        //physics:{barnesHut:{gravitationalConstant:-3000,/* springConstant: 0.01,*/ avoidOverlap: 0.01}}
                    });
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

        set_viewsel_options: function(datatype_name) {
            //dialog itself is opened via ref= on b-button, but I still need to pass some info to the dialog and retain task._id
            //this.vsel.datatype_name = datatype_name;
            this.$root.$emit("viewselecter.option", {
                datatype_name,
                task_cb: this.create_view_task, 
                subdir: "output",
            });
        },

        create_view_task: function(cb) {
            /*
            function openview(task) {
                if(view.docker) {
                    window.open("/warehouse/novnc/"+task.instance_id+"/"+task._id+"/"+view.ui+"/output", "", "width=1200,height=800,resizable=no,menubar=no"); 
                } else {
                    window.open("/warehouse/view/"+task.instance_id+"/"+task._id+"/"+view.ui+"/output", "", "width=1200,height=800,resizable=no,menubar=no"); 
                }
            }
            */

            //first, query for the viewing task to see if it already exist
            var name = "brainlife.view "+this.dataset._id;
            this.$http.get(Vue.config.wf_api+'/task', {params: {
                find: JSON.stringify({ name, status: { $ne: "removed" } })
            }})
            .then(res=>{
                if(res.body.count == 1) {
                    cb(res.body.tasks[0]);
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
                        console.log("created task", task); 
                        cb(task);
                    }).catch(console.error);
                }
            });
        },
    }
}

</script>
<style scoped>
.dataset-overlay {
position: fixed;
top: 0px;
left: 0px;
bottom: 0px;
right: 0px;
background-color: rgba(0,0,0,0.3);
z-index: 10;
padding: 30px;
}
.dataset-header {
background-color: white;
padding: 20px;
box-shadow: 0 0 3px rgba(0,0,0,0.5);
z-index: 20;
position: relative;
}
.dataset-content {
background-color: #f0f0f0;
padding: 20px;
overflow: auto;
height: 90%;
}
.container {
height: 100%;
padding: 0px;
box-shadow: 0 0 20px #000;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .3s
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0
}
</style>
