<template>
<div class="appedit">
    <pageheader/>
    <sidemenu active="/apps"></sidemenu>
    <div class="fixed-top">
        <div class="container" style="height: 50px;">
            <div style="margin: 20px 0px;">
                <p style="float: right; color: #999;">
                    If you are new to creating Apps for Brainlife, please read our
                    <b-button size="sm" variant="outline-secondary" href="https://brain-life.github.io/docs/apps/introduction" target="doc">Documentation</b-button>
                </p>
                <h3 v-if="$route.params.id == '_'">New App</h3>
                <h3 v-else>{{app.name}}</h3>
            </div>
        </div>
    </div>

    <div class="page-content" v-if="ready">
        <b-form @submit="submit" class="container">
            <!--
            <p v-if="$route.params.id == '_'">
                Before you can 
            </p>
            -->
    
            <div style="margin-top:20px;">
                <h4>Detail</h4>

                <b-row>
                    <b-col cols="3">
                        <span class="form-header">Name *</span>
                    </b-col> 
                    <b-col>
                        <b-form-input type="text" v-model="app.name" placeholder="Name of application" required/>
                        <br>
                    </b-col> 
                </b-row>

                <b-row>
                    <b-col cols="3">
                        <span class="form-header">Description Override</span>
                    </b-col> 
                    <b-col>
                        <b-form-textarea v-model="app.desc_override" placeholder="(Leave empty to use github repo description)" :rows="3" :max-rows="6"></b-form-textarea>
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="3">
                        <span class="form-header">Admins</span>
                    </b-col> 
                    <b-col>
                        <contactlist v-model="app.admins"></contactlist>
                        <p>
                            <small class="text-muted">Users who can update this application registration</small>
                        </p>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="3">
                        <span class="form-header">Avatar</span>
                    </b-col> 
                    <b-col>
                        <b-form-input type="text" v-model="app.avatar" placeholder="Image URL of application avatar"/>
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="3">
                        <span class="form-header">Projects</span>
                    </b-col> 
                    <b-col cols="9">
                        <multiprojectselecter v-model="app.projects" placeholder="(Leave it empty to make it available for all users)"/>
                        <p>
                            <small class="text-muted">If a private project is selected, only the member of the project can access this app</small>
                        </p>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="3">
                        <span class="form-header">Source Code</span>
                    </b-col> 
                    <b-col>
                        <b-row>
                            <b-col cols="7">
                                <b-input-group prepend="Github Repository Name">
                                    <b-form-input type="text" v-model="app.github" placeholder="github-org/app-name" required/>
                                </b-input-group>
                            </b-col>
                            <b-col>
                                <b-input-group prepend="Branch/Tag (optional)">
                                    <b-form-input type="text" v-model="app.github_branch" placeholder="master"/>
                                </b-input-group>
                            </b-col>
                        </b-row>
                        <br>
                    </b-col>
                </b-row>

            </div>
            
            <h4>
                <a style="float: right;" href="https://brain-life.github.io/docs/apps/register/#input-datasets" target="doc"><icon name="book"/></a>
                Input
            </h4>
            <div>
                <transition-group name="move-item" tag="p">
                    <div v-for="(input, idx) in input_datasets" v-if="input.pid" :key="input.pid" style="margin-bottom: 10px;">
                        <b-card style="position: relative;">
                            <b-row v-if="is_raw(input)">
                                <b-col>
                                    <b-alert show variant="warning" style="margin-bottom: 10px;">
                                        Warning: You have chosen a raw datatype as an input. We strongly recommend working with the developers of the App who is generating the raw datatype to register a new datatype so that it can used instead to pass dataset between Apps. Please refer to <a href="https://brain-life.github.io/docs/user/datatypes/">Datatypes</a>
                                    </b-alert>
                                </b-col>
                            </b-row>
                            <b-row>
                                <b-col cols="5">
                                    <b-input-group prepend="ID">
                                        <b-form-input type="text" v-model="input.id" required />
                                    </b-input-group>
                                </b-col>
                                <b-col cols="7">
                                    <div style="float: right;">
                                        <div class="button" v-if="idx > 0 && input_datasets.length > 1" @click="swap_inputs(idx, idx - 1)">
                                            <icon name="arrow-up" />
                                        </div>
                                        <div class="button" v-if="idx < input_datasets.length - 1 && input_datasets.length > 1" @click="swap_inputs(idx, idx + 1)">
                                            <icon name="arrow-down" />
                                        </div>
                                        <div class="button button-danger" @click="input_datasets.splice(idx, 1)">
                                            <icon name="trash"/>
                                        </div>
                                    </div>
                                    <b-form-checkbox v-model="input.optional">
                                        Optional 
                                        <small class="text-muted">user can submit this App without this input specified</small>
                                    </b-form-checkbox>
                                    <b-form-checkbox v-model="input.multi">
                                        Multi
                                        <small class="text-muted">Allow user to select multiple datasets in an array</small>
                                    </b-form-checkbox>
                                </b-col>
                            </b-row>
                            <hr>
                            <b-row>
                                <b-col cols="5">
                                    <span class="text-muted">Datatype</span>
                                    <datatypeselecter v-model="input.datatype" @input="input_datatype_changed(idx)"></datatypeselecter>
                                </b-col>
                                <b-col cols="7">
                                    <div class="text-muted">Datatype Tags</div>
                                    <tageditor placeholder="Tags" v-if="input.datatype" v-model="input.datatype_tags" :options="datatypes[input.datatype]._tags" />
                                    <small class="text-muted">Only allow user to select datasets with these tags. You can prefix tags with ! for negative tags</small>
                                </b-col>
                            </b-row>

                            <span class="text-muted">Description (optional)</span>
                            <b-form-textarea v-model="input.desc" placeholder="Enter description to show for this field" :rows="3" :max-rows="6"/>

                            <div v-if="input.datatype">
                                <br><b>File Mapping</b><br>
                                <p class="text-muted">Please choose keys used to specify the input files/directories inside config.json</p>
                                <transition-group name="file-transition" tag="div">
                                    <div v-for="(file, fidx) in input.files" :key="fidx" class="file-map">
                                        <div class="button" @click="remove_file(idx, fidx)" style="float: right">
                                            <icon name="trash"/>
                                        </div>
                                        <b-row>
                                            <b-col v-if="input.datatype" cols="6">
                                                <b-input-group prepend="file/dir">
                                                    <b-form-select :options="datatypes[input.datatype].files.map(f => ({ text: f.id+' ('+(f.filename||f.dirname)+')', value: f.id }))" v-model="file.file_id" required/>
                                                </b-input-group>
                                            </b-col>
                                            <b-col cols="1">
                                                <icon name="arrow-right"/>
                                            </b-col>
                                            <b-col cols="5">
                                                <b-input-group prepend="key">
                                                    <b-form-input type="text" v-model="file.id" required/>
                                                </b-input-group>
                                            </b-col>
                                        </b-row>
                                    </div>
                                </transition-group>
                                <br>
                                <b-button v-if="input.datatype" @click="add_file(idx)" size="sm">Add File Mapping</b-button>
                            </div>
                        </b-card>
                    </div>
                </transition-group>
                <p>
                    <b-button size="sm" @click="add_dataset(input_datasets)" variant="primary">Add Input</b-button>
                </p>
            </div>
            
            <h4>
                <a style="float: right;" href="https://brain-life.github.io/docs/apps/register/#output-datasets" target="doc"><icon name="book"/></a>
                Output
            </h4>
            <div>
                <transition-group name="move-item" tag="p">
                    <div v-for="(output, idx) in output_datasets" v-if="output.pid" :key="output.pid" style="margin-bottom: 10px;">
                        <b-card>
                               <b-row>
                                <b-col>
                                    <b-input-group prepend="ID">
                                        <b-form-input type="text" v-model="output.id" required />
                                    </b-input-group>
                                    <small class="text-muted">Internal ID used to identify this output</small>
                                </b-col>
                                <b-col cols="7">
                                     <div style="float: right;">
                                        <div class="button" v-if="idx > 0 && output_datasets.length > 1" @click="swap_outputs(idx, idx - 1)">
                                            <icon name="arrow-up" />
                                        </div>
                                        <div class="button" v-if="idx < output_datasets.length - 1 && output_datasets.length > 1" @click="swap_outputs(idx, idx + 1)">
                                            <icon name="arrow-down" />
                                        </div>
                                        <div class="button button-danger" @click="output_datasets.splice(idx, 1)">
                                            <icon name="trash"/>
                                        </div>
                                    </div>
                                </b-col>
                            </b-row>
                            <b-row>
                                <b-col>
                                    <div class="text-muted">Datatype</div>
                                    <datatypeselecter v-model="output.datatype"></datatypeselecter>
                                    <datatype :datatype="datatypes[output.datatype]" style="margin-top: 5px;" v-if="output.datatype"/>
                                </b-col>
                                <b-col cols="7" v-if="output.datatype">
                                    <div class="text-muted">Datatype Tags</div>
                                    <tageditor v-model="output.datatype_tags" :options="datatypes[output.datatype]._tags" />
                                    <small class="text-muted">Set these datatype tags on this output dataset</small>

                                    <div class="text-muted">Tag Passthrough</div>
                                    <b-form-select v-model="output.datatype_tags_pass">
                                        <option :value="null">(No Pass)</option>
                                        <option v-for="input in app.inputs" v-if="input.datatype == output.datatype" :key="input.id" :value="input.id">{{input.id}}</option>
                                    </b-form-select>
                                    <small class="text-muted">Add all datatype tags from the input dataset specified</small>
                                    
                                </b-col>
                            </b-row>
                            <div class="text-muted" style="margin-top: 3px;">Datatype File Mapping <small>(Optional JSON)</small></div>
                            <b-form-textarea v-model="output._files" :rows="3"></b-form-textarea>
                        </b-card>
                    </div>
                </transition-group>
                <p>
                    <b-button size="sm" @click="add_dataset(output_datasets)" variant="success">Add Output</b-button>
                </p>
            </div>
            
            <h4>
                <a style="float: right;" href="https://brain-life.github.io/docs/apps/register/#configuration-parameters" target="doc"><icon name="book"/></a>
                Configuration</h4>
            <div>
                <transition-group name="move-item" tag="p">
                    <div v-for="(param, idx) in config_params" v-if="param.pid" :key="param.pid" style="margin:5px;">
                        <b-card v-if="param.type == 'integer' || param.type == 'number' || param.type == 'string'">
                            <div style="float: right">
                                <div class="button" v-if="idx > 0 && config_params.length > 1" @click="move_param_up(idx)">
                                    <icon name="arrow-up" scale="1.25"/>
                                </div>
                                <div class="button" v-if="idx < config_params.length - 1 && config_params.length > 1" @click="move_param_down(idx)">
                                    <icon name="arrow-down" scale="1.25" />
                                </div>
                                <div class="button button-danger" @click="config_params.splice(idx, 1)">
                                    <icon name="trash" scale="1.25"/>
                                </div>
                            </div>
                            <h4>{{param.type|capitalize}}</h4>
                            <b-row>
                                <b-col>
                                    <b-form-group>
                                        <b-input-group prepend="config.json key">
                                            <b-form-input type="text" v-model="param.id" required/>
                                        </b-input-group>
                                    </b-form-group>

                                    <b-form-group>
                                        <b-input-group prepend="Default Value">
                                            <b-form-input v-if="param.type == 'integer'" type="number" v-model.number="param.default" placeholder="(no default)" @mousewheel.native="$event.preventDefault()"/><!--deprecated-->
                                            <b-form-input v-if="param.type == 'number'" type="number" step="0.01" v-model.number="param.default" placeholder="(no default)" @mousewheel.native="$event.preventDefault()"/>
                                            <b-form-input v-if="param.type == 'string'" type="text" v-model="param.default" placeholder="(no default)"/>
                                        </b-input-group>
                                    </b-form-group>

                                    <b-form-group v-if="param.default !== ''">
                                        <b-form-checkbox v-model="param.readonly">Read Only<br>
                                        <small class="text-muted">Value will be fixed to the default value and user can not change it</small></b-form-checkbox>
                                    </b-form-group>

                                    <b-form-group>
                                        <b-form-checkbox v-model="param.optional">Optional Configuration<br>
                                        <small class="text-muted">Check this if user should be able to submit your app without this parameter set</small></b-form-checkbox>
                                    </b-form-group>

                                    <div v-if="!param.readonly && (param.type == 'number' || param.type == 'integer')">
                                        <b-input-group prepend="Min">
                                            <b-form-input type="number" :step="0.01" v-model.number="param.min" placeholder="(No min)" @mousewheel.native="$event.preventDefault()"/>
                                        </b-input-group><br />
                                        <b-input-group prepend="Max">
                                            <b-form-input type="number" :step="0.01" v-model.number="param.max" placeholder="(No max)" @mousewheel.native="$event.preventDefault()"/>
                                        </b-input-group>
                                    </div>
                                </b-col>
                                <b-col sm="7">
                                    <b-form-group>
                                        <div class="text-muted">Placeholder <small>optional text to show inside the form element if no value is specified</small></div>
                                        <b-form-input type="text" v-model="param.placeholder"></b-form-input>
                                    </b-form-group>
                                    <b-form-group>
                                        <div class="text-muted">Description <small>optional</small></div>
                                        <b-form-textarea v-model="param.desc" placeholder="Enter description to add for this field" :rows="5" :max-rows="8"></b-form-textarea>
                                    </b-form-group>
                                </b-col>
                            </b-row>
                        </b-card>
                        <b-card v-if="param.type == 'boolean'">
                            <div style="float: right">
                                <div class="button" v-if="idx > 0 && config_params.length > 1" @click="move_param_up(idx)">
                                    <icon name="arrow-up" scale="1.25"/>
                                </div>
                                <div class="button" v-if="idx < config_params.length - 1 && config_params.length > 1" @click="move_param_down(idx)">
                                    <icon name="arrow-down" scale="1.25" />
                                </div>
                                <div class="button button-danger" @click="config_params.splice(idx, 1)">
                                    <icon name="trash" scale="1.25"/>
                                </div>
                            </div>
                            <h4>{{param.type|capitalize}}</h4>
                            <b-row>
                                <b-col>
                                    <b-form-group>
                                        <b-input-group prepend="Key">
                                            <b-form-input type="text" v-model="param.id"></b-form-input>
                                        </b-input-group>
                                    </b-form-group>
                                    <b-form-group>
                                        <b-input-group prepend="Default Value">
                                            <trueorfalse v-model="param.default"/>
                                        </b-input-group>
                                    </b-form-group>
                                    <b-form-group>
                                        <b-form-checkbox v-model="param.readonly">Read Only 
                                        <br><small class="text-muted">Value will be fixed to the default value and user can not change it</small></b-form-checkbox>
                                    </b-form-group>
                                </b-col>
                                <b-col sm="7">
                                    <div class="text-muted">Description</div>
                                    <b-form-input type="text" v-model="param.desc"></b-form-input>
                                </b-col>
                            </b-row>
                        </b-card>
                        <b-card v-else-if="param.type == 'enum'">
                            <div style="float: right">
                                <div class="button" v-if="idx > 0 && config_params.length > 1" @click="move_param_up(idx)">
                                    <icon name="arrow-up" scale="1.25"/>
                                </div>
                                <div class="button" v-if="idx < config_params.length - 1 && config_params.length > 1" @click="move_param_down(idx)">
                                    <icon name="arrow-down" scale="1.25" />
                                </div>
                                <div class="button button-danger" @click="config_params.splice(idx, 1)">
                                    <icon name="trash" scale="1.25"/>
                                </div>
                            </div>
                            <h4>{{param.type|capitalize}}</h4>
                            <b-row>
                                <b-col>
                                    <b-form-group>
                                        <b-input-group prepend="Key">
                                            <b-form-input type="text" v-model="param.id"></b-form-input>
                                        </b-input-group>
                                    </b-form-group>
                                    <b-form-group v-if="param.options.length">
                                        <b-input-group prepend="Default Value">
                                            <b-form-select :options="param.options.map(o => o.value)" v-model="param.default"></b-form-select>
                                        </b-input-group>
                                    </b-form-group>
                                    <b-form-group v-if="param.default !== ''">
                                        <b-form-checkbox v-model="param.readonly">Read Only 
                                        <br><small class="text-muted">Value will be fixed to the default value and user can not change it</small></b-form-checkbox>
                                    </b-form-group>
                                    <b-form-group>
                                        <b-form-checkbox v-model="param.optional">Optional Configuration<br>
                                        <small class="text-muted">Check this if user should be able to submit your app without this parameter set</small></b-form-checkbox>
                                    </b-form-group>
                                </b-col>
                                <b-col sm="7">
                                    <div class="text-muted">Description</div>
                                    <b-form-textarea v-model="param.desc" :rows="4"></b-form-textarea>
                                </b-col>
                            </b-row>
                            <b>Options</b>
                            <b-card v-for="(option, idx) in param.options" :key="idx" style="margin-bottom: 5px; margin-top: 5px;">
                                <div class="button" @click="param.options.splice(idx, 1)" style="float: right">
                                    <icon name="trash"/>
                                </div>
                                <b-row>
                                    <b-col cols="2">
                                        <div class="text-muted">Value</div>
                                        <b-form-input type="text" v-model="option.value"></b-form-input>
                                    </b-col>
                                    <b-col>
                                        <div class="text-muted">Label</div>
                                        <b-form-input type="text" v-model="option.label"></b-form-input>
                                    </b-col>
                                    <b-col>
                                        <div class="text-muted">Description</div>
                                        <b-form-input type="text" v-model="option.desc"></b-form-input>
                                    </b-col>
                                </b-row>
                            </b-card>
                            <br>
                            <b-button @click="param.options.push({ desc: '', label: '', value: '' })" size="sm">Add Enum Option</b-button>
                        </b-card>
                    </div>
                </transition-group>
            </div>
            <p>
                <b-dropdown size="sm" text="Add Configuration Parameter" variant="secondary">
                    <b-dropdown-item @click="add_param('string')">String</b-dropdown-item>
                    <b-dropdown-item @click="add_param('number')">Number</b-dropdown-item>
                    <b-dropdown-item @click="add_param('boolean')">Boolean</b-dropdown-item>
                    <b-dropdown-item @click="add_param('enum')">Enum</b-dropdown-item>
                    <!--integer is deprecated-->
                </b-dropdown>
            </p>
        </b-form>
        
        <div class="form-action" style="padding-right: 20px;">
            <b-button @click="cancel">Cancel</b-button>
            <b-button @click="submit" variant="primary">Submit</b-button>
        </div>
        
        <b-card v-if="config.debug">
            <div slot="header">Debug</div>
            <h3>input_datasets</h3>
            <pre v-highlightjs="JSON.stringify(input_datasets, null, 4)"><code class="json hljs"></code></pre>
            <h3>output_datasets</h3>
            <pre v-highlightjs="JSON.stringify(output_datasets, null, 4)"><code class="json hljs"></code></pre>
            <h3>config_params</h3>
            <pre v-highlightjs="JSON.stringify(config_params, null, 4)"><code class="json hljs"></code></pre>
            <h3>app</h3>
            <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
        </b-card>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import contactlist from '@/components/contactlist'
import multiprojectselecter from '@/components/multiprojectselecter'
import datatypeselecter from '@/components/datatypeselecter'
import trueorfalse from '@/components/trueorfalse'
import tageditor from '@/components/tageditor'
import datatype from '@/components/datatype'

export default {
    components: { 
        sidemenu, contactlist, 
        pageheader, multiprojectselecter,
        datatypeselecter, trueorfalse, tageditor, datatype,

        editor: require('vue2-ace-editor'),
    },
    data () {
        return {
            app: {
                config: {},
                inputs: [],
                outputs: []
            },
            
            input_datasets: [],
            output_datasets: [],
            config_params: [],

            alltags: [],

            ready: false,  //ready to render form

            //cache
            datatypes: null, //registered datatypes (keyed by datatype_id)

            config: Vue.config
        }
    },

    mounted: function() {
        //load datatypes for form
        this.$http.get('datatype').then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach((type)=>{
                this.datatypes[type._id] = type;
                type._tags = [];
            });

            //TODO - this is super inefficient!
            //load datatype_tags from all apps
            this.$http.get('app', {params: {
                select: 'inputs outputs',
            }}).then(res=>{
                var v = this;
                function aggregate_tags(dataset) {
                    if(!dataset.datatype_tags) return;
                    dataset.datatype_tags.forEach(tag=>{
                        var dt = v.datatypes[dataset.datatype];
                        if(!~dt._tags.indexOf(tag)) dt._tags.push(tag);
                    });
                }
                res.body.apps.forEach(app=>{
                    app.inputs.forEach(aggregate_tags);
                    app.outputs.forEach(aggregate_tags);
                });

                //load apptags catalog
                this.load_app_tags().then(tags=>{
                    this.alltags = tags;

                    if (this.$route.params.id !== '_') {

                        //finally time to load app to edit
                        this.$http.get('app', {params: {
                            find: JSON.stringify({_id: this.$route.params.id})
                        }})
                        .then(res=>{
                            this.app = res.body.apps[0];
                            this.convert_config_to_ui();
                            this.ready = true;
                        });
                    } else {
                        //init.. (can't do it in data() for some reason (maybe because contact list is not setup?))
                        this.app.admins = [Vue.config.user.sub];
                        this.convert_config_to_ui();
                        this.ready = true;
                    }

                });
            });
        }, res => {
            console.error(res);
        });
    },

    methods: {
        swap_inputs(first_idx, snd_idx) {
            let tmp = this.input_datasets[first_idx];
            Vue.set(this.input_datasets, first_idx, this.input_datasets[snd_idx]);
            Vue.set(this.input_datasets, snd_idx, tmp);
        },
        swap_outputs(first_idx, snd_idx) {
            let tmp = this.output_datasets[first_idx];
            Vue.set(this.output_datasets, first_idx, this.output_datasets[snd_idx]);
            Vue.set(this.output_datasets, snd_idx, tmp);
        },
        move_param_up(idx) {
            this.config_params[idx]._order--;
            this.config_params[idx - 1]._order++;
            this.sort_params_by_order();
        },
        move_param_down(idx) {
            this.config_params[idx]._order++;
            this.config_params[idx + 1]._order--;
            this.sort_params_by_order();
        },
        get_max_order() {
            let max_order = 1;
            for (let param of this.config_params) {
                if (max_order < param._order) {
                    max_order = param._order;
                }
            }
            return max_order;
        },
        sort_params_by_order() {
            // first assign ordering to items
            // that don't have one
            let max_order = this.get_max_order();
            for (let param of this.config_params) {
                if (!param._order) {
                    param._order = ++max_order;
                }
            }
            
            this.config_params.sort((a, b) => {
                return a._order > b._order ? 1 : -1;
            });
        },
        
        convert_config_to_ui() {
            let input_files = {};
            for (let id in this.app.config) {
                let param = this.app.config[id];
                param.id = id;
                if (param.type == 'input') {
                    if (!input_files[param.input_id]) {
                        input_files[param.input_id] = [];
                    }
                    input_files[param.input_id].push(param);
                } else {
                    param.pid = Math.random();
                    this.config_params.push(param);
                }
            }
            
            for (let input of this.app.inputs) {
                input.files = input_files[input.id] || [];
                input.pid = Math.random();
                this.input_datasets.push(input);
            }
            for (let output of this.app.outputs) {
                if (output.files) {
                    //_files needs to be obervable - otherwise textarea won't work..
                    Vue.set(output, '_files', JSON.stringify(output.files, null, 4));
                }
                output.pid = Math.random();
                this.output_datasets.push(output);
            }
            
            // use _order for ordering of array items
            this.sort_params_by_order();
        },
        
        convert_ui_to_config(cb) {
            let config = {};
            let inputTable = {};
            let outputTable = {};
            let paramTable = {};
            
            //validate
            for (let input of this.input_datasets) {
                if (!input.id) return cb("Not all input ids are non-null");
                if (inputTable[input.id]) return cb("Duplicate ID '" + input.id + "' found in list of inputs");
                if (!input.datatype) return cb("No datatype given for input '" + input.id + "'");
                
                let datatype = this.datatypes[input.datatype];
                if (datatype.name == "raw" && input.datatype_tags.length == 0) {
                    return cb("All raw input datatypes should have at least 1 datatype tag (when checking input '" + input.id + "').");
                }
                
                inputTable[input.id] = true;
                /*
                inputs.push({
                    _id: input._id,
                    id: input.id,
                    datatype_tags: input.datatype_tags,
                    datatype: input.datatype,
                    optional: input.optional,
                    multi: input.multi,
                    desc: input.desc,
                });
                inputs.push(Object.assign({}, input));
                */
                
                if (!input.files || input.files.length == 0) {
                    return cb("No file mapping given for input '" + input.id + "'");
                }
                
                for (let file of input.files) {
                    if (!file.id) {
                        return cb("Not all file ids for input '" + input.id + "' are non-null");
                    }
                    if (config[file.id]) {
                        return cb("Duplicate config.json key '" + input.id + "' found when checking file mapping");
                    }
                    config[file.id] = {
                        type: 'input',
                        file_id: file.file_id,
                        input_id: input.id,
                    };
                }
            }
            
            for (let output of this.output_datasets) {
                if (!output.id) {
                    return cb("Not all output ids are non-null");
                }
                if (outputTable[output.id]) {
                    return cb("Duplicate ID '" + output.id + "' found in list of outputs");
                }
                if (!output.datatype) {
                    return cb("No datatype given for output '" + input.id + "'");
                }
                
                let datatype = this.datatypes[output.datatype];
                
                if (datatype.name == "raw" && output.datatype_tags.length == 0) {
                    return cb("All raw output datatypes should have at least 1 datatype tag (when checking '" + output.id + "').");
                }
                
                outputTable[output.id] = true;

                output.files = null;
                try {
                    if(output._files) output.files = JSON.parse(output._files);
                } catch (err) {
                    return cb("Failed to parse JSON given for output '" + output.id + "'");
                }
            }
            
            for (let param of this.config_params) {
                if (!param.id) {
                    return cb("Not all configuration parameter ids are non-null");
                }
                if (inputTable[param.id]) {
                    return cb("Duplicate ID '" + param.id + "' used for configuration parameter and input");
                }
                if (outputTable[param.id]) {
                    return cb("Duplicate ID '" + param.id + "' used for configuration parameter and output");
                }
                if (paramTable[param.id]) {
                    return cb("Duplicate ID '" + param.id + "' found in list of config parameters");
                }
                
                paramTable[param.id] = true;
                config[param.id] = {};
                Object.assign(config[param.id], param);
            }
            
            this.app.config = config;
            this.app.inputs = this.input_datasets;
            this.app.outputs = this.output_datasets;
            
            return cb();
        },
        
        add_file(index, file_id) {
            this.input_datasets[index].files.push({
                id: file_id, //use the same key as file_id by default
                file_id: file_id || null,
            });
            Vue.set(this.input_datasets, index, this.input_datasets[index]);
        },
        
        remove_file(dataset_idx, file_idx) {
            this.input_datasets[dataset_idx].files.splice(file_idx, 1);
            Vue.set(this.input_datasets, dataset_idx, this.input_datasets[dataset_idx]);
        },
        
        add_param(type, input) {
            let max_order = this.get_max_order();
            let param = { 
                id: '', 
                type, 
                placeholder: '', 
                desc: '', 
                default: '', 
                _order: max_order + 1, 
                pid: Math.random() 
            };
            switch(type) {
            case "boolean":
                param.default = false;
                break;
            case "enum":
                param.options = [];
                break;
            case "number":
            case "integer":
                param.default = null;
            case "string":
                break;
            }
            this.config_params.push(param);
            this.sort_params_by_order();
        },
        
        add_dataset(it) {
            it.push({
                pid: Math.random(),
                id: "",
                datatype: null,
                datatype_tags: [],
                datatype_tags_pass: null,
                files: [],
            });
        },
        
        input_datatype_changed(idx) {
            // auto populate required datatype files when datatype is changed (also called when the form is first loaded)
            // NOTE .. "required" for datatype. it doesn't mean the file is required to be used as input for the App. Every App uses different things.
            // but, let's assume that "required" fields are usually some important files and most App will use it.
            let input = this.input_datasets[idx];
            if (input.datatype) {
                let datatype = this.datatypes[input.datatype];
                input.files = [];
                datatype.files.forEach(file => {
                    if (file.required) this.add_file(idx, file.id);
                });
            }
        },
        
        cancel() {
            this.$router.go(-1);
        },

        submit() {
            this.convert_ui_to_config(err => {
                if (err) {
                    this.$notify({ text: err, type: 'error' });
                    console.error(err);
                } else {
                    //now ready to submit
                    if(this.$route.params.id !== '_') {
                        //update
                        this.$http.put('app/' + this.app._id, this.app)
                        .then(res=>{
                            this.$router.push("/app/" + this.app._id);
                        }).catch(err=>{
                            this.$notify({text: err.body.message, type: 'error' });
                            console.error(err);
                        });
                    } else {
                        this.$http.post('app', this.app)
                        .then(res => {
                            this.$router.push("/app/" + res.body._id);
                        }).catch(err=>{
                            this.$notify({text: err.body.message, type: 'error' });
                            console.error(err);
                        });
                    }
                }
            });
        },

        //load tags from all apps and create a catalog
        load_app_tags() {
            return new Promise((resolve, reject)=>{
                this.$http.get('app', {params: {
                    select: 'tags',
                }}).then(res=>{
                    var alltags = []; 
                    res.body.apps.forEach(app=>{
                        if(app.tags) app.tags.forEach(tag=>{
                            if(!~alltags.indexOf(tag)) alltags.push(tag);
                        });
                    });
                    resolve(alltags);
                }, reject);
            });
        },
        
        is_raw(input) {
            if (this.datatypes) {
                let dtype = this.datatypes[input.datatype];
                if (dtype) {
                    return dtype.name == "raw";
                }
            }
        },
    }
}
</script>

<style scoped>
.fixed-top {
position: fixed;
top: 50px;
left: 50px;
right: 0px;
height: 80px;
z-index: 1;
background-color: white;
border-bottom: 1px solid #eee;
}
h4 {
color: #999;
border-bottom: 1px solid #ddd;
padding-bottom: 10px;
margin-bottom: 15px;
}
.page-content {
top: 130px;
}

.file-map {
margin: 7px;
}

.file-transition-enter-active {
transition: all .45s;
}
.file-transition-enter {
opacity: 0;
transform: translate(0, -100%);
}

.form-action {
text-align: right;
position: sticky;
bottom:0;
background-color: rgba(100,100,100,0.4);
padding:10px;
}
.move-item-enter-active, .move-item-leave-active {
transition: none;
}
.move-item-move {
transition: transform .45s;
}
</style>
