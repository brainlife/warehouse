<template>
<b-modal :no-close-on-backdrop='true' title="Upload Data" ref="modal" id="uploader" size="lg">
    <div v-if="mode == 'upload'">
        <b-form-group horizontal label="Data Type" v-if="datatypes">
            <v-select v-model="datatype" placeholder="Search Datatype" label="name" :options="Object.values(datatypes)" :selectable="option => option.validator">
                <template v-slot:option="option">
                    <datatypetag :datatype="option" :clickable="false"/><br>
                    <small style="white-space: normal;">{{option.desc}}</small>
                </template>
            </v-select>
        </b-form-group>

        <div v-if="datatype">
           
            <div v-if="tasks.upload && tasks.upload.resource_id && tasks.upload.status == 'finished'">
                <b-form-group horizontal v-if="datatype" v-for="file in files" :key="file.id" :label="file.id+(file.ext?' ('+file.ext+')':'')+(file.required?' *':'')" :description="file.desc">
                    <div v-if="!file.uploaded && !file.progress">
                        <input type="file" @change="filechange(file, $event)" :accept="file.ext">
                        <editor v-if="file.meta && sidecar" v-model="sidecar" @init="editorInit" lang="json" height="150" style="margin-top: 10px;"/>
                    </div>

                    <div v-if="!file.uploaded && file.progress">
                        <div class="button" @click="cancelupload(file)" style="float: right; position: relative; top:-5px;"><icon name="times"/></div>
                        <p v-if="file.progress.loaded < file.progress.total">
                            Uploading {{file.local_filename}}  <icon name="cog" spin/>
                            <b-progress :value="Math.floor(file.progress.loaded*1000/file.progress.total)/10" show-value/>
                        </p>
                        <p v-else>Clearing buffer... <icon name="cog" spin/></p>
                    </div>

                    <div v-if="file.uploaded">
                        <b><icon name="check" style="color: green"/> {{file.local_filename}}</b>
                        <small>({{file.size|filesize}})</small>
                        <div class="button" @click="clearfile(file)" style="float: right;"><icon name="trash"/></div>
                    </div>
    
                </b-form-group>
            </div>
            <div v-else>
                <b-form-group horizontal>
                    <p cass="text-muted">Preparing for file upload...  <icon name="cog" spin/></p>
                    <!--<pre v-if="config.debug">{{tasks.upload}}</pre>-->
                </b-form-group>
            </div>
 
            <b-form-group horizontal label="Subject *">
                <b-input type="text" v-model="meta['subject']" required/>
            </b-form-group>

            <b-form-group horizontal label="Session">
                <b-input type="text" v-model="meta['session']"/>
            </b-form-group>

            <b-form-group horizontal label="Description">
                <b-form-textarea v-model="desc" :rows="4" placeholder="(optional)"></b-form-textarea>
            </b-form-group>

            <b-form-group horizontal label="Data-Object Tags" v-if="available_tags">
                <tageditor v-model="tags" :options="available_tags" placeholder="(optional)"/>
                <small>Data-object tags is used to help organize data-objects and make searching easier. It can be edited by users anytime.</small>
            </b-form-group>

            <div style="background-color: #eee; margin: 5px -15px; padding: 10px 15px">
                <b-form-group horizontal label="Datatype Tags" v-if="available_dt_tags">
                    <tageditor v-model="datatype_tags" :options="available_dt_tags" placeholder="(optional)"/>
                    <small>Datatype tags add context to the datatype. Datatype Tags must be specific for each datatype. 
                        Please consult the datatype detail page before setting any datatype tags.</small>
                </b-form-group>
            </div>

        </div><!--datatype_id set -->
        <small>To bulk upload your data-objects, you can use <a href="https://github.com/brain-life/cli" target="_blank">Brainlife CLI</a></small>
    </div><!--meta-->

    <div v-if="mode == 'validate' && tasks.validation">

        <h5 v-if="tasks.validation.status == 'finished' 
            && tasks.validation.product 
            && tasks.validation.product.errors.length == 0">Registering Data...  <icon name="cog" spin/></h5>
        <task :task="tasks.validation" v-if="tasks.validation.status != 'finished'"/>

        <!-- 
            TODO - We can only abort archive if validation finishes and it has an error 
            We might want to give user option to proceed with warning?
        -->
        <div v-if="tasks.validation.status == 'finished' && tasks.validation.product && tasks.validation.product.errors.length > 0">
            <h5>Errors</h5>
            <b-alert show variant="danger" v-for="(error, idx) in tasks.validation.product.errors" :key="idx">
                {{error}}
            </b-alert>

            <!--show info-->
            <b-form-group horizontal v-for="(v, k) in tasks.validation.product" :key="k" 
                v-if="k != 'errors' && k != 'warnings' && k != 'datatype_tags' && k != 'tags' && k != 'brainlife'" :label="k">
                <pre style="max-height: 200px; overflow: auto;">{{v}}</pre>
            </b-form-group>
        </div>
    </div>

    <div slot="modal-footer">
        <b-form-group v-if="mode == 'upload'">
            <b-button @click="cancel">Cancel</b-button>
            <b-button variant="primary" @click="validate()" :disabled="!isValid()">Next</b-button>
        </b-form-group>
        <b-form-group v-if="mode == 'validate'">
            <b-button @click="mode = 'upload'">Back</b-button>
        </b-form-group>
    </div>
</b-modal>
</template>

<script>
import Vue from 'vue'

import pageheader from '@/components/pageheader'
import ReconnectingWebSocket from 'reconnectingwebsocket'
import projectaccess from '@/components/projectaccess'
import task from '@/components/task'
import tageditor from '@/components/tageditor'
import product from '@/components/product'
import datatypetag from '@/components/datatypetag'
//import datatypecache from '@/mixins/datatypecache'

//singleton instance to handle upload request
export default {
    //mixins: [ datatypecache ],
    components: { 
        pageheader, 
        task, 
        tageditor, 
        product,
        datatypetag,
        editor: require('vue2-ace-editor'),
    },
    data () {
        return {
            instance: null, //instance to upload things to
            ws: null, //websocket to receive all event for this instance

            project: null, //set by uploader.options event

            //user selections
            desc: "",
            datatype: null,
            tags: [],
            datatype_tags: [],
            meta: {
                subject: "",
                session: "",
            },
            sidecar: "",

            tasks: {
                upload: null, //task where I can upload to
                validation: null, //task entry for validation
            },

            mode: 'upload',
            validator_resource: null,
            
            datatypes: null, //registered datatypes (keyed by datatype_id)

            available_tags: null,
            available_dt_tags: null,

            config: Vue.config,
        }
    },

    mounted() {
        this.$http.get('datatype', {params: {
            sort: 'name', 

            //load all datatype that has validator assigned
            //find: JSON.stringify({validator: {$exists: true}}),

            //let's specify which datatype to allow upload (until we can handle directory upload
            //we also need to make sure to register those datatypes in brainlife.io resource
            find: JSON.stringify({_id: {$in: [
                "58c33bcee13a50849b25879a", //t1
                "594c0325fa1d2e5a1f0beda5", //t2
                "5d9cf81c0eed545f51bf75df", //flair
                "58c33c5fe13a50849b25879b", //dwi
                "59b685a08e5d38b0b331ddc5", //task
            ]}}),
        }}).then(res=>{
            this.datatypes = {};
            res.data.datatypes.forEach((type)=>{
                this.datatypes[type._id] = type;
            });
        });

        this.$root.$on("uploader.option", (opt)=>{
            this.reset();
            this.project = opt.project;
            this.findOrCreateInstance();
        });
    },

    watch: {
        datatype() {
            console.log("datatype changed")
            this.change_datatype();
        }
    },

    computed: {
        files() {

            //all datatype can add metadata via sidecar.json
            let sidecar = {
                id: "sidecar",
                ext: "json",
                filename: "sidecar.json",
                desc: "Optional metadata .json",
                required: false,
                meta: true,
            };

            if(!this.datatype) return null;
            return [...this.datatype.files, sidecar];
        },
    },

    methods: {
        reset() {
            this.mode = 'upload';
            this.project = null;
            this.meta = {};
            if(this.datatype) this.datatype.files.forEach(this.clearfile);
            this.datatype = null;
            this.desc = "";
            this.sidecar = "";
            this.tasks.upload = null;
            this.tasks.validation = null;
        },

        filechange(file, e) {
            var files = e.target.files || e.dataTransfer.files;
            if(!files.length) return;

            if(file.meta) {
                //sidecar file doesn't get uploaded - it's passed as meta config
                const reader = new FileReader()
                reader.onerror = err=>{
                    this.$notify({ type: 'error', text: 'Invalid file' });
                }
                reader.readAsText(files[0]) 
                reader.onload = event => {
                    try {
                        this.sidecar = null;
                        let meta = JSON.parse(event.target.result);
                        this.sidecar = JSON.stringify(meta, null, 4);
                    } catch (err) {
                        this.$notify({ type: 'error', text: 'Invalid json file' });
                        e.target.value = null;
                    }
                }
            } else {
                //normal file
                this.upload(file, files[0]); //only upload first one
            }
        },

        findOrCreateInstance() {
            let name = "upload."+this.project.group_id;
            this.$http.get(Vue.config.wf_api+'/instance?find='+JSON.stringify({ name })).then(res=>{
                if(res.data.instances.length > 0) { 
                    console.log("reusing instance");
                    console.dir(res.data);
                    this.instance = res.data.instances[0];
                    this.subscribeInstance();
                    return;
                }

                console.log("creating new instance");
                this.$http.post(Vue.config.wf_api+'/instance', {
                    name,
                    group_id: this.project.group_id,
                }).then(res=>{
                    console.dir(res.data);
                    this.instance = res.data;
                    this.subscribeInstance();
                }).catch(err=>{
                    console.error(err);
                });
            });
        },

        subscribeInstance() {
            //lastly, subscribe to the whole instance task events
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                console.log("websocket opened binding to wf.task", this.instance._id+".#");
                this.ws.send(JSON.stringify({
                  bind: {
                    ex: "wf.task",
                    key: this.instance._id+".#",
                  }
                }));
            }
            this.ws.onmessage = (json)=>{
                var event = JSON.parse(json.data);
                if(event.error) {
                    console.error(event.error);
                    return;
                }
                var task = event.msg;
                if(!task) return;
                if(this.tasks.upload && task._id == this.tasks.upload._id) {
                    this.tasks.upload = task;
                    if(task.status == "finished") {
                        console.log("upload noop finished", this.mode);
                    }
                }
                if(this.tasks.validation && task._id == this.tasks.validation._id) {
                    this.tasks.validation = task;

                    //load product.json
                    if(task.status == "finished") { 
                        this.$http.get(Vue.config.amaretti_api+'/task/product', {params: {ids: [task._id]}}).then(res=>{
                            Vue.set(this.tasks.validation, 'product', res.data[0].product);
                        });
                    }
                }

                if(this.tasks.validation && task.service == "brainlife/app-archive") {
                    let archive = task.deps_config.find(t=>t.task == this.tasks.validation._id);
                    if(archive) {
                        this.$refs.modal.hide();
                        this.$router.push("/project/"+this.project._id+"/dataset/"+task.config.datasets[0].dataset._id);

                        //TODO need to reload so that new subject group will show up on dataset paage..
                        //it will be nice if I can just force dataset reload (just use event?)
                        document.location.reload(); 

                        this.reset();
                    }
                }
            }
        },

        prep_upload() {
            //find resource that I can run validator
            this.$http.get(Vue.config.wf_api+'/resource/best/', {params: {
                service: this.datatype.validator,
            }}).then(res=>{
                if(!res.data.resource) { 
                    this.$notify({ type: 'error', title: 'Server Busy', text: 'Validator service is busy. Please try again later' });
                    this.cancel();
                }
                this.validator_resource = res.data.resource;

                //submit noop to upload files on the resource where validator can run
                return this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: this.instance._id,
                    name: "upload",
                    service: "brainlife/app-noop", //TODO - I should rename to app-upload?
                    preferred_resource_id: this.validator_resource, 
                });
            }).then(res=>{
                console.log("upload task submitted - waiting for it to finish before proceeding with upload");
                this.tasks.upload = res.data.task;
                this.mode = "upload"; 
            }).catch(err=>{
                console.error(err);
            });
        },

        isValid() {
            let valid = true;
            if(!this.project) return false;
            if(!this.datatype) return false;
            if(!this.meta["subject"]) return false;
            this.files.forEach(file=>{
                if(file.required && !file.uploaded) valid = false;
            });

            if(this.sidecar) {
                try {
                    let _sidecar = JSON.parse(this.sidecar);
                } catch (err) {
                    valid = false;
                }
            }

            return valid;
        },
 
        upload(file, f) {
            if(!this.tasks.upload.resource_id) return;

            file.local_filename  = f.name;
            file.size = f.size;
            file.type = f.type;
            file.progress = {};


            //axios has onUploadProgress cb.. I think I can switch to $http (see easybids)
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

        cancel() {
            this.$refs.modal.hide();
        },

        validate() {
            this.mode = "validate";
            this.tasks.validation = null;

            //apply sidecar to meta
            if(this.sidecar) {
                let _sidecar = JSON.parse(this.sidecar);
                Object.assign(this.meta, _sidecar);
            }

            //remove null meta
            let clean_meta = {};
            for(let id in this.meta) {
                if(this.meta[id] !== "") clean_meta[id] = this.meta[id];
            }

            //create validator config
            var config = {
                //_app: (no app id for validator)
                _outputs: [{
                    id: "output",
                    datatype: this.datatype._id,
                    datatype_tags: this.datatype_tags,
                    meta: clean_meta,
                    tags: this.tags,
                    desc: this.desc, //what is this for?

                    subdir: "output",
                    archive: {
                        project: this.project._id,
                        desc: this.desc, //dataset desc to be used
                    }
                }]
            };
            this.datatype.files.forEach(file=>{
                if(!file.local_filename) return; //not set.. optional?
                config[file.id] = "../"+this.tasks.upload._id+"/"+file.filename;
            });

            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: this.instance._id,
                name: "Upload", 
                service: this.datatype.validator,
                service_branch: this.datatype.validator_branch,
                config,
                deps_config: [ {task: this.tasks.upload._id} ], 
            }).then(res=>{
                console.log("submitted validation task");
                console.log(this.datatype.validator, this.datatype.valdiator_branch);
                this.tasks.validation = res.data.task;
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
            if(!this.datatype) return;

            this.prep_upload();

            //load available dataset tags
            this.$http.get('dataset/distinct', {params: {
                distinct: 'tags',
                find: JSON.stringify({project: this.project._id, datatype: this.datatype._id}),
            }}).then(res=>{
                this.available_tags = res.data;
            });

            //load available datatype tags
            this.$http.get('dataset/distinct', {params: {
                distinct: 'datatype_tags',
                find: JSON.stringify({project: this.project._id, datatype: this.datatype._id}),
            }}).then(res=>{
                this.available_dt_tags = res.data;
            });            
        },
        editorInit(editor) {
            require('brace/mode/json')
            editor.container.style.lineHeight = 1.25;
            editor.renderer.updateFontSize();
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
pre {
    line-height: 130%;
}
</style>


