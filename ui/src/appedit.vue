<template>
<div>
    <pageheader/>
    <sidemenu active="/apps"></sidemenu>
    <div class="fixed-top">
        <h2 v-if="$route.params.id == '_'">New App</h2>
        <h2 v-else><icon name="pencil" scale="2"/> {{app.name}}</h2>
    </div>

    <div class="main-section" v-if="ready">
        <el-form label-width="200px">
            <el-form-item label="Name">
                <el-input type="text" v-model="app.name" placeholder="Name of application"/>
            </el-form-item>
            <!--
            <el-form-item label="Description">
                <b-form-textarea :rows="5" v-model="app.desc" placeholder="Enter description for this application"/>
                <br>
            </el-form-item>
            <el-form-item label="Classification">
                <select2 :options="alltags" v-model="app.tags" :multiple="true" :tags="true"></select2>
                <p class="text-muted">Used to group similar application</p>
                <b-alert show variant="danger">Description/name/classifications will be loaded from source github repository soon. Please update your repo description / name / topics as well as these fields.</b-alert>
            </el-form-item>
            -->
            <el-form-item label="Admins">
                <contactlist v-model="app.admins"></contactlist>
                <p class="text-muted">Users who can update this application registration</p>
            </el-form-item>
            <el-form-item label="Avatar">
                <el-input type="text" v-model="app.avatar" placeholder="URL of application avatar"/>
            </el-form-item>
            <el-form-item label="Projects">
                <projectselecter 
                    v-model="app.projects" 
                    :allownull="true" 
                    access="private"
                    placeholder="(Does not belong to any project - available to all users)"/>
                <p class="text-muted">If a private project is selected, only the member of the project can access this app</p>
            </el-form-item>

            <el-form-item label="Source Code">
                <b-input-group>
                    <b-input-group-addon>Github Repository Name</b-input-group-addon>
                    <b-form-input type="text" v-model="app.github" placeholder="brain-life/app-name"/>
                    <b-input-group-addon>Branch</b-input-group-addon>
                    <b-form-input type="text" v-model="app.github_branch" placeholder="master"/>
                </b-input-group>
            </el-form-item>

            <!--
            <el-form-item label="Citation (bibtex)">
                <b-form-textarea v-model="app.citation" :rows="4" placeholder='@misc{app-name,
       author = {Doe, J, and Smith, M."},
       title = "Application Name",
       year = "2017"
       doi = {10.1.1/123.456}
}'/>
                <p class="text-muted">Please see <a href="http://www.bibtex.org/Format/">http://www.bibtex.org/Format/</a> for bibtex format</p>
            </el-form-item>
            -->

            <br>
            <el-form-item label="Max Retry">
                <el-input type="text" v-model="app.retry" placeholder="0"/>
                <p class="text-muted">If a task fails, it will rerun up to this count (0 means no retry)</p>
            </el-form-item>
            
            <el-form-item label="Configuration Parameters">
                <div v-for="(config, name) in app.config" :key="name" style="margin:5px;">
                    <b-card v-if="config.type == 'integer' || config.type == 'string'" :title="config.type | capitalize">
                        <b-button @click="remove_config(name)" style="float: right" size="sm" variant="danger"><icon name="trash"/></b-button>
                        <b-row>
                            <b-col sm="5">
                                <div class="text-muted">Key</div>
                                <b-form-input type="text" v-model="config._id"></b-form-input>

                                <div class="text-muted">Default Value (optional)</div>
                                <b-form-input v-if="config.type == 'integer'" type="number" v-model.number="config.default"></b-form-input>
                                <b-form-input v-if="config.type == 'string'" type="text" v-model="config.default"></b-form-input>
                            </b-col>
                            <b-col>
                                <div class="text-muted">Placeholder (optional text to show inside the form element if no value is specified)</div>
                                <b-form-input type="text" v-model="config.placeholder"></b-form-input>
                                <div class="text-muted">Description (optional)</div>
                                <b-form-textarea v-model="config.desc" placeholder="Enter description to add for this field" :rows="3" :max-rows="6"></b-form-textarea>
                            </b-col>
                        </b-row>
                    </b-card>
                    <b-card v-if="config.type == 'boolean'" :title="config.type | capitalize">
                        <b-button @click="remove_config(name)" style="float: right" size="sm" variant="danger"><icon name="trash"/></b-button>
                        <b-row>
                            <b-col>
                                <div class="text-muted">Key</div>
                                <b-form-input type="text" v-model="config._id"></b-form-input>
                            </b-col>
                            <b-col>
                                <div class="text-muted">Default Value</div>
                                <trueorfalse v-model="config.default"/>
                            </b-col>
                            <b-col>
                                <div class="text-muted">Description</div>
                                <b-form-input type="text" v-model="config.desc"></b-form-input>
                            </b-col>
                        </b-row>
                    </b-card>
                    <b-card v-else-if="config.type == 'enum'" :title="config.type | capitalize">
                        <b-button @click="remove_config(name)" size="sm" style="float: right" variant="danger"><icon name="trash"/></b-button>
                        <b-row>
                            <b-col>
                                <div class="text-muted">Key</div>
                                <b-form-input type="text" v-model="config._id"></b-form-input>
                            </b-col>
                            <b-col>
                                <div class="text-muted">Default Value</div>
                                <b-form-select v-if="config.options.length" :options="config.options.map(o => o.value)" v-model="config.default"></b-form-select>
                            </b-col>
                            <b-col>
                                <div class="text-muted">Description</div>
                                <b-form-input type="text" v-model="config.desc"></b-form-input>
                            </b-col>
                        </b-row>
                        <br><b>Options</b><br>
                        <b-card v-for="(option, idx) in config.options" :key="idx">
                            <b-button @click="config.options.splice(idx, 1)" style="float: right" size="sm" variant="danger"><icon name="trash"/></b-button>
                            <b-row>
                                <b-col>
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
                        <b-button @click="config.options.push({ desc: '', label: '', value: '' })" size="sm"><icon name="plus"/> Add Option</b-button>
                    </b-card>
                </div>
                
                <b-dropdown text="Add Configuration Parameter" variant="success">
                    <b-dropdown-item @click="add_config('string')">String</b-dropdown-item>
                    <b-dropdown-item @click="add_config('integer')">Integer</b-dropdown-item>
                    <b-dropdown-item @click="add_config('boolean')">Boolean</b-dropdown-item>
                    <b-dropdown-item @click="add_config('enum')">Enum</b-dropdown-item>
                </b-dropdown>
            </el-form-item>
            
            <br>
            <el-form-item label="Input Datasets">
                <div v-for="(input, idx) in app.inputs" :key="idx" style="margin-bottom: 20px;">
                    <b-card>
                        <b-button @click="remove_input(idx)" style="float: right;" size="sm" variant="danger"><icon name="trash"/></b-button>
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
                                <div class="text-muted">Datatype Tags</div>
                                <select2 v-if="input.datatype" :options="(datatypes[input.datatype]||{_tags:[]})._tags" v-model="input.datatype_tags" :multiple="true" :tags="true"></select2>
                            </b-col>
                        </b-row>
                        <br><b>File Mapping</b><br>
                        <p class="text-muted">Please specify configuration key to map each input files/directory to</p>
                        <b-card v-for="(config, name) in app.config" :key="name" v-if="config.type == 'input' && config.input_id == input.id">
                            <b-button @click="remove_config(name)" style="float: right" size="sm" variant="danger"><icon name="trash"/></b-button>
                            <b-row>
                                <b-col>
                                    <div class="text-muted">Key</div>
                                    <el-input v-model="config._id"></el-input>
                                </b-col>
                                
                                <b-col v-if="input.datatype">
                                    <div class="text-muted">File/Directory</div>
                                    <b-form-select :options="datatypes[input.datatype].files.map(f => ({ text: f.id+' ('+(f.filename||f.dirname)+')', value: f.id }))" v-model="config.file_id"></b-form-select>
                                </b-col>
                            </b-row>
                        </b-card>
                        <br>
                        <b-button @click="add_config('input', input)" v-if="input.datatype" size="sm"><icon name="plus"/> Add File Mapping</b-button>
                    </b-card>
                </div>
                
                <b-button @click="add_dataset(app.inputs)" variant="success"><icon name="plus"/>Add Input Dataset</b-button>
            </el-form-item>

            <br>
            <el-form-item label="Output Datasets">
                <div v-for="(output, idx) in app.outputs" :key="idx" style="margin-bottom: 10px;">
                    <b-card>
                        <b-button @click="app.outputs.splice(idx, 1)" icon="delete" style="float: right" size="sm" variant="danger"><icon name="trash"/></b-button>
                        <b-row>
                            <!-- let's not expose input/output IDs anymore
                            <b-col>
                                <div class="text-muted">ID</div>
                                <el-input v-model="output.id"></el-input>
                            </b-col>
                            -->
                            <b-col>
                                <div class="text-muted">Datatype</div>
                                <el-select v-model="output.datatype" style="width: 100%">
                                    <el-option v-for="datatype in datatypes" :key="datatype._id" :label="datatype.name" :value="datatype._id"></el-option>
                                </el-select>
                            </b-col>
                            <b-col>
                                <div class="text-muted">Datatype Tags</div>
                                <select2 v-if="output.datatype" :options="datatypes[output.datatype]._tags" 
                                    v-model="output.datatype_tags" :multiple="true" :tags="true"></select2>
                            </b-col>
                            <b-col>
                                <div class="text-muted" style="margin-top: 3px;">Datatype File Mapping</div>
                                <el-input type="textarea" v-model="output._files" placeholder="Optional (JSON)" autosize style="margin-top: 3px;" />
                            </b-col>
                        </b-row>
                    </b-card>
                </div>
                <b-button @click="add_dataset(app.outputs)" variant="success"><icon name="plus"/> Add Output Dataset</b-button>
            </el-form-item>

            <hr>
            <el-form-item style="float: right;">
                <b-button @click="cancel()">Cancel</b-button>
                <b-button variant="primary" @click="submit()">Submit</b-button>
            </el-form-item>
            <br clear="both">
        </el-form>

        <el-card v-if="config.debug">
            <div slot="header">Debug</div>
            <h3>app</h3>
            <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
        </el-card>
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
import select2 from '@/components/select2'
import projectselecter from '@/components/projectselecter'
import trueorfalse from '@/components/trueorfalse'

export default {
    components: { 
        sidemenu, editor, contactlist, 
        pageheader, select2, projectselecter,
        trueorfalse
    },
    data () {
        return {
            app: {
                projects: [],
                admins: null,

                name: null,
                desc: null,
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
                        this.app.admins = [Vue.config.user.sub.toString()];
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
                break;
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
            this.$router.push("/apps");
        },

        submit: function() {
            try {
                this.app.outputs.forEach(output=>{
                    output.files = null;
                    if(output._files) output.files = JSON.parse(output._files);
                });
            } catch(err) {
                this.$notify({ test: 'Failed to parse output mapping', type: 'error' });
                return;
            }

            //update object key with _id
            var newconfig = {};
            for (var k in this.app.config) {
                var c = this.app.config[k];
                newconfig[c._id] = c; 
                delete c._id;
            }
            this.app.config = newconfig;

            if(this.$route.params.id !== '_') {
                //update
                this.$http.put('app/'+this.app._id, this.app)
                .then(res=>{
                    this.$router.push("/app/"+this.app._id);
                }).catch(err=>{
                    this.$notify({text: err.body.message, type: 'error' });
                });
            } else {
                //new
                this.$http.post('app', this.app)
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
.main-section {
position: fixed;
padding: 20px;
left: 90px;
right: 0px;
top: 130px;
bottom: 0px;
overflow: auto;
}
.fixed-top {
background-color: #666;
padding: 20px;
color: white;
position: fixed;
top: 50px;
left: 90px;
right: 0px;
height: 80px;
z-index: 1;
border-bottom: 1px solid #666;
}
</style>


