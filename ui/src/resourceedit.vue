<template>
<div>
    <sidemenu active="/resources"></sidemenu>
    <div class="page-header">
        <b-container>
            <h4 style="margin-right: 150px">{{resource.name||'No name'}}</h4>
        </b-container>
    </div>
    <div class="page-content">
        <br>
        <b-form>
        <b-container>
            <b-row>
                <b-col cols="3">
                    <span class="form-header"></span>
                </b-col> 
                <b-col cols="9">
                    <b-form-checkbox v-model="resource.active">Active</b-form-checkbox>
                    <p>
                        <small>Uncheck this to temporarily disable this resource.</small>
                    </p>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Name *</span>
                </b-col> 
                <b-col cols="9">
                    <b-input type="text" v-model="resource.name" placeholder="Resource Name"/>
                    <br>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Description</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <b-form-textarea :rows="4" v-model="resource.config.desc"/>
                    </p>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Apps</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <b-input-group prepend="Max Jobs">
                            <b-input type="text" v-model="resource.config.maxtask"/>
                        </b-input-group>
                        <small>Number of max jobs to be submitted concurrently on this resource. Set to a higher number (10?) for batch schedulers.</small>
                    </p>

                    <div v-for="(service, idx) in resource.config.services" :key="idx" style="margin-bottom: 5px;">
                        <b-button @click="remove_service(service)" size="sm" text="Button" variant="danger" style="float: right;"><icon name="trash"/></b-button>
                        <div style="padding-right: 50px;">
                            <b-input-group prepend="Name">
                                <b-form-input v-model="service.name" list="service_names" trim></b-form-input>
                                <datalist id="service_names">
                                    <option v-for="service in service_names">{{service}}</option>
                                </datalist>
                                <b-input-group-prepend is-text>Score</b-input-group-prepend>
                                <b-form-input v-model="service.score"></b-form-input>
                            </b-input-group>
                        </div>
                    </div>
                    <p>
                        <b-btn @click="add_service" size="sm">Add App</b-btn>
                    </p>
                </b-col>
            </b-row>


            <b-row v-if="config.has_role('admin')">
                <b-col cols="3">
                    <span class="form-header">Group Sharing</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <!--
                        <b-form-checkbox v-model="global">Allow all users to access this resource</b-form-checkbox>
                        <b-form-checkbox v-model="archive_access">Archive access</b-form-checkbox>
                        -->
                        <tageditor v-model="resource.gids"/> 
                        <small>Only the brainlife administrator can edit this</small>
                    </p>
                    
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Login Node</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <b-input-group prepend="Username *">
                            <b-form-input v-model="resource.config.username"></b-form-input>
                            <b-input-group-prepend is-text>Hostname *</b-input-group-prepend>
                            <b-form-input v-model="resource.config.hostname"></b-form-input>
                        </b-input-group>
                        <small>Login node used to access this resource</small>
                    </p>
                    <p>
                        <b-input-group prepend="I/O Hostname">
                            <b-form-input v-model="resource.config.io_hostname"></b-form-input>
                        </b-input-group>
                        <small>Optional hostname used to transfer data in and out of this resource</small>
                    </p>
                    <p>
                        <b-input-group prepend="Workdir *">
                            <b-form-input v-model="resource.config.workdir"></b-form-input>
                        </b-input-group>
                        <small>Shared directory to host instance and task directories.</small>
                    </p>
                    <p>
                        <b-input-group prepend="ENV">
                            <b-form-textarea :rows="3" v-model="envs_"/>
                        </b-input-group>
                        <small>Enter JSON dictionary with key/value pairs. The specified ENV will be set on all jobs running on this resource.</small>
                    </p>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">SSH Key</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <b>Public Key</b>
                        <small>The following ssh public key should be stored in ~/.ssh/authorized_keys on this resource.</small>
                        <b-form-textarea :rows="6" v-model="resource.config.ssh_public"/>
                    </p>
                    <p>
                        <b>Private Key</b>
                        <small>Brainlife will use the following private key to access this resource.</small>
                        <b-form-checkbox v-if="resource.config.enc_ssh_private === true" v-model="resource.config.enc_ssh_private">Use the current private key</b-form-checkbox>
                        <b-form-textarea v-if="resource.config.enc_ssh_private !== true" :rows="3" v-model="resource.config.enc_ssh_private"/>
                    </p>
                    <p>
                        <b-btn @click="reset_sshkey" size="sm">Generate Keypair</b-btn>
                    </p>

                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Citation</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <b-form-textarea :rows="3" v-model="resource.citation"/>
                        <small>Enter citation that should be used to acknowledge the use of this resource (in bibtex format)</small>
                    </p>
                </b-col>
            </b-row>

            <div class="page-footer">
                <b-container>
                    <b-button variant="danger" @click="remove" v-if="this.resource._id" style="float: left;">Remove</b-button>
                    <b-button variant="secondary" @click="cancel">Cancel</b-button>
                    <b-button variant="primary" @click="submit" :disabled="submitting"><icon v-if="submitting" name="cog" spin/> Submit</b-button>
                </b-container>
            </div>
                
            <br>
            <br>
            <br>
        </b-container>
        <div v-if="config.debug">
            <pre v-highlightjs="JSON.stringify(resource, null, 4)"><code class="json hljs"></code></pre>
        </div>
        </b-form>
    </div><!--page-content-->
</div>
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import contactlist from '@/components/contactlist'
import tageditor from '@/components/tageditor'

const forge = require('node-forge');

export default {
    components: { 
        sidemenu, 
        contactlist, 
        pageheader,
        tageditor,
    },
    data () {
        return {
            resource: {
                _id: null, 
                active: true,
                name: "",
                config: {
                    desc: "",
                    services: [],
                    maxtask: 1,
                },
            },

            envs_: "",
            //global: false, 
            //archive_access: false, 

            service_names: [], //all services that user can choose from

            submitting: false,

            config: Vue.config,
        }
    },

    mounted: function() {
        if(this.$route.params.id !== '_') {
            this.$http.get(Vue.config.amaretti_api+'/resource', {params: {
                find: JSON.stringify({_id: this.$route.params.id})
            }}).then(res=>{
                this.resource = res.data.resources[0];
                this.envs_ = JSON.stringify(this.resource.envs, null, 4);
                //if(this.resource.gids.includes(1)) this.global = true;
                //if(this.resource.gids.includes(137)) this.archive_access = true;
            });
        } else {
            this.reset_sshkey();
        }

        this.$http.get("app", {params: {
            select: "github",
        }}).then(res=>{
            this.service_names = res.data.apps.map(app=>app.github);
            this.service_names = [...new Set(this.service_names)]; //debupe
            this.service_names = this.service_names.filter(name=>name && name.includes("/")); //remove odd looking service names
            this.service_names.sort();
            //console.dir(this.service_names);
        });
    },

    methods: {
        cancel() {
            //if(this.resource._id) this.$router.push('/resource/'+this.resource._id);
            //else this.$router.push('/resources');
            this.$router.go(-1);
        },

        remove() {
            if(confirm("Do you really want to remove this resource?")) {
                this.$http.delete(Vue.config.amaretti_api+'/resource/'+this.resource._id).then(res=>{
                    //this.$router.push('/resources/');
                    this.$router.go(-2); //go all the way back to resources page
                    this.$notify({type: 'success', text: "resource removed successfully"});
                }).catch(err=>{
                    this.$notify({type: 'error', text: err.response.data.message});
                });
            }
        },

        reset_sshkey() {
            delete this.resource.config.enc_ssh_private;
            forge.pki.rsa.generateKeyPair({bits: 2048, workers: 2/*e: 0x10001*/}, (err, keypair)=>{
                if(err) {
                    this.$notify({type: 'error', text: err});
                    return;
                }
                Vue.set(this.resource.config, 'ssh_public', forge.ssh.publicKeyToOpenSSH(keypair.publicKey));//, "pubkey comment");
                Vue.set(this.resource.config, 'enc_ssh_private', forge.ssh.privateKeyToOpenSSH(keypair.privateKey));
            });
        },

        submit(evt) {
            evt.preventDefault(); //TODO do I need this?

            if(this.submitting) return; //prevent double submission..
            this.submitting = true;

            //this.resource.gids = [];
            //if(this.global) this.resource.gids.push(1);
            //if(this.archive_access) this.resource.gids.push(137); //TODO make it confiruable
            if(this.envs_ && this.envs_.trim()) {
                try {
                    this.resource.envs = JSON.parse(this.envs_);

                    /* old key=value format
                        inst.envs = {};
                        inst._envs.split("\n").forEach(function(env) {
                            var pos = env.indexOf("=");
                            var key = env.substr(0, pos);
                            if(!key) return;//skip empty keys
                            var value = env.substr(pos+1);
                            inst.envs[key] = value;
                        });
                    */

                } catch(err) {
                    this.$notify({type: 'error', text: err});
                    this.submitting = false;
                    return;
                }
            }

            if(this.resource._id) {
                //update
                this.$http.put(Vue.config.amaretti_api+'/resource/'+this.resource._id, this.resource).then(res=>{
                    //this.$router.push('/resource/'+this.resource._id);
                    this.$router.go(-1);
                    this.submitting = false;
                }).catch(err=>{
                    this.$notify({text: err.response.data.message, type: 'error' });
                    console.error(err);
                    this.submitting = false;
                });
            } else {
                //create
                delete this.resource._id;
                this.$http.post(Vue.config.amaretti_api+'/resource', this.resource).then(res=>{
                    this.$router.replace('/resource/'+res.data._id);
                    this.submitting = false;
                }).catch(err=>{
                    this.$notify({text: err.response.data.message, type: 'error' });
                    console.error(err);
                    this.submitting = false;
                });
            }
        },

        add_service() {
            this.resource.config.services.push({
                name: "",
                score: 10,
            });
        },

        remove_service(service) {
            let pos = this.resource.config.services.indexOf(service);
            this.resource.config.services.splice(pos, 1);
        },

    },
}
</script>

<style scoped>
.page-header {
padding: 10px 20px;    
}
.page-header h4 {
opacity: 0.8;
}
</style>

