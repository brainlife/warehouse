<template>
<div>
    <sidemenu active="/apps"></sidemenu>
    <div class="ui pusher">
        <div class="margin20" v-if="app">
            <message v-for="(msg, idx) in messages" key="idx" :msg="msg"></message>
            <img style="float: left; margin-right: 20px;" :src="app.avatar">
            <h2>{{app.name}}</h2>
            <p>{{app.desc}}</p>
            <br clear="both">

            <el-card class="box-card">
                <!--
                <div slot="header">
                    <span>Submit Form</span>
                </div>
                -->
                <div class="ui form">
                    <div class="field">
                        <label>Description</label>
                        <el-input type="textarea" v-model="desc" placeholder="Optional Description for your process"></el-input>
                    </div>

                    <div class="field">
                        <label>Project</label>
                        <p class="text-muted">Project used to run this application</p>
                        <select v-model="project_id">
                            <option v-for="(p,id) in projects" :value="p._id">{{p.name}} ({{p.access}})</option>
                        </select>
                    </div>

                    <h3>Inputs</h3>
                    <div class="field" v-for="input in app.inputs">
                        <label>{{input.id}}</label>
                        <select class="ui fluid dropdown" v-model="input.dataset_id">
                            <option value="">(Select {{input.id}} dataset)</option>
                            <option v-for="dataset in datasets[input.id]" :value="dataset._id">
                                <metadata :metadata="dataset.meta"></metadata> / 
                                {{dataset.name}} / {{dataset.desc}} 
                                <tags :tags="dataset.datatype_tags"></tags>
                            </option>
                        </select>

                        <!--
                        <el-input placeholder="Please input" v-model="input5">
                            <el-select v-model="select" slot="prepend" placeholder="Select">
                            <el-option label="Restaurant" value="1"></el-option>
                            <el-option label="Order No." value="2"></el-option>
                            <el-option label="Tel" value="3"></el-option>
                            </el-select>
                            <el-button slot="append" icon="search"></el-button>
                        </el-input>
                        -->
                    </div>

                    <h3>Configurations</h3>
                    <!-- TODO doesn't support nested parameters-->
                    <div class="field" v-for="(v,k) in app.config" v-if="v.type && v.value">
                        <label>{{k}}</label>
                        <el-input v-model="v.value">
                            <!--<template slot="prepend">{{k}}</template>-->
                        </el-input>
                    </div>
        
                    <div class="ui primary button" @click="submit()">Submit</div>
                </div>
            </el-card>

            <h2>Debug</h2>
            <div class="ui segments">
                <div class="ui segment">
                    <h3>App</h3>
                    <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
                </div>
                <div class="ui segment">
                    <h3>Datasets</h3>
                    <pre v-highlightjs="JSON.stringify(datasets, null, 4)"><code class="json hljs"></code></pre>
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
import metadata from '@/components/metadata'

import lib from '@/lib'

//take app's config template and create a real config using download_task_id
function generate_config(app, download_task_id) {
    var config = app.config;

    function handle_obj(obj) {
        for(var k in obj) { 
            var node = obj[k];
            if(node.isArray) {
                console.log("todo.. array!");
            } else if(typeof node === 'object') {
                if(node.type) {
                    switch(node.type) {
                    case "string":
                    case "integer":
                        obj[k] = node.value;
                        break;
                    case "input":
                        //find the input 
                        app.inputs.forEach(input=>{
                            if(input.id == node.input_id) {
                                //find the file
                                input.datatype.files.forEach(file=>{
                                    if(file.id == node.file_id) {
                                        obj[k] = "../"+download_task_id+"/inputs/"+input.id+"/"+(file.filename||file.dirname)
                                    }
                                });
                            } 
                        });
                        break;
                    default:
                        obj[k] = "unknown_template_type";
                    }
                } else handle_obj(node); //recurse
            }
        }
    }

    handle_obj(config);

    console.log("generated config", config);
    return config;
}

export default {
    components: { sidemenu, contact, project, tags, metadata },

    data () {
        return {
            messages: [], //move to mixin?

            app: null,
            resource: null,

            //form inputs
            desc: "",
            project_id: localStorage.getItem("last_projectid_used")||"", 

            //cache
            datasets: {}, //available datasets grouped by input._id
            projects: [],
        }
    },

    computed: {
    },

    mounted: function() {
        //console.log("looking for ", this.$route.params.id);
        this.$http.get('app', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
            populate: 'inputs.datatype outputs.datatype',
        }})
        .then(res=>{
            this.app = res.body.apps[0];
            if(this.app.github) this.findbest(this.app.github);

            //process config template
            //TODO - update to handle nested parameters
            console.dir(this.app);
            for(var k in this.app.config) {
                var v = this.app.config[k];
                if(v.type && v.default) v.value = v.default;
            }

            //load datasets that this app cares about
            var datatype_ids = this.app.inputs.map((input)=>input.datatype._id);
            return this.$http.get('dataset', {params: {
                find: JSON.stringify({
                    datatype: {$in: datatype_ids},
                    removed: false,
                })
            }})

        })
        .then(res=>{
            //console.log("datasets applicable:", res);

            this.app.inputs.forEach((input)=>{
                //console.dir(input);
                Vue.set(this.datasets, input.id, res.body.datasets.filter(dataset=>{
                    //console.dir(dataset);
                    if(dataset.datatype != input.datatype._id) return false;

                    var match = true;
                    //see if all required tags exists
                    input.datatype_tags.forEach(required_tag=>{
                        if(required_tag[0] == "!") {
                            //negative tag
                            var neg_tag = required_tag.substring(1);
                            if(~dataset.datatype_tags.indexOf(neg_tag)) match = false;
                        } else {
                            //required tag
                            if(!~dataset.datatype_tags.indexOf(required_tag)) match = false;
                        }
                    });
                    return match; 
                }));
            });
            //console.dir(this.datasets);
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

        submit: function() {
            var instance = null;

            var inst_config = {
                brainlife: true,
                project: this.project_id,
                main_task_id: null, //will be set once submitted
                prov: {
                    app: this.app._id,
                    deps: this.app.inputs.map(input=>{
                        return {input_id: input.id, dataset: input.dataset_id};
                    }),
                }
            }

            //first create an instance to run everything
            this.$http.post(Vue.config.wf_api+'/instance', {
                name: "brainlife.a."+this.app._id,
                desc: this.desc,
                config: inst_config,
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
                console.log("submitting download task", download);
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: "Stage Input",
                    service: "soichih/sca-product-raw",
                    config: { download },
                })
            }).then(res=>{
                var download_task = res.body.task;
                console.log("download task submitted", download_task);

                //TODO - now submit intermediate tasks necessary to prep the input data so that we can run requested app

                //submit the main task
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: this.app.name,
                    service: this.app.github,
                    config: generate_config(this.app, download_task._id),
                    deps: [ download_task._id ],
                })
            }).then(res=>{
                //add main_task_id information on instance config (used by ui to render main task)
                inst_config.main_task_id = res.body.task._id;
                inst_config.prov.config = res.body.task.config;
                return this.$http.put(Vue.config.wf_api+'/instance/'+instance._id, {
                    config: inst_config,
                });
            }).then(res=>{
                //then request for notifications
                return this.request_notifications(instance, inst_config.main_task_id);
            }).then(res=>{
                //all good!
                localStorage.setItem("last_projectid_used", this.project_id);
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


