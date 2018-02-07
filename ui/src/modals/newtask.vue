<template>
<b-modal title="Submit New Task" ref="modal" id="newtaskModal" size="lg" @ok="submit">
    <!--app selection page--> 
    <transition name="fade">
    <div v-if="!app">
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
    </transition>

    <!--app configuration page--> 
    <transition name="fade">
    <div v-if="app">
        <app :app="app" :compact="false"/>
        <br>

        <!--input-->
        <b-row v-for="(input, input_id) in inputs" :key="input_id" style="margin-bottom: 5px;">
            <b-col cols="4">
                <datatypetag :datatype="input.datatype" :tags="input.datatype_tags"/>
            </b-col>
            <b-col>
                <b-form-group>
                    <el-select @change="validate()" v-model="input.dataset_idx" 
                        no-data-text="No dataset available for this datatype / tags"
                        placeholder="Please select input dataset" 
                        style="width: 100%;">
                        <el-option v-for="dataset in filter_datasets(input)" :key="dataset.idx"
                                :value="dataset.idx" 
                                :label="dataset.task.name+' (t.'+dataset.task.config._tid+') '+' > '+dataset.meta.subject+' > '+dataset.datatype_tags+' | '+dataset.tags">
                            <span v-if="dataset.task.status != 'finished'">(Processing)</span>
                            {{dataset.task.name}} (t.{{dataset.task.config._tid}}) <icon name="arrow-right" scale="0.8"></icon>
                            <b>{{dataset.meta.subject}}</b> 
                            <small>{{dataset.datatype_tags.toString()}}</small>
                            <!--(d.{{dataset.did}})-->
                        </el-option>
                    </el-select>
                </b-form-group>
            </b-col>
        </b-row>

        <!--config-->
        <b-row v-for="(v,k) in app.config" :key="k" v-if="v.type && v.type != 'input'">
            <b-col cols="4">{{k}}</b-col>
            <b-col>
                <b-form-group>
                    <!--integer is deprecated-->
                    <b-form-input type="number" v-if="v.type == 'number' || v.type == 'integer'" :readonly="v.readonly" v-model.number="config[k]" :placeholder="v.placeholder"/>
                    <b-form-input type="text" v-if="v.type == 'string'" :readonly="v.readonly" v-model="config[k]" :placeholder="v.placeholder"/>
                    <div v-if="v.type == 'boolean'">
                        <b-form-checkbox :disabled="v.readonly" v-model="config[k]">{{v.desc}}</b-form-checkbox>
                    </div>
                    <b-form-select v-if="v.type == 'enum'" v-model="config[k]" :placeholder="v.placeholder" :disabled="v.readonly">
                        <option v-for="(option, idx) in v.options" :key="idx" :value="option.value">
                            {{option.label}} <small>({{option.value}})</small>
                            <span v-if="option.desc"> - {{option.desc}}</span>
                        </option>
                    </b-form-select>
                    <b-form-text v-if="v.type != 'boolean'">{{v.desc}}</b-form-text>
                </b-form-group>
            </b-col>
        </b-row>


        <!-- people don't really use this to set meaningful description..
        <hr>
        <b-row>
            <b-col cols="4">Task Description</b-col>
            <b-col>
                <b-form-textarea placeholder="Optional description for this task submission" v-model="desc" :rows="2" :max-rows="6"></b-form-textarea>
            </b-col>
        </b-row>
        <br>
        -->

        <b-row>
            <b-col cols="4"><!--archive--></b-col>
            <b-col>
                <div v-if="!archive.enable">
                    <el-checkbox v-model="archive.enable"></el-checkbox> Archive all output datasets when finished
                </div>
                <b-card v-if="archive.enable">
                    <el-checkbox v-model="archive.enable"></el-checkbox> Archive all output datasets when finished
                    <p>
                        <b>Dataset Description</b>
                        <el-input type="textarea" placeholder="Optional" v-model="archive.desc" :autosize="{minRows: 2, maxRows: 5}"></el-input>
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
    </div><!--v-if="app"-->
    </transition>
    <br>

    <div slot="modal-footer">
        <b-button variant="primary" v-if="valid" @click="submit">Submit</b-button>
        <b-button @click="cancel" v-if="!app">Cancel</b-button>
        <b-button @click="back" v-if="app">Back</b-button>
    </div>
</b-modal>
</template>

<script>
import Vue from 'vue'

import app from '@/components/app'
import datatypetag from '@/components/datatypetag'

const lib = require('../lib');

export default {
    components: { 
        app, datatypetag, 
    },

    data() {
        return {
            apps: null, //applications user can run with selected data
            app: null, //selected

            desc: null,
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

    destroyed() {
        this.$root.$off("newtask.open");
    },

    mounted() {
        console.log("listening to newtask.open");
        this.$root.$on("newtask.open", info=>{
            //receive info from client
            this.datasets = info.datasets;

            console.log("requested to open newtask modal");
            if(!this.$refs.modal) alert('modal not set');
            this.$refs.modal.show()

            this.app = null;
            this.valid = false;

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
                        //if(!~datatype_ids.indexOf(input.datatype._id)) match = false;
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

        /*
        //TODO - call removeEventListener in destroy()? Or I should do this everytime modal is shown/hidden?
        document.addEventListener("keydown", e => {
            if (e.keyCode == 27) {
                this.close();
            }
        });
        */
    },

    methods: {

        set_default: function(config) {
            for(var k in config) {
                var v = config[k];
                if(!v.type) this.set_default(v); //primitive should recurse
                else if(v.type != "input") Vue.set(config, k, v.default);
            }
        },
        
        selectapp: function(app) {
            this.app = app;
            this.config = Object.assign({}, app.config);

            this.set_default(this.config);
            this.inputs = {}; //reset first
            this.app.inputs.forEach(input=>{
                var input_copy = Object.assign({dataset_idx: ''}, input);
                Vue.set(this.inputs, input.id, input_copy);
                this.preselect_single_items(input);
            });
            this.validate(); //for preselect
        },

        cancel: function() {
            this.$refs.modal.hide();
        },
        back: function() {
            this.app = null;
            this.validate();
        },

        preselect_single_items: function(input) {
            var datasets = this.filter_datasets(input);
            if (datasets.length == 1) {
                Vue.set(this.inputs[input.id], 'dataset_idx', datasets[0].idx);
            }
        },

        validate: function(val) {
            var valid = true; //innocent until proven guilty

            if(!this.app) {
                valid = false;
            } else {
                //make sure all inputs are selected
                for(var input_id in this.inputs) {
                    var input = this.inputs[input_id];
                    if(input.dataset_idx === '') valid = false;
                }
            }
            this.valid = valid;
        },

        //recursively update configuration with given newtask
        process_input_config: function(config) {
            for(var k in config) { 
                var node = config[k];
                if(node instanceof Array) {
                    console.log("todo.. array!");
                } else if(typeof node === 'object') {
                    if(node.type) {
                        switch(node.type) {
                        case "input":
                            var input = this.inputs[node.input_id];
                            var dataset = this.datasets[input.dataset_idx];

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
                            break;
                        default:
                            config[k] = "unknown_template_type";
                        }
                    } else this.process_input_config(node); //recurse to child node
                }
            }
        },

        //select all datasets that meets datatype requirement of 'input', that comes from task with name:task_name
        filter_datasets: function(input) {
            return lib.filter_datasets(this.datasets, input);
        },

        submit: function() {
            //now construct the task objeect
            this.deps = [];
            this.process_input_config(this.config);
            var meta = {};
            var _inputs = [];
            for(var input_id in this.inputs) {
                var input = this.inputs[input_id];
                var dataset = this.datasets[input.dataset_idx];

                var copy_dataset = Object.assign({}, dataset);
                copy_dataset.task_id = dataset.task._id;
                copy_dataset.app_id = dataset.task.config._app; //testing..
                copy_dataset.output_id = copy_dataset.id; //this becomes output_id
                copy_dataset.id = input_id;
                delete copy_dataset.task;
                _inputs.push(copy_dataset);

                //aggregating meta
                //TODO - I need a better way to discover meta (like letting app to decide?)
                //TODO - if 2 inputs has different value for the same meta (like subject) the latterr wins.. bad!
                for(var k in dataset.meta) meta[k] = dataset.meta[k];
            }
            this.config._inputs = _inputs;
            this.config._app = this.app._id;
            //this.config._tid = this.next_tid(); //added by the client
            var _outputs = [];
            //var did = this.next_did();
            this.app.outputs.forEach(output=>{
                var output_req = {
                    id: output.id,
                    //did: did++,
                    datatype: output.datatype._id,
                    datatype_tags: output.datatype_tags,
                    desc: output.id+ " from "+this.app.name,
                    meta,
                    //tags: ["sometags"], //TODO?
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
            this.$refs.modal.hide();
        },
    },
} 
</script>
<style scoped>
</style>
