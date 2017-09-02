<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/apps"></sidemenu>
    <div class="fixed-top">
        <h2 v-if="$route.params.id == '_'">New App</h2>
        <h2 v-else><icon name="pencil" scale="2"/> {{app.name}}</h2>
    </div>

    <div class="main-section" v-if="ready">
        <el-form ref="form" label-width="120px">
            <el-form-item label="Name">
                <el-input type="text" v-model="app.name" placeholder="Name of application"/>
            </el-form-item>
            <el-form-item label="Description">
                <el-input type="textarea" :autosize="{minRows: 4}" v-model="app.desc" placeholder="Enter description for this application."/>
            </el-form-item>
            <br>
            <el-form-item label="Tags">
                <select2 :options="alltags" v-model="app.tags" :multiple="true" :tags="true"></select2>
            </el-form-item>
            <el-form-item label="Developers">
                <contactlist v-model="app.admins"></contactlist>
            </el-form-item>
            <el-form-item label="Avatar">
                <el-input type="text" v-model="app.avatar" placeholder="URL of application avatar"/>
            </el-form-item>
            <el-form-item label="Source Code">
                <el-tabs v-model="form.repotype" type="border-card">
                    <el-tab-pane label="Github" name="github">
                        <el-form-item>
                            Reponame
                            <el-input type="text" v-model="app.github" placeholder="org/repo"/>
                        </el-form-item>
                        <el-form-item>
                            Branch
                            <el-input type="text" v-model="app.github_branch" placeholder="master"/>
                        </el-form-item>
                    </el-tab-pane>
                    <el-tab-pane label="Dockerhub" name="dockerhub">
                        <el-form-item>
                            Container Name
                            <el-input type="text" v-model="app.dockerhub" placeholder="org/container"/>
                        </el-form-item> 
                    </el-tab-pane>
                </el-tabs>
            </el-form-item>

            <br>
            <el-form-item label="Max Retry">
                <el-input type="text" v-model="app.retry" placeholder="0"/>
                <p class="text-muted">If a task fails, it will rerun up to this count (0 means no retry)</p>
            </el-form-item>
            
            <el-form-item label="JSON Configuration">
                <div v-for="(object, name) in app.config" :key="name" style="margin:5px;">
                    <!-- {{log(object, name)}} -->
                    <el-card v-if="object.type == 'string'">
                        <div class="text-muted" style="font-style:italic;">String</div>
                        <el-row :gutter="20">
                            <el-col :span="11">
                                <div class="text-muted">JSON Key</div>
                            </el-col>
                            <el-col :span="11">
                                <div class="text-muted">Default</div>
                            </el-col>
                            <el-col :span="2" style="text-align:right;">
                                <b-button @click="rm_app_config(name)" style="float: right;"><icon name="trash"/></b-button>
                            </el-col>
                        </el-row>
                        <el-row :gutter="20">
                            <el-col :span="11">
                                <b-form-input type="text" v-model="object._id" style="margin-top: 3px;"></b-form-input>
                            </el-col>
                            <el-col :span="13">
                                <b-form-input type="text" v-model="object.default" style="margin-top: 3px;"></b-form-input>
                            </el-col>
                        </el-row>
                    </el-card>
                    <el-card v-else-if="object.type == 'integer'">
                        <div class="text-muted" style="font-style:italic;">Integer</div>
                        <el-row :gutter="20">
                            <el-col :span="11">
                                <div class="text-muted">JSON Key</div>
                            </el-col>
                            <el-col :span="11">
                                <div class="text-muted">Default</div>
                            </el-col>
                            <el-col :span="2" style="text-align:right;">
                                <b-button @click="rm_app_config(name)" style="float: right;"><icon name="trash"/></b-button>
                            </el-col>
                        </el-row>
                        <el-row :gutter="20">
                            <el-col :span="11">
                                <b-form-input type="text" v-model="object._id" style="margin-top: 3px;"></b-form-input>
                            </el-col>
                            <el-col :span="13">
                                <b-form-input type="number" v-model="object.default" style="margin-top: 3px;"></b-form-input>
                            </el-col>
                        </el-row>
                    </el-card>
                </div>
                
                <div style="margin: 3px;">
                    <b-button @click="add_json_item('string')"><icon name="plus"/> Add String</b-button>
                    <b-button @click="add_json_item('integer')"><icon name="plus"/> Add Integer</b-button>
                </div>
            </el-form-item>
            
            <br>
            <el-form-item label="Inputs">
                <div v-for="(input, idx) in app.inputs" :key="idx" style="margin-bottom: 20px;">
                    <el-card>
                        <el-row :gutter="20" style="margin-bottom: 10px;">
                            <el-col :span="4">
                                <div class="text-muted">ID</div>
                            </el-col>
                            <el-col :span="6">
                                <div class="text-muted">Datatype</div>
                            </el-col>
                            <el-col :span="14" v-if="input.datatype">
                                <b-button @click="rm_input(idx)" style="float: right;"><icon name="trash"/></b-button>
                                <div class="text-muted">Datatype Tags</div>
                            </el-col>
                        </el-row>
                        <el-row :gutter="20">
                            <el-col :span="4">
                                <el-input v-model="input.id"></el-input>
                            </el-col>
                            <el-col :span="6">
                                <el-select v-model="input.datatype" style="width: 100%;">
                                    <el-option v-for="datatype in datatypes" :key="datatype._id" :label="datatype.name" :value="datatype._id"></el-option>
                                </el-select>
                            </el-col>
                            <el-col :span="14" v-if="input.datatype">
                                <select2 :options="(datatypes[input.datatype]||{_tags:[]})._tags" v-model="input.datatype_tags" :multiple="true" :tags="true"></select2>
                            </el-col>
                        </el-row>
                        <el-row>
                            <b-button style="margin-top:10px;" @click="add_json_item('input', input)" v-if="input.datatype"><icon name="plus"/> Add File Mapping</b-button>
                        </el-row>
                    </el-card>
                    
                    <!-- {{log(object, name)}} -->
                    <el-card v-for="(object, name) in app.config" :key="name" v-if="object.type == 'input' && object.owner == input._id" style="margin: 5px 10px 5px 10px;">
                        <el-row :gutter="20">
                            <el-col :span="11">
                                <div class="text-muted">JSON Key</div>
                            </el-col>
                            <el-col :span="11">
                                <div class="text-muted">File ID</div>
                            </el-col>
                            <el-col :span="2" style="text-align:right;">
                                <b-button @click="rm_app_config(name)" style="float: right;"><icon name="trash"/></b-button>
                            </el-col>
                        </el-row>
                        <el-row :gutter="20" style="margin-top:5px;">
                            <el-col :span="11">
                                <el-input v-model="object._id"></el-input>
                            </el-col>
                            
                            <el-col :span="13" v-if="input.datatype">
                                <b-form-select :options="datatypes[input.datatype].files.map(f => { return { text: f.filename, value: f.id }; })" v-model="object.file_id"></b-form-select>
                            </el-col>
                        </el-row>
                    </el-card>
                </div>
                <b-button @click="add(app.inputs)" style="margin-bottom: 5px;"><icon name="plus"/> Add Input</b-button>
            </el-form-item>

            <br>
            <el-form-item label="Outputs">
                <div v-for="(output, idx) in app.outputs" :key="idx" style="margin-bottom: 10px;">
                    <el-card>
                        <el-row :gutter="20" style="margin-bottom: 3px;">
                            <el-col :span="4">
                                <div class="text-muted">ID</div>
                            </el-col>
                            <el-col :span="6">
                                <div class="text-muted">Datatype</div>
                            </el-col>
                            <el-col :span="14" v-if="output.datatype">
                                <b-button @click="app.outputs.splice(idx, 1)" icon="delete" style="float: right;"><icon name="trash"/></b-button>
                                <div class="text-muted">Datatype Tags</div>
                            </el-col>
                        </el-row>
                        <el-row :gutter="20">
                            <el-col :span="4">
                                <el-input v-model="output.id"></el-input>
                            </el-col>
                            <el-col :span="6">
                                <el-select v-model="output.datatype" style="width: 100%">
                                    <el-option v-for="datatype in datatypes" :key="datatype._id" :label="datatype.name" :value="datatype._id"></el-option>
                                </el-select>
                            </el-col>
                            <el-col :span="14" v-if="output.datatype">
                                <select2 :options="datatypes[output.datatype]._tags" 
                                    v-model="output.datatype_tags" :multiple="true" :tags="true"></select2>
                                
                                <div class="text-muted" style="margin-top: 3px;">Datatype Mapping</div>
                                <el-input type="textarea" v-model="output._files" autosize style="margin-top: 3px;" />
                            </el-col>
                        </el-row>
                    </el-card>
                </div>
                <b-button @click="add(app.outputs)"><icon name="plus"/> Add Output</b-button>
            </el-form-item>

            <el-form-item style="float: right;">
                <b-button @click="cancel()">Cancel</b-button>
                <b-button variant="primary" @click="submit()">Submit</b-button>
            </el-form-item>
            <br clear="both">
        </el-form>

        <el-card v-if="config.debug">
            <div slot="header">Debug</div>
            <h3>_config</h3>
            <pre v-highlightjs="_config"><code class="json hljs"></code></pre>
            <h3>app</h3>
            <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
            <h3>form</h3>
            <pre v-highlightjs="JSON.stringify(form, null, 4)"><code class="json hljs"></code></pre>
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

export default {
    components: { sidemenu, editor, contactlist, pageheader, select2 },
    data () {
        return {
            app: {
                //_id: null,
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

            //form aids
            form: {
                repotype: "github",
            },

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

            //console.log("datatypes");
            //console.dir(this.datatypes);

            //load datatype_tags from all apps
            this.$http.get('app', {params: {
                select: 'inputs outputs',
            }}).then(res=>{
                //aggregate datatype_tags for each datatype
                var v = this;
                function addtag(datatype_id, tag) {
                    var dt = v.datatypes[datatype_id];
                    if(!~dt._tags.indexOf(tag)) dt._tags.push(tag);
                }
                res.body.apps.forEach(app=>{
                    app.inputs.forEach(input=>{
                        if(!input.datatype_tags) return;
                        input.datatype_tags.forEach(tag=>{
                            addtag(input.datatype, tag); 
                        });
                        //console.log("input" ,input.datatype, this.datatypes[input.datatype]);
                    });
                    app.outputs.forEach(output=>{
                        if(!output.datatype_tags) return;
                        output.datatype_tags.forEach(tag=>{
                            addtag(output.datatype, tag); 
                        });
                        //console.log("output" ,output.datatype, this.datatypes[output.datatype]);
                    });
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
                            
                            this.app.inputs.forEach(input => {
                                if (!input._id) input._id = v.gen_token();
                            });
                            
                            Vue.set(this.app, 'config', this.update_owners(this.app.config));
                            
                            // have to make sure ids exist for vue reactivity when changing _config object keys later..
                            for (var k in this.app.config) {
                                Vue.set(this.app.config[k], '_id', k);
                            }

                            //need to do some last minute type conversion
                            // this.app._config = JSON.stringify(this.app.config, null, 4);
                            this.app.outputs.forEach(output=>{
                                if(output.files) output._files = JSON.stringify(output.files, null, 4);
                            });
                            this.ready = true;
                        });
                    } else {
                        //init.. (can't do it in data() for some reason (maybe because contact list is not setup?
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
        gen_token: function() {
            return Math.floor(Math.random() * 10000000).toString(16);
        },
        
        add_json_item: function(type, input) {
            var randkey = this.gen_token();
            
            if (type == 'input') {
                Vue.set(this.app.config, randkey, { _id: '', owner: input._id, file_id: '', input_id: input.id, type });
            }
            else if (type == 'string') Vue.set(this.app.config, randkey, { _id: '', default: '', type });
            else if (type == 'integer') Vue.set(this.app.config, randkey, { _id: '', default: 0, type });
        },
        
        add: function(it) {
            it.push({
                _id: this.gen_token(),
                id: "",
                datatype: null,
                datatype_tags: [],
            });
        },
        
        rm_input: function(idx) {
            var input = this.app.inputs[idx];
            for (var k in this.app.config) {
                var obj = this.app.config[k];
                if (obj.owner && obj.owner == input._id || obj.input_id == input.id)
                    Vue.delete(this.app.config, k);
            }
            
            this.app.inputs.splice(idx, 1);
        },
        
        rm_app_config: function(id) {
            if (this.app.config[id])
                Vue.delete(this.app.config, id);
        },
        
        clear_pref_ids: function(arr) {
            arr.forEach(item => {
                if (item._id)
                    delete item._id;
            });
            return arr;
        },
        
        // update which inputs own what file maps
        update_owners: function(config) {
            for (var k in config) {
                if (config[k].owner) {
                    this.app.inputs.forEach(input => {
                        if (input._id == config[k].owner) config[k].input_id = input.id;
                    });
                }
                else if (config[k].input_id) {
                    this.app.inputs.forEach(input => {
                        if (input.id == config[k].input_id) config[k].owner = input._id;
                    });
                }
            }
            
            return config;
        },

        cancel: function() {
            this.$router.push("/apps");
        },

        submit: function() {
            try {
                this.app.config = JSON.parse(this._config);
                
                this.app.inputs = this.clear_pref_ids(this.app.inputs);
                this.app.outputs = this.clear_pref_ids(this.app.outputs);
            } catch(err) {
                this.$notify({ text: 'Failed to parse config template.', type: 'error' });
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
            if(this.$route.params.id !== '_') {
                //update
                this.$http.put('app/'+this.app._id, this.app)
                .then(res=>{
                    this.$router.push("/app/"+this.app._id);
                });
            } else {
                //new
                this.$http.post('app', this.app)
                .then(res=>{
                    this.$router.push("/app/"+res.body._id);
                }).catch(err=>{
                    console.error(err);
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
    },
    
    watch: {
        "app.inputs": {
            handler(conf) {
                Vue.set(this.app, 'config', this.update_owners(this.app.config));
            },
            deep: true
        }
    },
    
    computed: {
        input_ids: function() {
            let options = [];
            this.app.inputs.forEach(input => {
                options.push(input.id);
            });
            return options;
        },
        
        "_config": function() {
            var _config = {};
            var hard_copy_config = JSON.parse(JSON.stringify(this.app.config));
            
            hard_copy_config = this.update_owners(hard_copy_config);
            
            for (var k in hard_copy_config) {
                if (hard_copy_config[k].type == 'integer' && hard_copy_config[k].default) hard_copy_config[k].default = parseInt(hard_copy_config[k].default);
                
                if (hard_copy_config[k].owner) delete hard_copy_config[k].owner;
                
                if (hard_copy_config[k]._id) {
                    _config[hard_copy_config[k]._id] = hard_copy_config[k];
                    delete _config[hard_copy_config[k]._id]._id;
                }
                else _config[k] = hard_copy_config[k];
            }
            
            return JSON.stringify(_config, null, 4);
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


