<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/processes"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
        <div class="margin20" v-if="instance && app">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/processes' }">Processes</el-breadcrumb-item>
                <el-breadcrumb-item :to="{ path: '/process/'+instance._id}">{{instance.name}}</el-breadcrumb-item>
                <el-breadcrumb-item>Archive Output</el-breadcrumb-item>
            </el-breadcrumb>

            <br>
            <h1><icon name="cubes" scale="2"></icon> Archive Output</h1>
            
            <p class="text-muted">Please populate and submit following form to archive the output datasets generated from this process</p>

            <el-card>
                <el-form ref="form" label-width="180px">
                    <div v-for="dataset in datasets" :key="dataset.id" style="border-bottom: 1px solid #ddd; margin-bottom: 20px;">
                        <h2>{{dataset.id}}</h2>
                        <el-form-item label="Name (optional)">
                            <el-input type="text" v-model="dataset.name" placeholder="Dataset Name"></el-input>
                        </el-form-item>
                        <el-form-item label="Desc (optional)">
                            <el-input type="text" v-model="dataset.desc" placeholder="Dataset Description"></el-input>
                        </el-form-item>
                        <el-form-item label="Project">
                            <el-select v-model="dataset.project" placeholder="Please select" style="width: 100%;">
                                <el-option v-for="project in projects" :label="project.name" :value="project._id" :key="project._id">{{project.name}} <projectaccess :access="project.access"/></el-option>
                            </el-select>
                            <p class="text-muted" style="margin-bottom: 0px;">Project where you'd like to store this datasets</p>
                        </el-form-item>
                        <el-form-item label="User Tags (optional)">
                            <el-select v-model="dataset.tags" 
                                style="width: 100%"
                                multiple filterable allow-create placeholder="Enter tags">
                                <el-option v-for="tag in dataset.tags" key="tag" :label="tag" :value="tag"></el-option>
                            </el-select>
                            <p class="text-muted" style="margin-bottom: 0px;">Any tags you'd like to add to this dataset to make it easier to search / organize</p>
                        </el-form-item>
                        <el-form-item label="DataType Tags">
                            <el-select v-model="dataset.datatype_tags" 
                                style="width: 100%"
                                multiple filterable allow-create disabled placeholder="No datatype tags">
                                <el-option v-for="tag in dataset.datatype_tags" key="tag" :label="tag" :value="tag"></el-option>
                            </el-select>
                            <p class="text-muted" style="margin-bottom: 0px;">Datatype tags specified by the application configuration. <b>Read-only</b></p>
                        </el-form-item>
                        <el-form-item label="Metadata">
                            <div v-for="(v,k) in dataset.meta">
                                <el-input placeholder="Please input" v-model="dataset.meta[k]">
                                    <template slot="prepend">{{k|uppercase}}</template>
                                </el-input>
                            </div>
                            <p class="text-muted" style="margin-bottom: 0px;">Datatype specific Key/value pairs to describes hierarchy for this dataset</p>
                        </el-form-item>
                    </div>
                    <el-form-item>
                        <el-button type="primary" icon="check" @click="submit()">Submit</el-button>
                    </el-form-item>
                </el-form>
            </el-card>

            <br>
            <el-card v-if="config.debug">
                <div slot="header">Debug</div>
                <div v-if="instance">
                    <h3>datasets</h3>
                    <pre v-highlightjs="JSON.stringify(datasets, null, 4)"><code class="json hljs"></code></pre>
                    <h3>instance</h3>
                    <pre v-highlightjs="JSON.stringify(instance, null, 4)"><code class="json hljs"></code></pre>
                    <h3>app</h3>
                    <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
                </div>
            </el-card>
        </div><!--margin20-->
        </div><!--page-content-->
    </div><!--pusher-->
</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import contact from '@/components/contact'
import message from '@/components/message'
import task from '@/components/task'
import file from '@/components/file'
import filebrowser from '@/components/filebrowser'
import tags from '@/components/tags'
import pageheader from '@/components/pageheader'
import metadata from '@/components/metadata'
import appavatar from '@/components/appavatar'
import projectaccess from '@/components/projectaccess'

import ReconnectingWebSocket from 'reconnectingwebsocket'
import async from 'async'

export default {
    mixins: [
        //require("vue-toaster")
    ],
    components: { sidemenu, contact, task, message, file, tags, metadata, filebrowser, pageheader, appavatar, projectaccess },

    data () {
        return {
            instance: null,
            app: null,
            projects: null,

            test: null,

            datasets: [], //used as form

            config: Vue.config,
        }
    },

    mounted: function() {
        //load instance first
        this.$http.get(Vue.config.wf_api+'/instance', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
            //populate: 'config.project datatype instance.config.prov.deps.dataset',
        }})
        .then(res=>{
            this.instance = res.body.instances[0];

            //load datasets used for prov.deps (used to aggregate metadata)
            var dataset_ids = this.instance.config.prov.deps.map(dep=>dep.dataset);
            return this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: dataset_ids}),
                populate: ' ', //load all default
            }})
        })
        .then(res=>{
            //dereference prov.deps with real dataset object
            res.body.datasets.forEach(dataset=>{
                this.instance.config.prov.deps.forEach(dep=>{
                    if(dep.dataset == dataset._id) {
                        Vue.set(dep, '_dataset', dataset);
                    }
                });
            });

            //load projects that user is member of
            return this.$http.get('project', {params: {
                find: JSON.stringify({members: Vue.config.user.sub}),
                populate: ' ', //load all default
            }})
        })
        .then(res=>{
            this.projects = res.body.projects;
            if(this.projects.length == 0) {
                this.$notify.error({
                    title: 'Error',
                    message: 'You have no project you are member of. Please create a project first.'
                });
                return;
            }

            //load app
            return this.$http.get('app', {params: {
                find: JSON.stringify({_id: this.instance.config.prov.app}),
                populate: 'inputs.datatype outputs.datatype',
            }})
        })
        .then(res=>{
            this.app = res.body.apps[0];

            //construct metadata for the new output dataset
            //I think I should let the app take care of this (via products.json?) but metadata is more or less warehouse
            //specific concept - so maybe I should define mapping rule inside app record somehow.
            //for now, I just concat all metadata from input datasets used
            var meta_catalog = {}
            this.instance.config.prov.deps.forEach(function(dep) {
                Object.assign(meta_catalog, dep._dataset.meta);
            });

            var tags = [];
            this.instance.config.prov.deps.forEach(function(dep) {
                dep._dataset.tags.forEach(t=>{
                    if(!~tags.indexOf(t)) tags.push(t);
                });
            });

            //populate datasets array
            this.app.outputs.forEach(output=>{
                var meta = {};
                output.datatype.meta.forEach(m=>{
                    //use default from meta_catalog - maybe I should let products.json override this?
                    meta[m.id] = meta_catalog[m.id]; 
                });

                var dataset = {
                    instance_id: this.instance._id,
                    task_id: this.instance.config.main_task_id,
                    prov: this.instance.config.prov, 
                    id: output.id,
                    name: output.id+" from "+this.instance.name,
                    desc: output.id+" from "+this.instance.desc,
                    project: this.projects[0]._id, //select first project by default (TODO - remember user preference?)
                    tags: tags, 
                    meta: meta,
                    datatype: output.datatype._id,
                    datatype_tags: output.datatype_tags,
                }
                //this.$set(dataset, 'project', this.projects[0]._id);
                this.datasets.push(dataset);
            });

        }).catch(err=>{
            console.error(err);
        });
    },

    computed: {
        /*
        main_task: function() {
            var it = null;
            this.tasks.forEach((task)=>{
                if(task._id == this.instance.config.main_task_id) it = task;
            })
            if(!it) console.error("failed to find main_task");
            return it;
        },
        input_task: function() {
            var it = null;
            this.tasks.forEach((task)=>{
                if(task.name == "Stage Input") it = task; //TODO brittle~!
            })
            if(!it) console.error("failed to find input_task");
            return it;
        }
        */
    },
    methods: {

        go: function(path) {
            this.$router.push(path);
        },
        submit: function() {
            //request archive for *each* output datasets
            this.instance.config.dataset_ids = [];
            async.forEach(this.datasets, (dataset, next)=>{
                this.$http.post('dataset', dataset).then(res=>{
                    //this.messages.push({msg: "Archiving Request Sent!", cls: {info: true}});
                    console.log("posted dataset", res.body);
                    this.instance.config.dataset_ids.push(res.body._id);
                    next();
                }, next);
            }, err=>{
                if(err) {
                    this.$notify.error({
                        title: 'Error',
                        message: err.toString()
                    });
                    return;
                }

                //update instance to store dataset_ids
                this.$http.put(Vue.config.wf_api+'/instance/'+this.instance._id, {
                    config: this.instance.config,
                }).then(res=>{
                    this.$notify.success({
                        title: 'Success',
                        message: 'Successfully archived datasets',
                    });
                    this.$router.push("/process/"+this.instance._id);
                }).catch(console.error);
            });
        },
    },
}
</script>
