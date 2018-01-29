<template>
<div v-if="app && projects">
    <b-row>
        <b-col>Project</b-col>
        <b-col cols="9">
            <projectselecter canwrite="true" v-model="project" placeholder="Project you'd like to run this process in"/> 
        </b-col>
    </b-row>
    <br>

    <b-row>
        <b-col>Description</b-col>
        <b-col cols="9">
            <b-form-textarea v-model="form.desc"
                 placeholder="Optional description for this processing"
                 :rows="3"
                 :max-rows="6"/>
            <br>
        </b-col>
    </b-row>

    <!--<h4>Input Datasets</h4>-->
    <b-alert :show="!this.resource_available" variant="warning" style="margin-bottom:14px;">There is currently no available resource to run this application on. If you submit your application right now, it will only run after a resource has become available.</b-alert>
    
    <b-row v-for="input in app.inputs" :key="input.id" style="margin-bottom: 10px;">
        <b-col>
            <datatypetag :datatype="input.datatype" :tags="input.datatype_tags"/>
        </b-col>
        <b-col cols="4">
            <projectselecter 
                v-model="form.projects[input.id]" placeholder="Project" @input="preselect_single_items(input)"/>
        </b-col>
        <b-col cols="5">
            <select2 style="width: 100%; max-width: 100%;" 
                v-model="form.inputs[input.id]" 
                :dataAdapter="debounce_grab_items(input)" 
                :multiple="false" 
                :placeholder="'Input Dataset'" 
                :options="form.options[input.id]"/>
            <br>
        </b-col>
    </b-row>
    
    <!--<h4>Configuration</h4>-->
    <b-row v-for="(v,k) in app.config" :key="k" v-if="v.type && v.type != 'input'">
        <b-col>{{k}}</b-col>
        <b-col cols="9">
            <b-form-group>
                <!--integer is deprecated-->
                <b-form-input type="number" v-if="v.type == 'number' || v.type == 'integer'" :readonly="v.readonly"  v-model.number="form.config[k]" :placeholder="v.placeholder"/>
                <b-form-input type="text" v-if="v.type == 'string'" :readonly="v.readonly" v-model="form.config[k]" :placeholder="v.placeholder"></b-form-input>
                <div v-if="v.type == 'boolean'">
                    <b-form-checkbox :disabled="v.readonly" v-if="v.type == 'boolean'" v-model="form.config[k]">{{v.desc}}</b-form-checkbox>
                </div>
                <b-form-select v-if="v.type == 'enum'" v-model="form.config[k]" :placeholder="v.placeholder" :disabled="v.readonly">
                    <option v-for="(option, idx) in v.options" :key="idx" :value="option.value">
                        {{option.label}} <small>({{option.value}})</small>
                        <span v-if="option.desc"> - {{option.desc}}</span>
                    </option>
                </b-form-select>
                <b-form-text v-if="v.type != 'boolean'">{{v.desc}}</b-form-text>
            </b-form-group>
        </b-col>
    </b-row>

    <br>
    <b-row>
        <b-col></b-col>
        <b-col cols="9">
            <b-button variant="primary" @click="submit()">Submit</b-button>
        </b-col>
    </b-row>
</div>
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
import datatypetag from '@/components/datatypetag'
import app from '@/components/app'

const lib = require('../lib');

export default {
    components: { 
        sidemenu, contact, project, 
        tags, metadata, pageheader, 
        appavatar, select2, projectselecter, 
        app, datatypetag, 
    },

    props: [ "id" ], //appid

    data () {
        return {
            project: null,

            app: null,
            resource_available: null,
            //resource: null,

            form: {
                desc: "",
                inputs: {},
                options: {}, // explicit options to load (temporary)
                
                projects: {},
                config: {},
            },

            //cache
            datasets: {}, //available datasets grouped by input._id then project_id then array of datasets
            projects: [], //just names and group_ids
            
            config: Vue.config,
        }
    },

    mounted: function() {
        console.log("mounted");

        //load project names (used in various input selecters)
        this.$http.get('project', {params: {
            find: JSON.stringify({
                $or: [
                    { members: Vue.config.user.sub }, 
                    { access: "public" },
                ],
                removed: false,
            }),
            select: 'name group_id',
        }})
        .then(res=>{
            this.projects = {};
            res.body.projects.forEach((p)=>{
                this.projects[p._id] = p;
            });

            console.log("loaded projects");

            //load app detail
            return this.$http.get('app', {params: {
                find: JSON.stringify({_id: this.id}),
                populate: 'inputs.datatype outputs.datatype',
            }})
        })
        .then(res=>{
            this.app = res.body.apps[0];

            //TODO - update to handle nested parameters
            for(var k in this.app.config) {
                var v = this.app.config[k];
                if(v.type && v.type != "input") {
                    Vue.set(this.form.config, k, v.default);
                }
            }
            return this.$http.get(Vue.config.wf_api + '/resource/best', {params: {
                service: this.app.github
            }});
        })
        .then(res => {
            this.resource_available = !!res.body.resource
        })
        .catch(err=>{
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

            //var did = 0;
            var app_inputs = [];
            var meta = {};

            var project = this.projects[this.project];

            //first create an instance to run everything
            var instance = null;
            this.$http.post(Vue.config.wf_api+'/instance', {
                group_id: project.group_id,
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
                        //did: did++,
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
                    name: "Staged Dataset",
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
                        //did: did++,
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
                    service: this.app.github,
                    service_branch: this.app.github_branch,
                    config,
                    deps: [ download_task._id ],
                    retry: this.app.retry,
                })
            }).then(res=>{
                console.log("submitted app task", res.body.task);
                this.$router.push("/project/"+this.project+"/process/"+instance._id);
            }).catch(res=>{
                console.error(res);
                this.$notify({ text: res.body.message , type: 'error' });
            });
        },

        request_notifications: function(instance, task_id) {
            var url = document.location.origin+document.location.pathname+"/process/"+instance._id;

            //for success
            return this.$http.post(Vue.config.event_api+"/notification", {
                event: "wf.task.finished",
                handler: "email",
                config: {
                    task_id: task_id,
                    subject: "[brainlife.io] Process Completed",
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
h4 {
margin-top: 20px;
opacity: 0.6;
padding-bottom: 10px;
border-bottom: 1px solid #ddd;
font-size: 18px;
font-weight: bold;
}
</style>
