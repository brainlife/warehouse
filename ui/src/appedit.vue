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
            <el-form-item label="Configuration">
                <!--
                https://github.com/dhenkes/vue2-ace/issues/5
                <editor :content="app._config" :sync="true" :lang="'json'"></editor>
                -->
                <el-input type="textarea" v-model="app._config" autosize/>
            </el-form-item>

            <br>
            <el-form-item label="Inputs">
                <div v-for="(input, idx) in app.inputs" :key="idx" style="margin-bottom: 10px;">
                    <el-card>
                        <el-row :gutter="20">
                        <el-col :span="4">
                            ID
                            <el-input v-model="input.id">
                                <!--<template slot="prepend">ID</template>-->
                            </el-input>
                        </el-col>
                        <el-col :span="6">
                            Datatype
                            <el-select v-model="input.datatype" style="width: 100%;">
                                <el-option v-for="datatype in datatypes" key="datatype._id" :label="datatype.name" :value="datatype._id"></el-option>
                            </el-select>
                        </el-col>
                        
                        <el-col :span="14" v-if="input.datatype">
                            <el-button @click="app.inputs.splice(idx, 1)" size="small" icon="delete" style="float: right;"></el-button>
                            Datatype Tags<br>
                            <select2 :options="datatypes[input.datatype]._tags" v-model="input.datatype_tags" :multiple="true" :tags="true"></select2>
                        </el-col>
                        </el-row>
                    </el-card>
                </div>
                <el-button @click="add(app.inputs)" size="small" icon="plus">Add Input</el-button>
            </el-form-item>

            <br>
            <el-form-item label="Outputs">
                <div v-for="(output, idx) in app.outputs" :key="idx" style="margin-bottom: 10px;">
                    <el-card>
                        <el-row :gutter="20">
                        <el-col :span="4">
                            ID
                            <el-input v-model="output.id"></el-input>
                        </el-col>
                        <el-col :span="6">
                            Datatype
                            <el-select v-model="output.datatype" style="width: 100%">
                                <el-option v-for="datatype in datatypes" key="datatype._id" :label="datatype.name" :value="datatype._id"></el-option>
                            </el-select>
                        </el-col>
                        <el-col :span="14" v-if="output.datatype">
                            <el-button @click="app.outputs.splice(idx, 1)" size="small" icon="delete" style="float: right;"></el-button>
                            Datatype Tags<br>
                            <select2 :options="datatypes[output.datatype]._tags" 
                                v-model="output.datatype_tags" :multiple="true" :tags="true"></select2>
                            Datatype Mapping (optional)
                            <el-input type="textarea" v-model="output._files" autosize/>
                        </el-col>
                        </el-row>
                    </el-card>
                </div>
                <el-button @click="add(app.outputs)" size="small" icon="plus">Add Output</el-button>
            </el-form-item>

            <el-form-item style="float: right;">
                <el-button @click="cancel()">Cancel</el-button>
                <el-button type="primary" icon="check" @click="submit()">Submit</el-button>
            </el-form-item>
            <br clear="both">
        </el-form>

        <el-card v-if="config.debug">
            <div slot="header">Debug</div>
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
import configedit from '@/components/configedit'

export default {
    components: { sidemenu, editor, contactlist, pageheader, select2, configedit },
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
                
                config: null,
                _config: "{\"something\": 123}",

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

            config: Vue.config,
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

                            //need to do some last minute type conversion
                            this.app._config = JSON.stringify(this.app.config, null, 4);
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
        add: function(it) {
            it.push({
                id: "",
                datatype: null,
                datatype_tags: [],
            });
        },

        cancel: function() {
            this.$router.push("/apps");
        },

        submit: function() {
            try {
                this.app.config = JSON.parse(this.app._config);     
            } catch(err) {
                this.$notify({ text: 'Failed to parse config template.', type: 'error' });
                return;
            }
            try {
                this.app.outputs.forEach(output=>{
                    output.files = null;
                    console.log(output._files);
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


