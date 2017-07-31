<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/processes"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
        <div class="margin20" v-if="instance && app">

            <h1><icon name="cubes" scale="2"></icon> Archive Output</h1>
            
            <p class="text-muted">Please populate and submit following form to archive the output datasets generated from this process</p>

            <el-card>
                <el-form ref="form" label-width="180px">
                    <div v-for="dataset in datasets" :key="dataset.id" style="border-bottom: 1px solid #ddd; margin-bottom: 20px;">
                        <h3>
                            {{dataset.subdir||dataset.name}}
                            <small><datatypetag :datatype="datatypes[dataset.datatype]" :tags="dataset.datatype_tags"></datatypetag></small>
                        </h3>
                        <el-form-item label="Project">
                            <projectselecter v-model="dataset.project"/>
                            <p class="text-muted" style="margin-bottom: 0px;">Project where you'd like to store this datasets</p>
                        </el-form-item>
                        <el-form-item label="Metadata">
                            <div v-for="(v,k) in dataset.meta">
                                <el-input placeholder="Please input" v-model="dataset.meta[k]">
                                    <template slot="prepend">{{k|uppercase}}</template>
                                </el-input>
                            </div>
                            <p class="text-muted" style="margin-bottom: 0px;">Datatype specific Key/value pairs to describes hierarchy for this dataset</p>
                        </el-form-item>
                        <el-form-item label="User Tags (optional)">
                            <el-select v-model="dataset.tags" 
                                style="width: 100%"
                                multiple filterable allow-create placeholder="Enter tags">
                                <el-option v-for="tag in dataset.tags" key="tag" :label="tag" :value="tag"></el-option>
                            </el-select>
                            <p class="text-muted" style="margin-bottom: 0px;">Any tags you'd like to add to this dataset to make it easier to search / organize</p>
                        </el-form-item>
                        <el-form-item label="Description">
                            <el-input type="textarea" :autosize="{minRows: 2}" v-model="dataset.desc" placeholder="Optional"></el-input>
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
import projectselecter from '@/components/projectselecter'
import datatypetag from '@/components/datatypetag'

import async from 'async'

export default {
    components: { 
        sidemenu, contact, task, 
        message, file, tags, 
        metadata, filebrowser, pageheader, 
        appavatar, projectselecter, datatypetag,
    },

    data () {
        return {
            instance: null,
            app: null,
            projects: null,

            test: null,

            //cache
            datatypes: null,
            datasets: [], //used as form

            config: Vue.config,
        }
    },

    mounted: function() {

        //start by loading instance
        this.$http.get(Vue.config.wf_api+'/instance', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
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

            //load datatypes (TODO - I should only load datatypes used by datasets)
            return this.$http.get('datatype')
        })
        .then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach((d)=>{
                this.datatypes[d._id] = d;
            });

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
                    project: null,
                    instance_id: this.instance._id,
                    task_id: this.instance.config.output_task_id,

                    app_id: this.instance.config.prov.app,
                    datatype: output.datatype._id,
                    datatype_tags: output.datatype_tags,
                    files: {},

                    meta: meta,
                    desc: this.instance.desc, //default
                    tags: tags, 
                }

                //I need to subdir all output files with output.id
                console.dir(output.datatype.files);
                dataset.files = {};
                output.datatype.files.forEach(file=>{
                    dataset.files[file.id] = output.id+"/"+(file.filename||file.dirname);
                });
                console.dir(dataset.files);

                this.datasets.push(dataset);
            });

        }).catch(err=>{
            console.error(err);
        });
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
                    this.$router.push("/datasets/");
                }).catch(console.error);
            });
        },
    },
}
</script>
