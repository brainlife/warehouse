<template>
<transition name="fade">
<div v-if="dataset" class="brainlife-modal-overlay">
    <b-container class="brainlife-modal">
        <div class="brainlife-modal-header" v-if="!dataset.removed">
            <div class="brainlife-modal-header-buttons" style="margin-left: 10px;">
                <b-dropdown text="Download" v-if="dataset.storage" variant="outline-secondary" size="sm">
                    <b-dropdown-item @click="download">This Data-Object <small v-if="dataset.size">({{dataset.size|filesize}})</small></b-dropdown-item>
                    <b-dropdown-divider v-if="dataset.prov"/>
                    <b-dropdown-header v-if="dataset.prov">Provenance</b-dropdown-header>
                    <b-dropdown-item v-if="dataset.prov" @click="download_prov">provenance.json</b-dropdown-item>
                    <b-dropdown-item v-if="dataset.prov" @click="download_provscript">reproduce.sh (experimental)</b-dropdown-item>
                    <b-dropdown-item v-if="dataset.prov && dataset.prov.task && dataset.prov.task.commit_id" @click="download_app(dataset.prov.task)">
                        The version of the App used
                    </b-dropdown-item>
                    <b-dropdown-item v-if="dataset.prov" @click="download_boutique">Boutique descriptor (experimental)</b-dropdown-item>
                </b-dropdown>
                <div class="button" @click="remove" v-if="dataset._canedit" title="Remove Data-object">
                    <icon name="trash" scale="1.1"/>
                </div>
                <div class="button" @click="copy" v-if="dataset.storage" title="Copy">
                    <icon name="copy" scale="1.1"/> 
                </div>
                <div class="button" @click="start_viewer(dataset.datatype)" v-if="dataset.storage" title="View Data-object">
                    <icon name="eye" scale="1.1"/>
                </div>
                <div class="button" @click="process" v-if="dataset.storage" title="Process">
                    <icon name="play" scale="1.1"/> 
                </div>
                <div class="button" @click="close" style="margin-left: 20px; opacity: 0.8;">
                    <icon name="times" scale="1.5"/>
                </div>
            </div>
            <h5 style="margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <span v-if="dataset.meta" style="color: #999;">{{dataset.meta.subject}}</span>&nbsp;
                <datatypetag v-if="dataset.datatype" :datatype="dataset.datatype" :tags="dataset.datatype_tags" style="font-size: 95%;"/>
            </h5>
        </div><!--header-->

            <b-tabs class="brainlife-tab" v-model="tab_index">
                <b-tab title="Details">
                    <div class="dataset-detail">
                        <b-alert :show="dataset.removed" variant="secondary">This data-object has been removed</b-alert>
                        <b-alert :show="!dataset.removed && dataset.status == 'storing'" variant="secondary"><icon name="cog" spin/> Archiving Data-Object.. Please wait for a minute before you can interact with this data-object.</b-alert>
                        <!-- detail -->
                        <div class="margin20">
                            <b-row v-if="dataset._canedit">
                                <b-col cols="2"></b-col>
                                <b-col>
                                    <b-input-group prepend="Subject" size="sm" title="Only process subjects that matches this regex">
                                        <b-form-input v-model="dataset.meta.subject" type="text" @input="update_meta()"></b-form-input>
                                        <b-input-group-prepend is-text>Session</b-input-group-prepend>
                                        <b-form-input v-model="dataset.meta.session" type="text" @input="update_meta()"></b-form-input>
                                        <b-input-group-append v-if="dataset._meta_dirty">
                                            <b-btn variant="primary" @click="save_meta()"><icon name="check"/></b-btn>
                                        </b-input-group-append>
                                    </b-input-group>
                                    <br>
                                </b-col>
                            </b-row>
                            <b-row v-if="dataset.desc || dataset._canedit">
                                <b-col cols="2">
                                    <span class="form-header">Description</span>
                                </b-col>
                                <b-col>
                                    <div v-if="dataset._canedit">
                                        <b-form-textarea v-model="dataset.desc" @input="dataset._desc_dirty = true" :rows="2"/>
                                        <div v-if="dataset._desc_dirty" style="text-align:right;margin-top:10px;">
                                            <b-button variant="primary" @click="save_desc()">Save Description</b-button>
                                        </div>
                                    </div>
                                    <div v-else>
                                        {{dataset.desc}}
                                    </div>
                                    <br>
                                </b-col>
                            </b-row>
                            <b-row>
                                <b-col cols="2"><span class="form-header">Tags</span></b-col>
                                <b-col cols="10">
                                    <div v-if="dataset._canedit && alltags">
                                        <tageditor :value="dataset.tags" v-model="dataset.tags" @input="dataset._tags_dirty = true" :options="alltags"/>
                                        <div v-if="dataset._tags_dirty" style="text-align:right;margin-top:10px;">
                                            <b-button variant="primary" @click="save_tags()">Save Tags</b-button>
                                        </div>
                                    </div>
                                    <div v-else>
                                        <span class="text-muted" v-if="dataset.tags.length == 0">No Tags</span>
                                        <tags :tags="dataset.tags"></tags>
                                    </div>
                                    <br>
                                </b-col>
                            </b-row>

                            <b-row v-if="product && product.brainlife && product.brainlife.length > 0">
                                <b-col cols="2">
                                    <span class="form-header">Product</span><br>
                                    <p><small class="text-muted"><b>product.json</b> can be generated by the App (or the datatype validator) which is used to set tags / metadata 
                                        of output data-objects. product.json also contains messages or plotly graphs shown here.
                                    </small></p>
                                </b-col>
                                <b-col>
                                    <product :product="product"/>
                                    <br>
                                </b-col>
                            </b-row>

                            <b-row v-if="secondary && product">
                                <b-col cols="2">
                                    <span class="form-header">Secondary</span>
                                    <p><small class="text-muted">Secondary output from the validator service ({{dataset.prov.task.service}})</small></p>
                                </b-col>
                                <b-col cols="10">
                                    <secondary 
                                        :task="dtv" 
                                        :datatype_id="dataset.datatype._id"
                                        :output_id="dataset.prov.output_id" 
                                        :datatype_tags="dataset.datatype_tags" 
                                        :product="product" 
                                        :secondary="secondary"/>
                                    <br>
                                </b-col>
                            </b-row>

                            <b-row>
                                <b-col cols="2"><span class="form-header">Datatype</span></b-col>
                                <b-col>
                                    <datatype :datatype="dataset.datatype" :datatype_tags="dataset.datatype_tags">
                                        <icon slot="tag_extra" name="edit" v-if="dataset._canedit && !dataset._editDtag" @click="editDtag" style="opacity: 0.7; cursor: pointer;" title="Edit datatype tags"/>
                                    </datatype>
                                    <br>
                                </b-col>
                            </b-row>

                            <b-row v-if="dataset._editDtag">
                                <b-col cols="2"><span class="form-header">Datatype Tags</span></b-col>
                                <b-col>
                                    <b-row>
                                        <b-col cols="10">
                                            <tageditor v-model="dataset.datatype_tags" :options="dataset.datatype._datatype_tags"/>
                                        </b-col>
                                        <b-col cols="2">
                                            <b-button variant="primary" @click="saveDtag">Save</b-button>
                                        </b-col>
                                    </b-row>
                                    <p>
                                        <small>Please be careful when editing datatype tags!</small> 
                                    </p>
                                </b-col>
                            </b-row>

                            <b-row v-if="dataset.prov && dataset.prov.task && dataset.prov.task.config && dataset.prov.task.config._app">
                                <b-col cols="2"><span class="form-header">Produced by</span></b-col>
                                <b-col cols="10">
                                    <app slot="header"
                                        :appid="dataset.prov.task && dataset.prov.task.config._app" 
                                        :branch="(followTask && followTask.service_branch)||dataset.prov.task.service_branch||'master'">
                                        <taskconfig style="margin: 10px; margin-bottom: 40px;" :task="followTask||dataset.prov.task"/>
                                    </app>
                                    <br>

                                    <p v-if="!isimporttask(dataset.prov.task)">
                                        <a :href="'https://github.com/'+dataset.prov.task.service+'/tree/'+dataset.prov.task.commit_id" title="App Commit ID">
                                            <b-badge pill class="bigpill">
                                                <icon name="brands/github" style="opacity: 0.4;"/>&nbsp;&nbsp;Commit ID&nbsp;&nbsp;&nbsp;{{dataset.prov.task.commit_id}}
                                            </b-badge>
                                        </a>
                                    </p>
                                    <p v-else-if="followTask">
                                        <a :href="'https://github.com/'+followTask.service+'/tree/'+followTask.commit_id" title="App Commit ID">
                                            <b-badge pill class="bigpill">
                                                <icon name="brands/github" style="opacity: 0.4;"/>&nbsp;&nbsp;Commit ID&nbsp;&nbsp;&nbsp;{{followTask.commit_id}}
                                            </b-badge>
                                        </a>
                                    </p>
                                </b-col>
                            </b-row>

                            <b-row v-if="resource">
                                <b-col cols="2"><span class="form-header">Resource Used</span></b-col>
                                <b-col cols="10">
                                    <p>
                                        <a :href="'/resource/'+resource._id" title="Resource Used">
                                            <b-badge pill class="bigpill">
                                                <icon name="server" style="opacity: 0.5; margin-right: 7px;"/>&nbsp;{{resource.name}}
                                            </b-badge>
                                        </a>
                                    </p>
                                </b-col>
                            </b-row>

                            <b-row>
                                <b-col cols="2"><span class="form-header">Archived in</span></b-col>
                                <b-col>
                                    <p>
                                        <span v-if="dataset.status == 'stored'">
                                            <b>{{dataset.storage}}</b>
                                            <span v-if="dataset.storage_config && dataset.storage_config.path" style="opacity: 0.8; font-weight: normal; font-size: 90%">{{dataset.storage_config.path}}</span>
                                            <span v-if="dataset.storage == 'copy'">
                                                from <b>{{dataset.storage_config.project.name}}</b> project
                                                stored in ({{dataset.storage_config.storage}})
                                            </span>
                                            <span class="text-muted" v-if="dataset.size">({{dataset.size | filesize}})</span>
                                            <div v-if="dataset.storage == 'url'">
                                                <b-row v-for="file in dataset.storage_config.files" :key="file.id">
                                                    <b-col cols="2">{{file.local}}</b-col>
                                                    <b-col><a :href="file.url">{{file.url}}</a></b-col>
                                                </b-row>
                                            </div>
                                        </span> 
                                        <span v-if="(dataset.status == 'failed' || dataset.status == 'storing')">
                                            <task :task="dataset.archive_task" v-if="dataset.archive_task"/>
                                            <span v-else class="text-muted"><icon name="cog" spin/> {{dataset.status_msg}}</span>
                                        </span> 
                                        <span v-if="!dataset.status">
                                            Status is unknown
                                        </span> 
                                        <span title="Backup of this data-object exists in Scholarly Data Archive (SDA) system." v-if="dataset.backup_date" class="text-success">
                                            <b-badge variant="success"><icon name="archive" scale="0.7"/> SDA Backup</b-badge>
                                        </span>

                                        <p v-if="dataset.archive_task_id"><small>{{dataset.archive_task_id}}</small></p>
                                    </p>
                                </b-col>
                            </b-row>
                            <b-row>
                                <b-col cols="2"><span class="form-header">Archived by</span></b-col>
                                <b-col>
                                    <p>
                                        <contact :id="dataset.user_id"/> 
                                        <span class="text-muted"> <icon name="calendar"/> {{new Date(dataset.create_date).toLocaleString()}}</span>
                                    </p>
                                </b-col>
                            </b-row>
                            <b-row v-if="dataset.download_count">
                                <b-col cols="2"><span class="form-header">Download Count</span></b-col>
                                <b-col>
                                    <p><b>{{dataset.download_count}}</b> times</p>
                                </b-col>
                            </b-row>

                            <b-row v-if="dataset._pubs && dataset._pubs.length > 0">
                                <b-col cols="2"><span class="form-header">Publications</span></b-col>
                                <b-col cols="10">
                                    <p><small class="text-muted">This data-object has been published on the following publications.</small></p>
                                    <div v-for="(release, idx) in dataset.publications" :key="idx">
                                        <div v-for="(pub, idx) in dataset._pubs.filter(p=>!p.removed)" :key="idx">
                                            <p v-for="r in pub.releases.filter(r=>r._id == release && !r.removed)" :key="r._id">
                                                <a href="javascript:void(0);" @click="openpub(pub)">
                                                    <icon name="book" scale="0.8"/> {{pub.name||pub}} - Release {{r.name}}
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                </b-col>
                            </b-row>                        
                        </div>
                    </div><!--dataset-detail-->
                </b-tab>
                <!--
                <b-tab title="Provenance(old)">
                    <div v-if="prov" class="dataset-provenance">
                        <div v-if="prov.edges.length == 0">
                            <b-alert show variant="secondary">This data-object was uploaded by the user, and therefore has no provenance information.</b-alert>
                        </div>
                        <div v-else style="height: 100%">
                            <div style="position: absolute; right: 10px; top: 10px; z-index: 1;">
                                <span style="opacity: 0.6; margin-right: 10px;">Double click to open items</span>
                            </div>
                            <div ref="vis" style="height: 100%;"/>
                        </div>
                    </div>
                </b-tab>
                -->
                <b-tab title="Provenance">
                    <h5 style="padding: 20px; opacity: 0.5;" v-if="!prov2">Loading ...</h5>
                    <div class="dataset-provenance" v-if="prov2">
                        <div v-if="!prov2.nodes">
                            <b-alert show variant="secondary">This data-object has no provenance information.</b-alert>
                        </div>
                        <div v-if="prov2.nodes" style="height: 100%">
                            <div style="position: absolute; left: 10px; bottom: 10px; z-index: 1;">
                                <b-button variant="outline-primary" :pressed.sync="showFull" size="sm">Show Full Provenance</b-button>
                            </div>
                            <provgraph :prov="prov2" :showFull="showFull" :dataset="dataset" style="height: 100%;"/>
                        </div>
                    </div>
                    
                </b-tab>
                <b-tab title="Metadata/Sidecar">
                    <div class="dataset-meta">
                        <editor v-model="dataset._meta" @init="editorInit" @input="update_meta_json()" lang="json" height="100%"/>
                        <div v-if="dataset._canedit" style="position: absolute; bottom: 10px; right: 30px;">
                            <b-button v-if="dataset._meta_dirty" variant="primary" @click="save_meta()" style="float: right;">Save Metadata</b-button>
                            <br clear="both">
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

import contact from '@/components/contact'
import tags from '@/components/tags'
import app from '@/components/app'
import datatype from '@/components/datatype'
import pageheader from '@/components/pageheader'
import appavatar from '@/components/appavatar'
import datatypetag from '@/components/datatypetag'
import pubcard from '@/components/pubcard'
import tageditor from '@/components/tageditor'
import taskconfig from '@/components/taskconfig'
import product from '@/components/product'
import secondary from '@/components/secondary'
import provgraph from '@/components/provgraph'

import agreementMixin from '@/mixins/agreement'
import secondaryWaiter from '@/mixins/secondarywaiter'
import resourceCache from '@/mixins/resource_cache'

const getVis = ()=>import('vis/dist/vis-network.min')
let vis = null;
getVis().then(_vis=>{
    vis = _vis;
});
import 'vis/dist/vis-network.min.css'

const lib = require('@/lib');

let debounce;

export default {
    mixins: [
        agreementMixin, 
        secondaryWaiter, 
        resourceCache,
    ],

    components: { 
        contact, 
        app, 
        tags, 
        datatype, 
        pageheader, 
        appavatar,
        datatypetag, 
        pubcard, 
        tageditor, 
        taskconfig, 
        product, 
        secondary, 
        provgraph, 
        task: ()=>import('@/components/task'),

        projectcard: ()=>import('@/components/projectcard'),
        editor: ()=>import('vue2-ace-editor'),
    },

    data () {
        return {
            dataset: null,
            apps: null,
            //prov: null, 
            prov2: null, 
            product: null,

            dtv: null,
            secondary: null,
            followTask: null,
            
            resource: null,

            tab_index: 0,

            selfurl: document.location.href,

            alltags: null,

            tm_load_archive_task: null,
            tm_load_status: null,

            showFull: false,
            
            config: Vue.config,
        } 
    },

    mounted() {
        this.$root.$on("dataset.view", opt=>{
            this.load(opt.id);
        });

        //preopened?
        if(this.$root.openDataObject) {
            this.load(this.$root.openDataObject.id);
            this.$root.openDataObject = null;
        }

        //TODO - call removeEventListener in destroy()? Or I should do this everytime modal is shown/hidden?
        document.addEventListener("keydown", e => {
            if (e.keyCode == 27) {
                this.close();
            }
        });
    },

    destroyed() {
        //to prevent wierd things from happening during debugging?
        this.$root.$off("dataset.view");
    },
    
    watch: {
        tab_index: function() {
            if(this.tab_index == 1) this.load_prov2();
        },
        '$route': function() {
            if (this.dataset) {
                if (this.$route.params.tab != 'dataset') {
                    this.close();
                }
            }
        },
    },

    methods: {
   
        //same code in api/controllers/dataset.js
        isimporttask(task) {
            if(~task.service.indexOf("brainlife/validator-")) return true;
            if(~task.service.indexOf("brain-life/validator-")) return true;

            //if no input, then must be import
            if(!task.deps && !task.deps_config) return true;
            if((task.deps && task.deps.length == 0) &&
                (task.deps_config && task.deps_config.length == 0)) return true;

            return false;
        },

        update_dataset(elem) {
            clearTimeout(debounce);
            debounce = setTimeout(()=>{
                this.$http.put(Vue.config.api+'/dataset/'+this.dataset._id, this.dataset).then(res=>{
                    this.$notify({type: "success", text: "Saved "+elem});
                });
            }, 500);
        },

        /*
        load_prov() {
            //load provenance
            this.$http.get('dataset/prov/'+this.dataset._id).then(res=>{
                this.prov = res.data;

                //apply styles
                this.prov.nodes.forEach(node=>{
                    node.shape = "box"; //all box..
                    if(node.id.indexOf("task.") === 0) {
                        node.color = "#fff"; 
                        node.font = {size: 11};
                        //node.mass = 1+0.2*node.label.trim().split("\n").length;
                        node.labelHighlightBold = false;
                    }
                    if(node.id.indexOf("dataset.") === 0) {
                        node.color = "#159957";
                        node.font = {size: 12, color: "#fff"};
                    }
                    if(node.id == "dataset."+this.dataset._id) {
                        node.label = "This Data-Object";
                        node.color = "#2693ff";
                        node.y = 2000;
                        node.margin = 10;
                        node.font = {color: "#fff"};
                    }

                    //construct tooltip
                    let tooltip = "";
                    if(node._config) {
                        node.label += "\n";
                        let recs = [];
                        for(let key in node._config) {
                            let value = node._config[key];
                            if(typeof value == "string" && value.startsWith("../")) continue;
                            let rec = "";
                            rec += "<tr><td><pre>"+key+"</pre></td>";
                            if(node._config_default && node._config_default[key] !== undefined && node._config_default[key] == value) {
                                rec+= "<td>"+value+"</td>"
                            } else {
                                rec+= "<td><b>"+value+"</b> (default: "+node._config_default[key]+")</td>"
                                node.label += key+":"+value+"\n";
                            }
                            rec += "</tr>";
                            recs.push(rec);
                        }
                        if(recs.length > 0) {
                            tooltip += "<table class='table table-sm'>";
                            tooltip += recs.join("\n");
                            tooltip += "</table>";
                        }
                    }
                    node.title = tooltip+"\n<small>"+node.id+"</small>";
                });
                
                this.prov.edges.forEach(edge=>{
                    if(!edge.label) return;
                    let lines = edge.label.split("\n");
                    if(lines[0].startsWith("neuro/")) lines[0] = lines[0].substring(6);
                    if(edge._archived_dataset_id) {
                        lines[1] = "📦 "+(lines[1]?lines[1]:'');
                    }
                    edge.label = lines.join("\n");
                    edge.font = {
                        size: 10,
                        color: '#000a',
                    }
                })

                console.log("prov1");
                console.dir(res.data);
                
                if(this.prov.edges.length) {
                        getVis().then(vis=>{
                            var gph = new vis.Network(this.$refs.vis, res.data, 
                                {
                                    layout: {
                                        randomSeed: 0,
                                    },
                                    physics:{
                                        //enabled: true, //default true
                                        barnesHut:{
                                            //springConstant: 0.20,
                                            //springLength: 150,
                                            //avoidOverlap: 0.2,
                                            //damping: 0.3,
                                            gravitationalConstant: -3000,
                                        }
                                    },
                                    nodes: {
                                        shadow: {
                                            enabled: true,
                                            //make it less pronounced than default
                                            size: 3,
                                            x: 1,
                                            y: 1 ,
                                            color: 'rgba(0,0,0,0.2)',
                                        },
                                        borderWidth: 0,
                                    },
                                }
                            );
                            gph.on("doubleClick", e=>{
                                e.nodes.forEach(node=>{
                                    if(node.startsWith("dataset.")) {
                                        let dataset_id = node.substring(8);
                                        //for archive/datasets page
                                        if(this.$route.path.includes(this.dataset._id)) {
                                            //this should trigger reload
                                            this.$router.replace(this.$route.path.replace(this.dataset._id, dataset_id));
                                        } else {
                                            this.$root.$emit('dataset.view', {id: dataset_id});
                                        }
                                    }
                                    if(node.startsWith("task.")) {
                                        let fullnode = this.prov.nodes.find(n=>n.id == node);
                                        if(fullnode._app) this.$router.replace("/app/"+fullnode._app);
                                    }
                                });
                                if(this.prov) {
                                    e.edges.forEach(edge_id=>{
                                        let edge = this.prov.edges.find(e=>e.id == edge_id);
                                        if(edge._archived_dataset_id) {
                                            this.$router.replace(this.$route.path.replace(this.dataset._id, edge._archived_dataset_id)); 
                                        }
                                    });
                                }
                            });

                            gph.on("showPopup", e=>{
                                //console.log("popup!", e);
                            });
                            gph.on("hoverNode", e=>{
                                //console.log("hovernode!", e);
                            });
                    });
                }
            });
        },
        */

        load_prov2() {
            //load provenance
            this.prov2 = null;
            if(!this.dataset.prov) {
                this.prov2 = {};
                return;
            }
            this.$http.get('dataset/prov2/'+this.dataset._id).then(res=>{
                this.prov2 = res.data;
            }).catch(err=>{
                console.error(err);
                this.prov2 = {};
            });
        },

        load_apps() {
            console.log("looking for app that uses this data", this.dataset.datatype._id);
            this.$http.get('app', {params: {
                "find": JSON.stringify({
                    //look for apps that uses my datatype as input
                    "inputs.datatype": this.dataset.datatype._id,
                    removed: false,
                }),
                populate: 'inputs.datatype outputs.datatype contributors', //used by filter_apps and apps
                limit: 500, //TODO - this is not sustailable
            }}).then(res=>{
                if(!res) return; //TODO notify error?
                this.apps = lib.filter_apps(this.dataset, res.data.apps);
            });
        },

        load_product() {
            this.$http.get('dataset/product/'+this.dataset._id).then(res=>{
                this.product = res.data.product;
            }).catch(err=>{
                console.error(err);
            });
        },

        load_secondary() {
            //if follow_task_id is set, that means this data object came from _dtv
            //_dtv may produces secondary archive, so wait for that
            //see the secondary output archive diagram to understand this
            if(this.dataset.prov.task.follow_task_id) {
                console.log("waiting for secondary archive");
                this.dtv = this.dataset.prov.task;
                this.waitSecondaryArchive(this.dataset.prov.task, (err, secondary)=>{
                    if(err) console.error(err);
                    else {
                        console.log("secondary archive is ready");
                        this.secondary = secondary;
                    }
                });
            } else {
                //prov.task is not dtv.. maybe user archived the output directly?
                //I need to search for dtv (if exists) as waitSecondaryArchive requires task to be dtv
                console.log("data probably archived manually, or without validator .. looking for dtv..");
                this.$http.get(Vue.config.amaretti_api+'/task', {params: {
                    find: JSON.stringify({
                        follow_task_id: this.dataset.prov.task._id,
                    }),
                    populate: 'finish_date status',
                    limit: 1,
                }})
                .then(res=>{
                    if(res.data.tasks.length == 1) {
                        this.dtv = res.data.tasks[0];
                        this.waitSecondaryArchive(this.dtv, (err, secondary)=>{
                            if(err) console.error(err);
                            else {
                                this.secondary = secondary;
                            }
                        });
                    }
                });
            }
        },

        close() {
            if(!this.dataset) return;
            this.$router.replace(this.$route.path.replace(this.dataset._id, ""));
            this.dataset = null;

            clearTimeout(debounce);
            clearTimeout(this.tm_load_status);
            clearTimeout(this.tm_load_archive_task);
        },

        openpub(pub) {
            this.$router.replace('/pub/'+pub._id);
            this.dataset = null;
        },

        openapp(app_id) {
            if(!this.dataset) return;
            this.$router.replace('/app/'+app_id);
            this.dataset = null;
        },

        download() {
            if(!Vue.config.user) return alert("Please Signup/Login first to download this data-object");
            this.check_agreements(this.dataset.project, ()=>{
                let query = {_id: [this.dataset._id]};
                this.$root.$emit("downscript.open", {query});
            });
        },

        download_app(task) {
            let branch = task.branch||"master";
            document.location = "https://github.com/"+task.service+"/archive/"+task.commit_id+".zip";
        },
        download_prov() {
            document.location = Vue.config.api+'/dataset/prov/'+this.dataset._id;
        },
        download_boutique() {
            document.location = Vue.config.api+'/dataset/boutique/'+this.dataset._id;
        },
        download_provscript() {
            document.location = Vue.config.api+'/dataset/provscript/'+this.dataset._id;
        },

        process() {
            if(!Vue.config.user) return alert("Please Signup/Login first to run analysis with this data-object");
            this.check_agreements(this.dataset.project, ()=>{
                this.$root.$emit('instanceselecter.open', opt=>{
                    if(opt.instance) {
                        //using existing instance.. just submit staging task
                        this.submit_process(opt.project_id, opt.instance);
                    } else {
                        //need to create a new instance
                        this.$http.post(Vue.config.amaretti_api+'/instance', {
                            desc: opt.desc,
                            config: {
                                brainlife: true,
                            },
                            //can't use this.dataset.project.group_id because user could be selecting another project
                            group_id: opt.group_id, 
                        }).then(res=>{
                            this.submit_process(opt.project_id, res.data);
                        }).catch(err=>{
                            console.error(err);
                            this.$notify({type: 'error', text: err});
                        })
                    }
                });
            });
        },

        copy() {
            if(!Vue.config.user) return alert("Please Signup/Login first to copy this data-object");
            this.check_agreements(this.dataset.project, ()=>{
                this.$root.$emit('copytarget.open', opt=>{
                    this.$http.post('dataset/copy', {
                        dataset_ids: [ this.dataset._id ],
                        project: opt.project_id,
                    }).then(res=>{
                        this.$notify({type: 'success', text: 'Data-Object copied'});
                    });
                });
            });
        },

        submit_process(project_id, instance) {
            if(!Vue.config.user) return alert("Please Signup/Login first to analyze this data-object");
            this.check_agreements(this.dataset.project, ()=>{
                this.$http.post('dataset/stage', {
                    instance_id: instance._id,
                    dataset_ids: [ this.dataset._id ],
                }).then(res=>{
                    this.$router.replace("/project/"+project_id+"/process/"+instance._id);
                    this.dataset = null;
                });
            });
        },

        remove() {
            if(confirm("Do you really want to remove this data-object?")) {
                this.check_agreements(this.dataset.project, ()=>{
                    this.$http.delete('dataset/'+this.dataset._id)
                    .then(res=>{
                        this.$notify({type: "success", text: "Removed dataset"});
                        this.close();
                    });
                });
            }
        },

        load_archive_task() {
            if(!this.dataset || !this.dataset.archive_task_id) return; //no task_id
            this.$http.get(Vue.config.amaretti_api+'/task/'+this.dataset.archive_task_id).then(res=>{

                if(this.dataset.archive_task) Object.assign(this.dataset.archive_task, res.data);
                else Vue.set(this.dataset, 'archive_task', res.data)

                if(!["finished", "failed", "removed"].includes(res.data.status)) {
                    console.log("polling archive task update", res.data.status)
                    this.tm_load_archive_task = setTimeout(this.load_archive_task, 5000); 
                }
            });
        },

        load_status(id) {
            if(!this.dataset) return; //route changed before timeout was fired?
            this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: id}),
            }})
            .then(res=>{
                var dataset = res.data.datasets[0];
                if(!dataset) {
                    console.error("couldn't load dataset:", id);
                    return;
                }

                //TODO - why not just set all fields?
                this.dataset.size = dataset.size;
                this.dataset.status = dataset.status;
                this.dataset.storage = dataset.storage;
                if(!this.dataset._meta_dirty) this.dataset.meta = dataset.meta;
                if(!this.dataset._tags_dirty) this.dataset.tags = dataset.tags;
                if(!this.dataset._desc_dirty) this.dataset.desc = dataset.desc;
                this.dataset.stats = dataset.stats;
                this.dataset.archive_task_id = dataset.archive_task_id;
                if(this.dataset.status == "storing") {
                    this.tm_load_status = setTimeout(()=>{ this.load_status(id); }, 5000);
                } else {
                    this.$notify({type: "success", text: "Data-Object successfully stored on "+dataset.storage});
                }
            });
        },

        async load(id) {
            //reset previously loaded stuff
            this.dataset = null;
            this.prov = null;
            this.apps = null;
            this.product = null;
            this.resource = null;
            this.tab_index = 0;
            this.alltags = null;
            this.dtv = null;
            this.secondary = null;
            this.followTask = null;

            if(!id) return;

            const datasetRes = await this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: id}),
                populate: JSON.stringify([
                    {
                        path: "datatype", // prov.deps.dataset",
                        populate: {
                            path: "uis",
                            model: "UIs",
                        }
                    },
                    {
                        path: "project"
                    },
                    {
                        path: "storage_config.project",
                        model: "Projects",
                        select: "name",
                    }
                ]),
            }});

            if(datasetRes.data.count == 0) {
                throw new Error("can't find dataset id:"+id);
            }
            this.dataset = datasetRes.data.datasets[0];
            console.log(JSON.parse(JSON.stringify(this.dataset)));
            if(this.dataset.status == "storing") {
                this.tm_load_status = setTimeout(()=>{ this.load_status(id); }, 5000);
            }
            this.load_archive_task();
            this.load_product();

            Vue.set(this.dataset, '_meta',  JSON.stringify(this.dataset.meta, null, 4));
            Vue.set(this.dataset, '_meta_dirty',  false);
            Vue.set(this.dataset, '_tags_dirty',  false);
            Vue.set(this.dataset, '_desc_dirty',  false);

            //old dataset that doesn't have prov.task.. need to deref
            if(this.dataset.prov) {
                if(!this.dataset.prov.task && this.dataset.prov.task_id) {
                    this.$http.get(Vue.config.amaretti_api+'/task/'+this.dataset.prov.task_id).then(res=>{
                        this.dataset.prov.task = res.data;
                        this.load_resource();
                    });
                } else if(this.dataset.prov.task) {
                    this.load_resource();
                    this.load_secondary();
                }
            }

            /////////////////////////////////////////////////////////////////////////////

            // load follow_task if set
            if(this.dataset.prov) { 
                //TODO - for old task, prov.task is loaded asynchronously above.. so I should wait to do this?
                if(this.dataset.prov.task && this.dataset.prov.task.follow_task_id) {
                    console.log("loading follow_task");
                    const taskRes = await this.$http.get(Vue.config.amaretti_api+'/task', {params: {
                        find: JSON.stringify({ 
                            _id: this.dataset.prov.task.follow_task_id,
                        }),
                    }});
                    this.followTask = taskRes.data.tasks[0];
                }
            }

            /////////////////////////////////////////////////////////////////////////////

            //load tags from other datasets in this project
            const tagsRes = await this.$http.get('dataset/distinct', {params: {
                    find: JSON.stringify({"project": this.dataset.project._id}),
                    distinct: 'tags',
            }});
            if(!this.dataset) return; //modal closed while we are loading (TODO can I cancel?)
            this.alltags = tagsRes.data;

            /////////////////////////////////////////////////////////////////////////////

            //load all publications that this dataobjects is published in
            let find = {};
            if(this.dataset.publications) {
                find["releases._id"] = {$in: this.dataset.publications};
            }
            const pubRes = await this.$http.get('pub', {params: {
                find: JSON.stringify(find),
            }});
            if(!this.dataset) return; //modal closed while we are loading (TODO can I cancel?)
            this.$set(this.dataset, '_pubs', pubRes.data.pubs);
        },

        load_resource() {
            if(!Vue.config.user) return;
            if(!this.dataset.prov || !this.dataset.prov.task) return;
            this.resource_cache(this.dataset.prov.task.resource_id, (err, resource)=>{
                if(err) {
                    console.error(err);
                    this.$notify({type: 'error', text: err});
                } else {
                    this.resource = resource;
                }
            });
        },

        start_viewer(datatype) {
            if(!Vue.config.user) return alert("Please Signup/Login first to visualize this data-object");
            this.check_agreements(this.dataset.project, ()=>{
                this.$root.$emit("loading",{message: "Preparing staging job"});
                this.find_staged_task((task, subdir, files)=>{
                    if(task) {
                        //check to make sure we can actually download data from this task 
                        this.$http.get(Vue.config.amaretti_api+'/task/ls/'+task._id).then(res=>{
                            this.$root.$emit("loading", {show: false});
                            this.$root.$emit("viewselecter.open", { datatype, task, subdir, files });
                        }).catch(err=>{
                            //couldn't access the task.. let's stage new task
                            this.create_stage_task((err, task, subdir)=>{
                                if(err) return this.$notify({type: "error", text: err.toString()});
                                this.$root.$emit("loading", {show: false});
                                this.$root.$emit("viewselecter.open", { datatype, task, subdir });
                            });
                        });
                    } else {
                        //no staged task... need to stage one
                        this.create_stage_task((err, task, subdir)=>{
                            if(err) return this.$notify({type: "error", text: err.toString()});
                            this.$root.$emit("loading", {show: false});
                            this.$root.$emit("viewselecter.open", { datatype, task, subdir });
                        });
                    }
                });
            });
        },

        find_staged_task(cb) {
            //first, query for the staging task to see if it already staged
            this.$http.get(Vue.config.amaretti_api+'/task', {params: {
                find: JSON.stringify({ 
                    status: { $ne: "removed" },
                    service: "brainlife/app-stage", 
                    
                    //why not look for config.datasets.id? because for copied dataset, config.dataset.id != config._outputs.id
                    "config._outputs.id": this.dataset._id, 
                }),
                sort: '-create_date', //pick the latest one
                limit: 1,
            }}).then(res=>{
                let task = res.data.tasks[0];
                if(task && task.config._outputs) {
                    console.log("found previously staged task !"+this.dataset._id);
                    let output = task.config._outputs.find(output=>output.dataset_id == this.dataset._id);
                    return cb(task, output.subdir);
                }

                //ok.. let's see if a task that produced the dataset still exists
                if(!this.dataset.prov) return cb(null);
                if(!this.dataset.prov.task) return cb(null); //(only happens in dev?)
                if(!this.dataset.prov.task._id) return cb(null); //(only happens in dev?)
                return this.$http.get(Vue.config.amaretti_api+'/task', {params: {
                    find: JSON.stringify({ 
                        _id: this.dataset.prov.task._id,
                        status: "finished",
                    }),
                }}).then(res=>{
                    let task = res.data.tasks[0];
                    if(task && task.config._outputs) {
                        //console.log("task that produced this data-object still exists... using it");
                        //look for dataset/files in case app was using deprecated filemapping
                        let output = task.config._outputs.find(output=>output.id == this.dataset.prov.output_id);
                        return cb(task, this.dataset.prov.subdir, output.files);
                    }
                    cb(null); //didn't find it
                });
            });
        },

        create_stage_task(cb) {
            console.log("creating stage task");

            //it hasn't been staged.. create a new instance to download dataset to
            let instance = {
                name: "brainlife.download",
                config: {
                    selected: this.selected,
                },
            };

            //set group_id so that we can share it with other group members
            //TODO but.. user might not have write access to the project (probably a guest?)
            if(~Vue.config.user.gids.indexOf(this.dataset.project.group_id)) {
                instance.group_id = this.dataset.project.group_id;
            }
            this.$http.post(Vue.config.amaretti_api+'/instance', instance).then(res=>{
                let instance_id = res.data._id;
                return this.$http.post('dataset/stage', {
                    instance_id: instance_id,
                    dataset_ids: [ this.dataset._id ],
                });
            }).then(res=>{
                cb(null, res.data.task, this.dataset._id);
            }).catch(cb);
        },

        save_desc() {
            this.update_dataset('desc');
            this.dataset._desc_dirty = false;
        },
        save_tags() {
            this.update_dataset('tags');
            this.dataset._tags_dirty = false;
        },
        editDtag() {
            Vue.set(this.dataset, '_editDtag', true);
        },
        saveDtag() {
            this.update_dataset('datatype_tags');
            Vue.set(this.dataset, '_editDtag', false);
        },
         update_meta() {
            this.dataset._meta_dirty = true;
            if(this.dataset.meta.session == "") delete this.dataset.meta.session;
            this.dataset._meta = JSON.stringify(this.dataset.meta, null, 4);
        },
        update_meta_json() {
            this.dataset._meta_dirty = true;
            try {
                this.dataset.meta = JSON.parse(this.dataset._meta);
            } catch(err) {
                //user should fix
            }
        },
        save_meta() {
            try {
                this.dataset.meta = JSON.parse(this.dataset._meta);
                this.update_dataset('meta');
                this.dataset._meta_dirty = false;
            } catch(err) {
                this.$notify({ text: 'Failed to parse JSON', type: 'error' }); 
            }
        },

        editorInit(editor) {
            lib.editorInit(editor, err=>{
                if(!this.dataset._canedit) editor.setReadOnly(true);
            });
        },
    }
}

</script>

<style scoped>
.dataset-detail,
.dataset-apps,
.dataset-provenance,
.dataset-meta {
    position: absolute;
    top: 105px;
    left: 0;
    right: 0;
    bottom: 0;
}
.dataset-provenance {
background-color: #f9f9f9;
}
.dataset-detail {
overflow: auto;
background-color: #f9f9f9;
}
.dataset-apps {
overflow: auto;
padding: 20px;
background-color: #f9f9f9;
}
.dataset-meta {
overflow: auto;
background-color: #f9f9f9;
}
pre.code {
background-color: white;
padding: 10px;
}
.metadata.form-header {
padding: 10px;
margin-bottom: 0;
}
</style>

<style>
.dataset-provenance div.vis-tooltip {
font-family: inherit;
font-size: 80%;
background-color: white;
border: none;
box-shadow: 2px 2px 4px rgba(0,0,0,.1);
opacity: 0.8;
}
.dataset-provenance .table-sm th, 
.dataset-provenance .table-sm td {
padding: 0px 2px;
border-top: 1px solid #0001;
}
</style>
