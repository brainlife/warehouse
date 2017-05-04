<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/apps"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
        <div class="margin20" v-if="app">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/apps' }">Apps</el-breadcrumb-item>
                <el-breadcrumb-item v-if="app._id">Submit {{app._id}}</el-breadcrumb-item>
            </el-breadcrumb>
            <br>

            <appavatar :app="app" style="float: left; margin-right: 10px;"></appavatar>
            <h1>{{app.name}}</h1>
            <p>{{app.desc}}</p>

            <br clear="both">
            <br>

            <el-card class="box-card">
                <el-form :model="form" ref="form" label-position="left" label-width="150px">
                    <!--<h4 style="margin-left: 150px;">Inputs</h4>-->
                    <el-form-item v-for="input in app.inputs" :label="input.id" :key="input.id" ref="form">
                        <el-select v-model="form.inputs[input.id]" placeholder="Please select input dataset">
                            <el-option v-for="dataset in datasets[input.id]" :key="dataset._id" 
                                :value="dataset._id" :label="dataset.meta.subject+' '+dataset.name">
                                {{dataset.meta.subject}} | {{dataset.name}} | {{dataset.create_date|date}}
                            </el-option>
                        </el-select>
                    </el-form-item>

                    <!--<h4 style="margin-left: 150px;">Configurations</h4>-->
                    <!-- TODO doesn't support nested parameters-->
                    <el-form-item v-for="(v,k) in app.config" :label="k" :key="k" v-if="v.type && v.value">
                        <el-input v-model="form.config[k]"></el-input>
                    </el-form-item>
 
                    <el-form-item label="Description">
                        <el-input type="textarea" v-model="form.desc" placeholder="Optional Description for this processing"></el-input>
                    </el-form-item>
                    <br>
                    <el-form-item>
                        <el-button type="primary" @click="submit()">Submit</el-button>
                    </el-form-item>
                </el-form>
            </el-card>

            <el-card v-if="config.debug">
                <div slot="header">Debug</div>
                <h3>Form</h3>
                <pre v-highlightjs="JSON.stringify(form, null, 4)"><code class="json hljs"></code></pre>
                <h3>App</h3>
                <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
                <h3>Datasets</h3>
                <pre v-highlightjs="JSON.stringify(datasets, null, 4)"><code class="json hljs"></code></pre>
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
import metadata from '@/components/metadata'
import pageheader from '@/components/pageheader'
import appavatar from '@/components/appavatar'

const lib = require('./lib');

export default {
    components: { sidemenu, contact, project, tags, metadata, pageheader, appavatar },

    data () {
        return {
            app: null,
            resource: null,

            form: {
                desc: "",
                //project_id: localStorage.getItem("last_projectid_used")||"", 
                inputs: {},
                config: {},
            },

            //cache
            datasets: {}, //available datasets grouped by input._id
            //projects: [],

            config: Vue.config,
        }
    },

    computed: {
    },

    mounted: function() {
        //console.log("query query", this.$route.query);
        var preselect_dataset = null;

        this.$http.get('app', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
            populate: 'inputs.datatype outputs.datatype',
        }})
        .then(res=>{
            this.app = res.body.apps[0];
            if(this.app.github) this.findbest(this.app.github);

            //prepare form inputs
            this.app.inputs.forEach((input)=>{
                Vue.set(this.form.inputs, input.id, null);
            });
            for(var k in this.app.config) {
                Vue.set(this.form.config, k, this.app.config[k].default);
                //Vue.set(this.rules, k, [{required: true, message: 'Please enter'}]);
            }

            //process config template
            //TODO - update to handle nested parameters
            //console.dir(this.app);
            for(var k in this.app.config) {
                var v = this.app.config[k];
                if(v.type && v.default) v.value = v.default;
            }

            //load datasets that this app cares about
            var datatype_ids = this.app.inputs.map((input)=>input.datatype._id);
            return this.$http.get('dataset', {params: {
                find: JSON.stringify({
                    datatype: {$in: datatype_ids},
                    removed: false,
                })
            }})

        })
        .then(res=>{
            var datasets = res.body.datasets;
            this.app.inputs.forEach((input)=>{
                Vue.set(this.datasets, input.id, lib.filter_datasets(datasets, input));
            });

            //find preselected datasets
            if(this.$route.query.dataset) {
                datasets.forEach(dataset=>{
                    if(dataset._id == this.$route.query.dataset) preselect_dataset = dataset;
                }); 
            }
            //and use it to preselect
            var subject = null;
            if(preselect_dataset && preselect_dataset.meta) subject = preselect_dataset.meta.subject;
            for(var input_id in this.datasets) {
                var datasets = this.datasets[input_id];
                datasets.forEach(dataset=>{
                    if(preselect_dataset == dataset) this.form.inputs[input_id] = dataset._id;
                    else {
                        //select first one that has matching subject
                        if(dataset.meta.subject == subject) this.form.inputs[input_id] = dataset._id;
                    }
                });
            }
        }).catch(err=>{
            console.error(err);
        });
    },

    methods: {
        go: function(path) {
            this.$router.push(path);
        },

        findbest: function(service) {
          //find resource where we can run this app
          this.$http.get(Vue.config.wf_api+'/resource/best/', {params: {
              service: service,
          }})
          .then(res=>{
            this.resource = res.body;
          }, res=>{
            console.error(res);
          })
        },

        submit: function() {

            //make sure all inputs are selected
            var validated = true;
            for(var k in this.form.inputs) {
                if(!this.form.inputs[k]) validated = false;
            }
            if(!validated) {
                this.$notify({
                    title: 'Missing Input',
                    message: 'Please select all inputs',
                    type: 'error'
                });
                return;
            }

            //first create an instance to run everything
            var instance = null;
            var inst_config = {
                brainlife: true,
                //project: this.project_id,
                output_task_id: null, //will be set once submitted
                prov: {
                    app: this.app._id,
                    deps: [], 
                }
            }
            for(var input_id in this.form.inputs) {
                inst_config.prov.deps.push({input_id, dataset: this.form.inputs[input_id]});
            }
            this.$http.post(Vue.config.wf_api+'/instance', {
                name: "brainlife process for app:"+this.app._id,
                desc: this.form.desc,
                config: inst_config,
            }).then(res=>{
                instance = res.body;
                console.log("instance created", instance);

                //create config to download all input data from archive
                var download = [];
                for(var input_id in this.form.inputs) {
                    download.push({
                        url: Vue.config.api+"/dataset/download/"+this.form.inputs[input_id]+"?at="+Vue.config.jwt,
                        untar: "gz",
                        dir: "inputs/"+input_id,
                    });
                }

                //now submit task to download data from archive
                console.log("submitting download task", download);
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: "Stage Input",
                    service: "soichih/sca-product-raw",
                    config: { download },
                })
            }).then(res=>{
                var download_task = res.body.task;
                console.log("download task submitted", download_task);

                //TODO - now submit intermediate tasks necessary to prep the input data so that we can run requested app

                //submit the main task
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: this.app.name,
                    service: this.app.github,
                    config: Object.assign(this.form.config, lib.generate_config(this.app, download_task._id)),
                    deps: [ download_task._id ],
                })
            }).then(res=>{
                var main_task = res.body.task;
                //submit the output handling task
                var symlink = [];
                this.app.outputs.forEach(output=>{
                    console.log("processing", output);
                    if(output.files) {
                        for(var file_id in output.files) {
                            //find datatype file id
                            output.datatype.files.forEach(datatype_file=>{
                                if(datatype_file.id == file_id) {
                                    var name = datatype_file.filename||datatype_file.dirname;
                                    symlink.push({ 
                                        "src": "../"+main_task._id+"/"+output.files[file_id], 
                                        "dest": output.id+"/"+name 
                                    });
                                }
                            });
                        }
                    } else {
                        //copy everything..
                        symlink.push({"src": "../"+main_task._id, "dest": output.id});
                    }
                });
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: "Organize Output", 
                    service: "soichih/sca-product-raw",
                    config: { symlink },
                    deps: [ main_task._id ],
                })
            }).then(res=>{
                //add output_task_id information on instance config (used by ui to render main task)
                inst_config.output_task_id = res.body.task._id;
                inst_config.prov.config = res.body.task.config;
                inst_config.prov.task_id = res.body.task._id;
                inst_config.prov.instance_id = instance._id;
                return this.$http.put(Vue.config.wf_api+'/instance/'+instance._id, {
                    config: inst_config,
                });
            }).then(res=>{
                //then request for notifications
                return this.request_notifications(instance, inst_config.output_task_id);
            }).then(res=>{
                //all good!
                //localStorage.setItem("last_projectid_used", this.project_id);
                this.go('/process/'+instance._id);
            }).catch(err=>{
                console.error(err);
            });
        },

        request_notifications: function(instance, task_id) {
            var url = document.location.origin+document.location.pathname+"#/process/"+instance._id;

            //for success
            return this.$http.post(Vue.config.event_api+"/notification", {
                event: "wf.task.finished",
                handler: "email",
                config: {
                    task_id: task_id,
                    subject: "[brain-life.org] Process Completed",
                    message: "Hello!\n\nI'd like to inform you that your process has completed successfully.\n\nPlease visit "+url+" to view your result.\n\nBrain-life.org Administrator"
                },
            }).then(res=>{
                console.log("requested notification");
                console.dir(res.body);
            }).catch(err=>{
                console.error(err);
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
</style>


