<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/datasets"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
        <div class="margin20">
            <h1><icon name="upload" scale="2"></icon> Upload Dataset</h1>

            <el-card>
                <div slot="header">
                    <el-steps :space="200" :active="get_active_tab()">
                        <el-step title="Metadata" icon="edit" description="Choose datatype and enter information"></el-step>
                        <el-step title="Upload" icon="upload" description="Upload all required files"></el-step>
                        <el-step title="Validate" icon="picture" description="Validate your files"></el-step>
                        <el-step title="Finalize" icon="picture" description="Archive your data to Brain Life"></el-step>
                    </el-steps>
                </div>

                <el-form label-width="120px">
                    <div v-if="mode == 'meta'">
                        <el-form-item label="Name">
                            <el-input v-model="name" placeholder="Name of this dataset"></el-input>
                        </el-form-item>

                        <el-form-item label="Description">
                            <el-input type="textarea" v-model="desc" :rows="4" placeholder="Any description (optional)"></el-input>
                        </el-form-item>

                        <el-form-item label="Project" v-if="projects">
                            <el-select v-model="project_id" placeholder="Select project to store this dataset" style="width: 100%">
                                <el-option v-for="(p,id) in projects" key="id" :value="id" :label="p.name">{{p.name}} ({{p.access}})</el-option>
                            </el-select>
                        </el-form-item>

                        <el-form-item label="Data Type" v-if="datatypes">
                            <el-select v-model="datatype_id" placeholder="Please select" style="width: 100%;">
                                <el-option v-for="(type,id) in datatypes" key="id" :value="id" :label="type.desc"></el-option>
                            </el-select>
                        </el-form-item>

                        <el-form-item label="Metadata" v-if="datatype_id">
                            <div v-for="m in datatypes[datatype_id].meta">
                                <el-input type="text" v-model="meta[m.id]">
                                    <template slot="prepend"><span style="text-transform: uppercase;">{{m.id}}</span></template>
                                </el-input>
                            </div>
                        </el-form-item>

                        <el-form-item>
                            <el-button @click="back()">Back</el-button>
                            <el-button type="primary" @click="next()">Next</el-button>
                        </el-form-item>
                    </div><!--meta-->

                    <div v-if="mode == 'upload'">
                        <el-card v-if="datatype_id" v-for="file in files" :key="file.id" style="margin-left: 10px;">
                            <div slot="header">{{file.id}} <small class="text-muted">{{file.ext}}</small></div>

                            <div v-if="!file.uploaded && !file.progress">
                                <input type="file" @change="filechange(file, $event)">
                            </div>

                            <div v-if="!file.uploaded && file.progress">
                                <el-button type="small" @click="cancelupload(file)" style="float: right; position: relative; top:-5px;">
                                    <icon name="remove"></icon> Cancel
                                </el-button>
                                Uploading {{file.local_filename}}
                                <el-progress :text-inside="true" :stroke-width="18" :percentage="Math.floor(file.progress.loaded*1000/file.progress.total)/10"></el-progress>
                            </div>

                            <div v-if="file.uploaded">
                                <b>{{file.local_filename}}</b>
                                <small>({{file.size|filesize}})</small>
                                <el-button type="small" @click="clearfile(file)" style="float: right;"><icon name="remove"></icon> Remove</el-button>
                            </div>
                            <br>
                        </el-card>

                        <br>
                        <el-button @click="mode = 'meta'">Back</el-button>
                        <el-button type="primary" @click="validate()">Next</el-button>
                    </div>

                    <div v-if="mode == 'validate'">
                        <div v-if="validation && validation.status == 'finished' && validation.products">
                            <p v-if="validation.status != 'finished'">{{validation.status_msg}}</p>
                            <el-alert :title="msg" type="error" show-icon v-for="(msg,idx) in validation.products[0].results.errors" :key="idx"></el-alert>
                            <el-alert :title="msg" type="warning" show-icon  v-for="(msg,idx) in validation.products[0].results.warnings" :key="idx"></el-alert>
                            <el-alert title="Your data looks good! Please proceed" show-icon type="success" v-if="validation.products[0].results.errors.length == 0"></el-alert>
                            <br>
                
                            <!--show info-->
                            <el-card v-for="(v, k) in validation.products[0].results" :key="k" v-if="k != 'errors' && k != 'warnings'">
                                <div slot="header">{{k}}</div>
                                <pre v-highlightjs="v"><code class="text hljs"></code></pre>
                            </el-card>
                        </div>
                        <div v-if="!validation.products">
                            <h4><i class="notched circle loading icon"></i> Validating..</h4>
                            <pre v-highlightjs="JSON.stringify(validation, null, 4)"><code class="json hljs"></code></pre>
                        </div>

                        <br>
                        <el-button @click="mode = 'upload'">Back</el-button>
                        <el-button type="primary" @click="finalize()">Next</el-button>
                    </div>

                    <div v-if="mode == 'finalize'">
                        <div v-if="dataset">
                            <el-alert type="success" show-icon title="Success!"><br>Your data will be available in warehouse soon</el-alert>
                        </div>
                        <div v-if="!dataset && copy">
                            <h4><i class="notched circle loading icon"></i> Organizing your input files..</h4>
                        </div>

                        <br>
                        <el-button @click="mode = 'validate'">Back</el-button>
                        <el-button type="primary" @click="go('/datasets')">Done!</el-button>
                    </div>
                </el-form>
            </el-card>

            <br>
            <el-card v-if="config.debug">
                <div slot="header">debug</div>
                {{name}}
                {{desc}}
                {{datatype_id}}
                {{project_id}}
                <pre>{{meta}}</pre>
            </el-card>

        </div><!--margin20-->
        </div><!--page-content -->
    </div><!--page-->
</div>
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    components: { sidemenu, pageheader },
    data () {
        return {
            //user selections
            name: "",
            desc: "",
            instance_id: null,
            project_id: null, //project id to place new crate in
            datatype_id: "",
            meta: {},

            //cache
            datatypes: null, //registered datatypes (keyed by datatype_id)
            projects: null,

            //state
            validation: null, //task entry for validation
            copy: null, //copy task to prep uploaded files
            dataset: null, //geneated when finalize request is sent
            mode: "meta",

            config: Vue.config,
        }
    },

    mounted: function() {
        //initialize instance / resource ids if we haven't done yet
        if(this.initialized) return;
        this.initialized = true;
        console.log("uploader mounted - creating instance");
        this.$http.post(Vue.config.wf_api+'/instance', {
            name: "_upload",
        }).then(res=>{
          this.instance_id = res.body._id;
          console.log("subscribe to event service", this.instance_id);
          var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
          var ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
          ws.onopen = (e)=>{
            console.log("websocket opened", this.instance_id);
            ws.send(JSON.stringify({
              bind: {
                ex: "wf.task",
                key: Vue.config.user.sub+"."+this.instance_id+".#",
              }
            }));
          }
          ws.onmessage = (json)=>{
            var event = JSON.parse(json.data);
            var task = event.msg;
            if(!task) return;
            if(!task._id) return; //what kind of task is this?
            if(this.validation && task._id == this.validation._id) {
              this.validation = task;
            }
            if(this.copy && task._id == this.copy._id) {
              this.copy = task;
              if(task.status == "finished") {
                this.archive();
              }
            }
          }
        }, res=>{
          console.error(res);
        });

        //load datatypes
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

    computed: {
        files: function() {
         return this.datatypes[this.datatype_id].files;
        }
    },

    methods: {
        get_active_tab: function() {
            switch(this.mode) {
            case "meta": return 1;
            case "upload": return 2;
            case "validate": return 3;
            case "finalize": return 4;
            }
        },

        back: function() {
            console.log("requesting router back");
            //this.$router.go(-1);
            this.$router.push('/datasets');
        },

        next: function() {
            console.log("switching mode");
            switch(this.mode) {
                case "meta": this.mode = "upload"; break;
            }
            console.log(this.mode);
        },

        go: function(path) {
            this.$router.push(path);
        },

        filechange: function(file, e) {
            var files = e.target.files || e.dataTransfer.files;
            if(!files.length) return;
            this.upload(file, files[0]); //only upload first one
        },
        
        upload: function(file, f) {
            file.local_filename  = f.name;
            file.size = f.size;
            file.type = f.type;
            file.progress = {};

            //find resource to upload to
            this.$http.get(Vue.config.wf_api+'/resource/best/', {params: {
                service: "_upload",
            }})
            .then(res=>{
                var upload_resource = res.body.resource;
                var path = this.instance_id+'/upload/'+file.filename;

                var xhr = new XMLHttpRequest();
                file.xhr = xhr; //so that I can abort it if user wants to
                xhr.open("POST", Vue.config.wf_api+"/resource/upload/"+upload_resource._id+"/"+btoa(path));
                xhr.setRequestHeader("Authorization", "Bearer "+Vue.config.jwt);
                xhr.upload.addEventListener("progress", (evt)=>{
                    file.progress = {loaded: evt.loaded, total: evt.total};
                    //$("#file_"+file.id).progress({percent: evt.loaded*100/evt.total});
                    //console.dir(file.progress);
                    this.$forceUpdate();
                }, false);
                xhr.addEventListener("load", (evt)=>{
                    if(evt.target.status == "200") {
                        file.uploaded = true;
                        this.$forceUpdate();
                    } else {
                        var msg = JSON.parse(evt.target.response);
                        console.error(msg);
                    }
                }, false);
                xhr.addEventListener("error", (evt)=>{
                    console.error(evt);
                });
                xhr.send(f);
            }, res=>{
                console.error(res);
            });
        },
        validate: function() {
            this.mode = "validate";
            this.validation = null;

            //create validator config (let's just use soichih/sca-service-conneval-validate for now..)
            var config = {};
            this.datatypes[this.datatype_id].files.forEach(function(file) {
                config[file.id] = "../upload/"+file.filename;
            });
            //and submit
            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: this.instance_id,
                name: "validation",
                service: "soichih/sca-service-conneval-validate",
                config: config,
            }).then(res=>{
                console.log("submitted validation task");
                this.validation = res.body.task;
            }, res=>{
                console.error(res);
            });
        },
        finalize: function() {
            this.mode = "finalize";
            this.copy = null;
            this.dataset = null;

            //create validator config (let's just use soichih/sca-service-conneval-validate for now..)
            var copy = [];
            this.files.forEach(function(file) {
                copy.push({src: "../upload/"+file.filename, dest: file.filename});
            });
            //and submit copy
            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: this.instance_id,
                name: "input",
                service: "soichih/sca-product-raw",
                config: { copy },
            }).then(res=>{
                console.log("submitted copy task");
                this.copy = res.body.task;
            }, res=>{
                console.error(res);
            });
        },

        archive: function() {
            if(this.dataset) return; //already archived

            //finally, make a request to finalize the task directory
            this.$http.post('dataset', {

                //info for dataset
                project: this.project_id,
                name: this.name,
                desc: this.desc,
                datatype: this.datatype_id,
                datatype_tags: [],

                //product: product,
                meta: this.meta,

                tags: [], 

                //datasource
                instance_id: this.instance_id,
                task_id: this.copy._id, //we archive data from copy task

            }).then(res=>{
                console.log("submitted dataset request");
                this.dataset = res.body;
            }, res=>{
                console.error(res);
            });
        },

        clearfile: function(file) {
            file.uploaded = null;
            file.progress = null;
            this.$forceUpdate();
        },
        cancelupload: function(file) {
            file.xhr.abort();
            file.uploaded = null;
            file.progress = null;
            this.$forceUpdate();
        }
    },
}
</script>

<style scoped>
.ui.form textarea.desc {
    height: 30px;
}
.ui.header.status,
label.meta-field-name {
    text-transform: uppercase;
}
</style>


