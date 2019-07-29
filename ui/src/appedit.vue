<template>
<div class="appedit">
    <sidemenu active="/apps"></sidemenu>
    <div class="page-header" v-if="ready">
        <b-container>
            <p style="float: right; color: #999;">
                <b-button size="sm" variant="outline-secondary" href="https://brainlife.io/docs/apps/introduction" target="doc">
                    <icon name="book"/> Documentation
                </b-button>
            </p>
            <h4 style="margin-right: 150px" v-if="$route.params.id == '_'">New App</h4>
            <h4 style="margin-right: 150px" v-else>{{app.name}}</h4>
        </b-container>
    </div>

    <div class="page-content" v-if="ready">
        <b-form>
        <b-container>
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
                    <p>
                        <small class="text-muted">
Normally, the App description is automatically pulled from github repo description that you specify below. If you'd like to use different description from the one used for your github repo, you can enter it here to override the github repo description.</small>
                    </p>
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
                            <b-input-group prepend="https://github.com/">
                                <b-form-input type="text" v-model="app.github" placeholder="github-org/app-name" required/>
                            </b-input-group>
                            <small v-if="app.github && github_branches && github_branches.length == 0" class="text-danger">No such repository found.</small>
                        </b-col>
                        <b-col>
                            <b-input-group prepend="Branch/Tag">
                                <b-form-select v-model="app.github_branch">
                                    <optgroup label="Branches" v-if="github_branches">
                                        <option v-for="branch in github_branches" :key="branch" :value="branch">{{branch}}</option>
                                    </optgroup>
                                    <optgroup label="Tags" v-if="github_tags">
                                        <option v-for="tag in github_tags" :key="tag" :value="tag">{{tag}}</option>
                                    </optgroup>
                                </b-form-select>
                                
                            </b-input-group>
                                <small v-if="app.github_branch == 'master'" class="text-danger"><icon name="exclamation" scale="0.8"/> Please avoid master branch</small>
                        </b-col>
                    </b-row>
                    <br>
                </b-col>
            </b-row>

            <h4>
                <a style="float: right;" href="https://brainlife.io/docs/apps/register/#configuration-parameters" target="doc"><icon name="book"/></a>
                Configuration
            </h4>
            <div>
                <div v-for="(param, idx) in config_params" v-if="param.pid" :key="param.pid" style="margin:5px;">
                    <b-card>
                         <div class="right-buttons">
                            <div class="button" v-if="idx > 0 && config_params.length > 1" @click="move_param_up(idx)">
                                <icon name="arrow-up"/>
                            </div>
                            <div class="button" v-if="idx < config_params.length - 1 && config_params.length > 1" @click="move_param_down(idx)">
                                <icon name="arrow-down"/>
                            </div>
                            <div class="button button-danger" @click="config_params.splice(idx, 1)">
                                <icon name="trash"/>
                            </div>
                        </div>
                        <h5>{{param.type|capitalize}}</h5>
                        <b-row v-if="param.type == 'integer' || param.type == 'number' || param.type == 'string'">
                            <b-col>
                                <b-form-group>
                                    <b-input-group prepend="config.json key *">
                                        <b-form-input type="text" v-model="param.id" required/>
                                    </b-input-group>
                                </b-form-group>

                                <b-form-group>
                                    <b-input-group prepend="Default Value">
                                        <b-form-input v-if="param.type == 'integer'" type="number" v-model.number="param.default" placeholder="(no default)" @mousewheel.native="$event.preventDefault()"/><!--deprecated-->
                                        <b-form-input v-if="param.type == 'number'" type="number" step="0.01" v-model.number="param.default" placeholder="(no default)" @mousewheel.native="$event.preventDefault()"/>
                                        <b-form-input v-if="param.type == 'string' && !param.multiline" type="text" v-model="param.default" placeholder="(no default)"/>
                                        <b-form-textarea v-if="param.type == 'string' && param.multiline" v-model="param.default" placeholder="(no default)" :rows="2"/>
                                    </b-input-group>
                                </b-form-group>

                                <b-form-group v-if="param.default !== ''">
                                    <b-form-checkbox v-model="param.readonly">Read Only<br>
                                        <small class="text-muted">Value will be fixed to the default value and user can not change it</small>
                                    </b-form-checkbox>
                                </b-form-group>

                                <b-form-group>
                                    <b-form-checkbox v-model="param.optional">Optional Configuration<br>
                                        <small class="text-muted">Check this if user should be able to submit your app without this parameter set</small>
                                    </b-form-checkbox>
                                </b-form-group>

                                <b-form-group v-if="param.type == 'string'">
                                    <b-form-checkbox v-model="param.multiline">Multi-line<br>
                                        <small class="text-muted">Allow user to enter text in multiple line</small>
                                    </b-form-checkbox>
                                </b-form-group>

                                <b-form-group v-if="param.optional || param.default">
                                    <b-form-checkbox v-model="param.advanced">Advanced Option<br>
                                        <small class="text-muted">Show this option under <b>advanced</b> configuration section.</small>
                                    </b-form-checkbox>
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
                        <b-row v-if="param.type == 'boolean'">
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
                        <div v-else-if="param.type == 'enum'">
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
                                    <b-form-group v-if="param.optional || param.default">
                                        <b-form-checkbox v-model="param.advanced">Advanced Option<br>
                                            <small class="text-muted">Show this option under <b>advanced</b> configuration section.</small>
                                        </b-form-checkbox>
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
                            <b-button @click="param.options.push({ desc: '', label: '', value: '' })" size="sm" variant="outline-secondary">Add Enum Option</b-button>
                        </div>
                    </b-card>
                </div>
            </div>
            <p>
                <b-dropdown size="sm" text="Add Configuration Parameter">
                    <b-dropdown-item @click="add_param('string')">String</b-dropdown-item>
                    <b-dropdown-item @click="add_param('number')">Number</b-dropdown-item>
                    <b-dropdown-item @click="add_param('boolean')">Boolean</b-dropdown-item>
                    <b-dropdown-item @click="add_param('enum')">Enum (Multiple Choice)</b-dropdown-item>
                    <!--integer is deprecated-->
                </b-dropdown>
            </p>
            
            <h4>
                <a style="float: right;" href="https://brainlife.io/docs/apps/register/#input-datasets" target="doc"><icon name="book"/></a>
                Input
            </h4>
            <div style="border-left: 4px solid #007bff; padding-left: 10px;">
                <!--<transition-group name="move-item" tag="p">-->
                    <div v-for="(input, idx) in input_datasets" v-if="input.pid" :key="input.pid" style="margin-bottom: 10px;">
                        <b-card style="position: relative;">
                            <b-row v-if="is_raw(input)">
                                <b-col>
                                    <b-alert show variant="warning" style="margin-bottom: 10px;">
                                        Warning: You have chosen a raw datatype as an input. We strongly recommend working with the developers of the App who is generating the raw datatype to register a new datatype so that it can used instead to pass dataset between Apps. Please refer to <a href="https://brainlife.io/docs/user/datatypes/">Datatypes</a>
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
                                     <div class="right-buttons">
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
                                        Optional Configuration
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
                                    <datatype :datatype="datatypes[input.datatype]" style="margin-top: 5px;" v-if="input.datatype" :clickable="false"/>
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
                                <!--<transition-group name="file-transition" tag="div">-->
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
                                <!--</transition-group>-->
                                <br>
                                <b-button v-if="input.datatype" @click="add_file(idx)" size="sm">Add File Mapping</b-button>
                            </div>
                        </b-card>
                    </div>
                <!--</transition-group>-->
                <p>
                    <b-button size="sm" @click="add_dataset(input_datasets)" variant="primary">Add Input</b-button>
                </p>
            </div>
            
            <h4>
                <a style="float: right;" href="https://brainlife.io/docs/apps/register/#output-datasets" target="doc"><icon name="book"/></a>
                Output
            </h4>
            <div style="border-left: 4px solid #28a745; padding-left: 10px;">
                <div v-for="(output, idx) in output_datasets" v-if="output.pid" :key="output.pid" style="margin-bottom: 10px;">
                    <b-card>
                           <b-row>
                            <b-col>
                                <div class="text-muted">Output Directory</div>
                                <b-form-input type="text" v-model="output.id" required />
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
                        <!--<small class="text-muted">You should output files in a subdirectory with this ID as the directory name (unless you set "Output on root" below.)</small>-->
                        <b-row>
                            <b-col>
                                <div class="text-muted">Datatype</div>
                                <datatypeselecter v-model="output.datatype"></datatypeselecter>
                                <datatype :datatype="datatypes[output.datatype]" style="margin-top: 5px;" v-if="output.datatype" :clickable="false"/>
                            </b-col>
                            <b-col cols="7" v-if="output.datatype">
                                <div class="text-muted">Datatype Tags</div>
                                <tageditor v-model="output.datatype_tags" :options="datatypes[output.datatype]._tags" />
                                <small class="text-muted">Set these datatype tags on this output dataset</small>

                                <div class="text-muted">Datatype Tags Passthrough</div>
                                <b-form-select v-model="output.datatype_tags_pass">
                                    <option :value="null">(No Pass)</option>
                                    <option v-for="input in input_datasets" :key="input.id" :value="input.id">{{input.id}}</option>
                                </b-form-select>
                                <small class="text-muted">Add all datatype tags from the input dataset specified</small>
                                
                            </b-col>
                        </b-row>
                        
                        <br>
                        <b-form-checkbox v-model="output.output_on_root">(DEPRECATED) ignore output directory. Output files will be stored on the root of workdir.</b-form-checkbox>
                        <div v-if="output.output_on_root">
                            <div class="text-muted" style="margin-top: 3px;">Datatype File Mapping <small>Optional override of file/direcory name to avoid more than 1 output to collide.</small></div>
                            <b-form-textarea v-model="output._files" :rows="3" :placeholder="default_outmap(output.datatype)"></b-form-textarea>
                        </div>
                    </b-card>
                </div>
                <p>
                    <b-button size="sm" @click="add_dataset(output_datasets)" variant="success">Add Output</b-button>
                </p>
            </div>

            <hr>

            <b-form-group label="Deprecated By" horizontal>
                <small>This App has been deprecated(obsoleted) by the following App.</small>
                <v-select v-model="app.deprecated_by" label="name" :filterable="false" :options="search_apps" @search="search_app" placeholder="Please enter App name to search">
                    <!--<template slot="no-options">please enter App name / desc to search (2)</template>-->
                    <template slot="option" slot-scope="app">
                        <app :app="app" :compact="true" :clickable="false"/>
                    </template>
                    <template slot="selected-option" slot-scope="app">
                        {{app.name}}
                    </template>
                </v-select>
                <app v-if="app.deprecated_by" :app="app.deprecated_by" :compact="true" :clickable="false" style="margin-top: 5px;"/>
            </b-form-group>
            
            <b-form-group label="" horizontal>
                <b-form-checkbox v-if="app._id" v-model="app.removed">Removed <small>This App won't be listed as available Apps, but users can still find it through a direct URL / DOI</small></b-form-checkbox>
            </b-form-group>

            <!--make sure submit area won't cover the Add Output button-->
            <br>
            <br>
            <br>
            <br>
            <br>
            <br>
            <br>
            <br>
        </b-container>
        </b-form>

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
        
        <div class="page-footer">
            <b-container>
                <b-button @click="cancel">Cancel</b-button>
                <b-button @click="submit" variant="primary" :disabled="submitting"><icon v-if="submitting" name="cog" spin/> Submit</b-button>
            </b-container>
        </div>
    </div><!--page-content-->
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
import app from '@/components/app'

import search_app_mixin from '@/mixins/searchapp'

let debounce;

export default {
    mixins: [ search_app_mixin ],
    components: { 
        sidemenu, contactlist, 
        pageheader, multiprojectselecter,
        datatypeselecter, trueorfalse, tageditor, datatype, app,

        editor: require('vue2-ace-editor'),
    },
    data() {
        return {
            app: {
                config: {},
                inputs: [],
                outputs: [],
                github_branch: "master",
                github: "",
            },

            invalid_repo: false,
            github_branches: null,
            github_tags: null,
            
            input_datasets: [],
            output_datasets: [],
            config_params: [],

            alltags: [],

            ready: false,  //ready to render form
            submitting: false,

            datatypes: null, //registered datatypes (keyed by datatype_id)

            config: Vue.config
        }
    },

    computed: {
        github_bt() {
            return {
            }
        }
    },

    mounted: function() {
        //load datatypes for form
        this.$http.get('datatype').then(res=>{
            this.datatypes = {};
            res.data.datatypes.forEach(type=>{
                this.datatypes[type._id] = type;
                type._tags = [];
            });

            //load datatype_tags from all apps -- TODO - this is super inefficient!
            this.$http.get('app', {params: {
                select: 'inputs outputs',
                limit: 500, //TODO - this is not sustailable
            }}).then(res=>{
                var v = this;
                function aggregate_tags(dataset) {
                    if(!dataset.datatype_tags) return;
                    dataset.datatype_tags.forEach(tag=>{
                        var dt = v.datatypes[dataset.datatype];
                        if(!~dt._tags.indexOf(tag)) dt._tags.push(tag);
                    });
                }
                res.data.apps.forEach(app=>{
                    app.inputs.forEach(aggregate_tags);
                    app.outputs.forEach(aggregate_tags);
                });

                //load apptags catalog
                this.load_app_tags().then(tags=>{
                    this.alltags = tags;
                    if (this.$route.params.id == '_') {
                        //new .. (can't do it in data() for some reason (maybe because contact list is not setup?))
                        this.app.admins = [Vue.config.user.sub];
                        this.convert_config_to_ui();
                        this.ready = true;
                    } else {
                        //finally time to load app to edit
                        this.$http.get('app/'+this.$route.params.id, {params: {
                            //find: JSON.stringify({_id: this.$route.params.id}),
                            //limit: 1,
                            populate: 'deprecated_by',
                        }}).then(res=>{
                            this.app = res.data;
                            this.convert_config_to_ui();
                            this.load_branches();
                            if(this.$route.params.mode == 'copy') {
                                this.app.name += " - copy";
                                delete this.app._id;
                                delete this.app.doi;
                                delete this.app.create_date;
                            }
                            this.ready = true;
                        });
                    }
                });
            });
        }, res => {
            console.error(res);
        });
    },

    watch: {
        "app.github"(newv, oldv) {
            clearTimeout(debounce);
            debounce = setTimeout(()=>{ 
                this.load_branches();
            }, 1000);
        },
    },

    methods: {
        load_branches() {
            if(!this.app.github) return;
            console.log("loading branches", this.app.github);
            this.github_branches = null;
            this.$http.get('https://api.github.com/repos/' + this.app.github + '/branches', 
                { headers: { Authorization: null } })
            .then(res=>{
                this.github_branches = res.data.map(b => {
                    return b.name;
                });
            }).catch(err=>{
                this.github_branches = [];
                console.error(err);
            });

            this.github_tags = null;
            this.$http.get('https://api.github.com/repos/' + this.app.github + '/tags', 
                { headers: { Authorization: null } })
            .then(res=>{
                this.github_tags = res.data.map(b => {
                    return b.name;
                });
            }).catch(err=>{
                this.github_tags = [];
                console.error(err);
            });
        },
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
        
        validate(cb) {
            let config = {};
            let inputTable = {};
            let outputTable = {};
            let paramTable = {};

            if(!this.app.github) return cb("please specify github repo");
            this.app.github = this.app.github.trim();
            if(this.app.github.split("/").length != 2) return cb("please enter github repo in 'orgname/reponame' format");
            
            for (let input of this.input_datasets) {
                if (!input.id) return cb("Not all input ids are non-null");
                if (inputTable[input.id]) return cb("Duplicate ID '" + input.id + "' found in list of inputs");
                if (!input.datatype) return cb("No datatype given for input '" + input.id + "'");
                
                let datatype = this.datatypes[input.datatype];
                if (datatype.name == "raw" && input.datatype_tags.length == 0) {
                    return cb("All raw input datatypes should have at least 1 datatype tag (when checking input '" + input.id + "').");
                }
                
                inputTable[input.id] = true;
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
                    return cb("Failed to parse JSON given for output:" + output.id);
                }

                //datatype_tags_pass could be set to an invalid id if user changes input id
                if(output.datatype_tags_pass && !inputTable[output.datatype_tags_pass]) {
                    return cb("Datatype Tags Passthrough id is invalid for output:" + output.id);
                }
            }
            
            for (let param of this.config_params) {
                if (!param.id) {
                    return cb("Not all configuration parameter ids are non-null");
                }
                if (config[param.id]) {
                    return cb("Duplicate ID '" + param.id + "' used for config.json key or input file mapping ID");
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
                advanced: false,
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

        submit(evt) {
            console.log("submitting");
            if(this.submitting) return;
            this.submitting = true;
            this.validate(err => {
                if (err) {
                    this.$notify({ text: err, type: 'error' });
                    console.error(err);
                    this.submitting = false;
                } else {
                    let app_submitting = Object.assign({}, this.app);
                    if(this.app.deprecated_by) app_submitting.deprecated_by = this.app.deprecated_by._id; //deref

                    //now ready to submit
                    if(this.app._id) {
                        //update
                        this.$http.put('app/' + this.app._id, app_submitting)
                        .then(res=>{
                            this.$router.push("/app/" + this.app._id);
                            this.submitting = false;
                        }).catch(err=>{
                            this.$notify({text: err.body.message, type: 'error' });
                            console.error(err);
                            this.submitting = false;
                        });
                    } else {
                        //new
                        this.$http.post('app', app_submitting)
                        .then(res => {
                            this.$router.push("/app/" + res.data._id);
                            this.submitting = false;
                        }).catch(err=>{
                            this.$notify({text: err.body.message, type: 'error' });
                            console.error(err);
                            this.submitting = false;
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
                    limit: 500, //TODO - this is not sustailable
                }}).then(res=>{
                    var alltags = []; 
                    res.data.apps.forEach(app=>{
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

        default_outmap(datatype_id) {
            let datatype = this.datatypes[datatype_id];
            let def = {};
            if(!datatype.files) {
                console.error("datatype", datatype_id, "doesn't have files?");
                return "";
            }
            datatype.files.forEach(file=>{
                def[file.id] = file.filename||file.dirname;
            });
            return JSON.stringify(def, null, 4);
        },
    }
}
</script>

<style scoped>
.page-header {
padding: 10px 0px;    
}
.page-header h4 {
opacity: 0.8;
}
.file-map {
margin: 7px;
}
.page-content h4 {
color: #999;
border-bottom: 1px solid #ddd;
margin: 10px 0px;
padding: 10px 0px;
}

.file-transition-enter-active {
transition: all .45s;
}
.file-transition-enter {
opacity: 0;
transform: translate(0, -100%);
}

.move-item-enter-active, .move-item-leave-active {
transition: none;
}
.move-item-move {
transition: transform .45s;
}
.right-buttons {
float: right;
position: relative;
z-index: 1;
}
h5 {
font-size: 18px;
}
</style>
