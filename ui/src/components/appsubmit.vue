<template>
<b-form v-if="app && projects" @submit="submit">
    <b-alert :show="!this.resource_available">There are currently no resource available to run this App. If you submit this App, it will be executed after a resource becomes available.</b-alert>

    <!--<h4>Input Datasets</h4>-->
    <b-row v-for="input in app.inputs" :key="input.id" style="margin-bottom: 10px;">
        <b-col cols="3">
            <small style="float: right;" class="text-muted">{{input.id}}</small>
            <datatypetag :datatype="input.datatype" :tags="input.datatype_tags"/>

            <span v-if="!input.optional">*</span>
            <span class="text-muted" v-else>(optional)</span>
        </b-col>
        <b-col>
            <b-row>
                <b-col cols="5">
                    <!--<span class="text-muted">Project</span>-->
                    <projectselecter v-model="form.projects[input.id]" placeholder="Project" @input="preselect_single_items(input)"/>
                </b-col>
                <b-col cols="7">
                    <select2 
                        v-model="form.inputs[input.id]" 
                        :dataAdapter="debounce_grab_items(input)" 
                        :allowClear="input.optional"
                        :multiple="false" 
                        :placeholder="'Input Dataset'" 
                        :options="form.options[input.id]"/>
                </b-col>
            </b-row>
            <small v-if="input.desc" class="text-muted">{{input.desc}}</small>
        </b-col>
    </b-row>
    
    <configform :spec="app.config" v-model="form.config"/>
    <hr>

    <b-row>
        <b-col class="text-muted" cols="3">Project *</b-col>
        <b-col>
            <projectselecter canwrite="true" v-model="project" placeholder="Project you'd like to run this process in" :required="true"/> 
            <small class="text-muted">Project where you want to create a new process to execute this App.</small>
        </b-col>
    </b-row>
    <br>

    <b-row>
        <b-col cols="3" class="text-muted">Description</b-col>
        <b-col>
            <b-form-textarea v-model="form.desc"
                 placeholder="Optional description for this processing"
                 :rows="3"
                 :max-rows="6"/>
            <br>
        </b-col>
    </b-row>

    <br>
    <b-row>
        <b-col cols="3"></b-col>
        <b-col>
            <b-button variant="primary" type="submit">Submit</b-button>
        </b-col>
    </b-row>
</b-form>
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import contact from '@/components/contact'
import tags from '@/components/tags'
import metadata from '@/components/metadata'
import pageheader from '@/components/pageheader'
import appavatar from '@/components/appavatar'
import select2 from '@/components/select2'
import projectselecter from '@/components/projectselecter'
import datatypetag from '@/components/datatypetag'
import app from '@/components/app'
import configform from '@/components/configform'

const lib = require('../lib');

export default {
    components: { 
        sidemenu, contact, 
        tags, metadata, pageheader, 
        appavatar, select2, projectselecter, 
        app, datatypetag, configform,
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

            /*configform takes care of this now
            //set to default values
            for(var k in this.app.config) {
                var v = this.app.config[k];
                if(v.type && v.type != "input") {
                    Vue.set(this.form.config, k, v.default);
                }
            }
            */
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
                        datatype_tags: dataset.datatype_tags,
                        tags: dataset.tags,
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
                                        var dataset_id = form.inputs[input.id];
                                        if(!dataset_id) {
                                            //optional config that's not set?
                                            delete obj[k];
                                            return; 
                                        }
                                        input.datatype.files.forEach(file=>{
                                            if(file.id == node.file_id) {
                                                obj[k] = "../"+download_task_id+"/"+dataset_id+"/"+(file.filename||file.dirname)
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

        submit: function(evt) {
            evt.preventDefault();

            //make sure all required inputs are selected
            var validated = true;
            console.dir(this.form.inputs);
            this.app.inputs.forEach(input=>{
                if(input.optional !== undefined && input.optional) return;
                console.log(input.id,"should be set");
                if(!this.form.inputs[input.id]) validated = false;
            });
            if(!this.project) validated = false;
            if(!validated) {
                this.$notify({ text: 'Please select all required field', type: 'error' });
                return;
            }

            //var did = 0;
            var app_inputs = [];
            var meta = {};

            var project = this.projects[this.project];

            //first create an instance to run everything
            var instance = null;
            var download = [];
            var _outputs = [];
            var datasets = {};
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
                res.body.datasets.forEach(d=>{
                    datasets[d._id] = d;

                });

                //issue token to download datasets 
                return this.$http.get('dataset/token', {
                    params: {
                        ids: JSON.stringify(Object.values(this.form.inputs))
                    },
                });
            }).then(res=>{
                var jwt = res.body.jwt;
                
                //create config to download all input data from archive
                for(var input_id in this.form.inputs) {
                    var dataset_id = this.form.inputs[input_id];
                    if(!dataset_id) continue; //probably optional field that's not set
                    download.push({
                        url: Vue.config.api+"/dataset/download/safe/"+dataset_id+"?at="+jwt,
                        untar: "auto",
                        dir: dataset_id,
                    });

                    var dataset = datasets[dataset_id];
                    var output = {
                        id: input_id,
                        subdir: dataset_id, 
                        dataset_id,
                        task_id: dataset.task_id,
                        datatype: dataset.datatype,
                        datatype_tags: dataset.datatype_tags,
                        tags: dataset.tags,
                        meta: dataset.meta,
                        project: dataset.project,
                    }
                    _outputs.push(output);

                    //aggregate metas
                    for(var k in dataset.meta) if(!meta[k]) meta[k] = dataset.meta[k]; //use first one

                    //turn output into input for the main app
                    var keys = [];
                    for(var key in this.app.config) {
                        if(this.app.config[key].input_id == input_id) keys.push(key); 
                    }
                    app_inputs.push(Object.assign({
                        keys,
                    }, output));
                }

                //now submit task to download data from archive
                console.log("submitting download task", download, _outputs);
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: "Staging Dataset",
                    service: "soichih/sca-product-raw",
                    config: { download, _outputs, _tid: 0 },
                })
            }).then(res=>{
                var download_task = res.body.task;
                console.log("download task submitted", download_task);
                app_inputs.forEach(input=>{
                    input.task_id = download_task._id;
                });

                //now submit the main task
                var config = Object.assign(this.generate_config(download_task._id), {
                    _app: this.app._id,
                    _tid: 1,
                    _inputs: app_inputs,
                    _outputs: [],
                });
                this.app.outputs.forEach(output=>{
                    var output_req = {
                        id: output.id,
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
