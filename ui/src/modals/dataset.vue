<template>
<transition name="fade">
<div v-if="dataset" class="brainlife-modal-overlay">
    <b-container class="brainlife-modal">
        <div class="brainlife-modal-header">
            <div class="brainlife-modal-header-buttons">
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
                <div class="button" @click="remove" v-if="dataset._canedit && !dataset.removed" title="Remove Data-object">
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
            <h5 style="margin-top: 8px;">
                <span v-if="dataset.meta" style="color: #999;">{{dataset.meta.subject}}</span>&nbsp;
                <datatypetag v-if="dataset.datatype" :datatype="dataset.datatype" :tags="dataset.datatype_tags"></datatypetag>
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
                            <b-col cols="3"></b-col>
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
                            <b-col cols="3">
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
                            <b-col cols="3"><span class="form-header">Data-Object Tags</span></b-col>
                            <b-col cols="9">
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
                        <b-row>
                            <b-col cols="3"><span class="form-header">Datatype</span></b-col>
                            <b-col>
                                <datatype :datatype="dataset.datatype" :datatype_tags="dataset.datatype_tags"></datatype>
                                <br>
                            </b-col>
                        </b-row>
                        <b-row v-if="dataset.prov && dataset.prov.task && dataset.prov.task.config && dataset.prov.task.config._app">
                            <b-col cols="3"><span class="form-header">Produced by</span></b-col>
                            <b-col cols="9">
                                <app slot="header"
                                    :appid="dataset.prov.task.config._app" 
                                    :branch="dataset.prov.task.service_branch||'master'">
                                    <taskconfig style="margin: 10px; margin-bottom: 40px;" :task="dataset.prov.task"/>
                                </app>
                                <br>
                            </b-col>
                        </b-row>
                        <b-row v-if="resource">
                            <b-col cols="3"><span class="form-header">Produced In</span></b-col>
                            <b-col>
                                <p :title="resource._id">
                                    <icon name="server" style="opacity: 0.5; margin-right: 7px;"/>
                                    {{resource.name}}
                                    <small v-if="resource.desc">{{resource.desc}}</small>
                                </p>
                            </b-col>
                        </b-row>              
                        <b-row v-if="dataset.product">
                            <b-col cols="3"><span class="form-header">Task Result <small>(product.json)</small></span></b-col>
                            <b-col cols="9">
                                <product :product="dataset.product"/>
                                <br>
                            </b-col>
                        </b-row>

                        <b-row>
                            <b-col cols="3"><span class="form-header">Archived in</span></b-col>
                            <b-col>
                                <p>
                                    <span v-if="dataset.status == 'stored'">
                                        <b>
                                            {{dataset.storage}} 
                                            <span v-if="dataset.storage == 'copy'">- {{dataset.storage_config.storage}}</span>
                                            <span v-if="dataset.storage_config && dataset.storage_config.path" style="opacity: 0.8; font-weight: normal; font-size: 90%">{{dataset.storage_config.path}}</span>
                                        </b>
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
                                    </span> 
                                    <span v-if="!dataset.status">
                                        Status is unknown
                                    </span> 
                                    <span title="Backup of this data-object exists in Scholarly Data Archive (SDA) system." v-if="dataset.backup_date" class="text-success">
                                        <b-badge variant="success"><icon name="archive" scale="0.7"/> SDA</b-badge>
                                    </span>
                                </p>
                            </b-col>
                        </b-row>
                        <b-row>
                            <b-col cols="3"><span class="form-header">Archived by</span></b-col>
                            <b-col>
                                <p>
                                    <contact :id="dataset.user_id"/> 
                                    <span class="text-muted"> <icon name="calendar"/> {{new Date(dataset.create_date).toLocaleString()}}</span>
                                </p>
                            </b-col>
                        </b-row>
                        <b-row>
                            <b-col cols="3"><span class="form-header">Download Count</span></b-col>
                            <b-col>
                                <p><b>{{dataset.download_count}}</b> times</p>
                            </b-col>
                        </b-row>

                        <b-row v-if="dataset._pubs && dataset._pubs.length > 0">
                            <b-col cols="3"><span class="form-header">Publications</span></b-col>
                            <b-col cols="9">
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
                        <b-row>
                            <b-col cols="3">
                                <span class="form-header">Metadata / sidecar <small v-if="dataset._canedit">(editable)</small></span>
                            </b-col>
                            <b-col style="position: relative;">
                                <editor v-model="dataset._meta" @init="editorInit" @input="update_meta_json()" lang="json" height="200"></editor>
                                <div v-if="dataset._canedit">
                                    <br>
                                    <b-button v-if="dataset._meta_dirty" variant="primary" @click="save_meta()" style="float: right;">Save Metadata</b-button>
                                </div>
                                <br>
                            </b-col>
                        </b-row>
                        
                    </div>
                </div><!--dataset-detail-->
            </b-tab>
            <b-tab title="Provenance">
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
            <b-tab title="Apps">
                <div class="dataset-apps" v-if="apps">
                    <p v-if="apps.length > 0" class="text-muted">The following apps can be submitted with this data-object.</p>
                    <b-alert :show="apps.length == 0" variant="secondary" style="margin: -20px;">There are currently no applications that use the datatype from this data-object.</b-alert>
                    <div v-for="app in apps" :key="app._id" style="width: 33%; float: left;">
                        <!-- why am I handling @click on the parent div - instead of letting <app> do it?-->
                        <div style="margin-right: 10px; margin-bottom: 10px;" @click="openapp(app._id)" class="clickable">
                            <app :app="app" height="270px" :clickable="false"></app>
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

import contact from '@/components/contact'
import tags from '@/components/tags'
import app from '@/components/app'
import datatype from '@/components/datatype'
//import metadata from '@/components/metadata'
import pageheader from '@/components/pageheader'
import appavatar from '@/components/appavatar'
import datatypetag from '@/components/datatypetag'
import task from '@/components/task'
import pubcard from '@/components/pubcard'
import tageditor from '@/components/tageditor'
import taskconfig from '@/components/taskconfig'
import product from '@/components/product'

import agreementMixin from '@/mixins/agreement'

import vis from 'vis/dist/vis-network.min.js'
import 'vis/dist/vis-network.min.css'

const lib = require('@/lib');

let debounce;

export default {
    mixins: [agreementMixin],

    components: { 
        contact, 
        app, tags, datatype, 
        pageheader, appavatar,
        datatypetag, task, pubcard, 
        tageditor, taskconfig, product, task,

        editor: require('vue2-ace-editor'),
    },

    data () {
        return {
            dataset: null,
            apps: null,
            prov: null, 
            
            resource: null,

            tab_index: 0,

            selfurl: document.location.href,

            //back: null, //route to push to when user close it
            
            alltags: null,
            config: Vue.config,
        } 
    },

    created() {
        console.log("modal/dataset listening to dataset.view event");
        this.$root.$on("dataset.view", opt=>{
            //this.back = opt.back;
            this.load(opt.id);
        });

        //TODO - call removeEventListener in destroy()? Or I should do this everytime modal is shown/hidden?
        document.addEventListener("keydown", e => {
            if (e.keyCode == 27) {
                this.close();
            }
        });

        //this.editor.setTheme("ace/theme/twilight");
    },

    destroyed() {
        //to prevent wierd things from happening during debugging?
        this.$root.$off("dataset.view");
    },
    
    watch: {
        tab_index: function() {
            if(this.tab_index == 1 && this.prov == null) {
                this.load_prov();
            }
            if(this.tab_index == 2 && this.apps == null) {
                this.load_apps();
            }
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
        update_dataset(elem) {
            if(debounce) clearTimeout(debounce);
            debounce = setTimeout(()=>{
                this.$http.put(Vue.config.api+'/dataset/'+this.dataset._id, this.dataset).then(res=>{
                    this.$notify({type: "success", text: "Saved "+elem});
                });
            }, 500);
        },

        load_prov() {
            //load provenance
            this.$http.get('dataset/prov/'+this.dataset._id).then(res=>{
                this.prov = res.data;

                //apply styles
                this.prov.nodes.forEach(node=>{
                    node.shape = "box"; //all box..
                    if(node.id.indexOf("task.") === 0) {
                        node.color = "#fff"; 
                        //node.color = "rgba(255,255,255, 0.5)";
                        node.font = {size: 11};
                        node.mass = 1+0.2*node.label.trim().split("\n").length;
                    }
                    if(node.id.indexOf("dataset.") === 0) {
                        node.color = "#159957";
                        node.font = {size: 12, color: "#fff"};
                        //node.y = 0;
                    }
                    if(node.id == "dataset."+this.dataset._id) {
                        node.label = "This Data-Object";
                        node.color = "#2693ff";
                        //node.color = "rgba(255,0,0,0.5)";
                        node.y = 2000;
                        node.margin = 10;
                        node.font = {color: "#fff"};
                    }
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
                
                if(this.prov.edges.length) {
                    Vue.nextTick(()=>{
                        var gph = new vis.Network(this.$refs.vis, res.data, {
                            
                            layout: {
                                randomSeed: 0,
                            },
                            
                            //physics:{barnesHut:{/*gravitationalConstant:-3500, springConstant: 0.01, avoidOverlap: 0.02*/}},
                            physics:{
                                //enabled: true, //default true
                                barnesHut:{
                                    //springConstant: 0.20,
                                    //springLength: 150,
                                    //avoidOverlap: 0.2,
                                    //damping: 0.3,
                                    gravitationalConstant: -4000,
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
                        });
                        gph.on("doubleClick", e=>{
                            /*e.edges, e.event, e.nodes. e.pointer*/
                            e.nodes.forEach(node=>{
                                if(node.startsWith("dataset.")) {
                                    let dataset_id = node.substring(8);
                                    this.$router.replace(this.$route.path.replace(this.dataset._id, dataset_id));
                                }
                                if(node.startsWith("task.")) {
                                    let fullnode = this.prov.nodes.find(n=>n.id == node);
                                    console.dir(fullnode);
                                    if(fullnode._app) this.$router.replace("/app/"+fullnode._app);
                                }
                            });
                            e.edges.forEach(edge_id=>{
                                let edge = this.prov.edges.find(e=>e.id == edge_id);
                                if(edge._archived_dataset_id) {
                                    this.$router.replace(this.$route.path.replace(this.dataset._id, edge._archived_dataset_id)); 
                                }
                            });
                        });
                    });
                }
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

        close() {
            if(!this.dataset) return;
            this.$router.replace(this.$route.path.replace(this.dataset._id, ""));
            this.dataset = null;
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
                this.$root.$emit("downscript.open", {find: query});
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
                        //this.$router.push("/project/"+opt.project_id);
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
                    console.log(res);
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
            if(!this.dataset.archive_task_id) return; //no task_id
            if(this.dataset.archive_task) return; //already loaded
            console.log("loading dataset. archive_task");
            this.$http.get(Vue.config.amaretti_api+'/task/'+this.dataset.archive_task_id).then(res=>{
                console.log("loaded archive_task_id");
                console.dir(res);
                this.dataset.archive_task = res.data; 
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
                this.dataset.desc = dataset.desc;
                this.dataset.stats = dataset.stats;
                this.dataset.archive_task_id = dataset.archive_task_id;
                if(this.dataset.status == "storing") {
                    setTimeout(()=>{ this.load_status(id); }, 5000);
                } else {
                    this.$notify({type: "success", text: "Data-Object successfully stored on "+dataset.storage});
                }
                this.load_archive_task(); 
            });
        },

        load(id) {
            this.dataset = null;
            this.prov = null;
            this.apps = null;
            this.resource = null;
            this.tab_index = 0;
            this.alltags = null;

            if(!id) return;

            this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: id}),
                populate: JSON.stringify({
                    path: "project datatype prov.deps.dataset",
                    populate: {
                        path: "uis",
                        model: "UIs",
                    }
                }),
            }})
            .then(res=>{
                if(res.data.count == 0) {
                    console.error("can't find dataset");
                    return;
                }
                this.dataset = res.data.datasets[0];
                if(this.dataset.status == "storing") {
                    setTimeout(()=>{ this.load_status(id); }, 5000);
                }
                this.load_archive_task(); 

                Vue.set(this.dataset, '_meta',  JSON.stringify(this.dataset.meta, null, 4));
                Vue.set(this.dataset, '_meta_dirty',  false);
                Vue.set(this.dataset, '_tags_dirty',  false);
                Vue.set(this.dataset, '_desc_dirty',  false);

                //old dataset that doesn't have prov.task.. need to deref
                if(this.dataset.prov) {
                    if(this.dataset.prov.task_id) {
                        this.$http.get(Vue.config.amaretti_api+'/task/'+this.dataset.prov.task_id).then(res=>{
                            this.dataset.prov.task = res.data;
                            this.load_resource();
                        });
                    } else if(this.dataset.prov.task) {
                        this.load_resource();
                    }
                }

                //load tags from other datasets in this project
                return this.$http.get('dataset/distinct', {params: {
                    find: JSON.stringify({"project": this.dataset.project._id}),
                    distinct: 'tags',
                }});
            }).then(res=>{
                this.alltags = res.data;

                //load all publications that this dataobjects is published in
                let find = {};
                if(this.dataset.publications) {
                    find["releases._id"] = {$in: this.dataset.publications};
                }
                return this.$http.get('pub', {params: {
                    find: JSON.stringify(find),
                }});
            }).then(res=>{
                this.$set(this.dataset, '_pubs', res.data.pubs);
             }).catch(err=>{
                console.error(err);
                this.$notify({type: 'error', text: err});
            });
        },

        load_resource() {
            if(!Vue.config.user) return;
            if(!this.dataset.prov || !this.dataset.prov.task) return;
            this.$http.get(Vue.config.amaretti_api+'/resource', {params: {
                find: JSON.stringify({_id: this.dataset.prov.task.resource_id}),
            }})
            .then(res=>{
                this.resource = res.data.resources[0];
            }).catch(err=>{
                console.error(err);
                this.$notify({type: 'error', text: err});
            });;
        },

        start_viewer(datatype) {
            if(!Vue.config.user) return alert("Please Signup/Login first to visualize this data-object");
            this.check_agreements(this.dataset.project, ()=>{
                this.find_staged_task((task, subdir, files)=>{
                    if(task) {
                        this.$root.$emit("viewselecter.open", { datatype, task, subdir, files });
                    } else {
                        this.create_stage_task((err, task, subdir)=>{
                            if(err) return this.$notify({type: "error", text: err.toString()});
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
                if(task) {
                    console.log("found previously staged task !"+this.dataset._id);
                    let output = task.config._outputs.find(output=>output.dataset_id == this.dataset._id);
                    return cb(task, output.subdir);
                }

                //ok.. let's see if a task that produced the dataset still exists
                if(!this.dataset.prov) return cb(null);
                if(!this.dataset.prov.task._id) return cb(null); //(only happens in dev?)
                return this.$http.get(Vue.config.amaretti_api+'/task', {params: {
                    find: JSON.stringify({ 
                        _id: this.dataset.prov.task._id,
                        status: "finished",
                    }),
                }}).then(res=>{
                    let task = res.data.tasks[0];
                    if(task) {
                        console.log("task that produced this data-object still exists... using it");
                        console.dir(task);
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
            require('brace/mode/json')
            //require('brace/theme/chrome')
            //require('brace/theme/twilight')
            //editor.setTheme("ace/theme/twilight")
            editor.container.style.lineHeight = 1.25;
            editor.renderer.updateFontSize();
            if(!this.dataset._canedit) editor.setReadOnly(true);
        }
    }
}

</script>

<style scoped>
.dataset-detail,
.dataset-apps,
.dataset-provenance {
background-color: #f9f9f9;
position: absolute;
top: 105px;
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
pre.code {
background-color: white;
padding: 10px;
}
</style>


