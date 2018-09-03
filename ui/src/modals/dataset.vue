<template>
<transition name="fade">
<div v-if="dataset" class="brainlife-modal-overlay">
    <b-container class="brainlife-modal">
        <div class="brainlife-modal-header">
            <div style="float: right;">
                <div class="button" @click="remove" v-if="dataset._canedit && !dataset.removed" title="Remove Dataset">
                    <icon name="trash" scale="1.25"/>
                </div>
                <div class="button" @click="start_viewer(dataset.datatype.name)" v-if="config.user && dataset.storage" title="View Dataset">
                    <icon name="eye" scale="1.25"/>
                </div>
                <div class="button" @click="download" v-if="dataset.storage" title="Download Dataset">
                    <icon name="download" scale="1.25"/>
                </div>
                <div class="button" @click="process" v-if="config.user && dataset.storage" title="Process">
                    <icon name="paper-plane" scale="1.25"/> 
                </div>
                <div class="button" @click="close" style="margin-left: 20px; opacity: 0.8;">
                    <icon name="times" scale="1.5"/>
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
                    <b-alert :show="dataset.removed" variant="warning">This dataset has been removed</b-alert>
                    <!-- detail -->
                    <div class="margin20">
                        <b-row>
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
                            <b-col cols="3"><span class="form-header">User Tags</span></b-col>
                            <b-col cols="9">
                                <div v-if="dataset._canedit && alltags">
                                    <tageditor :value="dataset.tags" v-model="dataset.tags" @input="dataset._tags_dirty = true" />
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
                            <b-col>
                                <app slot="header" 
                                    :appid="dataset.prov.task.config._app" 
                                    :branch="dataset.prov.task.service_branch||'master'" 
                                    :clickable="false" 
                                    @click.native="openapp(dataset.prov.task.config._app)">
                                    <taskconfig style="margin: 10px;" :task="dataset.prov.task"/>
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
                       <b-row v-if="dataset.prov && dataset.prov.task && dataset.prov.task.product">
                            <b-col cols="3"><span class="form-header">Task Result <small>(product.json)</small></span></b-col>
                            <b-col cols="9">
                                <product :product="dataset.prov.task.product"/>
                            </b-col>
                        </b-row>

                        <b-row>
                            <b-col cols="3"><span class="form-header">Archived in</span></b-col>
                            <b-col>
                                <p>
                                    <span style="color: #2693ff;" v-if="dataset.status == 'storing'">
                                        <icon name="cog" :spin="true"/> <b>Storing ... </b> 
                                        <!--Please wait before you download / process this dataset.-->
                                    </span> 
                                    <span v-if="dataset.status == 'stored'">
                                        <b>{{dataset.storage}}</b>
                                        <span class="text-muted" v-if="dataset.size">({{dataset.size | filesize}})</span>
                                    </span> 
                                    <span v-if="dataset.status == 'failed'" style="color: red;">
                                        <icon name="exclamation-triangle"/> Failed to store on warehouse
                                    </span> 
                                    <span v-if="!dataset.status">
                                        Status is unknown
                                    </span> 
                                    <span title="Backup of this dataset exists in Scholarly Data Archive (SDA) system." v-if="dataset.backup_date" class="text-success">
                                        <b-badge variant="success">Backed Up</b-badge>
                                    </span>
                                </p>
                            </b-col>
                        </b-row>
                        <b-row v-if="config.user">
                            <b-col cols="3"><span class="form-header">Archived by</span></b-col>
                            <b-col>
                                <p>
                                    <contact :id="dataset.user_id"/> 
                                    <span class="text-muted">at {{new Date(dataset.create_date).toLocaleString()}}</span>
                                </p>
                            </b-col>
                        </b-row>
                        <b-row v-if-dis="dataset.download_count > 0">
                            <b-col cols="3"><span class="form-header">Download Count</span></b-col>
                            <b-col>
                                <p><b>{{dataset.download_count}}</b> times</p>
                                <p>
                                    <small style="opacity: 0.8;">
                                        You can download this dataset via <a href="https://github.com/brain-life/cli" target="doc">Brainlife CLI</a>
                                    </small>
                                    <pre>$ bl dataset download --id {{dataset._id}}</pre>
                                </p>
                            </b-col>
                        </b-row>

                        <b-row v-if="dataset.publications && dataset.publications.length > 0">
                            <b-col cols="3"><span class="form-header">Publications</span></b-col>
                            <b-col cols="9">
                                <p><small class="text-muted">This dataset has been published on the following publications.</small></p>
                                <p v-for="pub in dataset.publications" v-if="!pub.removed">
                                    <a href="javascript:void(0);" @click="openpub(pub)">
                                        <icon name="book" scale="0.8"/> {{pub.name||pub}}
                                    </a>
                                </p>
                            </b-col>
                        </b-row>
                        <b-row>
                            <b-col cols="3"><span class="form-header">Metadata</span></b-col>
                            <b-col style="position: relative;">
                                <div v-if="dataset._canedit">
                                    <editor v-model="dataset._meta" @init="editorInit" @input="dataset._meta_dirty = true" lang="json" height="200"></editor>
                                    <br>
                                    <b-button v-if="dataset._meta_dirty" variant="primary" @click="save_meta()" style="float: right;">Save Metadata</b-button>
                                </div>
                                <div v-else>
                                    <pre v-highlightjs><code class="json">{{dataset.meta}}</code></pre>
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
                        <b-alert show variant="secondary">This dataset was uploaded by the user, and therefore has no provenance information.</b-alert>
                    </div>
                    <div ref="vis" v-else style="height: 100%;"/>
                </div>
            </b-tab>
            <b-tab title="Apps">
                <div class="dataset-apps" v-if="apps">
                    <p v-if="apps.length > 0" class="text-muted">The following apps can be submitted with this dataset.</p>
                    <b-alert show variant="info" v-if="apps.length == 0">There are currently no applications that use the datatype from this dataset.</b-alert>
                    <div v-for="app in apps" :key="app._id" style="width: 33%; float: left;">
                        <!-- why am I handling @click on the parent div - instead of letting <app> do it?-->
                        <div style="margin-right: 10px; margin-bottom: 10px;" @click="openapp(app._id)">
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

import sidemenu from '@/components/sidemenu'
import contact from '@/components/contact'
import tags from '@/components/tags'
import app from '@/components/app'
import datatype from '@/components/datatype'
import metadata from '@/components/metadata'
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
        sidemenu, contact, 
        app, tags, datatype, 
        metadata, pageheader, appavatar,
        datatypetag, task, pubcard, 
        tageditor, taskconfig, product,

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

            back: null, //route to push to when user close it
            
            alltags: null,
            config: Vue.config,
        } 
    },

    created() {
        console.log("modal/dataset listening to dataset.view event");
        this.$root.$on("dataset.view", opt=>{
            this.back = opt.back;
            this.load(opt.id);
        });

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
            //console.log("tab_index changed", this.prov);
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
                this.prov = res.body;

                //apply styles
                this.prov.nodes.forEach(node=>{
                    node.shape = "box"; //all box..
                    if(node.id.indexOf("task.") === 0) {
                        node.color = "#fff";
                        //node.color = "rgba(h55,255,255,0.5)";
                        node.font = {size: 11};
                    }
                    if(node.id.indexOf("dataset.") === 0) {
                        node.color = "#159957";
                    }
                    if(node.id == "dataset."+this.dataset._id) {
                        node.label = "This Dataset";
                        node.color = "#2693ff";
                        node.y = 1500;
                        node.margin = 10;
                        node.font = {color: "#fff"};
                    }
                });

                if(this.prov.edges.length) {
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
                            physics:{
                                barnesHut:{
                                    //springConstant: 0.20,
                                    //springLength: 150,
                                    //avoidOverlap: 0.2,
                                    //damping: 0.3,
                                    gravitationalConstant: -6000,
                                }
                            },

                            nodes: {
                                shadow: true,
                                borderWidth: 0,
                            },
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
            }}).then(res=>{
                if(!res) return; //TODO notify error?
                this.apps = lib.filter_apps(this.dataset, res.body.apps);
            });
        },

        close() {
            if(!this.dataset) return;
            this.$router.push(this.$route.path.replace(this.dataset._id, ""));
            this.dataset = null;
        },

        openpub(pub) {
            this.$router.push('/pub/'+pub._id);
            this.dataset = null;
        },

        openapp(app_id) {
            if(!this.dataset) return;
            this.$router.push('/app/'+app_id);
            this.dataset = null;
        },

        download() {
            this.check_agreements(this.dataset.project, ()=>{
                var url = Vue.config.api+'/dataset/download/'+this.dataset._id;
                if(Vue.config.user) url += '?at='+Vue.config.jwt; //guest can download without jwt for published datasets
                document.location = url;
            });
        },

        process() {
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
                            group_id: opt.group_id,
                        }).then(res=>{
                            this.submit_process(opt.project_id, res.body);
                        }).catch(err=>{
                            console.error(err);
                            this.$notify({type: 'error', text: err.body.message});
                        })
                    }
                });
            });
        },

        submit_process(project_id, instance) {
            //console.log("submitting staging task", this.dataset);
            this.$http.post(Vue.config.amaretti_api+'/task', {
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
                this.$router.push("/project/"+project_id+"/process/"+instance._id);
                this.dataset = null;
            });
        },

        remove() {
            if(confirm("Do you really want to remove this dataset?")) {
                this.check_agreements(this.dataset.project, ()=>{
                    this.$http.delete('dataset/'+this.dataset._id)
                    .then(res=>{
                        this.close();
                    });
                });
            }
        },

        load_status(id) {
            //console.log("loading dataset status");
            if(!this.dataset) return; //route changed before timeout was fired?
            this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: id}),
            }})
            .then(res=>{
                var dataset = res.body.datasets[0];
                //TODO - why not just set all fields?
                this.dataset.size = dataset.size;
                this.dataset.status = dataset.status;
                this.dataset.storage = dataset.storage;
                this.dataset.desc = dataset.desc;
                this.dataset.stats = dataset.stats;
                if(this.dataset.status == "storing") {
                    setTimeout(()=>{ this.load_status(id); }, 5000);
                } else {
                    this.$notify({type: "success", text: "Dataset successfully stored on "+dataset.storage});
                }
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
                populate: "project datatype prov.deps.dataset publications",
            }})
            .then(res=>{
                if(res.body.count == 0) {
                    console.error("can't find dataset");
                    return;
                }
                this.dataset = res.body.datasets[0];
                if(this.dataset.status == "storing") this.load_status(id);

                Vue.set(this.dataset, '_meta',  JSON.stringify(this.dataset.meta, null, 4));
                Vue.set(this.dataset, '_meta_dirty',  false);
                Vue.set(this.dataset, '_tags_dirty',  false);
                Vue.set(this.dataset, '_desc_dirty',  false);

                //old dataset that doesn't have prov.task.. need to deref
                if(this.dataset.prov) {
                    if(this.dataset.prov.task_id) {
                        this.$http.get(Vue.config.amaretti_api+'/task/'+this.dataset.prov.task_id).then(res=>{
                            this.dataset.prov.task = res.body;
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
                this.alltags = res.body;
             }).catch(err=>{
                console.error(err);
            });
        },

        load_resource() {
            if(!this.dataset.prov || !this.dataset.prov.task) return;
            this.$http.get(Vue.config.amaretti_api+'/resource', {params: {
                find: JSON.stringify({_id: this.dataset.prov.task.resource_id}),
            }})
            .then(res=>{
                this.resource = res.body.resources[0];
            }).catch(err=>{
                console.error(err);
            });;
        },

        get_instance() {
            //first create an instance to download things to
            return this.$http.post(Vue.config.amaretti_api+'/instance', {
                name: "brainlife.download",
                config: {
                    selected: this.selected,
                }
            }).then(res=>res.body);
        },

        start_viewer(datatype_name) {
            this.check_agreements(this.dataset.project, ()=>{
                //dialog itself is opened via ref= on b-button, but I still need to pass some info to the dialog and retain task._id
                this.$root.$emit("viewselecter.open", {
                    datatype_name,
                    task_cb: this.create_view_task, 
                    subdir: "output",
                });
            });
        },

        create_view_task(cb) {
            //first, query for the viewing task to see if it already exist
            var name = "brainlife.view "+this.dataset._id;
            this.$http.get(Vue.config.amaretti_api+'/task', {params: {
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
                            dir: "output",
                        });

                        //remove in 48 hours (abcd-novnc should terminate in 24 hours)
                        var remove_date = new Date();
                        remove_date.setDate(remove_date.getDate()+2);

                        return this.$http.post(Vue.config.amaretti_api+'/task', {
                            instance_id: download_instance._id,
                            name,
                            service: "soichih/sca-product-raw",
                            config: { download },
                            remove_date: remove_date,
                        }).then(res=>res.body.task);
                        return this.stage_selected(download_instance);
                    }).then(task=>{
                        //console.log("created task", task); 
                        cb(task);
                    }).catch(console.error);
                }
            });
        },

        save_desc() {
            this.update_dataset('desc');
            this.dataset._desc_dirty = false;
        },
        save_tags() {
            this.update_dataset('tags');
            this.dataset._tags_dirty = false;
        },
        save_meta() {
            try {
                this.dataset.meta = JSON.parse(this.dataset._meta);
                this.update_dataset('meta');
                this.dataset._meta_dirty = false;
            } catch(err) {
                this.$notify({ text: 'Failed to parse JSON', type: 'error' });
                return;
            }
        },
        editorInit() {
            require('brace/mode/json')
            require('brace/theme/chrome')
        },
    }
}

</script>

<style scoped>
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
.fade-enter, .fade-leave-to {
    opacity: 0
}
</style>


