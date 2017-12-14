<template>
<transition name="fade">
<div v-if="dataset" class="dataset-overlay">
    <b-container class="dataset-modal">
        <div class="dataset-header">
            <div style="float: right;">
                <div class="button" @click="remove" v-if="dataset._canedit && !dataset.removed" title="Remove Dataset">
                    <icon name="trash" scale="1.25"/>
                </div>
                <div class="button" v-b-modal.viewSelecter @click="set_viewsel_options(dataset.datatype.name)" v-if="dataset.storage" title="View Dataset">
                    <icon name="eye" scale="1.25"/>
                </div>
                <div class="button" @click="download" v-if="dataset.storage" title="Downlnoad Dataset">
                    <icon name="download" scale="1.25"/>
                </div>
                <div class="button" @click="process" v-if="dataset.storage" title="Process">
                    <icon name="paper-plane" scale="1.25"/> 
                </div>

                <div class="button" @click="close" style="margin-left: 20px; opacity: 0.8;">
                    <icon name="close" scale="1.5"/>
                </div>
            </div>
            <h4>
                <div style="display: inline-block; border: 4px solid white; box-shadow: 3px 3px 3px rgba(0,0,0,0.3); background-color: white;">
                    <div v-if="dataset.meta" style="display: inline-block; padding: 0px 10px; color: #999;">{{dataset.meta.subject}}</div><datatypetag :datatype="dataset.datatype" :tags="dataset.datatype_tags"></datatypetag>
                </div>
            </h4>
        </div><!--header-->
        <b-tabs class="brainlife-tab" v-model="tab_index">
            <b-tab title="Details">
                <div class="dataset-detail">
                    <el-alert v-if="dataset.removed" style="border-radius: 0px" title="This dataset has been removed" type="warning" show-icon :closable="false"></el-alert>
                    <!-- detail -->
                    <div class="margin20">
                        <b-row>
                            <b-col cols="3">
                                <b class="text-muted">Description</b>
                            </b-col>
                            <b-col>
                                <div v-if="dataset._canedit">
                                    <b-form-textarea v-model="dataset.desc" @input="update_dataset('desc')" :rows="2"/>
                                    <!--<b-button v-if="dirty.desc" @click="update_dataset('desc')" variant="primary" style="float:right;">Update</b-button>-->
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
                                    <!--
                                    <select2 :options="alltags" v-model="dataset.tags" :multiple="true" :tags="true" @input="dirty.tags = true"></select2>
                                    <b-button v-if="dirty.tags" @click="update_dataset('tags')" variant="primary" style="float:right;">Update</b-button>
                                    -->
                                    <tageditor v-model="dataset.tags" @input="update_dataset('tags')"/>
                                </div>
                                <div v-else>
                                    <span class="text-muted" v-if="dataset.tags.length == 0">No Tags</span>
                                    <tags :tags="dataset.tags"></tags>
                                </div>
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

                        <b-row>
                            <b-col cols="3"><b class="text-muted">Storage</b></b-col>
                            <b-col>
                                <p>
                                    <span style="color: #2693ff;" v-if="dataset.status == 'storing'">
                                        <icon name="cog" :spin="true"/> Storing ...
                                    </span> 
                                    <span v-if="dataset.status == 'stored'">
                                        <b>{{dataset.storage|uppercase}}</b> 
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
                            <b-col cols="3"><b class="text-muted">Archived by</b></b-col>
                            <b-col>
                                <p>
                                    <contact :id="dataset.user_id"/> <span class="text-muted">at</span> {{new Date(dataset.create_date).toLocaleString()}}
                                </p>
                            </b-col>
                        </b-row>

                        <b-row>
                            <b-col cols="3"><b class="text-muted">Metadata</b></b-col>
                            <b-col>
                                <div v-if="dataset._canedit">
                                    <el-row>
                                        <el-col :span="6" v-for="(m, id) in dataset.meta" :key="id">
                                            <el-input type="text" v-model="dataset.meta[id]" @change="update_dataset('meta')">
                                                <template slot="prepend"><span style="text-transform: uppercase;">{{id}}</span></template>
                                            </el-input>
                                        </el-col>
                                    </el-row>
                                    <!--
                                    <el-button v-if="dirty.meta" @click="update_dataset('meta')" type="primary" style="float:right;">Update</el-button>
                                    -->
                                </div>
                                <metadata v-else :metadata="dataset.meta"></metadata>
                                <br>
                            </b-col>
                        </b-row>

                        <b-row v-if="dataset.download_count > 0">
                            <b-col cols="3"><b class="text-muted">Download Count</b></b-col>
                            <b-col>
                                <p>{{dataset.download_count}}</p>
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
                </div><!--dataset-detail-->
            </b-tab>
            <b-tab title="Provenance">
                <div v-if="prov" class="dataset-provenance">
                    <div v-if="prov.nodes.length == 1" class="margin20">
                        <b-alert show variance="info">This dataset was uploaded by the user, and therefore has no provenance information.</b-alert>
                    </div>
                    <div ref="vis" v-else style="height: 100%;"/>
                    <br>
                </div>
            </b-tab>
            <b-tab title="Apps">
                <div class="dataset-apps" v-if="apps">
                    <p v-if="apps.length > 0">The following apps can be submitted with this dataset.</p>
                    <b-alert show variant="info" v-if="apps.length == 0">There are currently no application that uses this datatype.</b-alert>
                    <div v-for="app in apps" :key="app._id" style="width: 33%; float: left;">
                        <div style="margin-right: 10px; margin-bottom: 10px;">
                            <app :app="app" descheight="80px"></app>
                        </div>
                    </div>
                </div>
            </b-tab>
        </b-tabs>
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
//import select2 from '@/components/select2'
import task from '@/components/task'
import pubcard from '@/components/pubcard'
import tageditor from '@/components/tageditor'

import vis from 'vis/dist/vis-network.min.js'
import 'vis/dist/vis-network.min.css'

const lib = require('@/lib');

let debounce;

export default {
    components: { 
        sidemenu, contact, project, 
        app, tags, datatype, 
        metadata, pageheader, appavatar,
        datatypetag, task, pubcard, tageditor,
    },
    data () {
        return {
            dataset: null,

            task: null, //task that produced this dataset (optional)
            apps: null,
            prov: null, 
            derivatives: {},

            tab_index: 0,

            selfurl: document.location.href,
            
            /*
            dirty: {
                desc: false,
                meta: false,
                tags: false
            },
            */

            alltags: null,
            config: Vue.config,
        } 
    },

    mounted() {
        this.$root.$on("dataset.view", id=>{
            console.log("requested to view", id);
            this.load(id);
        });

        document.addEventListener("keydown", e => {
            if (e.keyCode == 27) {
                this.close();
            }
        });

    },
    
    watch: {
        '$route': function() {
            this.dataset = null;
        },

        /*
        'dataset.tags': function() {
            console.log("dataset tags changed"); 
        },
        */

        tab_index: function() {
            console.log("tab_index changed", this.prov);
            if(this.tab_index == 1 && this.prov == null) {
                this.load_prov();
            }

            if(this.tab_index == 2 && this.apps == null) {
                this.load_apps();
            }
        }

    },

    methods: {
        update_dataset: function(elem) {
            if(debounce) clearTimeout(debounce);
            debounce = setTimeout(()=>{
                this.$http.put(Vue.config.api+'/dataset/'+this.dataset._id, this.dataset).then(res=>{
                    this.$notify({type: "success", text: "Saved "+elem});
                });
            }, 500);
        },

        load_prov: function() {
            //load provenance
            this.$http.get('dataset/prov/'+this.dataset._id).then(res=>{
                this.prov = res.body;
                console.log("loaded provenance", this.prov);

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
                        //physics:{barnesHut:{/*gravitationalConstant:-3500, springConstant: 0.01, avoidOverlap: 0.02*/}},
                        physics:{barnesHut:{springConstant: 0.03}},
                        nodes: {
                            shadow: true,
                            borderWidth: 0,
                        },
                    });
                });
            });
        },

        load_apps: function() {
            console.log("looking for app that uses this data", this.dataset.datatype._id);
            this.$http.get('app', {params: {
                "find": JSON.stringify({
                    //look for apps that uses my datatype as input
                    "inputs.datatype": this.dataset.datatype._id,
                    removed: false,
                }),
                populate: 'inputs.datatype outputs.datatype contributors', //used by filter_apps and apps
            }}).then(res=>{
                if(!res) return; //TODO notify error?
                this.apps = lib.filter_apps(this.dataset, res.body.apps);
            });
        },
    
        close: function() {
            if(!this.dataset) return;
            this.$root.$emit("dataset.close");
        },

        download: function() {
            var url = Vue.config.api+'/dataset/download/'+this.dataset._id+'?at='+Vue.config.jwt;
            document.location = url;
        },

        process: function() {
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
                    this.$router.push("/processes/"+instance._id);
                });
            });
        },

        remove: function() {
            if(confirm("Do you really want to remove this dataset?")) {
                this.$http.delete('dataset/'+this.dataset._id)
                .then(res=>{
                    this.dataset = null;
                    this.$root.$emit("dataset.remove", this.dataset);
                });
            }
        },

        load_status: function(id) {
            console.log("loading dataset status");
            if(!this.dataset) return; //route changed before timeout was fired?
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
            this.dataset = null;
            this.prov = null;
            this.apps = null;
            this.tab_index = 0;

            console.log("modal/dataset.vue loading");
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
                    find: JSON.stringify({"project": this.dataset.project._id}),
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

             }).catch(err=>{
                console.error(err);
            });
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
padding: 10px 20px;
box-shadow: 0 0 3px rgba(0,0,0,0.5);
z-index: 20;
height: 60px;
position: relative;
}
.dataset-modal {
background-color: #fff;
height: 100%;
padding: 0px;
box-shadow: 0 0 20px #000;
position: relative;
}

.dataset-detail,
.dataset-apps,
.dataset-provenance {
background-color: #f9f9f9;
position: absolute;
top: 110px;
left: 0;
right: 0;
bottom: 0px;
}

.dataset-detail {
overflow: auto;
}
.dataset-apps {
overflow: auto;
padding: 20px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .3s
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0
}
</style>
