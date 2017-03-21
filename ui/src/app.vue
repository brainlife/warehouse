<template>
<div>
    <sidemenu active="apps"></sidemenu>
    <div class="ui pusher">
        <div class="margin20" v-if="app">
            <h2 class="ui header">
                <img class="ui image" :src="app.avatar">
                {{app.name}}
            </h2>
            <p>{{app.desc}}</p>

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
                <tr class="top aligned">
                    <td>Inputs</td>
                    <td>
                        <div class="ui list">
                            <div class="item" v-for="input in app.inputs">
                                <div class="header"> {{input.datatype.desc}} </div>
                                <tags :tags="input.datatype_tags"></tags>
                                <div class="ui segment" v-for="file in input.datatype.files">
                                    {{file}}
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
                <tr class="top aligned" v-for="output in app.outputs">
                    <td>Outputs</td>
                    <td>
                        <div class="ui list">
                            <div class="item" v-for="output in app.outputs">
                                <div class="header"> {{output.datatype.desc}} </div>
                                <tags :tags="output.datatype_tags"></tags>
                                <div class="ui segment" v-for="file in output.datatype.files">
                                    {{file}}
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
                <tr v-if="resource">
                    <td>Computing Resource</td>
                    <td>
                        <p>
                            This service can currently run on 
                            <a class="ui label"> {{resource.detail.name}} </a>
                        </p>
                    </td>
                </tr>
                <tr v-if="app.dockerhub">
                    <td>dockerhub</td>
                    <td><a :href="'http://hub.docker.com/'+app.dockerhub">{{app.dockerhub}}</a></td>
                </tr>
            </tbody>
            </table>

            <div class="ui segment">
                <div class="ui top attached label">Submit Process</div>
                <div class="ui form">
                    <div class="field" v-for="input in app.inputs">
                        <label>{{input.id}}</label>
                        <select class="ui fluid dropdown" v-model="input.dataset_id">
                            <option value="">(Select {{input.id}} dataset)</option>
                            <option v-for="dataset in datasets[input.datatype._id]" :value="dataset._id">
                                {{dataset.name}}
                                <tags :tags="dataset.datatype_tags"></tags>
                            </option>
                        </select>
                    </div>

                    <div class="field">
                        <label>Project</label>
                        <p>Project used to run this application</p>
                        <select v-model="project_id">
                            <option v-for="(p,id) in projects" :value="p._id">{{p.name}} ({{p.access}})</option>
                        </select>
                    </div>

                    <div class="ui primary button" @click="submitapp()">Submit</div>
                </div>
            </div>

            <h2>Debug</h2>
            <div class="ui segments">
                <div class="ui segment">
                    <h3>App</h3>
                    <pre v-highlightjs><code class="json hljs">{{app}}</code></pre>
                </div>
            </div>
        </div>
    </div>
</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import contact from '@/components/contact'
import project from '@/components/project'
import tags from '@/components/tags'

export default {
    components: { sidemenu, contact, project, tags },

    data () {
        return {
            app: null,
            resource: null,

            project_id: "", //to be selected by the user

            //cache
            datasets: {}, //for searching datasets
            projects: [],
        }
    },

    mounted: function() {
        //console.log("looking for ", this.$route.params.id);
        this.$http.get('app', {params: {
            find: JSON.stringify({_id: this.$route.params.id})
        }})
        .then(res=>{
            this.app = res.body.apps[0];
            if(this.app.github) this.findbest(this.app.github);

            var datatype_ids = this.app.inputs.map((input)=>input.datatype._id);

            //find datasets (TODO - make this smarter..)
            return this.$http.get('dataset', {params: {
                find: JSON.stringify({datatype: {$in: datatype_ids}})
            }})
        })
        .then(res=>{
            this.datasets = {};
            res.body.datasets.forEach((dataset)=>{
                var datatype_id = dataset.datatype._id;

                //group by datatype_id
                if(this.datasets[datatype_id] === undefined) Vue.set(this.datasets, datatype_id, []);

                //TODO - apply tag filter

                this.datasets[datatype_id].push(dataset);
            });
            console.log(this.datasets);
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

                //Now submit the app (TODO - generate UI and config automatically)
                var config = {
                    //"coords": [ [ 0, 0, 0 ], [ 0, -16, 0 ], [ 0, -8, 40 ] ],
                };
                //TODO - for now, let's just load some default config
                for(var k in this.app.config) {
                    var spec = this.app.config[k];
                    config[k] = spec.default;
                }
                this.app.inputs.forEach((input)=>{
                    input.datatype.files.forEach((file)=>{
                        config[file.id] = "../"+download_task._id+"/inputs/"+input.id+"/"+(file.filename||file.dirname);
                    });
                });
                console.log("generated config");
                console.dir(config);

                prov.config = config; //store main_task config inside provenance
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


