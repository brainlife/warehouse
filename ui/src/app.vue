<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/apps"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
        <div class="margin20" v-if="app">
            <message v-for="(msg, idx) in messages" key="idx" :msg="msg"></message>
            <button class="ui button primary right floated" v-if="resource && !resource.nomatch" @click="go('/app/'+app._id+'/submit')"> 
                <i class="play icon"></i> Submit
            </button>
            <button class="ui button right floated" @click="go('/app/'+app._id+'/edit')"> 
                <i class="pencil icon"></i> Edit
            </button>

            <img style="float: left; margin-right: 20px;" :src="app.avatar">
            <h2>{{app.name}}</h2>
            <p>{{app.desc}}</p>
            <br clear="both">

            <table class="ui definition table">
            <tbody>
                <tr>
                    <td>DOI</td>
                    <td>10.1006/br.a.{{app._id}}</td>
                </tr>
                <tr>
                    <td>Owner</td>
                    <td><contact :id="app.user_id"></contact></td>
                </tr>
                <tr>
                    <td>Administrators</td>
                    <td><contact v-for="c in app.admins" key="c._id" :id="c"></contact></td>
                </tr>
                <tr v-if="app.github">
                    <td>github</td>
                    <td>
                        <p>
                            <a :href="'http://github.com/'+app.github">{{app.github}}</a>
                        </p>
                    </td>
                </tr>
                <tr v-if="app.dockerhub">
                    <td>dockerhub</td>
                    <td>
                        <p>
                            <a :href="'http://hub.docker.com/'+app.dockerhub">{{app.dockerhub}}</a>
                        </p>
                    </td>
                </tr>
                <tr v-if="resource">
                    <td>Computing Resource</td>
                    <td>
                        <el-alert :closable="false" title="" type="error" v-if="!resource.detail">
                            There is no computing resource to run this currently.
                        </el-alert>
                        <p v-if="resource.detail">
                            This service can currently run on 
                            <a class="ui label"> {{resource.detail.name}} </a>
                        </p>
                    </td>
                </tr>
                <tr class="top aligned">
                    <td>Configuration Template</td>
                    <td>
                        <pre v-highlightjs><code class="json hljs">{{app.config}}</code></pre>
                    </td>
                </tr>
                <tr class="top aligned">
                    <td>Inputs</td>
                    <td>
                        <div class="ui list">
                            <div class="item" v-for="input in app.inputs">
                                 <datatype :datatype="input.datatype" :datatype_tags="input.datatype_tags"></datatype>
                            </div>
                        </div>
                    </td>
                </tr>
                <tr class="top aligned" v-for="output in app.outputs">
                    <td>Outputs</td>
                    <td>
                        <div class="ui list">
                            <div class="item" v-for="output in app.outputs">
                                <datatype :datatype="output.datatype" :datatype_tags="output.datatype_tags"></datatype>
                            </div>
                        </div>
                    </td>
                </tr>
                <tr v-if="app.dockerhub">
                    <td>dockerhub</td>
                    <td><a :href="'http://hub.docker.com/'+app.dockerhub">{{app.dockerhub}}</a></td>
                </tr>
            </tbody>
            </table>

            <div v-if="config.debug">
                <h2>Debug</h2>

                <div class="ui segments">
                    <div class="ui segment">
                        <h3>App</h3>
                        <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
                    </div>
                    <div class="ui segment">
                        <h3>Resource</h3>
                        <pre v-highlightjs="JSON.stringify(resource, null, 4)"><code class="json hljs"></code></pre>
                    </div>
                </div>
            </div>
        </div><!--margin20-->
        </div><!--page-content-->
    </div>
</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import project from '@/components/project'
import tags from '@/components/tags'
import datatype from '@/components/datatype'

export default {
    components: { sidemenu, pageheader, contact, project, tags, datatype },

    data () {
        return {
            messages: [], //move to mixin?

            app: null,
            resource: null,

            project_id: "", //to be selected by the user

            //cache
            projects: [],

            config: Vue.config,
        }
    },

    mounted: function() {
        this.$http.get('app', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
            populate: 'inputs.datatype outputs.datatype',
        }})
        .then(res=>{
            this.app = res.body.apps[0];
            if(this.app.github) this.findbest(this.app.github);
        }).catch(err=>{
            console.error(err);
        });

        //load projects
        this.$http.get('project', {params: {
            //service: "_upload",
        }})
        .then(res=>{
            this.projects = {};
            res.body.projects.forEach((p)=>{
                this.projects[p._id] = p;
            });
        }, res=>{
          console.error(res);
        });
    },

    methods: {
        go: function(path) {
            this.$router.push(path);
        },

        findbest: function(service) {
          //find resource where we can run this app
          this.$http.get(Vue.config.wf_api+'/resource/best/', {params: {
              service: service,
          }})
          .then(res=>{
            this.resource = res.body;
          }, res=>{
            console.error(res);
          })
        },

        submitapp: function() {
            var instance = null;

            var prov = {
                brainlife: true,
                project: this.project_id,
                app: this.app._id,
                main_task_id: null,
                datasets: this.app.inputs,
            }

            //first create an instance to run everything
            this.$http.post(Vue.config.wf_api+'/instance', {
                name: "brainlife.a."+this.app._id,
                desc: this.app.name,
                config: prov,
            }).then(res=>{
                instance = res.body;
                console.log("instance created", instance);

                //create config to download all input data from archive
                var download = [];
                this.app.inputs.forEach(function(input) {
                    download.push({
                        url: Vue.config.api+"/dataset/download/"+input.dataset_id+"?at="+Vue.config.jwt,
                        untar: "gz",
                        dir: "inputs/"+input.id,
                    });
                });
                //now submit task to download data from archive
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: "Stage Input",
                    service: "soichih/sca-product-raw",
                    config: { download },
                })
            }).then(res=>{
                var download_task = res.body.task;

                console.log("download task submitted");

                //TODO - now submit intermediate tasks necessary to prep the input data so that we can run requested app

                //constract config
                //TODO - this is currently very primitive.. but it will do
                var config = {}
                for(var k in this.app.config) {
                    var spec = this.app.config[k];
                    config[k] = spec.default;
                }
                this.app.inputs.forEach((input)=>{
                    input.datatype.files.forEach((file)=>{
                        config[file.id] = "../"+download_task._id+"/inputs/"+input.id+"/"+(file.filename||file.dirname);
                    });
                });
                prov.config = config; //store main_task config inside provenance
                console.log("generated config");
                console.dir(config);

                //Now submit the app
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: this.app.name,
                    service: this.app.github,
                    config: config,
                    deps: [ download_task._id ],
                })
            }).then(res=>{
                //add main_task_id information on instance config (provenance)
                prov.main_task_id = res.body.task._id;
                return this.$http.put(Vue.config.wf_api+'/instance/'+instance._id, {
                    config: prov,
                });
            }).then(res=>{
                //then request for notifications
                return this.request_notifications(instance, prov.main_task_id);
            }).then(res=>{
                //all good!
                this.go('/process/'+instance._id);
            }).catch(function(err) {
                console.error(err);
            });
        },

        request_notifications: function(instance, main_task) {
            var url = document.location.origin+document.location.pathname+"#/process/"+instance._id;

            //for success
            return this.$http.post(Vue.config.event_api+"/notification", {
                event: "wf.task.finished",
                handler: "email",
                config: {
                        task_id: main_task._id,
                        subject: "[brain-life.org] Process Completed",
                        message: "Hello!\n\nI'd like to inform you that your process has completed successfully.\n\nPlease visit "+url+" to view your result.\n\nBrain-life.org Administrator"
                },
            });
        }
    },
}
</script>

<style scoped>
.ui.text.menu {
    margin: 0;
}
.dataset:hover {
    cursor: pointer;
    background-color: #ddd;
}
</style>


