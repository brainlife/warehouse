<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/apps"></sidemenu>
    <div class="page-content">
        <div class="header">
            <h2>Submit Application</h2>
        </div>
        <div class="content" v-if="app && projects">
            <el-form :model="form" ref="form" label-position="left" label-width="200px">
                <!--<h4 style="margin-left: 150px;">Inputs</h4>-->
                <el-form-item label="Application">
                    <app :appid="app._id"/>
                    <br>
                </el-form-item>
                <el-form-item v-for="input in app.inputs" :label="input.id+' '+input.datatype_tags" :key="input.id" ref="form">
                    <el-row :gutter="1">
                        <el-col :span="8" style="padding-right:7px;">
                            <projectselecter v-model="form.projects[input.id]" :placeholder="'Project'" @input="preselect_single_items(input)"></projectselecter>
                        </el-col>
                        <el-col :span="15">
                            <select2 style="width: 100%; max-width: 100%;" v-model="form.inputs[input.id]" :dataAdapter="debounce_grab_items(input)" :multiple="false" :placeholder="'Input Dataset'" :options="form.options[input.id]"></select2>
                        </el-col>
                    </el-row>
                </el-form-item>
                
                <!-- TODO doesn't support nested parameters-->
                <el-form-item v-for="(v,k) in app.config" :label="k" :key="k" v-if="v.type && v.type != 'input'">
                    <input v-if="v.type == 'float'" type="number" v-model.number="form.config[k]" step="0.01" :placeholder="v.placeholder">
                    <el-input type="number" v-if="v.type == 'integer'" v-model.number="form.config[k]" :placeholder="v.placeholder"></el-input>
                    <el-input v-if="v.type == 'string'" v-model="form.config[k]" :placeholder="v.placeholder"></el-input>
                    <el-checkbox v-if="v.type == 'boolean'" v-model="form.config[k]"></el-checkbox>
                    <el-select v-if="v.type == 'enum'" v-model="form.config[k]" :placeholder="v.placeholder">
                        <el-option v-for="option in v.options" :key="option.value" :label="option.label" :value="option.value">
                            <b>{{option.label}}</b>
                            <small> - {{option.desc}}</small>
                        </el-option>
                    </el-select>
                </el-form-item>

                <el-form-item label="Description">
                    <el-input type="textarea" v-model="form.desc" placeholder="Optional Description for this processing"></el-input>
                </el-form-item>
                <br>
                <el-form-item>
                    <el-button type="primary" @click="submit()">Submit</el-button>
                </el-form-item>
            </el-form>
        </div>

        <br>
        <el-card v-if="config.debug">
            <div slot="header">Debug</div>
            <h3>Form</h3>
            <pre v-highlightjs="JSON.stringify(form, null, 4)"><code class="json hljs"></code></pre>
            <h3>App</h3>
            <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
            <h3>Datasets</h3>
            <pre v-highlightjs="JSON.stringify(datasets, null, 4)"><code class="json hljs"></code></pre>
        </el-card>
    </div><!--page-content-->
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
import select2 from '@/components/select2'
import projectselecter from '@/components/projectselecter'
import app from '@/components/app'

const lib = require('./lib');

export default {
    components: { 
        sidemenu, contact, project, 
        tags, metadata, pageheader, 
        appavatar, select2, projectselecter, app
     },

    data () {
        return {
            app: null,
            //resource: null,

            form: {
                desc: "",
                //project_id: localStorage.getItem("last_projectid_used")||"", 
                inputs: {},
                options: {}, // explicit options to load (temporary)
                
                projects: {},
                config: {},
            },

            //cache
            datasets: {}, //available datasets grouped by input._id then project_id then array of datasets
            projects: [], //just names
            
            config: Vue.config,
        }
    },

    mounted: function() {
        //load project names
        console.log("loading projects");
        this.$http.get('project', {params: {
            find: JSON.stringify({
                $or: [
                    { members: Vue.config.user.sub}, 
                    { access: "public" },
                ],
                removed: false,
            }),
            select: 'name',
        }})
        .then(res=>{
            this.projects = {};
            res.body.projects.forEach((p)=>{
                this.projects[p._id] = p;
            });

            //load app detail
            return this.$http.get('app', {params: {
                find: JSON.stringify({_id: this.$route.params.id}),
                populate: 'inputs.datatype outputs.datatype',
            }})
        })
        .then(res=>{
            this.app = res.body.apps[0];
            //if(this.app.github) this.findbest(this.app.github);

            //TODO - update to handle nested parameters
            for(var k in this.app.config) {
                var v = this.app.config[k];
                if(v.type && v.type != "input") {
                    Vue.set(this.form.config, k, v.default);
                }
            }
        }).catch(err=>{
            console.error(err);
        });
    },

    methods: {
        
        // if there's only 1 applicable dataset for a given input, pre-select it
        preselect_single_items: function(input) {
            this.grab_items(input, {}, data => {
                //if there's only 1 applicable dataset...
                if (data.results.length == 1) {
                    let result = data.results[0];
                    //first add it to the list of options to choose from
                    Vue.set(this.form.options, input.id, data.results);
                    //then select it
                    Vue.set(this.form.inputs, input.id, result.id);
                }
                else { // more than one, clear the selection
                    // clear select2 selection using only options
                    Vue.set(this.form.options, input.id, []);
                    Vue.set(this.form.inputs, input.id, undefined);
                }
            });
        },

        /*        
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
        */
        
        grab_items: function(input, params, cb) {
            // essentially the same code from datasetselecter.vue
            if (!params.page) params.page = 1;
            var dropdown_items = [];
            
            let limit = 100;
            let skip = (params.page - 1) * limit;
            let find_raw = {
                project: this.form.projects[input.id],
                datatype: input.datatype._id,
                storage: {$exists: true}, 
                removed: false,
                status: {$in: ["stored", "archived"]},
            };

            if (params.term) find_raw.$text = { $search: params.term };
            
            this.$http.get('dataset', { params: {
                find: JSON.stringify(find_raw),
                sort: "project meta.subject -create_date",
                populate: "datatype",
                datatype_tags: input.datatype_tags,
                limit,
                skip
            }})
            .then(res => {
                //let filtered_datasets = lib.filter_datasets(res.body.datasets, input);
                //console.log("filtered", res.body.datasets, filtered_datasets);
                //filtered_datasets.forEach(dataset => {
                res.body.datasets.forEach(dataset => {
                    var subject = "N/A";
                    if (dataset.meta && dataset.meta.subject) subject = dataset.meta.subject;

                    // add dropdown menu item
                    dropdown_items.push({
                        id: dataset._id,
                        text: subject,
                        date: dataset.create_date,
                        datatype: dataset.datatype,
                        tags: dataset.datatype_tags
                    });
                });

                // let select2 know that we're done retrieving items
                cb({
                    results: dropdown_items,
                    pagination: {
                        // only load more items if there's more items to load
                        more: skip + res.body.datasets.length < res.body.count,
                    },
                });
            });
        },
        
        // wait a bit (unless interrupted by more keystrokes), then calls grab_items
        debounce_grab_items: function(input) {
            // 'global' variables
            let debounce;
            
            // return a new grab_items event that can be called for each input datatype
            // params + cb are input from select2
            return (params, cb) => {
                let vm = this;
                
                // debounce handling without lodash
                if (debounce) {
                    clearTimeout(debounce);
                    debounce = null;
                }
                debounce = setTimeout(function() {
                    debounce = null;
                    vm.grab_items.call(vm, input, params, cb);
                }, 200);
            }
        },

        generate_config: function(download_task_id) {
            var config = this.app.config;
            var app = this.app;
            var form = this.form;
            function handle_obj(obj) {
                for(var k in obj) { 
                    var node = obj[k];
                    if(!node) return;
                    if(node.isArray) {
                        console.log("todo.. array!");
                    } else if(typeof node === 'object') {
                        if(node.type) {
                            switch(node.type) {
                            case "input":
                                //find the input 
                                app.inputs.forEach(input=>{
                                    if(input.id == node.input_id) {
                                        //find the file
                                        input.datatype.files.forEach(file=>{
                                            if(file.id == node.file_id) {
                                                obj[k] = "../"+download_task_id+"/"+form.inputs[input.id]+"/"+(file.filename||file.dirname)
                                            }
                                        });
                                    } 
                                });
                                break;
                            default:
                                obj[k] = form.config[k];
                            }
                        } else handle_obj(node); //recurse
                    }
                }
            }

            handle_obj(config);
            console.log("generated config", config);
            return config;
        },

        //v2 process submit
        submit: function() {
            //make sure all inputs are selected
            var validated = true;
            for(var k in this.form.inputs) {
                if(!this.form.inputs[k]) validated = false;
            }
            if(!validated) {
                this.$notify({ title: 'Missing Input', text: 'Please select all inputs', type: 'error' });
                return;
            }

            var did = 0;
            var app_inputs = [];
            var meta = {};

            //first create an instance to run everything
            var instance = null;
            this.$http.post(Vue.config.wf_api+'/instance', {
                //name: "brainlife process for app:"+this.app._id,
                desc: this.form.desc||this.app.name,
                config: {
                    brainlife: true,
                    type: "v2",
                },
            }).then(res=>{
                instance = res.body;
                console.log("instance created", instance);

                //pull datasets info that we are submitting with
                return this.$http.get('dataset', {params: {
                    find: JSON.stringify({_id: {$in: Object.values(this.form.inputs)}}),
                }})
            }).then(res=>{
                var download = [];
                var _outputs = [];
                var datasets = {};
                res.body.datasets.forEach(d=>{
                    datasets[d._id] = d;

                    //aggregate metas
                    for(var k in d.meta) meta[k] = d.meta[k];
                });
                
                //create config to download all input data from archive
                for(var input_id in this.form.inputs) {
                    var dataset_id = this.form.inputs[input_id];
                    download.push({
                        url: Vue.config.api+"/dataset/download/"+dataset_id+"?at="+Vue.config.jwt,
                        untar: "auto",
                        dir: dataset_id,
                    });
                    var output = Object.assign(datasets[dataset_id], {
                        did: did++,
                        subdir: dataset_id, 
                        dataset_id,
                        prov: null, //not needed
                        id: input_id,
                    });
                    _outputs.push(output);

                    //turn output into input for the app
                    app_inputs.push(Object.assign({output_id: output.id}, output));
                }
                //now submit task to download data from archive
                console.log("submitting download task", download, _outputs);
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: "Staging Input Dataset",
                    service: "soichih/sca-product-raw",
                    config: { download, _outputs, _tid: 0 },
                })
            }).then(res=>{
                var download_task = res.body.task;
                console.log("download task submitted", download_task);

                //TODO - now submit intermediate tasks necessary to prep the input data so that we can run requested app

                app_inputs.forEach(input=>{
                    input.task_id = download_task._id
                });
                //submit the app task
                var config = Object.assign(this.generate_config(download_task._id), {
                    _app: this.app._id,
                    _tid: 1,
                    _inputs: app_inputs,
                    _outputs: [],
                });
                this.app.outputs.forEach(output=>{
                    var output_req = {
                        id: output.id,
                        did: did++,
                        datatype: output.datatype._id,
                        datatype_tags: output.datatype_tags,
                        desc: output.id+ " from "+this.app.name,
                        meta,
                        files: output.files,
                    };
                    /* TODO..
                    if(this.newtask.archive.enable) output_req.archive = {
                        project: this.newtask.archive.project,
                        desc: this.newtask.archive.desc,
                        //tags: this.newtask.archive.tags, //deprecated - store this under output_req
                    }
                    */
                    config._outputs.push(output_req);
                });

                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: this.app.name,
                    //desc: this.form.desc, 
                    service: this.app.github,
                    config,
                    deps: [ download_task._id ],
                    retry: this.app.retry,
                })
            }).then(res=>{
                console.log("submitted app task", res.body.task);
/*
                //then request for notifications
                return this.request_notifications(instance, inst_config.output_task_id);
            }).then(res=>{
*/
                //all done
                this.$router.push("/processes/"+instance._id);
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
    }
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
.content {
background-color: white;
padding: 20px;
}
.header {
background-color: #666;
padding: 20px;
color: white;
}
.header h1 {
margin: 0px;
}
</style>
