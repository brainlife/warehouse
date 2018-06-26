<template>
<b-form @submit="submit">
    <b-alert :show="this.no_resource">There are currently no resource available to run this App. If you submit this App, it will be executed after a resource becomes available.</b-alert>

    <b-row v-for="input in app.inputs" :key="input.id" style="margin-bottom: 10px;">
        <b-col cols="3">
            <small style="float: right;" class="text-muted">{{input.id}}</small>
            <datatypetag :datatype="input.datatype" :tags="input.datatype_tags"/>

            <span v-if="!input.optional">*</span>
            <span class="text-muted" v-else>(optional)</span>
        </b-col>
        <b-col>
            <b-row v-for="(item, idx) in form.inputs[input.id]" :key="idx" style="margin-bottom: 5px;">
                <b-col cols="5">
                    <projectselecter 
                        v-model="form.projects[input.id]" 
                        :datatype="input.datatype"
                        :datatype_tags="input.datatype_tags"
                        placeholder="Select Project" 
                        @input="form.inputs[input.id][idx] = null"/>
                </b-col>
                <b-col cols="6">
                    <select2 
                        v-if="form.projects[input.id]"
                        v-model="form.inputs[input.id][idx]" 
                        :dataAdapter="debounce_fetch_datasets(input)" 
                        :allowClear="input.optional"
                        :multiple="false" 
                        :placeholder="'Select Input Dataset'" 
                        :options="form.options[input.id]"/>
                </b-col>
                <b-col cols="1" v-if="input.multi">
                    <div class="button button-danger" @click="form.inputs[input.id].splice(idx, 1)" size="sm"><icon name="trash"/></div>
                </b-col>
            </b-row>
            <b-row>
                <b-col cols="5">
                    <small v-if="input.desc" class="text-muted">{{input.desc}}</small>
                </b-col>
                <b-col cols="6" style="text-align:right;">
                    <b-button :size="'sm'" :variant="'secondary'" @click="form.inputs[input.id].push(null)" v-if="input.multi">Add Dataset</b-button>
                </b-col>
            </b-row>
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
    
    <advanced :app='app' v-model='form.advanced'></advanced>

    <br>
    <br>
    <br>
    <div class="form-action">
        <b-button variant="primary" type="submit">Submit</b-button>
    </div>

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
import advanced from '@/components/appadvanced'

import agreementMixin from '@/mixins/agreement'

const lib = require("../lib");
const async = require("async");

export default {
    mixins: [agreementMixin],
    components: { 
        sidemenu, contact, 
        tags, metadata, pageheader, 
        appavatar, select2, projectselecter, 
        app, datatypetag, configform, advanced
    },

    props: [ "id" ], //appid

    data () {
        return {
            project: null,

            app: null,
            no_resource: false,

            form: {
                desc: "",
                inputs: {}, //input_id as key, and array of dataset ids selected
                options: {}, // explicit options to load (temporary)
                
                projects: {},
                config: {},
                advanced: {},
            },

            //cache
            datasets: {}, //available datasets grouped by input._id then project_id then array of datasets
            //projects: [], //just names and group_ids
            
            config: Vue.config,
        }
    },

    mounted: function() {
        console.log("mounted");

        //load app detail
        return this.$http.get('app', {params: {
            find: JSON.stringify({_id: this.id}),
            populate: 'inputs.datatype outputs.datatype',
        }})
        .then(res=>{
            this.app = res.body.apps[0];
            this.github_branch = this.app.github_branch || 'master';

            //initialize input datasets array (with null as first item)
            for(var idx in this.app.inputs) {
                var input = this.app.inputs[idx];
                Vue.set(this.form.inputs, input.id, [null]);
            }

            return this.$http.get(Vue.config.wf_api + '/resource/best', {params: {
                service: this.app.github
            }});
        })
        .then(res => {
            this.no_resource = !res.body.resource;
        })
        .catch(err=>{
            console.error(err);
        });
    },

    methods: {
        
        // if there's only 1 applicable dataset for a given input, pre-select it
        //TODO - update to make it work with array input
        /*
        preselect_single_items: function(input) {
            this.fetch_datasets(input, {}, data => {
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
        */

        fetch_datasets: function(input, params, cb) {
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
        
        // wait a bit (unless interrupted by more keystrokes), then calls fetch_datasets
        debounce_fetch_datasets: function(input) {
            let debounce;
            
            // return a new fetch_datasets event that can be called for each input datatype
            // params + cb are input from select2
            return (params, cb) => {
                // debounce handling without lodash
                if (debounce) {
                    clearTimeout(debounce);
                    debounce = null;
                }
                debounce = setTimeout(()=>{
                    debounce = null;
                    this.fetch_datasets(input, params, cb);
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
                                        var dataset_ids = form.inputs[input.id];
                                        var allnull = true;
                                        dataset_ids.forEach(id=>{
                                            if(id) allnull = false;
                                        });
                                        if(allnull) {
                                            //optional config that's not set?
                                            delete obj[k];
                                            return; 
                                        }
                                        //find the file
                                        input.datatype.files.forEach(file=>{
                                            if(file.id == node.file_id) {
                                                if(input.multi) {
                                                    obj[k] = [];
                                                    dataset_ids.forEach(dataset_id=>{
                                                        obj[k].push("../"+download_task_id+"/"+dataset_id+"/"+(file.filename||file.dirname));
                                                    });
                                                } else {
                                                    //single
                                                    obj[k] = "../"+download_task_id+"/"+dataset_ids[0]+"/"+(file.filename||file.dirname)
                                                }
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


        validate: function() {
            var validated = true;
            this.app.inputs.forEach(input=>{
                if(input.optional !== undefined && input.optional) return;
                //count number of non nulls
                if(this.form.inputs[input.id].filter(id=>id!=null).length == 0) {
                    this.$notify({ text: 'Please select '+input.id, type: 'error' });
                    validated = false;
                }
            });
            if(!this.project) {
                this.$notify({ text: 'Please select project', type: 'error' });
                validated = false;
            }
            return validated;
        },

        submit: function(evt) {
            evt.preventDefault();
            if(!this.validate()) return;

            //remove null inputs 
            this.app.inputs.forEach(input=>{
                this.form.inputs[input.id] = this.form.inputs[input.id].filter(id=>id!=null);
            });

            var all_dataset_ids = [];
            for(var input_id in this.form.inputs) {
                all_dataset_ids = all_dataset_ids.concat(this.form.inputs[input_id]);
            }

            var app_inputs = [];
            var meta = {};
            var project = null;
            var instance = null;
            var download = [];
            var _outputs = [];
            var datasets = {};

            //load project detail for project selected and desintation project
            let project_ids = [ this.project ]; //desintation
            //for project selected for input
            for(let input_id in this.form.projects) {
                project_ids.push(this.form.projects[input_id]);
            }
            this.$http.get('project', {params: {
                find: JSON.stringify({
                   _id: {$in : project_ids}
                }),
                select: 'name group_id agreements',
            }}).then(res=>{
                project = res.body.projects.find(p=>p._id == this.project);

                //make sure user has met agreements to all projects used
                return new Promise((resolve, reject)=>{
                    async.eachSeries(res.body.projects, this.check_agreements, err=>{
                        if(err) return reject(err);

                        //create an instance to run everything
                        this.$http.post(Vue.config.wf_api+'/instance', {
                            group_id: project.group_id,
                            desc: this.form.desc||this.app.name,
                            config: {
                                brainlife: true,
                                //type: "v2",
                            },
                        }).then(resolve);
                    });
                }); 
            }).then(res=>{
                instance = res.body;
                console.log("instance created", instance);

                //pull datasets info that we are submitting with
                return this.$http.get('dataset', {params: {
                    find: JSON.stringify({_id: {$in: all_dataset_ids}}),
                }})
            }).then(res=>{
                res.body.datasets.forEach(d=>{
                    datasets[d._id] = d;
                });

                //issue token to download datasets 
                return this.$http.get('dataset/token', {
                    params: {
                        ids: JSON.stringify(all_dataset_ids)
                    },
                });
            }).then(res=>{
                var jwt = res.body.jwt;
                
                //create config to download all input data from archive
                for(var input_id in this.form.inputs) {
                    this.form.inputs[input_id].forEach(dataset_id=>{
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
                    });
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
                        //datatype_tags: output.datatype_tags,
                        desc: output.id+ " from "+this.app.name,
                        meta,
                        files: output.files,
                    };

                    //handle tag passthrough
					var tags = [];
                    if(output.datatype_tags_pass) {
                        this.form.inputs[output.datatype_tags_pass].forEach(dataset_id=>{
							tags = tags.concat(tags, datasets[dataset_id].datatype_tags);
                        }); 
                    }
					//.. and add app specified output tags at the end
					tags = tags.concat(tags, output.datatype_tags); 
                    output_req.datatype_tags = lib.uniq(tags);

                    config._outputs.push(output_req);
                });

                let submissionParams = {
                    instance_id: instance._id,
                    name: this.app.name,
                    service: this.app.github,
                    service_branch: this.app.github_branch,
                    config,
                    deps: [ download_task._id ],
                    retry: this.app.retry,
                };
                if (this.form.advanced.resource) submissionParams.preferred_resource_id = this.form.advanced.resource;
                if (this.form.advanced.branch) submissionParams.service_branch = this.form.advanced.branch;
                
                return this.$http.post(Vue.config.wf_api+'/task', submissionParams);
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
.form-action {
text-align: right;
position: fixed;
right: 0px;
left: 90px;
bottom: 0px;
padding: 10px 30px;
background-color: rgba(100,100,100,0.4);
}
</style>
