<template>
<b-modal :no-close-on-backdrop='true' title="Upload Dataset" ref="modal" id="uploader" size="lg">
    <div v-if="mode == 'upload'">
        <b-form-group horizontal label="Data Type" v-if="datatypes">
            <v-select v-model="datatype" placeholder="Search Datatype" label="desc" :options="Object.values(datatypes)"/>
        </b-form-group>

        <div v-if="datatype">
            <div v-if="tasks.upload && !tasks.upload.resource_id">
                <b-form-group horizontal>
                    <p cass="text-muted">Preparing for file upload...  <icon name="cog" spin/></p>
                    <pre v-if="config.debug">{{tasks.upload}}</pre>
                </b-form-group>
            </div>
            
            <div v-if="tasks.upload && tasks.upload.resource_id">
                <b-form-group horizontal v-if="datatype" v-for="file in files" :key="file.id" :label="file.id+(file.ext?'('+file.ext+')':'')+(file.required?' *':'')">
                    <div v-if="!file.uploaded && !file.progress">
                        <input type="file" @change="filechange(file, $event)" :accept="file.ext">
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

            <!--
            <b-form-group horizontal :label="m.id.toUpperCase()+(m.required?' *':'')" v-for="m in datatype.meta" :key="m.id">
                <b-input type="text" v-model="meta[m.id]" :required="m.required" :placeholder="m.required?'':'(optional)'"/>
            </b-form-group>
            -->
            <b-form-group horizontal label="Subject *">
                <b-input type="text" v-model="meta['subject']" required/>
            </b-form-group>

            <b-form-group horizontal label="Session">
                <b-input type="text" v-model="meta['session']"/>
            </b-form-group>

            <b-form-group horizontal label="Description">
                <b-form-textarea v-model="desc" :rows="4" placeholder="(optional)"></b-form-textarea>
            </b-form-group>

            <b-form-group horizontal label="Datatype Tags" v-if="available_dt_tags">
                <tageditor v-model="datatype_tags" :options="available_dt_tags" placeholder="(optional)"/>
                <small>Datatype tags add context to the datatype. It can not be changed once archived.</small>
            </b-form-group>

            <b-form-group horizontal label="Dataset Tags" v-if="available_tags">
                <tageditor v-model="tags" :options="available_tags" placeholder="(optional)"/>
                <small>Dataset tags is used to help organize datasets and make searching easier. It can be edited by users anytime.</small>
            </b-form-group>

        </div><!--datatype_id set -->
        <small>To bulk upload your datasets, you can use <a href="https://github.com/brain-life/cli" target="_blank">Brainlife CLI</a></small>
    </div><!--meta-->

    <div v-if="mode == 'validate' && tasks.validation">
        <task :task="tasks.validation" v-if="!tasks.validation.product"/>
        <div v-else>
            <b-alert :show="can_archive()" variant="success">
                Your data looks good! Please check information below and click Archive button.
            </b-alert>
            <b-alert :show="tasks.validation.product.errors.length > 0" variant="danger" v-for="(error, idx) in tasks.validation.product.errors" :key="idx">
                {{error}}
            </b-alert>
            <b-alert :show="tasks.validation.product.warnings.length > 0" variant="warning" v-for="(warning, idx) in tasks.validation.product.warning" :key="idx">
                {{warning}}
            </b-alert>
            <product :product="tasks.validation.product"/>

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
            <b-button variant="primary" @click="validate()" :disabled="!can_validate()">Next</b-button>
        </b-form-group>
        <b-form-group v-if="mode == 'validate'">
            <b-button @click="mode = 'upload'">Back</b-button>
            <b-button variant="primary" @click="finalize()" :disabled="!can_archive()"><icon name="archive"/> Archive</b-button>
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

//singleton instance to handle upload request
export default {
    components: { 
        pageheader, 
        task, tageditor, product,
        //datatypetag,
    },
    data () {
        return {
            instance: null, //instance to upload things to

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

            tasks: {
                upload: null, //task where I can upload to
                validation: null, //task entry for validation
            },

            mode: null,
            validator_resource: null,
            
            datatypes: null, //registered datatypes (keyed by datatype_id)

            available_tags: null,
            available_dt_tags: null,

            config: Vue.config,
        }
    },

    mounted() {
        console.log("loading all datatypes - todo. switch to datatypecache mixin");
        this.$http.get('datatype', {params: {
            sort: 'name', 
            find: JSON.stringify({validator: {$exists: true}}),
        }}).then(res=>{
            //console.dir(res);
            this.datatypes = {};
            res.data.datatypes.forEach((type)=>{
                this.datatypes[type._id] = type;
            });
            
            /*
            //override meta 
            for(let id in this.datatypes) {
                this.datatypes[id].meta = [
                    {id: "subject", type: "string", required: true},
                    {id: "session", type: "string", required: false},
                ];
            }
            */
        });

        this.$root.$on("uploader.option", (opt)=>{
            this.reset();
            this.project = opt.project;
            if(!this.instance) this.create_instance();
        });
    },

    watch: {
        datatype() {
            console.log("datatype changed")
            this.change_datatype();
        }
    },

    computed: {
        files: function() {
            if(!this.datatype) return null;
            return this.datatype.files;
        },
    },

    methods: {
        reset() {
            this.mode = "upload";
            this.project = null;
            this.meta = {};
            if(this.datatype) this.datatype.files.forEach(this.clearfile);
            this.datatype = null;
            this.desc = "";
        },

        filechange(file, e) {
            var files = e.target.files || e.dataTransfer.files;
            if(!files.length) return;
            this.upload(file, files[0]); //only upload first one
        },

        create_instance() {
            this.$http.post(Vue.config.wf_api+'/instance', {
                name: "_upload",
            }).then(res=>{
                this.instance = res.data;

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
                    //TODO - could we use event_handler to the archiving?
                    if(this.tasks.validation && task._id == this.tasks.validation._id) {
                        this.tasks.validation = task;
                        if(task.status == "finished") {
                            console.log("validation finished!", task)
                            if(task.product.tags) {
                                this.tags = [... new Set(this.product.tags.concat(task.tags))];
                            }

                            if(task.product.datatype_tags) {
                                this.datatype_tags = [... new Set(task.product.datatype_tags.concat(this.datatype_tags))];
                            }
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
                console.log("upload task submitted");
                this.tasks.upload = res.data.task;
                this.mode = "upload"; 
            }).catch(err=>{
                console.error(err);
            });
        },

        can_validate() {
            let valid = true;
            if(!this.project) return false;
            if(!this.datatype) return false;
            if(!this.meta["subject"]) return false;
            this.files.forEach(file=>{
                if(file.required && !file.uploaded) valid = false;
            });
            return valid;
        },

        can_archive() {
            return (this.tasks.validation && this.tasks.validation.product && this.tasks.validation.product.errors.length == 0);
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

            //create validator config
            var config = {
                //_app: (no app id for validator)
                _outputs: [{
                    id: "output",
                    datatype: this.datatype._id,
                    datatype_tags: this.datatype_tags,
                    meta: this.meta,
                }]
            };
            this.datatype.files.forEach(file=>{
                if(!file.local_filename) return; //not set.. optional?
                config[file.id] = "../"+this.tasks.upload._id+"/"+file.filename;
            });

            this.$http.post(Vue.config.wf_api+'/task', {
                instance_id: this.instance._id,
                name: "validation",
                service: this.datatype.validator,
                service_branch: this.datatype.validator_branch,
                config,
                deps_config: [ {task: this.tasks.upload._id} ], 
            }).then(res=>{
                console.log("submitted validation task");
                this.tasks.validation = res.data.task;
            }, res=>{
                console.error(res);
            });
        },

        finalize() {
            this.$refs.modal.hide();
            this.$root.$emit("loading",{message: "Registering Data-Object..."});

            //remove null meta
            let clean_meta = {};
            for(let id in this.meta) {
                if(this.meta[id] !== "") clean_meta[id] = this.meta[id];
            }

            this.$http.post('dataset', {
                project: this.project._id,
                task_id: this.tasks.validation._id, 
                output_id: "output", //validation service isn't realy BL app, so I just have to come up with something

                meta: clean_meta,
                tags: this.tags,
                desc: this.desc,
            }).then(res=>{
                var dataset = res.data;
                this.$root.$emit("loading", {show: false});
                this.$notify({ type: 'success', text: 'Successfully uploaded a new data-object. Please give a few minutes for your data to become available.', });
                this.$router.push("/project/"+this.project._id+"/dataset/"+dataset._id);

                //TODO need to reload so that new subject group will show up on dataset paage..
                //it will be nice if I can just force dataset reload (just use event?)
                document.location.reload(); 

                this.reset();
            }).catch(err=>{
                console.error(err);
                this.$root.$emit("loading", {show: false});
                this.$notify({type: "error", text: err.response.data.message});
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

            /*
            this.meta = {};
            //need to reset all meta properties to be reactive
            this.datatype.meta.forEach(meta=>{
                Vue.set(this.meta, meta.id, "");
            });
            */

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


