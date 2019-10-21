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
                    <br>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Name</span>
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
                        <b-form-textarea :rows="2" v-model="resource.config.desc"/>
                    </p>
                </b-col>
            </b-row>

            <b-row v-if="config.has_role('admin')">
                <b-col cols="3">
                    <span class="form-header">Sharing</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <b-form-checkbox v-model="resource.active">Allow all users to access this resource</b-form-checkbox>
                        <small>Only the administrator can share resources.</small>
                    </p>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Login Node</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <b-input-group prepend="Username">
                            <b-form-input v-model="resource.config.username"></b-form-input>
                            <b-input-group-prepend is-text>Hostname</b-input-group-prepend>
                            <b-form-input v-model="resource.config.hostname"></b-form-input>
                            <b-input-group-prepend is-text>I/O Hostname</b-input-group-prepend>
                            <b-form-input v-model="resource.config.io_hostname" placeholder="Optional hostname used to transfer data in and out of this resource"></b-form-input>
                        </b-input-group>
                    </p>
                    <p>
                        <b-input-group prepend="Workdir">
                            <b-form-input v-model="resource.config.workdir"></b-form-input>
                        </b-input-group>
                    </p>
                    <p>
                        <b-input-group prepend="ENV">
                            <b-form-textarea :rows="3" v-model="_envs"/>
                        </b-input-group>
                        <small></small>
                    </p>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">SSH Public Key</span>
                </b-col> 
                <b-col cols="9">
                    <p style="font-family: Courier; font-size: 85%; word-wrap: break-word; background-color: white; padding: 10px;">
                        {{resource.config.ssh_public}}
                    </p>
                    <p>
                        <small>Please add the above ssh key under ~/.ssh/authorized_keys on this resource.</small>
                    </p>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Citation</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <b-form-textarea :rows="3" v-model="resource.citation" placeholder="Enter bibtex citation that can be used by users if this resource is used"/>
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
                        <small>Number of max jobs to be submitted concurrently on this resource</small>
                    </p>

                    <p v-for="(service, idx) in resource.config.services" :key="idx">
                        <b-input-group prepend="Name">
                            <b-form-input v-model="service.name"></b-form-input>
                            <b-input-group-append>
                                <b-input-group-prepend is-text>Score</b-input-group-prepend>
                                <b-form-input v-model="service.score"></b-form-input>
                            </b-input-group-append>
                            <b-input-group-append>
                                <b-button @click="remove_service(service)" size="sm" text="Button" variant="danger"><icon name="trash"/></b-button>
                            </b-input-group-append>
                        </b-input-group>
                    </p>
                    <p>
                        <b-btn @click="add_service" size="sm">Add App</b-btn>
                    </p>
                </b-col>
            </b-row>

            <div class="page-footer">
                <b-container>
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

export default {
    components: { sidemenu, contactlist, pageheader },
    data () {
        return {
            resource: {
                _id: null, 
                name: "",
                config: {
                    desc: "",
                },
            },

            _envs: "",

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

                this._envs = JSON.stringify(this.resource.envs, null, 4);
            });
        } 
    },

    methods: {
        cancel() {
            if(this.resource._id) this.$router.push('/resource/'+this.resource._id);
            else this.$router.push('/resources');
        },

        submit(evt) {
            evt.preventDefault();

            if(this.submitting) return; //prevent double submission..
            this.submitting = true;

            if(this.resource._id) {
                //update
                this.$http.put(Vue.config.amaretti_api+'/resource/'+this.resource._id, this.resource).then(res=>{
                    this.$router.push('/resource/'+this.resource._id);
                    this.submitting = false;
                }).catch(err=>{
                    console.error(err);
                    this.submitting = false;
                });
            } else {
                //create
                this.$http.post(Vue.config.amaretti_api+'/resource', this.resource).then(res=>{
                    this.$router.push('/resource/'+res.data._id);
                }).catch(err=>{
                    console.error(err);
                    this.submitting = false;
                });
            }
        },

        /*
        add_tag() {
            this.datatype.datatype_tags.push({
                datatype_tag: "",
                desc: "",
            });
        },
        remove_tag(tag) {
            let pos = this.datatype.datatype_tags.indexOf(tag);
            this.datatype.datatype_tags.splice(pos, 1);
        },
        */

        add_service() {
            this.resource.config.services.push({
                name: "repo/name",
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

