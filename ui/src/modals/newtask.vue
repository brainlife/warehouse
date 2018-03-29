<template>
<transition name="fade">
<div v-if="open" class="brainlife-modal-overlay">
<b-container class="brainlife-modal">
    <div class="brainlife-modal-header">
        <div style="float: right;">
            <div class="button" @click="open = false" style="margin-left: 20px; opacity: 0.8;">
                <icon name="close" scale="1.5"/>
            </div>
        </div>
        <h4 style="margin-top: 8px;">Submit New App</h4>
    </div><!--header-->

    <!--app selection page--> 
    <div v-if="!app" class="app-selecter">
        <div v-if="apps && apps.length == 0" style="margin: 20px;">
            <p class="text-muted">You have no application that you can submit with currently staged datasets.<br><br>Please try staging more datasets.</p>
        </div>
        <p v-else class="text-muted">You can submit following application(s) with currently available dataset.</p>

        <div style="width: 50%; float: left;" v-for="app in apps" :key="app._id">
            <div @click="selectapp(app)" style="padding-bottom: 5px; padding-right: 10px;">
                <app :app="app" :compact="true" :clickable="false" class="clickable" descheight="50px"/>
            </div>
        </div>
        <br clear="both">
    </div>

    <!--app configuration page--> 
    <b-form v-if="app" class="submit-form" @submit="submit">
        <app :app="app" :compact="false"/>
        <br>

        <!--input-->
        <b-row v-for="(input, input_id) in inputs" :key="input_id" style="margin-bottom: 5px;">
            <b-col>
                <datatypetag :datatype="input.datatype" :tags="input.datatype_tags"/>
                <span v-if="input.optional" class="text-muted">(optional)</span>
                <span v-else>*</span>
            </b-col>
            <b-col cols="8">
                <b-form-group>
                    <!--
                    <el-select @change="validate()" v-model="input.dataset_idx" 
                        no-data-text="No dataset available for this datatype / tags"
                        placeholder="Please select input dataset" 
                        style="width: 100%;">
                        <el-option v-for="dataset in filter_datasets(input)" :key="dataset.idx"
                                :value="dataset.idx" :label="compose_label(dataset)">
                            <span v-if="dataset.task.status != 'finished'">({{dataset.task.status}})</span>
                            {{dataset.task.name}} (t.{{dataset.task.config._tid}}) <icon name="arrow-right" scale="0.8"></icon>
                            <b>{{dataset.meta.subject}}</b> 
                            <small>{{dataset.datatype_tags.toString()}}</small>
                        </el-option>
                    </el-select>
                    -->
                    <v-select :onChange="validate()" v-model="input.selected" :options="vsel(filter_datasets(input))">
                        <span slot="no-options">No dataset available for this datatype / tags</span>
                        <template slot="option" slot-scope="option">
                            <span v-if="option.dataset.task.status != 'finished'">({{option.dataset.task.status}})</span>
                            {{option.dataset.task.name}} (t.{{option.dataset.task.config._tid}}) <icon name="arrow-right" scale="0.8"></icon>
                            <b>{{option.dataset.meta.subject}}</b> 
                            <small>{{option.dataset.datatype_tags.toString()}}</small>
                        </template>
                    </v-select>
                    <small v-if="input.desc" class="text-muted">{{input.desc}}</small>
                </b-form-group>
            </b-col>
        </b-row>

        <configform :spec="app.config" v-model="config"/>

        <b-row>
            <b-col cols="4"><!--archive--></b-col>
            <b-col>
                <div v-if="!archive.enable">
                    <b-form-checkbox v-model="archive.enable">Archive all output datasets when finished</b-form-checkbox>
                </div>
                <b-card v-if="archive.enable">
                    <b-form-checkbox v-model="archive.enable">Archive all output datasets when finished</b-form-checkbox>
                    <p>
                        <b>Dataset Description</b>
                        <b-form-textarea placeholder="Optional" v-model="archive.desc" :rows="3"/>
                    </p>
                    <!--
                    <p>
                        <b>Project</b> <span class="text-muted">where you'd like to store this datasets</span>
                        <projectselecter v-model="archive.project"/>
                    </p>
                    -->
                </b-card>
            </b-col>
        </b-row>

        <hr>
        <b-row>
            <b-col cols="4"></b-col>
            <b-col>
                <div style="float: right">
                    <b-button @click="back">Back</b-button>
                    <b-button variant="primary" v-if="valid" type="submit">Submit</b-button>
                </div>
            </b-col>
        </b-row>

    </b-form>
</b-container>
</div>
</transition>
</template>

<script>
import Vue from 'vue'

import app from '@/components/app'
import datatypetag from '@/components/datatypetag'
import configform from '@/components/configform'
import vSelect from 'vue-select'

const lib = require('../lib');

export default {
    components: { 
        app, datatypetag, configform, vSelect,
    },

    data() {
        return {
            open: false,

            apps: null, //applications user can run with selected data
            app: null, //selected

            //desc: null,
            config: null,
            inputs: null,

            archive: {
                enable: false,
                //project: null,
                desc: "",
            },

            datasets: null,

            deps: null,

            valid: false, //form is ready to submit or not
        }
    },

    created() {
        this.$root.$on("newtask.open", info=>{
            //receive info from client
            this.datasets = info.datasets;

            console.log("requested to open newtask modal");
            this.open = true;

            //reset form
            this.app = null;
            this.valid = false;
            this.archive.desc = "";
            this.archive.enable = false;

            //create list of all datatypes that user has staged / generated
            var datatype_ids = [];
            this.datasets.forEach(dataset=>{
                if(!~datatype_ids.indexOf(dataset.datatype)) datatype_ids.push(dataset.datatype);
            });

            //now find apps that user can submit
            this.$http.get('app', {params: {
                find: JSON.stringify({
                    "inputs.datatype": {$in: datatype_ids},
                    removed: false,
                }),
                populate: 'inputs.datatype outputs.datatype',
            }})
            .then(res=>{
                //now, pick apps that we have *all* input datasets that matches the input datatype/tags
                this.apps = [];
                res.body.apps.forEach(app=>{
                    var match = true;
                    app.inputs.forEach(input=>{
                        if(input.optional) return; //optional 
                        var matching_dataset = this.datasets.find(dataset=>{
                            if(dataset.datatype != input.datatype._id) return false;
                            var match_tag = true;
                            input.datatype_tags.forEach(tag=>{
                                //make sure tag matches
                                if(tag[0] == "!" && ~dataset.datatype_tags.indexOf(tag.substring(1))) match_tag = false;
                                if(tag[0] != "!" && !~dataset.datatype_tags.indexOf(tag)) match_tag = false;
                            });
                            return match_tag;
                        }); 
                        if(!matching_dataset) match = false;
                    });
                    if(match) {
                        //console.log("can run", app.name);
                        this.apps.push(app);
                    }
                });
            }).catch(err=>{
                console.error(err);
            });
        });

        //TODO - call removeEventListener in destroy()? Or I should do this everytime modal is shown/hidden?
        document.addEventListener("keydown", e => {
            if (e.keyCode == 27) {
                this.open = false;
            }
        });
    },

    destroyed() {
        this.$root.$off("newtask.open");
    },

    methods: {

        /*
        set_default: function(config) {
            for(var k in config) {
                var v = config[k];
                if(!v.type) this.set_default(v); //primitive should recurse
                else if(v.type != "input") Vue.set(config, k, v.default);
            }
        },
        */
        
        selectapp: function(app) {
            this.app = app;

            //this.config = Object.assign({}, app.config);
            //this.set_default(this.config);
            console.log("resetting this.config");
            this.config = {};

            this.inputs = {}; //reset first
            this.app.inputs.forEach(input=>{
                var input_copy = Object.assign({
                    selected: null, 
                    options: this.vsel(this.filter_datasets(input)),
                }, input);
                Vue.set(this.inputs, input.id, input_copy);
                this.preselect_single_items(input_copy);
            });

            this.validate(); //for preselect
        },

        back: function() {
            this.app = null;
        },

        preselect_single_items: function(input) {
            //var datasets = this.filter_datasets(input);
            if (input.options.length == 1) {
                //Vue.set(this.inputs[input.id], 'selected', datasets[0].idx);
                this.inputs[input.id].selected = input.options[0];
            }
        },

        validate: function() {
            var valid = true; //innocent until proven guilty

            if(!this.app) {
                valid = false;
            } else {
                //make sure all inputs are selected
                for(var input_id in this.inputs) {
                    var input = this.inputs[input_id];
                    if(!input.optional && !input.selected) {
                        valid = false;
                    }
                }
            }
            this.valid = valid;
        },

        process_input_config: function(config) {
            for(var k in this.app.config) { 
                var node = this.app.config[k];
                if(node.type && node.type == "input") {
                    var input = this.inputs[node.input_id];
                    if(!input.selected) continue; //optional input not selected?
                    var dataset = input.selected.dataset;

                    var base = "../"+dataset.task._id;
                    if(dataset.subdir) base+="/"+dataset.subdir;
                    if(!~this.deps.indexOf(dataset.task._id)) this.deps.push(dataset.task._id);

                    //use file path specified in datatype..
                    var file = input.datatype.files.find(file=>file.id == node.file_id);
                    if(!file) {
                        console.error("failed to find file id", node.file_id);
                        config[k] = "no such file_id:"+node.file_id;
                        break;
                    }
                    config[k] = base+"/"+(file.filename||file.dirname);
                    //but override it if filemapping from the input dataset is provided
                    if(dataset.files && dataset.files[node.input_id]) {
                        config[k] = base+"/"+dataset.files[node.file_id];
                    }
                }
            }
        },

        //select all datasets that meets datatype requirement of 'input', that comes from task with name:task_name
        filter_datasets: function(input) {
            return lib.filter_datasets(this.datasets, input);
        },

        vsel: function(datasets) {
            return datasets.map(dataset=>{
                return { label: this.compose_label(dataset), dataset };
            });
        },

        submit: function(evt) {
            evt.preventDefault();

            //now construct the task objeect
            this.deps = [];
            this.process_input_config(this.config);
            var meta = {};
            var _inputs = [];
            for(var input_id in this.inputs) {
                var input = this.inputs[input_id];
                if(!input.selected) continue; //optional input not selected?
                var dataset = input.selected.dataset; 

                /*
                var copy_dataset = Object.assign({}, dataset);
                copy_dataset.task_id = dataset.task._id;
                //copy_dataset.app_id = dataset.task.config._app; //testing..
                //copy_dataset.output_id = copy_dataset.id; //this becomes output_id
                //copy_dataset.id = input_id; //I believe this is not needed

                //aggregate file mappings (keys) from this input (used to help app discover which input is for which config key)
                */

                var keys = [];
                for(var key in this.app.config) {
                    if(this.app.config[key].input_id == input_id) keys.push(key); 
                }
                _inputs.push({
                    id: input_id, 
                    task_id: dataset.task._id, //unpopulate
                    subdir: dataset.subdir, //is this right? (should come from prov?)
                    meta: dataset.meta,
                    tags: dataset.tags,
                    datatype: dataset.datatype,
                    dataset_id: dataset._id,
                    datatype_tags: dataset.datatype_tags,
                    project: dataset.project,
                    keys,
                });

                //aggregating meta from all inputs
                //TODO - I need a better way to discover meta (like letting app to decide?)
                //TODO - if 2 inputs has different value for the same meta (like subject) the latterr wins.. bad!
                for(var k in dataset.meta) {
                    if(!meta[k]) meta[k] = dataset.meta[k]; //use first one
                }
            }

            this.config._inputs = _inputs;
            this.config._app = this.app._id;
            var _outputs = [];
            this.app.outputs.forEach(output=>{
                var output_req = {
                    id: output.id,
                    datatype: output.datatype._id,
                    datatype_tags: output.datatype_tags,
                    desc: output.id+ " from "+this.app.name,
                    meta,
                    files: output.files,
                };
                if(this.archive.enable) output_req.archive = {
                    //project: this.project,  //should be set by the client
                    desc: this.archive.desc,
                }
                _outputs.push(output_req);
            });
            this.config._outputs = _outputs;

            //ship it!
            let task = {
                //instance_id: this.instance._id, //should be set by the client
                name: this.app.name,
                desc: this.desc,
                service: this.app.github, 
                service_branch: this.app.github_branch, 
                config: this.config,
                deps: this.deps,
                retry: this.app.retry,
            };
            this.$root.$emit("newtask.submit", task);
            this.open = false;
        },

        compose_label: function(dataset) {
            var label = "";
            if(dataset.task.status != 'finished') label += "("+dataset.task.status+") ";
            label += dataset.task.name+' (t.'+dataset.task.config._tid+') '+' > '+dataset.meta.subject;
            if(dataset.datatype_tags.length > 0) label += ' > '+dataset.datatype_tags;
            //if(dataset.tags.length > 0) label +=' | '+dataset.tags; //I am not sure if we need to show tag..
            return label;
        },
    },
} 
</script>

<style scoped>
.app-selecter,
.submit-form {
position: absolute;
left: 0px;
right: 0px;
top: 60px;
padding: 20px;
bottom: 0px;
overflow: auto;
}
</style>
