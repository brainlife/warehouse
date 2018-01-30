<template>
<div class="appedit">
    <pageheader/>
    <sidemenu active="/apps"></sidemenu>
    <div class="fixed-top">
        <div class="container" style="height: 50px;">
            <div style="color: white; margin: 20px 0px;">
                <h2 v-if="$route.params.id == '_'">New App</h2>
                <h2 v-else><icon name="pencil" scale="2" style="opacity: 0.5"/> {{app.name}}</h2>
            </div>
        </div>
        <!--
        <b-tabs class="brainlife-tab" v-model="tab_index">
            <b-tab title="Details"/>
            <b-tab title="Input / Output"/>
            <b-tab title="Configuration Parameter"/>
        </b-tabs>
        -->
    </div>

    <div class="main-section" v-if="ready">
        <b-form @submit="submit" class="container">
            <!--detail-->
            <div>
                <h4>Detail</h4>
                <b-form-group horizontal label="Name *">
                    <b-form-input type="text" v-model="app.name" placeholder="Name of application" required/>
                </b-form-group>
                <b-form-group horizontal label="Description Override">
                    <b-form-textarea v-model="app.desc_override" placeholder="(Leave empty to use github repo description)" :rows="3" :max-rows="6"></b-form-textarea>
                </b-form-group>
                <b-form-group horizontal label="Admins">
                    <contactlist v-model="app.admins"></contactlist>
                    <p class="text-muted">Users who can update this application registration</p>
                </b-form-group>
                <b-form-group horizontal label="Avatar">
                    <el-input type="text" v-model="app.avatar" placeholder="URL of application avatar"/>
                </b-form-group>
                <b-form-group horizontal label="Projects">
                    <projectsselecter 
                        v-model="app.projects" 
                        :allownull="true" 
                        access="private"
                        placeholder="(Leave it empty to make it available for all users)"/>
                    <small class="text-muted">If a private project is selected, only the member of the project can access this app</small>
                </b-form-group>

                <b-form-group horizontal label="Source Code">
                    <b-row>
                        <b-col>
                            <b-input-group prepend="Github Repository Name *">
                                <b-form-input type="text" v-model="app.github" placeholder="brain-life/app-name" required/>
                            </b-input-group>
                        </b-col>
                        <b-col>
                            <b-input-group prepend="Branch (optional)">
                                <b-form-input type="text" v-model="app.github_branch" placeholder="master"/>
                            </b-input-group>
                        </b-col>
                    </b-row>
                </b-form-group>
                <br>
                <b-form-group horizontal label="Max Retry">
                    <el-input type="text" v-model="app.retry" placeholder="0"/>
                    <p class="text-muted">If a task fails, it will rerun up to this count (0 means no retry)</p>
                </b-form-group>
            </div>

            <div>
                <h4>Input / Output</h4>
                <b-form-group horizontal label="Input Datatype">
                    <transition-group name="height">
                    <div v-for="(input, idx) in app.inputs" :key="idx" style="margin-bottom: 10px;">
                        <b-card>
                            <div class="button button-danger" @click="remove_input(idx)" style="float: right;">
                                <icon name="trash"/>
                            </div>
                            <b-row>
                                <!-- we probably don't need to expose this to user
                                <b-col>
                                    <div class="text-muted">ID</div>
                                    <el-input v-model="input.id"></el-input>
                                </b-col>
                                -->
                                <b-col>
                                    <div class="text-muted">Datatype</div>
                                    <el-select v-model="input.datatype" style="width: 100%;">
                                        <el-option v-for="datatype in datatypes" :key="datatype._id" :label="datatype.name" :value="datatype._id"></el-option>
                                    </el-select>
                                </b-col>
                                <b-col>
                                    <div class="text-muted">Datatype Tags <small>optional</small></div>
                                    <tageditor v-if="input.datatype" v-model="input.datatype_tags"/>
                                    <!--
                                    <select2 v-if="input.datatype" :options="(datatypes[input.datatype]||{_tags:[]})._tags" v-model="input.datatype_tags" :multiple="true" :tags="true"></select2>
                                    -->
                                </b-col>
                            </b-row>
                            <br><b>File Mapping</b><br>
                            <p class="text-muted">Please specify configuration key to map each input files/directory to</p>
                            <transition-group name="height">
                                <b-card v-for="(config, name) in app.config" :key="name" v-if="config.type == 'input' && config.input_id == input.id">
                                    <div class="button" @click="remove_config(name)" style="float: right">
                                        <icon name="trash"/>
                                    </div>
                                    <b-row>
                                        <b-col>
                                            <div class="text-muted">Key</div>
                                            <b-form-input type="text" v-model="config._id" placeholder="key to reference in your config.json" required/>
                                        </b-col>
                                        
                                        <b-col v-if="input.datatype">
                                            <div class="text-muted">File/Directory</div>
                                            <b-form-select :options="datatypes[input.datatype].files.map(f => ({ text: f.id+' ('+(f.filename||f.dirname)+')', value: f.id }))" v-model="config.file_id" required/>
                                        </b-col>
                                    </b-row>
                                </b-card>
                            </transition-group>
                            <br>
                            <b-button @click="add_config('input', input)" v-if="input.datatype" size="sm"><icon name="plus"/> Add File Mapping</b-button>
                        </b-card>
                    </div>
                    </transition-group>
                    <p>
                        <b-button size="sm" @click="add_dataset(app.inputs)" variant="success"><icon name="plus"/> Add Input Dataset</b-button>
                    </p>
                </b-form-group>

                <b-form-group horizontal label="Output Datatype">
                    <transition-group name="height">
                    <div v-for="(output, idx) in app.outputs" :key="idx" style="margin-bottom: 10px;">
                        <b-card>
                            <div class="button button-danger" @click="app.outputs.splice(idx, 1)" style="float: right">
                                <icon name="trash"/>
                            </div>
                            <b-row>
                                <b-col>
                                    <div class="text-muted">Datatype</div>
                                    <el-select v-model="output.datatype" style="width: 100%">
                                        <el-option v-for="datatype in datatypes" :key="datatype._id" :label="datatype.name" :value="datatype._id"></el-option>
                                    </el-select>
                                </b-col>
                                <b-col>
                                    <div class="text-muted">Datatype Tags <small>optional</small></div>
                                    <tageditor v-if="output.datatype" v-model="output.datatype_tags"/>
                                    <!--
                                    <select2 v-if="output.datatype" :options="datatypes[output.datatype]._tags" 
                                        v-model="output.datatype_tags" :multiple="true" :tags="true"></select2>
                                    -->
                                </b-col>
                                <b-col>
                                    <div class="text-muted" style="margin-top: 3px;">Datatype File Mapping</div>
                                    <el-input type="textarea" v-model="output._files" placeholder="Optional (JSON)" autosize style="margin-top: 3px;" />
                                </b-col>
                            </b-row>
                        </b-card>
                    </div>
                    </transition-group>
                    <p>
                        <b-button size="sm" @click="add_dataset(app.outputs)" variant="success"><icon name="plus"/> Add Output Dataset</b-button>
                    </p>
                </b-form-group>
            </div>

            <div>
                <h4>Configuration</h4>
                <b-form-group horizontal label="Configuration">
                    <b-dropdown size="sm" text="Add Configuration Parameter" variant="success">
                        <b-dropdown-item @click="add_config('string')">String</b-dropdown-item>
                        <b-dropdown-item @click="add_config('number')">Number</b-dropdown-item>
                        <b-dropdown-item @click="add_config('boolean')">Boolean</b-dropdown-item>
                        <b-dropdown-item @click="add_config('enum')">Enum</b-dropdown-item>
                        <!--integer is deprecated-->
                    </b-dropdown>
                    <transition-group name="height">
                    <div v-for="(config, name) in app.config" :key="name" style="margin:5px;">
                        <b-card v-if="config.type == 'integer' || config.type == 'number' || config.type == 'string'" :title="config.type | capitalize">
                            <div class="button button-danger" @click="remove_config(name)" style="float: right">
                                <icon name="trash"/>
                            </div>
                            <b-row>
                                <b-col>
                                    <b-form-group>
                                        <div class="text-muted">Key</div>
                                        <b-form-input type="text" v-model="config._id"></b-form-input>
                                    </b-form-group>

                                    <b-form-group>
                                        <div class="text-muted">Default Value <small>optional</small></div>
                                        <b-form-input v-if="config.type == 'integer'" type="number" v-model.number="config.default"></b-form-input><!--deprecated-->
                                        <b-form-input v-if="config.type == 'number'" type="number" v-model.number="config.default"></b-form-input>
                                        <b-form-input v-if="config.type == 'string'" type="text" v-model="config.default"></b-form-input>
                                    </b-form-group>

                                    <b-form-group v-if="config.default">
                                        <b-form-checkbox v-model="config.readonly">Read Only <small class="text-muted">value will be fixed to default value and user can not change it</small></b-form-checkbox>
                                    </b-form-group>
                                </b-col>
                                <b-col sm="7">
                                    <b-form-group>
                                        <div class="text-muted">Placeholder <small>optional text to show inside the form element if no value is specified</small></div>
                                        <b-form-input type="text" v-model="config.placeholder"></b-form-input>
                                    </b-form-group>
                                    <b-form-group>
                                        <div class="text-muted">Description <small>optional</small></div>
                                        <b-form-textarea v-model="config.desc" placeholder="Enter description to add for this field" :rows="3" :max-rows="6"></b-form-textarea>
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
                                        <div class="text-muted">Key</div>
                                        <b-form-input type="text" v-model="config._id"></b-form-input>
                                    </b-form-group>
                                    <b-form-group>
                                        <div class="text-muted">Default Value</div>
                                        <trueorfalse v-model="config.default"/>
                                    </b-form-group>
                                    <b-form-group>
                                        <b-form-checkbox v-model="config.readonly">Read Only <small class="text-muted">value will be fixed to default value and user can not change it</small></b-form-checkbox>
                                    </b-form-group>
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
                                        <div class="text-muted">Key</div>
                                        <b-form-input type="text" v-model="config._id"></b-form-input>
                                    </b-form-group>
                                    <b-form-group v-if="config.options.length">
                                        <div class="text-muted">Default Value</div>
                                        <b-form-select :options="config.options.map(o => o.value)" v-model="config.default"></b-form-select>
                                    </b-form-group>
                                    <b-form-group v-if="config.default">
                                        <b-form-checkbox v-model="config.readonly">Read Only <small class="text-muted">value will be fixed to default value and user can not change it</small></b-form-checkbox>
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
                                    <b-col>
                                        <div class="text-muted">Value</div>
                                        <b-form-input type="text" v-model="option.value"></b-form-input>
                                    </b-col>
                                    <b-col>
                                        <div class="text-muted">Label</div>
                                        <b-form-input type="text" v-model="option.label"></b-form-input>
                                    </b-col>
                                    <b-col sm="7">
                                        <div class="text-muted">Description</div>
                                        <b-form-input type="text" v-model="option.desc"></b-form-input>
                                    </b-col>
                                </b-row>
                            </b-card>
                            <br>
                            <b-button @click="config.options.push({ desc: '', label: '', value: '' })" size="sm"><icon name="plus"/> Add Enum Option</b-button>
                        </b-card>
                    </div>
                    </transition-group> 
                </b-form-group>
            </div>

            <!-- citation
            <transition name="slide-fade">
            <div v-if="tab_index == 3">
                <b-form-group horizontal label="Preferred Citation">
                    <b-form-textarea v-model="app.citation" placeholder="Enter citation you'd like to be used to cite this application" :rows="2" :max-rows="4"></b-form-textarea>
                </b-form-group>
                <b-form-group horizontal label="References">
                    <p v-for="(reference, idx) in app.references" :key="idx">
                        <b-form-textarea v-model="reference.text" placeholder="" :rows="2" :max-rows="4"></b-form-textarea>
                    </p>
                    <b-button size="sm" @click="add_reference" variant="success"><icon name="plus"/> Add Reference</b-button>
                    
                </b-form-group>
            </div>
            </transition>
            -->
            
            <br>
            <br>
            <div style="float: right">
                <b-button @click="cancel">Cancel</b-button>
                <b-button type="submit" variant="primary">Submit</b-button>
            </div>
            <br clear="both">

        </b-form>

        <!--
        <b-card v-if="config.debug">
            <br>
            <br>
            <br>
            <div slot="header">Debug</div>
            <h3>app</h3>
            <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
        </b-card>
        -->
    </div>
</div>
</template>

<script>
import Vue from 'vue'

import editor from 'vue2-ace'
import 'brace/mode/json'
import 'brace/theme/chrome'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import contactlist from '@/components/contactlist'
import projectsselecter from '@/components/projectsselecter'
import trueorfalse from '@/components/trueorfalse'
import tageditor from '@/components/tageditor'

export default {
    components: { 
        sidemenu, editor, contactlist, 
        pageheader, projectsselecter,
        trueorfalse, tageditor,
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
        this.$http.get('datatype', {params: {
            //service: "_upload",
        }})
        .then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach((type)=>{
                this.datatypes[type._id] = type;
                type._tags = [];
            });

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
                                if(output.files) output._files = JSON.stringify(output.files, null, 4);
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
            case "string":
            case "number":
            case "integer":
                break;
            }
            Vue.set(this.app.config, tempid, config);
        },
        
        add_dataset: function(it) {
            it.push({
                id: it.length,
                datatype: null,
                datatype_tags: [],
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
            /*
            if (this.app.outputs.length == 0) {
                this.$notify({text: "At least one output is required", type: 'error' });
                return;
            }
            */
        
            var valid = true;
            this.app.inputs.forEach(input=>{
                //find the input mapping
                var found = null;
                for (var k in this.app.config) {
                    if (this.app.config[k].input_id == input.id) found = this.app.config;
                }
                if(!found) {
                    valid = false;
                    this.$notify({text: "Please enter at least one file mapping per each input", type: 'error' });
                }
            }); 
            if(!valid) {
                console.error("invalid form");
                return; 
            }
            
            try {
                this.app.outputs.forEach(output=>{
                    output.files = null;
                    if(output._files) output.files = JSON.parse(output._files);
                });
            } catch(err) {
                this.$notify({ test: 'Failed to parse output mapping', type: 'error' });
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
        }
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
background-color: #666;
border-bottom: 1px solid #ccc;
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

</style>
