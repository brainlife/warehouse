<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/apps"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
        <div class="margin20">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/apps' }">Apps</el-breadcrumb-item>
                <el-breadcrumb-item v-if="app._id" :to="{ path: '/app/'+app._id }">{{app._id}}</el-breadcrumb-item>
                <el-breadcrumb-item v-if="app._id">Edit</el-breadcrumb-item>
                <el-breadcrumb-item v-if="!app._id">New App</el-breadcrumb-item>
            </el-breadcrumb>
            <br>

            <h1 v-if="$route.params.id == '_'">New App</h1>
            <h1 v-else><icon name="pencil" scale="2"/> Edit {{app.name}}</h1>

            <el-card>
                <el-form ref="form" label-width="120px">
                    <el-form-item label="Name">
                        <el-input type="text" v-model="app.name" placeholder="Name of application"/>
                    </el-form-item>
                    <el-form-item label="Description">
                        <el-input type="textarea" v-model="app.desc" placeholder="Enter description for this application."/>
                    </el-form-item>
                    <el-form-item label="Administrators">
                        <contactlist :uids="app.admins"></contactlist>
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

                    <el-form-item label="Configuration">
                        <!--
                        https://github.com/dhenkes/vue2-ace/issues/5
                        <editor :content="app._config" :sync="true" :lang="'json'"></editor>
                        -->
                        <el-input type="textarea" v-model="app._config" autosize/>
                    </el-form-item>

                    <el-form-item label="Inputs">
                        <el-card v-for="(input, idx) in app.inputs" :key="idx" style="margin-bottom: 10px;">
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
                            <el-col :span="14">
                                Datatype Tags
                                <el-select v-model="input.datatype_tags" 
                                    style="width: 100%"
                                    multiple filterable allow-create placeholder="Enter datatype tags">
                                    <el-option v-for="tag in input.datatype_tags" key="tag" :label="tag" :value="tag"></el-option>
                                </el-select>
                            </el-col>
                            </el-row>
                        </el-card>
                        <el-button @click="add(app.inputs)">Add Input</el-button>
                    </el-form-item>

                    <el-form-item label="Outputs">
                        <el-card v-for="(output, idx) in app.outputs" :key="idx" style="margin-bottom: 10px;">
                            <el-row :gutter="20">
                            <el-col :span="4">
                                ID
                                <el-input v-model="output.id">
                                    <!--<template slot="prepend">ID</template>-->
                                </el-input>
                            </el-col>
                            <el-col :span="6">
                                Datatype
                                <el-select v-model="output.datatype" style="width: 100%">
                                    <el-option v-for="datatype in datatypes" key="datatype._id" :label="datatype.name" :value="datatype._id"></el-option>
                                </el-select>
                            </el-col>
                            <el-col :span="14">
                                Datatype Tags
                                <el-select v-model="output.datatype_tags" 
                                    style="width: 100%" 
                                    multiple filterable allow-create placeholder="Enter datatype tags">
                                    <el-option v-for="tag in output.datatype_tags" key="tag" :label="tag" :value="tag"></el-option>
                                </el-select>
                            </el-col>
                            </el-row>
                        </el-card>
                        <el-button @click="add(app.outputs)">Add Output</el-button>
                    </el-form-item>

                    <el-form-item>
                        <el-button type="primary" icon="check" @click="submit()">Submit</el-button>
                    </el-form-item>
                </el-form>
            </el-card>
            
            <br><br>

            <el-card v-if="config.debug">
                <div slot="header">Debug</div>
                <h3>app</h3>
                <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
                <h3>form</h3>
                <pre v-highlightjs="JSON.stringify(form, null, 4)"><code class="json hljs"></code></pre>
            </el-card>

        </div><!--margin20-->
        </div><!--page-content-->
    </div><!--page-->
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

export default {
    name: "appedit",
    components: { sidemenu, editor, contactlist, pageheader },
    data () {
        return {
            app: {
                _id: null,
                admins: [Vue.config.user.sub.toString()],

                name: null,
                desc: null,
                avatar: null,

                github: null,
                github_branch: null,
                
                config: null,
                _config: "{\"something\": 123}",

                inputs: [],
                outputs: [],
            },

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
        if(this.$route.params.id !== '_') {
            //load app to edit
            this.$http.get('app', {params: {
                find: JSON.stringify({_id: this.$route.params.id})
            }})
            .then(res=>{
                this.app = res.body.apps[0];
                this.app.init_admins = this.app.admins;
                this.app._config = JSON.stringify(this.app.config, null, 4);
            });
        } 
        //this.$message('This is a message');
        /*
         this.$notify({
          title: 'Success',
          message: 'This is a success message',
          type: 'success'
        });
        */

        this.$on('editor-update', c=>{
            console.log(c);
        });

        //load datatypes for form
        this.$http.get('datatype', {params: {
            //service: "_upload",
        }})
        .then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach((type)=>{
                this.datatypes[type._id] = type;
            });
        }, res=>{
            console.error(res);
        });

    },
    computed: {
    },
    methods: {
        /*
        changeadmins: function(admins) {
            this.app.admins = admins;
        },
        */

        add: function(it) {
            it.push({
                id: "",
                datatype: null,
                datatype_tags: [],
            });
        },

        submit: function() {
            //console.dir(this.app._config);
            try {
                this.app.config = JSON.parse(this.app._config);     
            } catch(err) {
                this.$notify({ showClose: true, message: 'Failed to parse config template.', type: 'error' });
                return;
            }
            if(this.app._id !== '_') {
                //update
                this.$http.put('app/'+this.app._id, this.app)
                .then(res=>{
                    console.dir(res.body);
                    this.$router.push("/app/"+this.app._id);
                });
            } else {
                //new
                this.$http.post('app', this.app)
                .then(res=>{
                    console.dir(res.body);
                    this.$router.push("/app/"+res.body._id);
                });
            } 
        }
    },
}
</script>

<style scoped>
</style>


