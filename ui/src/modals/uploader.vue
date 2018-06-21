<template>
<b-modal :no-close-on-backdrop='true' title="Upload Dataset" ref="modal" id="uploader" size="lg">
    <div v-if="mode == 'upload'">
        <b-form-group horizontal label="Data Type" v-if="datatypes">
            <el-select v-model="datatype_id" placeholder="Please select" @change="change_datatype" style="width: 100%;">
                <el-option v-for="(type,id) in datatypes_with_validator" :key="id" :value="id" :label="type.desc"></el-option>
            </el-select>
        </b-form-group>

        <div v-if="datatype_id">
            <div v-if="tasks.upload && !tasks.upload.resource_id">
                <b-form-group horizontal>
                    <p cass="text-muted">Preparing for file upload...  <icon name="cog" spin/></p>
                    <pre v-if="config.debug">{{tasks.upload}}</pre>
                </b-form-group>
            </div>
            
            <div v-if="tasks.upload && tasks.upload.resource_id">
                <b-form-group horizontal v-if="datatype_id" v-for="file in files" :key="file.id" :label="file.id+(file.ext?'('+file.ext+')':'')+(file.required?' *':'')">
                    <div v-if="!file.uploaded && !file.progress">
                        <input type="file" @change="filechange(file, $event)" :accept="file.ext">
                    </div>

                    <div v-if="!file.uploaded && file.progress">
                        <div class="button" @click="cancelupload(file)" style="float: right; position: relative; top:-5px;"><icon name="times"/></div>
                        Uploading {{file.local_filename}}
                        <b-progress :value="Math.floor(file.progress.loaded*1000/file.progress.total)/10" show-value/>
                    </div>

                    <div v-if="file.uploaded">
                        <b><icon name="check" style="color: green"/> {{file.local_filename}}</b>
                        <small>({{file.size|filesize}})</small>
                        <div class="button" @click="clearfile(file)" style="float: right;"><icon name="trash"/></div>
                    </div>
                </b-form-group>
            </div>

            <b-form-group horizontal :label="m.id.toUpperCase()+(m.required?' *':'')" v-for="m in datatypes[datatype_id].meta" :key="m.id">
                <b-input type="text" v-model="meta[m.id]" :required="m.required" :placeholder="m.required?'':'(optional)'"/>
            </b-form-group>

            <b-form-group horizontal label="Description">
                <b-form-textarea v-model="desc" :rows="4" placeholder="(optional)"></b-form-textarea>
             </b-form-group>

        </div><!--datatype_id set -->
        <small>To bulk upload your datasets, you can use <a href="https://github.com/brain-life/cli" target="_blank">Brainlife CLI</a></small>
    </div><!--meta-->

    <div v-if="mode == 'validate' && tasks.validation">
        <task :task="tasks.validation" v-if="!tasks.validation.product"/>
        <div v-else>
            <b-form-group>
                <!--
                <b-alert show variant="danger" v-for="(msg, $idx) in tasks.validation.product.errors" :key="$idx">{{msg}}</b-alert>
                <b-alert show variant="warning" v-for="(msg, $idx) in tasks.validation.product.warnings" :key="$idx">{{msg}}</b-alert>
                -->
                <b-alert show variant="success" v-if="tasks.validation.product.errors.length == 0 && tasks.validation.product.warnings.length == 0">
                    Your data looks good! Please check information below and click Archive button.
                </b-alert>
            </b-form-group>
            <product :product="tasks.validation.product"/>

            <!--show info-->
            <b-form-group horizontal v-for="(v, k) in tasks.validation.product" :key="k" 
                v-if="k != 'errors' && k != 'warnings' && k != 'datatype_tags' && k != 'tags' && k != 'brainlife'" :label="k">
                <pre v-highlightjs="v" v-if="typeof v == 'string'" style="max-height: 200px; overflow: auto;"><code class="text hljs"></code></pre>
                <div v-else>
                    <pre>{{v}}</pre>
                </div>
            </b-form-group>

            <b-form-group horizontal label="Dataset Tags">
                <tageditor v-model="tags"/>
                <small>Dataset tags is used to help organize datasets and make searching easier. It can be edited by users anytime.</small>
            </b-form-group>
            <b-form-group horizontal label="Datatype Tags">
                <tageditor v-model="datatype_tags"/> 
                <small>Datatype tags add context to the datatype. It can not be changed once archived.</small>
            </b-form-group>
        </div>
    </div>

    <div slot="modal-footer">
        <b-form-group v-if="mode == 'upload'">
            <b-button @click="cancel">Cancel</b-button>
            <b-button variant="primary" @click="validate()" :disabled="!is_valid()">Next</b-button>
        </b-form-group>
        <b-form-group v-if="mode == 'validate'">
            <b-button @click="mode = 'upload'">Back</b-button>
            <b-button variant="primary" @click="finalize()" :disabled="!(tasks.validation && tasks.validation.product && tasks.validation.product.errors.length == 0)">Archive</b-button>
        </b-form-group>
    </div>
</b-modal>
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import ReconnectingWebSocket from 'reconnectingwebsocket'
import projectaccess from '@/components/projectaccess'
import projectselecter from '@/components/projectselecter'
import task from '@/components/task'
import tageditor from '@/components/tageditor'
import product from '@/components/product'

//singleton instance to handle upload request
export default {
    components: { 
        sidemenu, pageheader, projectselecter, 
        task, tageditor, product },
    data () {
        return {
            instance: null, //instance to upload things to

            project: null, //set by uploader.options event

            //user selections
            desc: "",
            datatype_id: "",
            tags: [],
            datatype_tags: [],
            meta: {},

            tasks: {
                upload: null, //task where I can upload to
                validation: null, //task entry for validation
            },

            mode: null,
            validator_resource: null,
            
            datatypes: null, //registered datatypes (keyed by datatype_id)

            config: Vue.config,
        }
    },

    mounted() {
        //load all datatypes
        this.$http.get('datatype').then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach((type)=>{
                this.datatypes[type._id] = type;
            });
            
            //override meta 
            for(let id in this.datatypes) {
                this.datatypes[id].meta = [
                    {id: "subject", type: "string", required: true},
                    {id: "session", type: "string", required: false},
                ];
            }
        });

        this.$root.$on("uploader.option", (opt)=>{
            this.reset();
            this.project = opt.project;
            if(!this.instance) this.create_instance();
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
        reset: function() {
            this.mode = "upload";
            this.project = null;
            this.meta = {};
            if(this.datatype_id) this.datatypes[this.datatype_id].files.forEach(this.clearfile);
            this.datatype_id = null;
            this.desc = "";
        },

        filechange: function(file, e) {
            var files = e.target.files || e.dataTransfer.files;
            if(!files.length) return;
            this.upload(file, files[0]); //only upload first one
        },

        create_instance: function() {
            this.$http.post(Vue.config.wf_api+'/instance', {
                name: "_upload",
            }).then(res=>{
                this.instance = res.body;

                //lastly, subscribe to the whole instance task events
                var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
                var ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
                ws.onopen = (e)=>{
                    console.log("websocket opened binding to wf.task", this.instance._id+".#");
                    ws.send(JSON.stringify({
                      bind: {
                        ex: "wf.task",
                        key: this.instance._id+".#",
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
                    if(this.tasks.upload && task._id == this.tasks.upload._id) {
                        this.tasks.upload = task;
                    }
                    if(this.tasks.validation && task._id == this.tasks.validation._id) {
                        this.tasks.validation = task;
                        if(task.status == "finished") {
                            console.log("validation finished!", task)
                            if(task.product.tags) this.tags = task.product.tags;
                            if(task.product.datatype_tags) this.datatype_tags = task.product.datatype_tags; 
                        }
                    }
                }
            }).catch(err=>{
                console.error(err);
            });
        },

        prep_upload() {
            //find resource that I can run validator
            this.$http.get(Vue.config.wf_api+'/resource/best/', {params: {
                service: this.get_validator(),
            }}).then(res=>{
                if(!res.body.resource) { 
                    this.$notify({ type: 'error', title: 'Server Busy', text: 'Validator service is busy. Please try again later' });
                    this.cancel();
                }
                this.validator_resource = res.body.resource;

                //submit noop to upload files on the resource where validator can run
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: this.instance._id,
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

        is_valid: function() {
            let valid = true;
            if(!this.project) return false;
            if(!this.datatype_id) return false;
            this.datatypes[this.datatype_id].meta.forEach(meta=>{
                if(!meta.required) return;
                if(!this.meta[meta.id]) valid = false;
            });
            this.files.forEach(file=>{
                //console.log(file);
                if(file.required && !file.uploaded) valid = false;
            });
            return valid;
        },
        
        upload: function(file, f) {
            if(!this.tasks.upload.resource_id) return;

            file.local_filename  = f.name;
            file.size = f.size;
            file.type = f.type;
            file.progress = {};

            //var path = this.instance._id+'/'+this.tasks.upload._id+'/'+file.filename;
            var xhr = new XMLHttpRequest();
            file.xhr = xhr; //so that I can abort it if user wants to
            xhr.open("POST", Vue.config.wf_api+"/task/upload/"+this.tasks.upload._id+"?p="+encodeURIComponent(file.filename));
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

        cancel() {
            this.$refs.modal.hide();
        },

        validate() {
            this.mode = "validate";
            this.tasks.validation = null;

            //create validator config
            var config = {};
            var datatype = this.datatypes[this.datatype_id];
            datatype.files.forEach(file=>{
                if(!file.local_filename) return; //not set.. optional?
                config[file.id] = "../"+this.tasks.upload._id+"/"+file.filename;
            });
            //and submit

            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: this.instance._id,
                name: "validation",
                service: this.get_validator(),
                config,
                deps: [ this.tasks.upload._id ], 
            }).then(res=>{
                console.log("submitted validation task");
                this.tasks.validation = res.body.task;
            }, res=>{
                console.error(res);
            });
        },

        finalize() {
            this.$refs.modal.hide();

            //remove null meta
            for(let id in this.meta) {
                if(this.meta[id] === "") delete this.meta[id];
            }

            this.$http.post('dataset', {
                project: this.project._id,
                task_id: this.tasks.validation._id, 
                output_id: "output", //validation service isn't realy BL app, so I just have to come up with something

                datatype: this.datatype_id,
                //datatype_tags: validation_product.datatype_tags, 
                datatype_tags: this.datatype_tags,

                meta: this.meta,
                desc: this.desc,
                //tags: validation_product.tags, 
                tags: this.tags,
            }).then(res=>{
                console.log("submitted dataset request");
                var dataset = res.body;
                this.$notify({ type: 'success', text: 'Successfully uploaded a new dataset. Please give a few minutes for your data to become available.', });
                this.$router.push("/project/"+this.project._id+"/dataset/"+dataset._id);

                //TODO need to reload so that new subject group will show up on dataset paage..
                //it will be nice if I can just force dataset reload (just use event?)
                document.location.reload(); 

                this.reset();
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
            this.clearfile(file);
        },

        change_datatype() {
            //need to reset all meta properties to be reactive
            this.meta = {};
            this.datatypes[this.datatype_id].meta.forEach(meta=>{
                Vue.set(this.meta, meta.id, "");
            });
            this.prep_upload();
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


