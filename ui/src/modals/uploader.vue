<template>
<b-modal :no-close-on-backdrop='true' title="Upload Data" ref="modal" id="uploader" size="lg">
    <div v-if="mode == 'upload'">
        <b-form-group horizontal label="Data Type" style="margin-bottom: 8px;">
            <v-select v-model="datatype" placeholder="Search Datatype" label="name" :options="Object.values(datatypes)" :selectable="option => option.validator">
                <template v-slot:option="option">
                    <datatypetag :datatype="option" :clickable="false"/><br>
                    <small style="white-space: normal;">{{option.desc}}</small>
                </template>
            </v-select>
        </b-form-group>

        <div v-if="!datatype">
            <small style="position: relative; top: -5px;">
                If you do not see the datatype you want to upload listed, or if you'd like to bulk upload multiple objects at once, please use <a href="https://brainlife.io/docs/cli/install/" target="doc">Brainlife CLI</a>.
            </small>

            <br>
            <b style="opacity: 0.6; padding: 20px;"><center>- OR -</center></b>
            <div style="background-color: #eee; border-radius: 10px; padding: 10px;">
                <center>
                    <small>If you'd like to bulk upload your <b>raw DICOM</b> files, please use</small>
                    &nbsp;
                    <b-btn variant="success" @click="ezbids"><icon name="play"/> ez<b>BIDS</b></b-btn>
                </center>
            </div> 
        </div>

        <div v-if="datatype">
            <p>
                <small>{{datatype.desc}}</small>
            </p>
            <div v-if="tasks.upload && tasks.upload.resource_id && tasks.upload.status == 'finished'">
                <b-tabs v-model="subtype" v-if="datatype._id == '5c390505f9109beac42b00df'">
                    <b-tab v-for="spec in dtSpecs[datatype._id]" :key="spec.datatype_tag" :title="spec.datatype_tag">
                        <p>
                            <small>{{datatype.datatype_tags.find(t=>t.datatype_tag == spec.datatype_tag).desc}}</small>
                        </p>
                    </b-tab>
                </b-tabs>
                <b-form-group horizontal v-for="file in files" :key="file.id" :class="{'gray-background': file.meta}">
                    <legend class="col-form-label pt-0" style="margin: 0; padding: 0">{{file.id+(file.ext?' ('+file.ext+')':'')+(file.required?' *':'')}}</legend>
                    <small>{{file.desc}}</small>
                    <div v-if="!file.uploaded && !file.progress">
                        <input type="file" @change="filechange(file, $event)" :accept="file.ext">
                        <editor v-if="file.meta && sidecar" v-model="sidecar" @init="editorInit" lang="json" height="150" style="margin-top: 10px;"/>
                    </div>

                    <div v-if="!file.uploaded && file.progress">
                        <div class="button" @click="cancelupload(file)" style="float: right; position: relative; top:-5px;"><icon name="times"/></div>
                        <p v-if="file.progress.loaded < file.progress.total">
                            <icon name="cog" spin/>
                            Uploading {{file.local_filename}} 
                            <small>({{file.progress.loaded|filesize}} / {{file.progress.total|filesize}})</small> 
                            <b-progress :max="file.progress.total">
                                <b-progress-bar :value="file.progress.loaded" :label="Math.floor(file.progress.loaded*1000/file.progress.total)/10+'%'"/>
                            </b-progress>
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
                </b-form-group>
            </div>
 
            <b-form-group horizontal label="Subject *">
                <b-input type="text" v-model="meta['subject']" required/>
            </b-form-group>

            <b-form-group horizontal label="Session">
                <b-input type="text" v-model="meta['session']" placeholder="(optional)"/>
            </b-form-group>

            <b-form-group horizontal label="Description">
                <b-form-textarea v-model="desc" :rows="4" placeholder="(optional)"></b-form-textarea>
            </b-form-group>

            <b-form-group horizontal label="Data-Object Tags" v-if="available_tags">
                <tageditor v-model="tags" :options="available_tags" placeholder="(optional)"/>
                <small>Data-object tags is used to help organize data-objects and make searching easier. It can be edited by users anytime.</small>
            </b-form-group>

            <div class="gray-background">
                <b-form-group horizontal label="Datatype Tags">
                    <tageditor v-model="datatype_tags" :options="datatype.datatype_tags.map(entry=>entry.datatype_tag)" placeholder="(optional)"/>
                    <small>Datatype tags add context to the datatype. Datatype Tags must be specific for each datatype. 
                        Please consult the datatype detail page before setting any datatype tags.</small>
                </b-form-group>
            </div>

        </div><!--datatype_id set -->
    </div><!--meta-->

    <div v-if="mode == 'validate' && tasks.validation">
        <b v-if="tasks.validation.status == 'finished' 
            && tasks.validation.product 
            && tasks.validation.product.errors.length == 0">Registering Data...  <icon name="cog" spin/></b>
        <task :task="tasks.validation" v-if="tasks.validation.status != 'finished'"/>

        <!-- 
            TODO - We can only abort archive if validation finishes and it has an error 
            We might want to give user option to proceed with warning?
        -->
	<b-alert show variant="danger" v-if="tasks.validation.status == 'finished' && !tasks.validation.product">Validator didn't generate product.json. Please check task: {{tasks.validation._id}}</b-alert>
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
            <b-button variant="primary" @click="finalize()" :disabled="!isValid()">Next</b-button>
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

import datatypesMixin from '@/mixins/datatypes'

export default {
    mixins: [
        datatypesMixin,
    ],

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
            
            subtype: 0, 

            available_tags: null,

            dtSpecs: {
                //fmap
                "5c390505f9109beac42b00df": [
                    {
                        datatype_tag: "phasediff",
                        files: [
                            "phasediff", "phasediff_json",
                            "phasediff", "phasediff_json",
                            "magnitude1", "magnitude1_json",
                            "magnitude2", "magnitude2_json", //optional
                        ],
                    },

                    {
                        datatype_tag: "2phasemag",
                        files: [
                            "phase1", "phase1_json",
                            "phase2", "phase2_json",
                            "magnitude1", "magnitude1_json",
                            "magnitude2", "magnitude2_json",
                        ],
                    },

                    {
                        datatype_tag: "single",
                        files: [
                            "magnitude", "magnitude_json",
                            "fieldmap", "fieldmap_json",
                        ],
                    },

                    {
                        datatype_tag: "pepolar",
                        files: [
                            "epi1", "epi1_json",
                            "epi2", "epi2_json"
                        ],
                    },
                ]
            },

            config: Vue.config,
        }
    },

    mounted() {
        /*
        this.$http.get('datatype', {params: {
            sort: 'name', 

            //load all datatype that has validator assigned
            //find: JSON.stringify({validator: {$exists: true}}),

            find: JSON.stringify({_id: {$in: [
            ]}}),
        }}).then(res=>{
            this.datatypes = {};
            res.data.datatypes.forEach((type)=>{
                this.datatypes[type._id] = type;
            });
        });
        */

        //let's specify which datatype to allow upload (until we can handle directory upload
        //we also need to make sure to register those datatypes in brainlife.io resource
        this.loadDatatypes({
            _id: {$in: [
                "58c33bcee13a50849b25879a", //t1
                "594c0325fa1d2e5a1f0beda5", //t2
                "5d9cf81c0eed545f51bf75df", //flair
                "58c33c5fe13a50849b25879b", //dwi
                "59b685a08e5d38b0b331ddc5", //task
                "5ebe0bbbb969982124072325", //oct
                "5907d922436ee50ffde9c549", //track/tck
                "5b956f6cd7b3f1e24e9121ce", //track/trk
                "5c390505f9109beac42b00df", //fmap
                "604976b3ebfe45c4633ae3d2", //microperimetry
                "599f305ad1f46fec1759f363", //tractmeasures

                "5ed0352de3f453b13b267dae", //generic/network
                "604a4553ebfe4559de3af944", //generic/timeseries
            ]},
        }, err=>{
            if(err) console.error(err);
        });

        this.$root.$on("uploader.option", (opt)=>{
            this.reset();
            this.project = opt.project;
            this.findOrCreateInstance();
        });
    },

    watch: {
        datatype() {
            //console.log("datatype changed")
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

            //fmap only show files that pertains to subtype
            if(this.datatype._id == '5c390505f9109beac42b00df') {
                //console.dir(this.subtype);
                let subtypeFiles = this.dtSpecs[this.datatype._id][this.subtype].files;
                return [...this.datatype.files.filter(f=>subtypeFiles.includes(f.id)), sidecar];
            } 

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
            let name = "upload."+this.project.group_id; //same for cli upload (bl data upload and bids upload)
            this.$http.get(Vue.config.amaretti_api+'/instance?find='+JSON.stringify({ name })).then(res=>{
                if(res.data.instances.length > 0) { 
                    this.instance = res.data.instances[0];
                    this.subscribeInstance();
                    return;
                }

                this.$http.post(Vue.config.amaretti_api+'/instance', {
                    name,
                    group_id: this.project.group_id,
                }).then(res=>{
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
                        this.$router.push("/project/"+this.project._id+"/dataset/"+task.config.datasets[0].dataset_id);

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
            //TODO why do I care which resource to run validator on?
            this.$http.get(Vue.config.amaretti_api+'/resource/best/', {params: {
                service: this.datatype.validator,
            }}).then(res=>{
                if(!res.data.resource) { 
                    this.$notify({ type: 'error', title: 'Server Busy', text: 'Validator service is busy. Please try again later' });
                    this.cancel();
                }
                this.validator_resource = res.data.resource;

                //submit noop to upload files on the resource where validator can run
                return this.$http.post(Vue.config.amaretti_api+'/task', {
                    instance_id: this.instance._id,
                    name: "upload",
                    service: "brainlife/app-noop", //TODO - I should rename to app-upload?
                    config: {}, //must exist for event handler to submit secondary archiver?
                    preferred_resource_id: this.validator_resource, 
                    max_runtime: 600*1000, //10 minutes should be enough? (I've also set 10 mintues for cli, but is that too short?)
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

            let data = new FormData();
            data.append("file", f);
            file.cancel = this.$http.CancelToken.source();
            this.$http.post(Vue.config.amaretti_api+"/task/upload2/"+this.tasks.upload._id+"?p="+encodeURIComponent("upload/"+file.filename), data, {
                cancelToken: file.cancel.token,
                onUploadProgress: evt=>{
                    file.progress = {loaded: evt.loaded, total: evt.total};
                    this.$forceUpdate();
                }
            }).then(res=>{
                file.uploaded = true;
                this.$forceUpdate();
                if(file.size != res.data.attrs.size) {
                    this.$notify({ type: 'error', text: 'Failed to upload the entire file. filesie: '+file.size+' received filesize: '+res.data.attrs.size });
                }
            }).catch(err=>{
                console.error(err);
            });
        },

        cancel() {
            this.$refs.modal.hide();
        },

        finalize()  {
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

            const fileids = this.files.filter(f=>f.uploaded).map(f=>f.id);

            this.$http.post(Vue.config.api+"/dataset/finalize-upload", {
                task: this.tasks.upload._id,
                subdir: "upload",
                datatype: this.datatype._id,
                desc: this.desc, //what is this for?
                fileids,

                datatype_tags: this.datatype_tags,
                meta: clean_meta,
                tags: this.tags,
            }).then(res=>{
                this.tasks.validation = res.data.validator_task;
            }).catch(err=>{
                console.error(err);
            });
        },

        clearfile: function(file) {
            file.uploaded = null;
            file.progress = null;
            this.$forceUpdate();
        },

        cancelupload: function(file) {
            file.cancel.cancel();
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
        },

        editorInit(editor) {
            require('brace/mode/json')
            editor.container.style.lineHeight = 1.25;
            editor.renderer.updateFontSize();
        },

        ezbids() {
            this.$refs.modal.hide();
            //this.$router.push("/project/ezbids");
            document.location = "https://brainlife.io/ezbids";
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
.gray-background {
    background-color: #eee; 
    margin: 5px -15px; 
    padding: 10px 15px;
}
</style>


