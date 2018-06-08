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
            <div>
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
            <div><!--to keep input indx separate from output-->
                <div v-for="(input, idx) in app.inputs" :key="idx" style="margin-bottom: 10px;">
                    <b-card style="position: relative;">
                        <b-row>
                            <b-col cols="5">
                                <b-input-group prepend="ID">
                                    <b-form-input type="text" v-model="input.id"required/>
                                </b-input-group>
                            </b-col>
                            <b-col cols="7">
                                <div class="button button-danger" @click="remove_input(idx)" style="float: right">
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
                                <tageditor placeholder="Tags" v-if="input.datatype" v-model="input.datatype_tags"/>
                                <small class="text-muted">Only allow user to select datasets with these tags. You can prefix tags with ! for negative tags</small>
                            </b-col>
                        </b-row>

                        <span class="text-muted">Description (optional)</span>
                        <b-form-textarea v-model="input.desc" placeholder="Enter description to show for this field" :rows="3" :max-rows="6"/>

                        <div v-if="input.datatype">
                            <br><b>File Mapping</b><br>
                            <p class="text-muted">Please specify configuration key to map each input files/directory to</p>
                            <transition-group name="height">
                                <b-card v-for="(config, name) in app.config" :key="name" v-if="config.type == 'input' && config.input_id == input.id">
                                    <div class="button" @click="remove_config(name)" style="float: right">
                                        <icon name="trash"/>
                                    </div>
                                    <b-row>
                                        <b-col>
                                            <b-input-group prepend="config.json key">
                                                <b-form-input type="text" v-model="config._id" required/>
                                            </b-input-group>
                                        </b-col>
                                        <b-col v-if="input.datatype" cols="7">
                                            <b-input-group prepend="file/dir">
                                                <b-form-select :options="datatypes[input.datatype].files.map(f => ({ text: f.id+' ('+(f.filename||f.dirname)+')', value: f.id }))" v-model="config.file_id" required/>
                                            </b-input-group>
                                        </b-col>
                                    </b-row>
                                </b-card>
                            </transition-group>
                            <br>
                            <b-button @click="add_config('input', input)" size="sm">Add File Mapping</b-button>
                        </div>
                    </b-card>
                </div>
                <p>
                    <b-button size="sm" @click="add_dataset(app.inputs)" variant="success"> Add Input Dataset</b-button>
                </p>
            </div>

            <h4>Output Datasets</h4>
            <div><!--to keep output indx separate from output-->
                <div v-for="(output, idx) in app.outputs" :key="idx" style="margin-bottom: 10px;">
                    <b-card>
                        <div class="button button-danger" @click="app.outputs.splice(idx, 1)" style="float: right">
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
                    <b-button size="sm" @click="add_dataset(app.outputs)" variant="success">Add Output Dataset</b-button>
                </p>
            </div>

            <h4>Configuration</h4>
            <div><!--to keep idx different-->
                <div v-for="(config, name) in app.config" :key="name" style="margin:5px;">
                    <b-card v-if="config.type == 'integer' || config.type == 'number' || config.type == 'string'">
                        <div class="button button-danger" @click="remove_config(name)" style="float: right">
                            <icon name="trash" scale="1.25"/>
                        </div>
                        <h4>{{config.type|capitalize}}</h4>
                        <b-row>
                            <b-col>
                                <b-form-group>
                                    <!--
                                    <span class="text-muted">Key <small>in config.json</small></span>
                                    <b-form-input type="text" v-model="config._id" required placeholder="A key to use in config.json"/>
                                    -->
                                    <b-input-group prepend="config.json key">
                                        <b-form-input type="text" v-model="config._id" required/>
                                    </b-input-group>
                                </b-form-group>

                                <b-form-group>
                                    <b-input-group prepend="Default Value">
                                        <b-form-input v-if="config.type == 'integer'" type="number" v-model.number="config.default" placeholder="(no default)"/><!--deprecated-->
                                        <b-form-input v-if="config.type == 'number'" type="number" :step="0.01" v-model.number="config.default" placeholder="(no default)"/>
                                        <b-form-input v-if="config.type == 'string'" type="text" v-model="config.default" placeholder="(no default)"/>
                                    </b-input-group>
                                </b-form-group>

                                <b-form-group v-if="config.default !== ''">
                                    <b-form-checkbox v-model="config.readonly">Read Only<br>
                                    <small class="text-muted">Value will be fixed to the default value and user can not change it</small></b-form-checkbox>
                                </b-form-group>

                                <b-form-group>
                                    <b-form-checkbox v-model="config.optional">Optional Configuration<br>
                                    <small class="text-muted">Check this if user should be able to submit your app without this parameter set</small></b-form-checkbox>
                                </b-form-group>

                                <div v-if="!config.readonly && (config.type == 'number' || config.type == 'integer')">
                                    <b-input-group prepend="Min">
                                        <b-form-input type="number" :step="0.01" v-model.number="config.min" placeholder="(No min)"/>
                                    </b-input-group>
                                    <b-input-group prepend="Max">
                                        <b-form-input type="number" :step="0.01" v-model.number="config.max" placeholder="(No max)"/>
                                    </b-input-group>
                                </div>
                            </b-col>
                            <b-col sm="7">
                                <b-form-group>
                                    <div class="text-muted">Placeholder <small>optional text to show inside the form element if no value is specified</small></div>
                                    <b-form-input type="text" v-model="config.placeholder"></b-form-input>
                                </b-form-group>
                                <b-form-group>
                                    <div class="text-muted">Description <small>optional</small></div>
                                    <b-form-textarea v-model="config.desc" placeholder="Enter description to add for this field" :rows="5" :max-rows="8"></b-form-textarea>
                                </b-form-group>
                            </b-col>
                        </b-row>
                    </b-card>
                    <b-card v-if="config.type == 'boolean'" :title="config.type | capitalize">
                        <div class="button button-danger" @click="remove_config(name)" style="float: right">
                            <icon name="trash"/>
                        </div>
                        <b-row>
                            <b-col>
                                <b-form-group>
                                    <b-input-group prepend="Key">
                                        <b-form-input type="text" v-model="config._id"></b-form-input>
                                    </b-input-group>
                                </b-form-group>
                                <b-form-group>
                                    <b-input-group prepend="Default Value">
                                        <trueorfalse v-model="config.default"/>
                                    </b-input-group>
                                </b-form-group>
                                <b-form-group>
                                    <b-form-checkbox v-model="config.readonly">Read Only 
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
                                <b-form-input type="text" v-model="config.desc"></b-form-input>
                            </b-col>
                        </b-row>
                    </b-card>
                    <b-card v-else-if="config.type == 'enum'" :title="config.type | capitalize">
                        <div class="button button-danger" @click="remove_config(name)" style="float: right">
                            <icon name="trash"/>
                        </div>
                        <b-row>
                            <b-col>
                                <b-form-group>
                                    <b-input-group prepend="Key">
                                        <b-form-input type="text" v-model="config._id"></b-form-input>
                                    </b-input-group>
                                </b-form-group>
                                <b-form-group v-if="config.options.length">
                                    <b-input-group prepend="Default Value">
                                        <b-form-select :options="config.options.map(o => o.value)" v-model="config.default"></b-form-select>
                                    </b-input-group>
                                </b-form-group>
                                <b-form-group v-if="config.default !== ''">
                                    <b-form-checkbox v-model="config.readonly">Read Only 
                                    <br><small class="text-muted">Value will be fixed to the default value and user can not change it</small></b-form-checkbox>
                                </b-form-group>
                                <b-form-group>
                                    <b-form-checkbox v-model="config.optional">Optional Configuration<br>
                                    <small class="text-muted">Check this if user should be able to submit your app without this parameter set</small></b-form-checkbox>
                                </b-form-group>
                            </b-col>
                            <b-col sm="7">
                                <div class="text-muted">Description</div>
                                <b-form-textarea v-model="config.desc" :rows="4"></b-form-textarea>
                            </b-col>
                        </b-row>
                        <b>Options</b>
                        <b-card v-for="(option, idx) in config.options" :key="idx">
                            <div class="button" @click="config.options.splice(idx, 1)" style="float: right">
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
                        <b-button @click="config.options.push({ desc: '', label: '', value: '' })" size="sm">Add Enum Option</b-button>
                    </b-card>
                </div>
            </div>
            <p>
                <b-dropdown size="sm" text="Add Configuration Parameter" variant="success">
                    <b-dropdown-item @click="add_config('string')">String</b-dropdown-item>
                    <b-dropdown-item @click="add_config('number')">Number</b-dropdown-item>
                    <b-dropdown-item @click="add_config('boolean')">Boolean</b-dropdown-item>
                    <b-dropdown-item @click="add_config('enum')">Enum</b-dropdown-item>
                    <!--integer is deprecated-->
                </b-dropdown>
            </p>

            <br>
            <br>
            <br>
            <br>
            <div class="form-action">
                <b-button @click="cancel">Cancel</b-button>
                <b-button type="submit" variant="primary">Submit</b-button>
            </div>
        </b-form>

        <b-card v-if="config.debug">
            <br>
            <br>
            <br>
            <div slot="header">Debug</div>
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
            app: {
                projects: [],
                admins: null,

                name: null,
                desc: null,
                desc_overide: null,

                citation: null,
                references: [],

                tags: [],
                avatar: null,

                github: null,
                github_branch: null,
                
                config: {},

                inputs: [],
                outputs: [],
            },

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
                            
                            // have to make sure ids exist for vue reactivity when changing _config object keys later..
                            for (var k in this.app.config)  Vue.set(this.app.config[k], '_id', k);

                            //convert output.files to JSON string - for now, we let user enter key/value where key is file_id and value is file/dir path 
                            this.app.outputs.forEach(output=>{
                                if(output.files) Vue.set(output, '_files', JSON.stringify(output.files, null, 4));
                            });

                            this.ready = true;
                        });
                    } else {
                        //init.. (can't do it in data() for some reason (maybe because contact list is not setup?)
                        this.app.admins = [Vue.config.user.sub];
                        this.ready = true;
                    }

                });
            });
        }, res=>{
            console.error(res);
        });
    },

    methods: {
        add_config: function(type, input) {
            //tempid just have to be unique
            var tempid = 0;
            while(this.app.config[tempid]) tempid++;

            var config = { _id: '', type, placeholder: '', desc: '', default: ''};
            switch(type) {
            case "input":
                config.file_id = '';
                config.input_id = input.id;
                break;
            case "boolean":
                config.default = false;
                break;
            case "enum":
                config.options = [];
                break;
            case "number":
            case "integer":
                config.default = null;
            case "string":
                break;
            }
            Vue.set(this.app.config, tempid, config);
        },
        
        add_dataset: function(it) {
            it.push({
                //id: it.length,
                id: "",
                datatype: null,
                datatype_tags: [],
                datatype_tags_pass: null, //only for output
            });
        },
        
        add_reference: function() {
            if(!this.app.references) Vue.set(this.app, 'references', []);
            this.app.references.push({text: ''});
        },
        remove_input: function(idx) {
            //remove all file mapping configs that uses this input also
            var input = this.app.inputs[idx];
            for (var k in this.app.config) {
                if (this.app.config[k].input_id == input.id) Vue.delete(this.app.config, k);
            }
            
            this.app.inputs.splice(idx, 1);
        },
        
        remove_config: function(id) {
            if (this.app.config[id]) Vue.delete(this.app.config, id);
        },
        
        cancel: function() {
            this.$router.go(-1);
        },

        submit: function(evt) {
            evt.preventDefault();
            console.log("clicked submit");

            //remove orphaned config entries (input that points to non-existing app.input)
            for(var id in this.app.config) {
                var config = this.app.config[id];
                if(config.type == "input") {

                    //find the app.input with the same input_id
                    var found = this.app.inputs.find(it=>(it.id == config.input_id));
                    if(!found) {
                        console.log("app.config with input_id:",id,"no longer has app.inputs "+config.input_id+".. removing");
                        delete this.app.config[id];
                    }
                }
            }
        
            var valid = true;

            //make sure all inputs has file mapping
            this.app.inputs.forEach(input=>{
                var found = null;
                for (var k in this.app.config) {
                    if (this.app.config[k].input_id == input.id) found = this.app.config;
                }
                if(!found) {
                    valid = false;
                    this.$notify({text: "Please enter at least one file mapping per each input:"+input.id, type: 'error' });
                }
            }); 

            //make sure there are no duplicate config key used in input
            var keys = [];
            for(var id in this.app.config) {
                var key = this.app.config[id]._id;
                if(~keys.indexOf(key)) {
                    this.$notify({text: "Configuration key:"+key+" is also used in input. Please use a different key", type: 'error' });
                    valid = false;
                } else {
                    keys.push(key); 
                }
            }

            //make sure all raw input/output has at least 1 datatype tags
            this.app.inputs.forEach(input=>{
                var datatype = this.datatypes[input.datatype];
                if(datatype.name  == "raw" && input.datatype_tags.length == 0) {
                    this.$notify({text: "All raw input should have at least 1 datatype tag", type: 'error' });
                    valid = false;
                }
            });
            this.app.outputs.forEach(output=>{
                var datatype = this.datatypes[output.datatype];
                if(datatype.name  == "raw" && output.datatype_tags.length == 0) {
                    this.$notify({text: "All raw output should have at least 1 datatype tag", type: 'error' });
                    valid = false;
                }
            });

            //parse output mapping json
            try {
                this.app.outputs.forEach(output=>{
                    output.files = null;
                    if(output._files) output.files = JSON.parse(output._files);
                });
            } catch(err) {
                this.$notify({ text: 'Failed to parse output mapping. Please check JSON syntax', type: 'error' });
                return;
            }

            if(!valid) {
                console.error("invalid form");
                return; 
            }

            console.log("form good");

            //update config object key with _id specified by the user - instead of ones that are generated for UI
            let keyed_app = Object.assign({}, this.app);
            let keyed_config = {};
            for (var k in keyed_app.config) {
                var c = keyed_app.config[k];
                keyed_config[c._id] = c; 
                delete c._id; //why?
            }
            keyed_app.config = keyed_config;

            //now ready to submit
            if(this.$route.params.id !== '_') {
                //update
                this.$http.put('app/'+keyed_app._id, keyed_app)
                .then(res=>{
                    this.$router.push("/app/"+keyed_app._id);
                }).catch(err=>{
                    this.$notify({text: err.body.message, type: 'error' });
                });
            } else {
                //new
                this.$http.post('app', keyed_app)
                .then(res=>{
                    this.$router.push("/app/"+res.body._id);
                }).catch(err=>{
                    this.$notify({text: err.body.message, type: 'error' });
                });
            } 
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
padding: 20px;
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
position: fixed;
right: 0px;
left: 90px;
bottom: 0px;
padding: 10px 30px;
background-color: rgba(100,100,100,0.4);
}
</style>
