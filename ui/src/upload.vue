<template>
<div>
    <sidemenu active="datasets"></sidemenu>
    <div class="ui pusher">
        <div class="margin20">
            <h1>Upload</h1>

            <div class="ui attached segment form">
                <el-steps :space="200" :active="get_active_tab()">
                    <el-step title="Metadata" icon="edit" description="Choose datatype and enter information"></el-step>
                    <el-step title="Upload" icon="upload" description="Upload all required files"></el-step>
                    <el-step title="Validate" icon="picture" description="Validate your files"></el-step>
                    <el-step title="Finalize" icon="picture" description="Archive your data to Brain Life"></el-step>
                </el-steps>
            </div>

            <!--
            <div class="ui four top attached steps">
                <div class="step" v-bind:class="{active: mode == 'meta'}">
                    <i class="info circle icon"></i>
                    <div class="content">
                        <div class="title">metadata</div>
                        <div class="description">describe your data</div>
                    </div>
                </div>
                <div class="step" v-bind:class="{active: mode == 'upload'}">
                    <i class="upload icon"></i>
                    <div class="content">
                        <div class="title">upload</div>
                        <div class="description">upload all required files</div>
                    </div>
                </div>
                <div class="step" v-bind:class="{active: mode == 'validate'}">
                    <i class="checkmark box icon"></i>
                    <div class="content">
                        <div class="title">validate</div>
                        <div class="description">verify your uploaded data</div>
                    </div>
                </div>
                <div class="step" v-bind:class="{active: mode == 'finalize'}">
                    <i class="database icon"></i>
                    <div class="content">
                        <div class="title">finalize</div>
                        <div class="description">store your data to archive</div>
                    </div>
                </div>
            </div>
            -->

            <div class="ui attached segment form">
                <div v-if="mode == 'meta'">
                    <div class="field">
                        <label>Name</label>
                        <input type="text" v-model="name" placeholder="Enter a name for this data">
                    </div>

                    <div class="field">
                        <label>Description</label>
                        <el-input type="textarea" v-model="desc" :rows="4" placeholder="Any description.."></el-input>
                    </div>

                    <div class="field" v-if="projects">
                        <label>Project</label>
                        <select v-model="project_id">
                            <option v-for="(p,id) in projects" v-bind:value="id">{{p.name}} ({{p.access}})</option>
                        </select>
                    </div>

                    <div class="field" v-if="datatypes">
                        <label>Data Type</label>
                        <el-select v-model="datatype_id" placeholder="Please select">
                            <el-option v-for="(type,id) in datatypes" key="id" :value="id" :label="type.desc"></el-option>
                        </el-select>
                    </div>
                    <div v-if="datatype_id">
                        <div class="field" v-for="m in datatypes[datatype_id].meta">
                        <label>Metadata</label>
                        <el-input type="text" v-model="meta[m.id]">
                            <template slot="prepend"><span style="text-transform: uppercase;">{{m.id}}</span></template>
                        </el-input>
                        </div>
                    </div>

                    <br>
                    <button class="ui right floated primary button" @click="next()">Next</button>
                    <button class="ui right floated button" @click="back()">Back</button>
                    <br clear="both">
                </div><!--meta-->

                <div v-if="mode == 'upload'">
                    <div class="field" v-if="datatype_id">
                        <div class="ui raised segment" v-for="file in files" style="margin-left: 10px;">
                            <a class="ui ribbon label">{{file.id}}</a>
                            <br>
                            <br>
                            <div v-if="!file.uploaded && !file.progress">
                                <input type="file" @change="filechange(file, $event)">
                            </div>

                            <div v-if="!file.uploaded && file.progress">
                                <button class="ui tiny button remove icon" @click="cancelupload(file)" style="float: right"></i>
                                    <i class="ui remove icon"></i>
                                </button>
                                <div class="ui indicating progress" v-bind:id="'file_'+file.id" style="margin-right: 40px;">
                                    <div class="bar">
                                        <div class="progress"></div>
                                    </div>
                                    <div class="label">Uploading {{file.filename}}</div>
                                </div>
                            </div>

                            <div v-if="file.uploaded">
                                <button class="small ui button right floated" @click="clearfile(file)">Remove</button>
                                <b>{{file.filename}}</b>
                                <small>({{file.size}} bytes)</small>
                                <br clear="both">
                            </div>
                        </div>
                    </div><!--field-->

                    <button class="ui right floated primary button" @click="validate()">Next</button>
                    <button class="ui right floated button" @click="mode = 'meta'">Back</button>
                    <br clear="both">
                </div>

                <div v-if="mode == 'validate'">
                    <div v-if="validation && validation.status == 'finished' && validation.products">
                        <div class="field">
                            <p v-if="validation.status != 'finished'">{{validation.status_msg}}</p>
                            <div class="ui red inverted segment" v-for="msg in validation.products[0].results.errors">{{msg}}</div>
                            <div class="ui yellow inverted segment" v-for="msg in validation.products[0].results.warnings">{{msg}}</div>
                            <div v-if="validation.products[0].results.errors.length == 0" class="ui message">
                                <p>Your data looks good! Please proceed.</p>
                            </div>
                            <div v-for="(v, k) in validation.products[0].results" v-if="k != 'errors' && k != 'warnings'">
                                <div class="ui raised segment" style="margin-left: 10px;">
                                    <a class="ui red ribbon label">{{k}}</a>
                                    <pre>{{v}}</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="!validation.products">
                        <h4><i class="notched circle loading icon"></i> Validating..</h4>
                        <pre>{{validation}}</pre>
                    </div>

                    <br>
                    <button class="ui right floated primary button" @click="finalize()">Next</button>
                    <button class="ui right floated button" @click="mode = 'upload'">Back</button>
                    <br clear="both">
                </div>

                <div v-if="mode == 'finalize'">
                    <div v-if="dataset">
                        <div class="ui message">
                            <div class="header">Success!</div>
                                <p>Your data will be available in warehouse soon!</p>
                            </div>
                        </div>
                    <div v-if="!dataset && copy">
                        <h4><i class="notched circle loading icon"></i> Organizing your input files..</h4>
                    </div>

                    <br>
                    <button class="ui right floated primary button" @click="go('/datasets')">Done!</button>
                    <button class="ui right floated button" @click="mode = 'validate'">Back</button>
                    <br clear="both">
                </div>
            </div><!--segments-->

            <div class="ui segment">
                <h3>debug</h3>
                {{name}}
                {{desc}}
                {{datatype_id}}
                {{project_id}}
                <pre>{{meta}}</pre>
            </div>

        </div><!--margin20-->
    </div><!--page-->
</div>
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    name: "upload",
    //props: [ 'init' ],
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
            if(task._id == this.validation._id) {
              this.validation = task;
            }
            if(task._id == this.copy._id) {
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
            console.log("starting upload", f);
            file.filename  = f.name;
            file.size = f.size;
            file.type = f.type;

            file.progress = {};

      //find resource to upload to
      this.$http.get(Vue.config.wf_api+'/resource/best/', {params: {
          service: "_upload",
      }})
      .then(res=>{
        var upload_resource = res.body.resource;
        var path = this.instance_id+'/upload/'+f.name;

                var xhr = new XMLHttpRequest();
                file.xhr = xhr; //so that I can abort it if user wants to
                xhr.open("POST", Vue.config.wf_api+"/resource/upload/"+upload_resource._id+"/"+btoa(path));
                xhr.setRequestHeader("Authorization", "Bearer "+Vue.config.jwt);
        xhr.upload.addEventListener("progress", (evt)=>{
          file.progress = {loaded: evt.loaded, total: evt.total};
          $("#file_"+file.id).progress({percent: evt.loaded*100/evt.total});
          console.dir(file.progress);
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
        //copy.push({src: "../upload/"+file.filename, dest: file.id+(file.ext||'')});
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

            /*
            var product = {
                files: {
                },
                validation: this.validation.products[0],
            }
            this.files.forEach(function(file) {
                //product.files[file.id] = {filename: file.id+(file.ext||''), size: file.size};
                product.files[file.id] = {filename: file.filename, size: file.size};
            });
            */

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
    components: { sidemenu },
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


