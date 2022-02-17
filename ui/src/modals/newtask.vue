<template>
<transition name="fade">
<div v-if="open" class="brainlife-modal-overlay">
<b-container class="brainlife-modal">
    <div class="brainlife-modal-header">
        <div class="brainlife-modal-header-buttons">
            <div class="button" @click="open = false" style="margin-left: 20px; opacity: 0.8;">
                <icon name="times" scale="1.5"/>
            </div>
        </div>
        <h4 style="margin-top: 5px;">Submit App</h4>
    </div><!--header-->

    <!--app selection page--> 
    <div v-if="!app" class="app-selecter">
        <div v-if="apps.all">
            <b-alert v-if="!loading && apps.all.length == 0" show variant="secondary">There are no Apps that can be submitted with currently staged data.</b-alert>
            <div v-else>
                <icon name="search" class="search-icon" scale="1.3"/>
                <input class="search" ref="search" v-model="filter" placeholder="Filter Apps" @change="update_lists"/>
            </div>

            <div class="apps">
                <!-- if there are too many apps, show popular and non-popular separately-->
                <div v-if="apps.filtered.length > 9">
                    <h3><icon name="fire-alt"/> Popular</h3>
                    <div v-for="app in apps.popular" :key="app._id">
                        <div class="app" @click="selectapp(app)">
                            <app :app="app" :clickable="false" class="clickable" height="230px"/>
                        </div>
                    </div>
                    <br style="clear: both"/>
                    <h3>Others</h3>
                    <div v-for="app in apps.not_popular" :key="app._id">
                        <div class="app" @click="selectapp(app)">
                            <app :app="app" :clickable="false" class="clickable" height="230px"/>
                        </div>
                    </div>
                </div>

                <!--show everything together if there are less than 9-->
                <div v-else>
                    <div v-for="app in apps.filtered" :key="app._id">
                        <div class="app" @click="selectapp(app)">
                            <app :app="app" :clickable="false" class="clickable" height="230px"/>
                        </div>
                    </div>
                    <br>
                </div>

                <br clear="both">
                <small>* If you cannot find the App you are looking for, please check the required inputs for the App and make sure you have staged/generated all required data-objects with those datatypes.</small>
            </div>

        </div> 

        <br clear="both">
    </div>

    <!--app configuration page--> 
    <b-form v-if="app" class="submit-form" @submit="submit">
        <div class="form-body">
            <div class="selected-app">
                <app :app="app" :clickable="false" height="inherit"/>
            </div>
            <div style="margin: 20px">
                <b-row v-for="(input, input_id) in inputs" :key="input_id" style="margin-bottom: 5px;">
                    <b-col cols="3">
                        <span style="opacity: 0.8">{{input_id}}</span>
                        <datatypetag :datatype="input.datatype" :tags="input.datatype_tags"/>
                        <span v-if="input.optional" style="opacity: 0.8">(optional)</span>
                        <span v-else>*</span>
                        <span v-if="input.multi" style="opacity: 0.8">(multi)</span>
                    </b-col>
                    <b-col>
                        <b-form-group>
                            <b-row v-for="(it, idx) in input.selected" style="margin-bottom: 5px;" :key="idx">
                                <b-col>
                                    <v-select 
                                        @input="change_input(input)" 
                                        placeholder="Select Input Dataset"
                                        v-model="input.selected[idx]" 
                                        :options="wrap_with_label(filter_datasets(input))">
                                        <span slot="no-options">No dataset available for this datatype / tags</span>

                                        <template slot="option" slot-scope="option">
                                            <span v-if="option.dataset.task.status != 'finished'">({{option.dataset.task.status}})</span>
                                            {{option.dataset.task.name}} <span v-if="option.dataset.task.config._tid">(t.{{option.dataset.task.config._tid}})</span> <icon name="arrow-right" scale="0.8"></icon>
                                            <b>{{option.dataset.meta.subject}}</b> 
                                            <small v-if="option.dataset.meta.session"> / {{option.dataset.meta.session}}</small>
                                            <small v-if="option.dataset.datatype_tags">{{option.dataset.datatype_tags.toString()}}</small>
                                            <span v-if="option.dataset.tags.length > 0">
                                                |
                                                <small>{{option.dataset.tags.toString()}}</small>
                                            </span>
                                        </template>
                                    </v-select>
                                </b-col>
                                <b-col cols="1" v-if="input.multi">
                                    <div class="button button-danger" v-if="input.selected[idx]"
                                        @click="input.selected.splice(idx, 1)" size="sm"><icon name="trash"/></div>
                                </b-col>
                            </b-row>
                            <p v-if="input.multi">
                                <b-button variant="outline-secondary" size="sm" @click="selectAllAvailable(input)">Select All Staged</b-button>
                            </p>
                            <small v-if="input.desc" style="opacity: 0.8; white-space: pre-wrap;">{{input.desc}}</small>
                        </b-form-group>
                    </b-col>
                </b-row>
                
                <configform :spec="app.config" v-model="config"/>

                <hr>
                <advanced :app='app' v-model='advanced' :gids="appGids">
                    <configform :spec="app.config" v-model="config" :advanced="true"/>
                </advanced>
                <hr>

                <b-row>
                    <b-col cols="3">Notes</b-col>
                    <b-col>
                        <b-form-textarea placeholder="Optional task description (markdown OK)" v-model="desc" :rows="2"/>
                        <br>
                    </b-col>
                </b-row>

                <b-row v-if="this.app.outputs.length > 0">
                    <b-col cols="3"></b-col>
                    <b-col>
                        <b-row>
                            <b-col>
                                <div v-if="!archive.enable">
                                    <b-form-checkbox v-model="archive.enable">Archive all output when finished</b-form-checkbox>
                                </div>
                                <b-card v-if="archive.enable" style="margin-bottom: 10px;">
                                    <b-form-checkbox v-model="archive.enable">Archive all output when finished</b-form-checkbox>
                                    <p>
                                        <b>Description (optional)</b>
                                        <b-form-textarea placeholder="Description for archived data" v-model="archive.desc" :rows="2"/>
                                    </p>
                                    <p>
                                        <b>Tags (optional)</b>
                                        <tageditor placeholder="Tags to set for archived data" v-model="tags" :options="alltags"/>
                                        <small style="opacity: 0.8">* Description / tags will be applied to all output</small>
                                    </p>
                                </b-card>
                            </b-col>
                        </b-row>
                    </b-col>
                </b-row>
            </div>
            <br>
        </div><!--form-body-->

        <div class="form-action">
            <b-button @click="back">Back</b-button>
            <b-button variant="primary" :disabled="!valid" type="submit">Submit</b-button>
        </div>
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
import advanced from '@/components/appadvanced'
import tageditor from '@/components/tageditor'

const lib = require('../lib');

export default {
    components: { 
        app, datatypetag, configform, advanced, tageditor,
    },

    data() {
        return {
            open: false,

            filter: "",

            loading: false,
            app: null, //selected
            tags: [],

            apps: {
                all: [], //applications user can run with selected data
                filtered: [],
                popular: [],
                not_popular: [],
            },

            alltags: [], 

            config: null,
            inputs: null,

            archive: {
                enable: false,
                desc: "",
            },

            datasets: null,
            project: null, 

            deps_config: null,

            advanced: {},

            desc: "",

            valid: false, //form is ready to submit or not
        }
    },

    created() {
        this.$root.$on("newtask.open", info=>{
            //receive info from client
            this.datasets = info.datasets;
            this.project = info.project;
            this.open = true;
            this.$nextTick(()=>{
                this.$refs.search.focus();
            });

            //reset form
            this.app = null;
            this.valid = false;
            this.archive.desc = "";
            this.archive.enable = false;
            this.tags = [];
            this.desc = "";
            this.filter = "";

            this.apps.all = [];
            this.apps.filtered = [];
            this.apps.popular = [];
            this.apps.not_popular = [];

            this.loading = true;

            //create list of all datatypes that user has staged / generated
            var datatype_ids = [];
            this.datasets.forEach(dataset=>{
                if(!~datatype_ids.indexOf(dataset.datatype)) datatype_ids.push(dataset.datatype);
            });

            //load all tags
            //load tags from other datasets in this project
            this.$http.get('dataset/distinct', {params: {
                find: JSON.stringify({"project": this.project._id}),
                distinct: 'tags',
            }}).then(res=>{
                this.alltags = res.data;
            });

            //now find apps that user can submit
            this.$http.get('app', {params: {
                find: JSON.stringify({
                    "inputs.datatype": {$in: datatype_ids},
                    removed: false,
                }),
                sort: 'name', 
                populate: 'inputs.datatype outputs.datatype',
                limit: 500, //TODO - this is not sustailable
            }})
            .then(res=>{
                //now, pick apps that we have *all* input datasets that matches the input datatype/tags
                res.data.apps.forEach(app=>{
                    var match = true;
                    app.inputs.forEach(input=>{
                        if(input.optional) return; //optional 
                        var matching_dataset = this.datasets.find(dataset=>{
                            if(!input.datatype) return false; //only happens on dev?
                            if(dataset.datatype != input.datatype._id) return false;
                            var match_tag = true;
                            if(dataset.datatype_tags) input.datatype_tags.forEach(tag=>{
                                //make sure tag matches
                                if(tag[0] == "!" && ~dataset.datatype_tags.indexOf(tag.substring(1))) match_tag = false;
                                if(tag[0] != "!" && !~dataset.datatype_tags.indexOf(tag)) match_tag = false;
                            });
                            return match_tag;
                        }); 
                        if(!matching_dataset) match = false;
                    });
                    if(match) this.apps.all.push(app);
                });
                this.update_lists();
                this.loading = false;
            }).catch(console.error);
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

    watch: {
        filter(v, ov) {
            this.update_lists();
        },
    },

    computed: {
        appGids() {
            const gids = [this.project.group_id];
            if(!this.project.noPublicResource) gids.push(1);
            return gids;
        }
    },

    methods: {
        update_lists() {
            //apply filter
            if(!this.filter) this.apps.filtered = this.apps.all.sort((a,b)=>a.name - b.name);
            let l_filter = this.filter.toLowerCase();
            this.apps.filtered = this.apps.all.filter(app=>{
                let match = false;
                if(app.name && app.name.toLowerCase().includes(l_filter)) match = true;
                if(app.desc && app.desc.toLowerCase().includes(l_filter)) match = true;
                if(app.desc_override && app.desc_override.toLowerCase().includes(l_filter)) match = true;
                if(app.github.toLowerCase().includes(l_filter)) match = true;

                app.inputs.forEach(input=>{
                    if(input.datatype.name.toLowerCase().includes(l_filter)) match = true;
                    if(input.datatype_tags) input.datatype_tags.forEach(tag=>{
                        if(tag.toLowerCase().includes(l_filter)) match = true;
                    });
                });
                app.outputs.forEach(output=>{
                    if(!output.datatype) {
                        //happens on dev..
                        console.error(output);
                        return; 
                    }
                    if(output.datatype.name.toLowerCase().includes(l_filter)) match = true;
                    if(output.datatype_tags) output.datatype_tags.forEach(tag=>{
                        if(tag.toLowerCase().includes(l_filter)) match = true;
                    });
                });
                return match;
            });

            let popular_ordered = this.apps.filtered.map(a=>{
                if(!a.stats) a.stats = {users: 0};
                return a;
            }).sort((a,b)=>b.stats.users-a.stats.users)

            this.apps.popular = popular_ordered.slice(0, 9);
            this.apps.not_popular = popular_ordered.slice(9);
        },

        selectapp(app) {
            this.app = app;
            this.github_branch = this.app.github_branch || 'master';
            this.config = {};
            this.inputs = {}; 
            this.app.inputs.forEach(input=>{
                var input_copy = Object.assign({
                    selected: [null], 
                    options: this.wrap_with_label(this.filter_datasets(input)),
                }, input);
                Vue.set(this.inputs, input.id, input_copy);
                this.preselect_single_items(input_copy);
            });

            this.validate(); //for preselect
        },

        back() {
            this.app = null;
        },

        preselect_single_items(input) {
            if (input.options.length == 1) {
                //we know which item goes here, but don't use it twice..
                let selected = [];
                for(let id in this.inputs) {
                    let item = this.inputs[id].selected[0];
                    if(item) selected.push(item.dataset.id);
                }
                //ok.. never been used, let's use it
                if(!selected.includes(input.options[0].dataset.id)) {
                    this.inputs[input.id].selected[0] = input.options[0];
                }
            }
        },

        change_input(input) {
            //make sure at least one null dataset exists
            if(input.multi && !input.selected.includes(null)) {
                input.selected.push(null); 
            } 

            this.validate();
        },

        validate() {
            var valid = true; //innocent until proven guilty

            if(!this.app) {
                valid = false;
            } else {
                //make sure all non-optinal inputs has at least one dataset selected
                for(var input_id in this.inputs) {
                    var input = this.inputs[input_id];
                    if(!input.optional && input.selected.filter(id=>id!=null).length == 0) {
                        valid = false;
                    }
                }
            }
            this.valid = valid;
        },

        //transform config object
        process_input_config(config) {
            for(var k in this.app.config) { 
                var node = this.app.config[k];
                if(node.type && node.type == "input") {
                    var input = this.inputs[node.input_id]; //input spec from the app registration
                    if(input.multi) config[k] = [];

                    //we handle multiple input for UI
                    input.selected.forEach(selected=>{
                        if(!selected) return; //not set for optional input?
                        var dataset = selected.dataset;

                        let dep_config = this.deps_config.find(dep=>dep.task == dataset.task._id);
                        if(!dep_config) {
                            dep_config = {task: dataset.task._id};
                            this.deps_config.push(dep_config);
                        }

                        //use file path specified in datatype..
                        var file = input.datatype.files.find(file=>file.id == node.file_id);
                        if(!file) {
                            config[k] = "no such file_id:"+node.file_id;
                            return;
                        }

                        //use file.filename/dirname path, 
                        //unless filemapping from the input dataset is provided
                        var base = "../"+dataset.task._id;
                        if(dataset.subdir) {
                            base+="/"+dataset.subdir;

                            //add to subdirs list
                            if(!dep_config.subdirs) dep_config.subdirs = [];
                            if(!dep_config.subdirs.includes(dataset.subdir)) {
                                if(input.includes) {
                                    input.includes.split("\n").forEach(include=>{
                                        dep_config.subdirs.push("include:"+dataset.subdir+"/"+include);
                                    });
                                } else dep_config.subdirs.push(dataset.subdir);
                            }
                        }

                        var path = base+"/"+(file.filename||file.dirname);
                        if(dataset.files && dataset.files[node.file_id]) {
                            path = base+"/"+dataset.files[node.file_id];
                        }
                        if(input.multi) config[k].push(path);
                        else config[k] = path;
                    });
                }
            }
        },

        //select all datasets that meets datatype requirement of 'input', that comes from task with name:task_name
        filter_datasets(input) {
            let selectedIds = [];
            if(input.selected) {
                selectedIds = input.selected.filter(s=>Boolean(s)).map(s=>s.dataset.id);
            }
            return lib.filter_datasets(this.datasets, input).filter(d=>{
                return !(selectedIds.includes(d.id));
            });
        },

        wrap_with_label(datasets) {
            return datasets.map(dataset=>{
                return { label: this.compose_label(dataset), dataset };
            });
        },

        //Similar code alert...
        //modals/newtask.vue::submit()
        //modals/appsubmit.vue::submit()
        //(bin)/rule_handler.js
        //cli
        submit(evt) {
            evt.preventDefault();

            //prevent double submit
            if(!this.open) return; 
            this.open = false;

            //now construct the task object
            this.deps_config = [];
            this.process_input_config(this.config);
            const meta = {};
            const _inputs = [];
            for(const input_id in this.inputs) {
                const input = this.inputs[input_id];
                input.selected.forEach(selected=>{
                    if(!selected) return; //not set?
                    const dataset = selected.dataset; 
                    const keys = [];
                    for(const key in this.app.config) {
                        if(this.app.config[key].input_id == input_id) keys.push(key); 
                    }
                    _inputs.push({
                        id: input_id, 
                        task_id: dataset.task._id, //unpopulate
                        subdir: dataset.subdir, //is this right? (should come from prov?)
                        meta: dataset.meta,
                        tags: dataset.tags,
                        datatype: dataset.datatype,
                        datatype_tags: dataset.datatype_tags,
                        keys,

                        //only set if input is staged in
                        project: dataset.project,
                        dataset_id: dataset.dataset_id,
                    });

                    //copy some hierarchical metadata from input
                    //similar code in ui/modal/newtask.vue
                    //similar code in ui/modal/appsubmit.vue
                    //similar code in bin/rule_handler
                    //cli
                    ["subject", "session", "run"].forEach(k=>{
                        if(!meta[k]) meta[k] = dataset.meta[k]; //use first one
                    });
                });
            }

            this.config._inputs = _inputs;
            this.config._app = this.app._id;

            //similar code alert
            //modals/newtask
            //modals/appsubmit
            //bin/rule_handler
            //cli
            const _outputs = [];
            this.app.outputs.forEach(output=>{
                const output_req = {
                    id: output.id,
                    datatype: output.datatype._id,
                    desc: (output.desc||this.app.name),
                    meta,
                    tags: this.tags,
                };
                if(this.archive.enable) output_req.archive = {
                    project: this.project._id,
                    desc: this.archive.desc,
                }

                if(output.output_on_root) {
                    output_req.files = output.files; //optional
                } else {
                    output_req.subdir = output.id;
                }

                //handle datatype tag passthrough (and metadata)
                let tags = [];
                if(output.datatype_tags_pass) {
                    this.inputs[output.datatype_tags_pass].selected.forEach(selected=>{
                        if(!selected) return; //not set?
                        if(selected.dataset.datatype_tags) tags = tags.concat(selected.dataset.datatype_tags);

                        //copy all metadata (let last one win.. if there are multiple)
                        Object.assign(output_req.meta, selected.dataset.meta);
                    });
                }
                //.. and add app specified output tags at the end
                tags = tags.concat(output.datatype_tags); 
                output_req.datatype_tags = lib.uniq(tags);

                _outputs.push(output_req);
            });
            this.config._outputs = _outputs;

            //now ship it!
            let task = {
                name: this.app.name,
                desc: this.desc,
                service: this.app.github, 
                service_branch: this.app.github_branch, 
                config: this.config,
                deps_config: this.deps_config,
                retry: this.app.retry,
            };
            if (this.advanced.resource) task.preferred_resource_id = this.advanced.resource;
            if (this.advanced.branch) task.service_branch = this.advanced.branch;
            this.$root.$emit("newtask.submit", task);
        },

        compose_label(dataset) {
            var label = "";
            if(dataset.task.status != 'finished') label += "("+dataset.task.status+") ";
            label += dataset.task.name;
            if(dataset.task.config._tid) label +=' (t.'+dataset.task.config._tid+') ';
            label += ' > '+dataset.meta.subject;
            if(dataset.meta.session) label += " / "+dataset.meta.session;
            if(dataset.datatype_tags && dataset.datatype_tags.length > 0) label += ' '+dataset.datatype_tags;
            if(dataset.tags.length > 0) label +=' | '+dataset.tags; 
            return label;
        },

        selectAllAvailable(input) {
            input.selected = [];
            let inputs = this.wrap_with_label(this.filter_datasets(input));
            input.selected.push(...inputs);
            this.validate();
        }
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
    bottom: 0px;
    background-color: #f9f9f9;
}
.app-selecter {
    overflow: auto;
}
.form-body {
position: absolute;
top: 0px;
bottom: 0px;
left: 0px;
right: 0px;
overflow: auto;
margin-bottom: 60px;
}
.form-action {
position: absolute;
bottom: 0px;
left: 0px;
right: 0px;
height: 60px;
box-shadow: inset 0px 1px 1px #ddd;
background-color: #eee;
padding: 10px 20px;
text-align: right;
}
.selected-app {
position: sticky;
top: 0px;
z-index: 2;
}
.apps {
padding: 20px;
padding-top: 10px;
overflow: auto;
position: absolute;
top: 45px;
left: 0;
right: 0;
bottom: 0px;
}
.app {
width: calc(33% - 10px); 
float: left;
transition: box-shadow 0.3s ease;
margin-right: 10px;
margin-bottom: 10px;
}
.app:hover {
box-shadow: 2px 2px 6px rgba(0,0,0,0.2);
}
.search {
width: 100%;
padding: 5px;
padding-left: 50px;
font-size: 120%;
height: 45px;
border: none;
color: #666;
}
.search:focus {
outline: none;
}
.search-icon {
position: absolute;
left: 15px;
top: 12px;
opacity: 0.2;
}
.apps h3 {
margin-bottom: 10px;
opacity: 0.5;
font-size: 170%;
font-weight: bold;
}
</style>
