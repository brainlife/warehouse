<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/apps"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
        <div class="margin20">
            <h1 v-if="$route.params.id == '_'">Register App</h1>
            <h1 v-else>Edit {{app.name}}</h1>

            <form class="ui form">
                <div class="field">
                    <label>Name</label>
                    <input type="text" v-model="app.name" placeholder="Name of application">
                </div>
                <div class="field">
                    <label>Description Name</label>
                    <textarea v-model="app.desc" placeholder="Enter description for this application."></textarea>
                </div>
                <div class="field" v-if="app.init_admins">
                    <label>Administrator</label>
                    <contactlist :uids="app.init_admins" @changed="changeadmins($event)"></contactlist>
                </div>
                <div class="field">
                    <label>Avatar</label>
                    <input type="text" v-model="app.avatar" placeholder="URL of application avatar">
                </div>
                <div class="field">
                    <label>Source code Repository</label>
                    <div class="ui top attached tabular menu repotype">
                        <a class="item active" data-tab="github">Github</a>
                        <a class="item" data-tab="dockerhub">Dockerhub</a>
                    </div>

                    <div class="ui bottom attached tab segment active" data-tab="github">
                        <div class="field">
                            <label>Repo Name</label>
                            <input type="text" v-model="app.github" placeholder="org/repo">
                        </div>
                        <div class="field">
                            <label>Branch Name</label>
                            <input type="text" v-model="app.github_branch" placeholder="master">
                        </div>
                    </div>
                    <div class="ui bottom attached tab segment" data-tab="dockerhub">
                        <div class="field">
                            <label>Container Name</label>
                            <input type="text" v-model="app.dockerhub" placeholder="org/container">
                        </div> 
                    </div>
                </div>

                <div class="field" v-if="app._config">
                    <label>Configuration Template</label>
                    <editor :sync="true" :content="app._config"></editor>
                </div>

                <hr>
                <div class="field">
                    <label>Inputs</label>
                    <div class="ui segment" v-for="input in app.inputs">
                        <el-input v-model="input.id">
                            <template slot="prepend">ID</template>
                        </el-input>

                        <h4>Datatype</h4>
                        <el-select v-model="input.datatype">
                            <el-option v-for="datatype in datatypes" key="datatype._id" :label="datatype.name" :value="datatype._id"></el-option>
                        </el-select>

                        <h4>Datatype Tags</h4>
                        <el-select v-model="input.datatype_tags" multiple filterable allow-create placeholder="Choose datatype tags">
                            <el-option v-for="tag in input.datatype_tags" key="tag" :label="tag" :value="tag"></el-option>
                        </el-select>
                    </div>
                    <button class="ui mini button" type="button" @click="add(app.inputs)">Add</button>
                </div>

                <hr>
                <div class="field">
                    <label>Output</label>
                    <div class="ui segment" v-for="output in app.outputs">
                        <!--
                        <el-input v-model="output.id">
                            <template slot="prepend">ID</template>
                        </el-input>
                        -->
                        <h4>Datatype</h4>
                        <el-select v-model="output.datatype">
                            <el-option v-for="datatype in datatypes" key="datatype._id" :label="datatype.name" :value="datatype._id"></el-option>
                        </el-select>

                        <h4>Datatype Tags</h4>
                        <el-select v-model="output.datatype_tags" multiple filterable allow-create placeholder="Choose datatype tags">
                            <el-option v-for="tag in output.datatype_tags" key="tag" :label="tag" :value="tag"></el-option>
                        </el-select>
                    </div>
                    <button class="ui mini button" type="button" @click="add(app.outputs)">Add</button>
                </div>

                <!--
                <div class="field">
                    <div class="ui checkbox">
                        <input type="checkbox" tabindex="0" class="hidden">
                        <label>I agree to the Terms and Conditions</label>
                    </div>
                </div>
                -->
                <el-button type="primary" icon="check" @click="submit()" style="float: right;">Submit</el-button>
            </form>
            
            <br><br>

            <div class="ui segments" v-if="config.debug">
                <div class="ui segment">
                    <h3>app</h3>
                    <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
                </div>
            </div>

        </div><!--margin20-->
        </div><!--page-content-->
    </div><!--page-->
</div>
</template>

<script>
import Vue from 'vue'

import editor from 'vue2-ace'
import 'brace/mode/javascript'
import 'brace/theme/chrome'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import contactlist from '@/components/contactlist'

export default {
    name: "appedit",
    components: { sidemenu, editor, contactlist, pageheader },
    data () {
        return {
            repotype: "github",

            app: {
                _id: null,
                init_admins: null,
                admins: null,

                name: null,
                desc: null,
                avatar: null,

                github: null,
                github_branch: null,

                _config: null,
                inputs: [],
                outputs: [],
            },

            //cache
            datatypes: null, //registered datatypes (keyed by datatype_id)

            config: Vue.config,
        }
    },
    mounted: function() {
		$(this.$el).find('.repotype .item').tab({
            onVisible: (v)=> {
                this.repotype = v;
            }
        });
        this.$on('editor-update', function(c) {
            this.app._config = c;
        });
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
        } else {
            //init new app
            this.app.admins = this.app.init_admins = [Vue.config.user.sub];
            this.add(this.app.inputs);
            this.add(this.app.outputs);
            this.app.avatar = "http://lorempixel.com/80/80/technics/";
            this._config = "{}";
        } 
        //this.$message('This is a message');
        /*
         this.$notify({
          title: 'Success',
          message: 'This is a success message',
          type: 'success'
        });
        */

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
        changeadmins: function(admins) {
            this.app.admins = admins;
        },

        add: function(it) {
            it.push({
                id: "",
                datatype: null,
                datatype_tags: [],
            });
        },

        submit: function() {
            try {
                this.app.config = JSON.parse(this.app._config);     
            } catch(err) {
                this.$notify({ showClose: true, message: 'Failed to parse config template.', type: 'error' });
                return;
            }
            console.log("submitting", this.app);
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


