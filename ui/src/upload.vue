<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/datasets"></sidemenu>
    <div class="page-content">
        <div class="margin20">
            <!--
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/datasets' }">Datasets</el-breadcrumb-item>
                <el-breadcrumb-item>Upload</el-breadcrumb-item>
            </el-breadcrumb>
            <br>
            -->
            <h1><icon name="upload" scale="2"></icon> Upload Dataset</h1>
        </div><!--margin20-->

        <el-card>
            <div slot="header">
                <el-steps :space="200" :active="get_active_tab()">
                    <el-step title="Metadata" icon="edit" description="Choose datatype and enter information"></el-step>
                    <el-step title="Upload" icon="upload" description="Upload all required files"></el-step>
                    <el-step title="Validate" icon="picture" description="Validate your files"></el-step>
                    <el-step title="Archive" icon="picture" description="Finalize and archive your data to Brain Life warehouse"></el-step>
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

                    <el-form-item label="Project">
                        <projectselector v-model="project_id"/>
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
                        <el-button type="primary" @click="next()" :disabled="!is_valid('meta')">Next</el-button>
                    </el-form-item>
                </div><!--meta-->

                <div v-if="mode == 'upload'">
                    <el-form-item  v-if="datatype_id" v-for="file in files" :key="file.id" :label="file.id">
                        <el-card v-if="datatype_id" style="margin-left: 10px;">
                            <!--<div slot="header"><small class="text-muted">{{file.ext}}</small></div>-->

                            <div v-if="!file.uploaded && !file.progress">
                                <input type="file" @change="filechange(file, $event)">
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
                    </el-form-item>
        
                    <el-form-item>
                        <el-button @click="mode = 'meta'">Back</el-button>
                        <el-button type="primary" @click="validate()" :disabled="!is_valid('upload')">Next</el-button>
                    </el-form-item>
                </div>

                <div v-if="mode == 'validate'">
                    <el-form-item v-if="!validation.products">
                        <h4><icon name="cog" spin/> Validating..</h4>
                        <pre v-if="config.debug" v-highlightjs="JSON.stringify(validation, null, 4)"><code class="json hljs"></code></pre>
                    </el-form-item>

                    <div v-if="validation && validation.status == 'finished' && validation.products">
                        <el-form-item>
                            <p v-if="validation.status != 'finished'">{{validation.status_msg}}</p>
                            <el-alert :title="msg" type="error" show-icon v-for="(msg,idx) in validation.products[0].errors" :key="idx"></el-alert>
                            <el-alert :title="msg" type="warning" show-icon  v-for="(msg,idx) in validation.products[0].warnings" :key="idx"></el-alert>
                            <el-alert title="Your data looks good! Please check information below and click Archive button." show-icon type="success" v-if="validation.products[0].errors.length == 0"></el-alert>
                        </el-form-item>
            
                        <!--show info-->
                        <el-form-item v-for="(v, k) in validation.products[0]" :key="k" v-if="k != 'errors' && k != 'warnings'" :label="k">
                            <pre v-highlightjs="v"><code class="text hljs"></code></pre>
                        </el-form-item>
                    </div>

                    <el-form-item>
                        <el-button @click="mode = 'upload'">Back</el-button>
                        <el-button type="primary" @click="finalize()">Archive !</el-button>
                    </el-form-item>
                </div>

                <div v-if="mode == 'finalize'">
                    <el-form-item v-if="!dataset && copy">
                        <b><icon name="cog" spin/></b> Organizing your input files..
                    </el-form-item>
                </div>
            </el-form>
        </el-card>

        <br>
        <el-card v-if="config.debug">
            <div slot="header">debug</div>
            <h3>Name/Desc</h3>
            {{name}}
            {{desc}}

            <h3>Datatype ID</h3>
            {{datatype_id}}

            <h3>Project ID</h3>
            {{project_id}}

            <h3>Meta</h3>
            <pre v-if="meta" v-highlightjs="JSON.stringify(meta, null, 4)"><code class="json hljs"></code></pre>

            <h3>Validation</h3>
            <pre v-if="meta" v-highlightjs="JSON.stringify(validation, null, 4)"><code class="json hljs"></code></pre>
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
import projectselector from '@/components/projectselector'

export default {
    components: { sidemenu, pageheader, projectselector},
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
            //projects: null,

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
                    //for backward compatibility 
                    if(this.validation.products && this.validation.products[0].results) {
                        //unwrap old structure to new
                        this.validation.products[0] = this.validation.products[0].results;
                    }
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
                case "finalize": return 4;
            }
        },

        back: function() {
            console.log("requesting router back");
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
                        //console.error(msg);
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

            //create validator config
            var config = {};
            var datatype = this.datatypes[this.datatype_id];
            datatype.files.forEach(function(file) {
                config[file.id] = "../upload/"+file.filename;
            });
            //and submit
            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: this.instance_id,
                name: "validation",
                service: datatype.validator || "soichih/sca-service-conneval-validate", //TODO - deprecate sca-service-conneval-validate eventually
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
                deps: [], //I can't set deps for upload task.. because it doesn't have real task id
            }).then(res=>{
                console.log("submitted copy task", res);
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

                prov: {}, //TODO?

                tags: [], 

                //datasource
                instance_id: this.instance_id,
                task_id: this.copy._id, //we archive data from copy task

            }).then(res=>{
                console.log("submitted dataset request");
                this.dataset = res.body; //without this, same dataset maybe archived over and over...
                this.$notify.success({
                    title: 'Success',
                    message: 'Successfully archived a new dataset. Please give a few minutes for your data to propagate to all storages.',
                });
                this.go('/dataset/'+res.body._id);
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

        change_datatype: function() {
            //need to reset all meta properties to be reactive
            this.meta = {};
            this.datatypes[this.datatype_id].meta.forEach(meta=>{
                //console.log("setting meta", meta.id);
                Vue.set(this.meta, meta.id, "");
            });
        },

        //check if we can proceed out of the page we are in
        is_valid: function(form) {
            let valid = true;
            switch(form) {
            case "meta":
                if(!this.name) return false;
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


