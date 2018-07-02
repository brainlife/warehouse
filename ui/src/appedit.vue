<template>
<div class="appedit">
    <pageheader/>
    <sidemenu active="/apps"></sidemenu>
    <div class="fixed-top">
        <div class="container" style="height: 50px;">
            <div style="margin: 20px 0px;">
                <p style="float: right">
                    <a href="https://brain-life.github.io/docs/apps/register/" target="doc">Help</a>
                </p>
                <h3 v-if="$route.params.id == '_'">New App</h3>
                <h3 v-else>{{app.name}}</h3>
            </div>
        </div>
    </div>

    <div class="main-section" v-if="ready">
        <b-form @submit="submit" class="container">
            <!--detail-->
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
                        <span class="form-header">Projects *</span>
                    </b-col> 
                    <b-col cols="9">
                        <projectsselecter 
                            v-model="app.projects" 
                            :allownull="true" 
                            access="private"
                            placeholder="(Leave it empty to make it available for all users)"/>
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
                                <b-input-group prepend="Github Repository Name *">
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
            
            <h4>Input Datasets</h4>
            <div>
                <div v-for="(input, idx) in input_datasets" :key="idx" style="margin-bottom: 10px;">
                    <b-card style="position: relative;">
                        <b-row v-if="is_raw(input)">
                            <b-col>
                                <b-alert show variant="warning">
                                    Warning: You have chosen a raw datatype as an input. If possible, please request your upstream app developer to create a new datatype so that it can instead be used to pass data between apps.
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
                                <div class="button button-danger" @click="input_datasets.splice(idx, 1);" style="float: right">
                                    <icon name="trash" scale="1.25"/>
                                </div>
                                <b-form-checkbox v-model="input.optional">
                                    Optional 
                                    <small class="text-muted">user can submit this app without this input specified</small>
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
                                <datatypeselecter v-model="input.datatype"></datatypeselecter>
                            </b-col>
                            <b-col cols="7">
                                <div class="text-muted">Datatype Tags</div>
                                <tageditor placeholder="Tags" v-if="input.datatype" v-model="input.datatype_tags" :options="datatypes[input.datatype]._tags" />
                                <small class="text-muted">Only allow user to select datasets with these tags. You can prefix tags with ! for negative tags</small>
                            </b-col>
                        </b-row>

                        <span class="text-muted">Description (optional)</span>
                        <b-form-textarea v-model="input.desc" placeholder="Enter description to show for this field" :rows="3" :max-rows="6"/>

                        <div v-if="input.files">
                            <br><b>File Mapping</b><br>
                            <p class="text-muted">Please specify configuration key to map each input files/directory to</p>
                            <transition-group name="height">
                                <b-card v-for="(file, fidx) in input.files" :key="fidx">
                                    <div class="button" @click="remove_file(idx, fidx)" style="float: right">
                                        <icon name="trash"/>
                                    </div>
                                    <b-row>
                                        <b-col>
                                            <b-input-group prepend="config.json key">
                                                <b-form-input type="text" v-model="file.id" required/>
                                            </b-input-group>
                                        </b-col>
                                        <b-col v-if="input.datatype" cols="7">
                                            <b-input-group prepend="file/dir">
                                                <b-form-select :options="datatypes[input.datatype].files.map(f => ({ text: f.id+' ('+(f.filename||f.dirname)+')', value: f.id }))" v-model="file.file_id" required/>
                                            </b-input-group>
                                        </b-col>
                                    </b-row>
                                </b-card>
                            </transition-group>
                            <br>
                            <b-button @click="add_file(idx)" size="sm">Add File Mapping</b-button>
                        </div>
                    </b-card>
                </div>
                <p>
                    <b-button size="sm" @click="add_dataset(input_datasets)" variant="success">Add Input Dataset</b-button>
                </p>
            </div>
            
            <h4>Output Datasets</h4>
            <div>
                <div v-for="(output, idx) in output_datasets" :key="idx" style="margin-bottom: 10px;">
                    <b-card>
                        <div class="button button-danger" @click="output_datasets.splice(idx, 1)" style="float: right">
                            <icon name="trash"/>
                        </div>
                        <b-row>
                            <b-col>
                                <b-input-group prepend="ID">
                                    <b-form-input type="text" v-model="output.id" required />
                                </b-input-group>
                                <small class="text-muted">Internal ID used to identify this output</small>
                            </b-col>
                            <b-col cols="7">
                            </b-col>
                        </b-row>
                        <b-row>
                            <b-col>
                                <div class="text-muted">Datatype</div>
                                <datatypeselecter v-model="output.datatype"></datatypeselecter>
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
                <p>
                    <b-button size="sm" @click="add_dataset(output_datasets)" variant="success">Add Output Dataset</b-button>
                </p>
            </div>
            
            <h4>Configuration</h4>
            <div>
                <div v-for="(param, idx) in config_params" :key="idx" style="margin:5px;">
                    <b-card v-if="param.type == 'integer' || param.type == 'number' || param.type == 'string'">
                        <div class="button button-danger" @click="config_params.splice(idx, 1)" style="float: right">
                            <icon name="trash" scale="1.25"/>
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
                                        <b-form-input v-if="param.type == 'integer'" type="number" v-model.number="param.default" placeholder="(no default)"/><!--deprecated-->
                                        <b-form-input v-if="param.type == 'number'" type="number" :step="0.01" v-model.number="param.default" placeholder="(no default)"/>
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
                                        <b-form-input type="number" :step="0.01" v-model.number="param.min" placeholder="(No min)"/>
                                    </b-input-group><br />
                                    <b-input-group prepend="Max">
                                        <b-form-input type="number" :step="0.01" v-model.number="param.max" placeholder="(No max)"/>
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
                    <b-card v-if="param.type == 'boolean'" :title="param.type | capitalize">
                        <div class="button button-danger" @click="config_params.splice(idx, 1)" style="float: right">
                            <icon name="trash"/>
                        </div>
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

                                <!-- doesn't make sense that boolean field can be optional
                                <b-form-group>
                                    <b-form-checkbox v-model="config.optional">Optional Configuration<br>
                                    <small class="text-muted">Check this if user should be able to submit your app without this parameter set</small></b-form-checkbox>
                                </b-form-group>
                                -->
                            </b-col>
                            <b-col sm="7">
                                <div class="text-muted">Description</div>
                                <b-form-input type="text" v-model="param.desc"></b-form-input>
                            </b-col>
                        </b-row>
                    </b-card>
                    <b-card v-else-if="param.type == 'enum'" :title="param.type | capitalize">
                        <div class="button button-danger" @click="config_params.splice(idx, 1)" style="float: right">
                            <icon name="trash"/>
                        </div>
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
                        <b-card v-for="(option, idx) in param.options" :key="idx">
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
            </div>
            <p>
                <b-dropdown size="sm" text="Add Configuration Parameter" variant="success">
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
import projectsselecter from '@/components/projectsselecter'
import datatypeselecter from '@/components/datatypeselecter'
import trueorfalse from '@/components/trueorfalse'
import tageditor from '@/components/tageditor'

export default {
    components: { 
        sidemenu, contactlist, 
        pageheader, projectsselecter,
        datatypeselecter, trueorfalse, tageditor,

        editor: require('vue2-ace-editor'),
    },
    data () {
        return {
            //tab_index: 0,
            app: {},
            
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

                    if(this.$route.params.id !== '_') {

                        //finally time to load app to edit
                        this.$http.get('app', {params: {
                            find: JSON.stringify({_id: this.$route.params.id})
                        }})
                        .then(res=>{
                            this.app = res.body.apps[0];

                            //convert output.files to JSON string - for now, we let user enter key/value where key is file_id and value is file/dir path 
                            this.app.outputs.forEach(output=>{
                                if(output.files) Vue.set(output, '_files', JSON.stringify(output.files, null, 4));
                            });
                            
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
        convert_config_to_ui: function() {
            /*
            put app information into input_datasets, output_datasets, and config_params,
            input_datasets: [{
                    id: 'input1',
                    _id: '5b35212ee546831043cde671',
                    datatype_tags: [...],
                    ...,
                    files: [{
                        type: 'input',
                        _id: 'networkneuro',
                        ...
                    }, ...]
                }, ...]
            output_datasets: [{
                    id: 'output1',
                    _id: '5b35212ee546831043cde671',
                    datatype_tags: [...],
                    ... // (no 'files' entry)
                }, ...]
            config_params: [{
                    id: 'test_string',
                    type: 'string',
                    default: 'test',
                    ...
                }, ...]
            */
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
                    this.config_params.push(param);
                }
            }
            
            for (let input of this.app.inputs) {
                input.files = input_files[input.id] || [];
                this.input_datasets.push(input);
            }
            for (let output of this.app.outputs) {
                if (output.files) {
                    output._files = JSON.stringify(output.files, null, 4);
                }
                this.output_datasets.push(output);
            }
        },
        
        convert_ui_to_config: function(cb) {
            let config = {};
            let inputs = [];
            let outputs = [];
            
            let inputTable = {};
            let outputTable = {};
            
            this.input_datasets.forEach(input => {
                if (!input.id) {
                    return cb("Not all input ids are non-null");
                }
                if (inputTable[input.id]) {
                    return cb("Duplicate ID '" + input.id + "' found in list of inputs");
                }
                
                let datatype = this.datatypes[input.datatype];
                if (datatype.name == "raw" && input.datatype_tags.length == 0) {
                    return cb("All raw input datatypes should have at least 1 datatype tag (when checking input '" + input.id + "').");
                }
                
                inputTable[input.id] = true;
                inputs.push({
                    _id: input._id,
                    id: input.id,
                    datatype_tags: input.datatype_tags,
                    datatype: input.datatype,
                    optional: input.optional,
                    multi: input.multi,
                });
                
                if (!input.files || input.files.length == 0) {
                    if (!file.id) {
                        return cb("No file mapping given for input '" + input.id + "'");
                    }
                }
                input.files.forEach(file => {
                    if (!file.id) {
                        return cb("Not all file ids for input '" + input.id + "' are non-null");
                    }
                    config[file.id] = {
                        type: 'input',
                        file_id: file.file_id,
                        input_id: input.id,
                    };
                });
            });
            
            this.output_datasets.forEach(output => {
                if (!output.id) {
                    return cb("Not all output ids are non-null");
                }
                if (inputTable[output.id]) {
                    return cb("Duplicate ID '" + output.id + "' found in list of inputs and outputs");
                }
                if (outputTable[output.id]) {
                    return cb("Duplicate ID '" + output.id + "' found in list of outputs");
                }
                
                let datatype = this.datatypes[output.datatype];
                let invalid = false;
                
                if (datatype.name == "raw" && output.datatype_tags.length == 0) {
                    return cb("All raw output datatypes should have at least 1 datatype tag (when checking '" + output.id + "').");
                }
                
                try {
                    outputTable[output.id] = true;
                    outputs.push({
                        _id: output._id,
                        id: output.id,
                        datatype_tags: output.datatype_tags,
                        datatype: output.datatype,
                        datatype_tags_pass: output.datatype_tags_pass,
                        files: output._files ? JSON.parse(output._files) : null,
                    });
                } catch (err) {
                    invalid = true;
                }
                
                if (invalid) {
                    return cb("Failed to parse JSON given for output '" + output.id + "'");
                }
            });
            
            this.config_params.forEach(param => {
                if (!param.id) {
                    return cb("Not all configuration parameter ids are non-null");
                }
                if (inputTable[param.id]) {
                    return cb("Duplicate ID '" + param.id + "' used for configuration parameter and input");
                }
                if (outputTable[param.id]) {
                    return cb("Duplicate ID '" + param.id + "' used for configuration parameter and output");
                }
                
                config[param.id] = {
                    type: param.type,
                    placeholder: param.placeholder,
                    desc: param.desc,
                    default: param.default,
                    options: param.options,
                    readonly: param.readonly,
                    optional: param.optional,
                    min: param.min,
                    max: param.max,
                };
            });
            
            this.app.config = config;
            this.app.inputs = inputs;
            this.app.outputs = outputs;
            
            return cb(null);
        },
        
        add_file: function(index) {
            this.input_datasets[index].files.push({
                type: 'input',
                id: '',
                desc: '',
                default: '',
            });
            // to trigger vue dom change
            Vue.set(this.input_datasets, index, this.input_datasets[index]);
        },
        
        remove_file: function(dataset_idx, file_idx) {
            this.input_datasets[dataset_idx].files.splice(file_idx, 1);
            Vue.set(this.input_datasets, dataset_idx, this.input_datasets[dataset_idx]);
        },
        
        add_param: function(type, input) {
            //tempid just have to be unique
            let param = { id: '', type, placeholder: '', desc: '', default: ''};
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
        },
        
        add_dataset: function(it) {
            it.push({
                id: "",
                datatype: null,
                datatype_tags: [],
                datatype_tags_pass: null,
                files: [],
            });
        },
        
        add_reference: function() {
            if(!this.app.references) Vue.set(this.app, 'references', []);
            this.app.references.push({text: ''});
        },
        
        input_datatype_changed: function(idx) {
            let input = this.app.inputs[idx];
            if (input.id) {
                console.log('input datatype changed', input);
                
            }
        },
        
        cancel: function() {
            this.$router.go(-1);
        },

        submit: function() {
            console.log("clicked submit");
            
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
        load_app_tags: function() {
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
        editorInit: function() {
            require('brace/mode/json')
            //require('brace/theme/twilight')
        },
        is_raw: function(input) {
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
left: 90px;
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
.main-section {
position: fixed;
left: 90px;
right: 0px;
top: 130px;
bottom: 0px;
overflow: auto;
}

.slide-fade-enter-active {
  transition: all .3s ease;
}
.slide-fade-leave-active {
  transition: none;
}
.slide-fade-enter, .slide-fade-leave-to {
  transform: translateX(10px);
  opacity: 0;
}
.form-action {
text-align: right;
position: sticky;
bottom:0;
background-color: rgba(100,100,100,0.4);
padding:10px;
}
</style>
