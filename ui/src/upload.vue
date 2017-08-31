<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/datasets"></sidemenu>
    <div class="page-content">
        <div class="margin20">
            <h2><icon name="upload" scale="2"></icon> Upload Dataset</h2>
        </div><!--margin20-->

        <el-card>
            <div slot="header">
                <el-steps :space="200" :active="get_active_tab()">
                    <el-step title="Metadata" icon="edit" description="Choose datatype and enter information"></el-step>
                    <el-step title="Upload" icon="upload" description="Upload all required files"></el-step>
                    <el-step title="Validate" icon="check" description="Validate your files"></el-step>
                </el-steps>
            </div>

            <el-form label-width="120px">
                <div v-if="mode == 'meta'">
                    <el-form-item label="Description">
                        <el-input type="textarea" v-model="desc" :rows="4" placeholder="Any description (optional)"></el-input>
                    </el-form-item>
                    <br>

                    <el-form-item label="Project">
                        <projectselecter v-model="project_id"/>
                    </el-form-item>

                    <el-form-item label="Data Type" v-if="datatypes">
                        <el-select v-model="datatype_id" placeholder="Please select" @change="change_datatype" style="width: 100%;">
                            <el-option v-for="(type,id) in datatypes_with_validator" key="id" :value="id" :label="type.desc"></el-option>
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
                        <el-button type="primary" @click="prep_upload()" :disabled="!is_valid('meta')">Next</el-button>
                    </el-form-item>
                </div><!--meta-->

                <div v-if="mode == 'upload' && tasks.upload && !tasks.upload.resource_id">
                    <mute>Waiting for resource where we can upload files becomes available..  <icon name="cog" spin/></mute>
                    <pre>{{tasks.upload}}</pre>
                </div>

                <div v-if="mode == 'upload' && tasks.upload && tasks.upload.resource_id">
                    <el-form-item v-if="datatype_id" v-for="file in files" :key="file.id" :label="file.id+(file.ext?'('+file.ext+')':'')">
                        <el-card v-if="datatype_id">
                            <div v-if="!file.uploaded && !file.progress">
                                <input type="file" @change="filechange(file, $event)" :accept="file.ext">
                            </div>

                            <div v-if="!file.uploaded && file.progress">
                                <el-button type="small" @click="cancelupload(file)" style="float: right; position: relative; top:-5px;" icon="close">Cancel</el-button>
                                Uploading {{file.local_filename}}
                                <el-progress :text-inside="true" :stroke-width="18" :percentage="Math.floor(file.progress.loaded*1000/file.progress.total)/10"></el-progress>
                            </div>

                            <div v-if="file.uploaded">
                                <b><icon name="check" style="color: green"/> {{file.local_filename}}</b>
                                <small>({{file.size|filesize}})</small>
                                <el-button type="small" @click="clearfile(file)" style="float: right;" icon="delete">Remove</el-button>
                            </div>
                        </el-card>
                        <br>
                    </el-form-item>
        
                    <el-form-item>
                        <el-button @click="mode = 'meta'">Back</el-button>
                        <el-button type="primary" @click="validate()" :disabled="!is_valid('upload')">Next</el-button>
                    </el-form-item>
                </div>

                <div v-if="mode == 'validate' && tasks.validation">
                    <el-form-item v-if="!tasks.validation.products">
                        <!--<pre v-if="config.debug" v-highlightjs="JSON.stringify(tasks.validation, null, 4)"><code class="json hljs"></code></pre>-->
                        <task :task="tasks.validation"/>
                        <br>
                    </el-form-item>

                    <div v-if="tasks.validation && tasks.validation.status == 'finished' && tasks.validation.products">
                        <el-form-item>
                            <p v-if="tasks.validation.status != 'finished'">{{tasks.validation.status_msg}}</p>
                            <b-alert variant="danger" v-for="(msg,idx) in tasks.validation.products[0].errors" :key="idx">{{msg}}</b-alert>
                            <b-alert variant="warning" v-for="(msg,idx) in tasks.validation.products[0].warnings" :key="idx">{{msg}}</b-alert>
                            <b-alert variant="success" v-if="tasks.validation.products[0].errors.length == 0">Your data looks good! Please check information below and click Archive button.</b-alert>
                        </el-form-item>
            
                        <!--show info-->
                        <el-form-item v-for="(v, k) in tasks.validation.products[0]" :key="k" v-if="k != 'errors' && k != 'warnings'" :label="k">
                            <pre v-highlightjs="v" v-if="typeof v == 'string'"><code class="text hljs"></code></pre>
                            <div v-else>
                                <pre>{{v}}</pre>
                            </div>
                        </el-form-item>
                    </div>

                    <el-form-item>
                        <el-button @click="mode = 'upload'">Back</el-button>
                        <el-button type="primary" @click="finalize()">Archive !</el-button>
                    </el-form-item>
                </div>
            </el-form>
        </el-card>

        <br>
        <el-card v-if="config.debug">
            <div slot="header">debug</div>
            <h3>Name/Desc</h3>
            {{desc}}

            <h3>Datatype ID</h3>
            {{datatype_id}}

            <h3>Project ID</h3>
            {{project_id}}

            <h3>Meta</h3>
            <pre v-if="meta" v-highlightjs="JSON.stringify(meta, null, 4)"><code class="json hljs"></code></pre>

            <h3>upload</h3>
            <pre v-if="meta" v-highlightjs="JSON.stringify(tasks.upload, null, 4)"><code class="json hljs"></code></pre>
            <h3>Validation</h3>
            <pre v-if="meta" v-highlightjs="JSON.stringify(tasks.validation, null, 4)"><code class="json hljs"></code></pre>
        </el-card>
    </div><!--page-content -->
</div>
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import ReconnectingWebSocket from 'reconnectingwebsocket'
import projectaccess from '@/components/projectaccess'
import projectselecter from '@/components/projectselecter'
import task from '@/components/task'

export default {
    components: { sidemenu, pageheader, projectselecter, task},
    data () {
        return {

            //user selections
            desc: "",
            instance_id: null,
            project_id: null,
            datatype_id: "",
            meta: {},

            tasks: {
                upload: null, //task where I can upload to
                validation: null, //task entry for validation
            },

            mode: "meta",
            validator_resource: null,
            
            //cache
            datatypes: null, //registered datatypes (keyed by datatype_id)

            config: Vue.config,
        }
    },

    mounted() {
        console.log("uploader mounted - creating instance");
        this.$http.post(Vue.config.wf_api+'/instance', {
            name: "_upload",
        }).then(res=>{
            this.instance_id = res.body._id;
            //load all datatypes
            return this.$http.get('datatype');
        }).then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach((type)=>{
                this.datatypes[type._id] = type;
            });

            //lastly, subscribe to the whole instance task events
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
                if(event.error) {
                    console.error(event.error);
                    return;
                }
                var task = event.msg;
                if(!task) return;
                //if(!task._id) return; //what kind of task is this?
                if(this.tasks.upload && task._id == this.tasks.upload._id) {
                    this.tasks.upload = task;
                }
                if(this.tasks.validation && task._id == this.tasks.validation._id) {
                    this.tasks.validation = task;
                }
            }
        }).catch(err=>{
            console.error(err);
        });
    },

    computed: {
        files: function() {
            return this.datatypes[this.datatype_id].files;
        },
        datatypes_with_validator: function() {
            var types = {};
            for(var id in this.datatypes) { 
                var type = this.datatypes[id];
                if(type.validator) types[id] = type;
            }
            return types;
        },
    },

    methods: {
        get_active_tab: function() {
            switch(this.mode) {
                case "meta": return 1;
                case "upload": return 2;
                case "validate": return 3;
            }
        },

        back: function() {
            console.log("requesting router back");
            this.$router.push('/datasets');
        },

        go: function(path) {
            this.$router.push(path);
        },

        filechange: function(file, e) {
            var files = e.target.files || e.dataTransfer.files;
            if(!files.length) return;
            this.upload(file, files[0]); //only upload first one
        },

        prep_upload() {
            //find resource that I can run validator
            this.$http.get(Vue.config.wf_api+'/resource/best/', {params: {
                service: this.get_validator(),
            }}).then(res=>{
                if(!res.body.resource) { 
                    //TODO - not tested
                    this.$notify({ type: 'error', title: 'Server Busy', text: 'Validator service is busy. Please try again later' });
                    return;
                }
                this.validator_resource = res.body.resource;

                //submit noop to upload files on the resource where validator can run
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: this.instance_id,
                    name: "upload",
                    service: "soichih/sca-service-noop",
                    preferred_resource_id: this.validator_resource, 
                });
            }).then(res=>{
                console.log("upload task submitted");
                this.tasks.upload = res.body.task;
                this.mode = "upload"; 
            }).catch(err=>{
                console.error(err);
            });
        },

        //check if we can proceed out of the page we are in
        is_valid: function(form) {
            let valid = true;
            switch(form) {
            case "meta":
                if(!this.project_id) return false;
                if(!this.datatype_id) return false;
                this.datatypes[this.datatype_id].meta.forEach(meta=>{
                    if(!this.meta[meta.id]) valid = false;
                });
                break;
            case "upload":
                this.files.forEach(file=>{
                    //console.log(file);
                    if(!file.uploaded) valid = false;
                });
                break;
            default:
                console.error('unknown form');
                return false;
            }
            return valid;
        },
        
        upload: function(file, f) {
            if(!this.tasks.upload.resource_id) return;

            file.local_filename  = f.name;
            file.size = f.size;
            file.type = f.type;
            file.progress = {};

            var path = this.instance_id+'/'+this.tasks.upload._id+'/'+file.filename;
            var xhr = new XMLHttpRequest();
            file.xhr = xhr; //so that I can abort it if user wants to
            xhr.open("POST", Vue.config.wf_api+"/resource/upload/"+this.tasks.upload.resource_id+"/"+btoa(path));
            xhr.setRequestHeader("Authorization", "Bearer "+Vue.config.jwt);
            xhr.upload.addEventListener("progress", (evt)=>{
                file.progress = {loaded: evt.loaded, total: evt.total};
                this.$forceUpdate();
            }, false);
            xhr.addEventListener("load", (evt)=>{
                if(evt.target.status == "200") {
                    file.uploaded = true;
                    this.$forceUpdate();
                    console.log("file uploade complete", file);
                } else {
                    var msg = JSON.parse(evt.target.response);
                }
            }, false);
            xhr.addEventListener("error", (evt)=>{
                console.error(evt);
            });
            xhr.send(f);
        },

        get_validator() {
            return this.datatypes[this.datatype_id].validator;
        },

        validate() {
            this.mode = "validate";
            this.tasks.validation = null;

            //create validator config
            var config = {};
            var datatype = this.datatypes[this.datatype_id];
            datatype.files.forEach(file=>{
                config[file.id] = "../"+this.tasks.upload._id+"/"+file.filename;
            });
            //and submit
            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: this.instance_id,
                name: "validation",
                service: this.get_validator(),
                config: config,
                //preferred_resource_id: this.validator_resource, 
                deps: [ this.tasks.upload._id ], 
            }).then(res=>{
                console.log("submitted validation task");
                this.tasks.validation = res.body.task;
            }, res=>{
                console.error(res);
            });
        },

        finalize() {
            this.mode = "finalize";
            this.$http.post('dataset', {

                project: this.project_id,
                task_id: this.tasks.upload._id, 

                //app_id
                //output_id

                datatype: this.datatype_id,
                datatype_tags: [],
                //file - I shouldn't have to map it - uploader should upload files to the correct file name

                meta: this.meta,
                desc: this.desc,
                tags: [], 

            }).then(res=>{
                console.log("submitted dataset request");
                var dataset = res.body;
                this.$notify({ type: 'success', text: 'Successfully uploaded a new dataset. Please give a few minutes for your data to become available.', });
                this.$router.push("/dataset/"+dataset._id);
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
        },

        change_datatype() {
            //need to reset all meta properties to be reactive
            this.meta = {};
            this.datatypes[this.datatype_id].meta.forEach(meta=>{
                //console.log("setting meta", meta.id);
                Vue.set(this.meta, meta.id, "");
            });
        },


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
pre {
line-height: 130%;
}
</style>


