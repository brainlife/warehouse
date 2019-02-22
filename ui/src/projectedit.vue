<template>
<div class="projectedit">
    <pageheader/>
    <sidemenu active="/projects"></sidemenu>
    <div class="fixed-top">
        <b-container>
            <p style="float: right">
                <a href="https://brainlife.io/docs/user/project/"><icon name="book"/></a>
            </p>
            <h3>{{project.name||'No name'}}</h3>
        </b-container>
    </div>

    <div class="main-section">
        <b-form>
        <b-container>
            <b-row>
                <b-col cols="3">
                    <span class="form-header">Name</span>
                </b-col> 
                <b-col cols="9">
                    <b-input type="text" v-model="project.name" placeholder="Project Name"/>
                    <br>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Description</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <b-form-textarea :rows="2" v-model="project.desc" placeholder="Enter description for this project."/>
                    </p>
                </b-col>
            </b-row>
            
            <b-row>
                <b-col cols="3">
                    <span class="form-header">README</span>
                </b-col> 
                <b-col cols="9">
                    <b-form-textarea :rows="4" :max-rows="20" v-model="project.readme" placeholder="Enter extended README content"/>
                    <p>
                        <small class="text-muted">in <a href="https://help.github.com/articles/basic-writing-and-formatting-syntax/" target="_blank">markdown format</a></small>
                    </p>
                </b-col>
            </b-row>
            <b-row>
                <b-col cols="3">
                    <span class="form-header">Access Policy</span>
                </b-col> 
                <b-col cols="9">
                    <b-form-radio-group v-model="project.access">
                        <p>
                            <b-form-radio value="public">Public</b-form-radio> <br>
                            <small class="text-muted">Datasets are accessible to any users but only project member can update them.</small>
                        </p>
                        <p>
                            <b-form-radio value="private">Private</b-form-radio> <br>
                            <small class="text-muted">Only the members of project can access datasets. Guest users has read access to the datasets.</small>
                       </p>
                    </b-form-radio-group>
                    <!-- I think we should put this under AUP when user signin
                    <p v-if="project.access == 'public'">
                        <vue-markdown :source="public_project_consent" class="readme"></vue-markdown>
                        <br>
                        <b-form-checkbox v-model="consent" required>I consent to the above consent form.</b-form-checkbox>
                    </p>
                    -->
                    <p>
                        <b-form-checkbox v-if="project.access == 'private'" style="margin-left: 40px;" v-model="project.listed">List project summary for all users</b-form-checkbox>
                    </p>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Agreements</span>
                </b-col> 
                <b-col cols="9">
                    <p class="text-muted"><small>List of agreements that user must agree before accessing datasets stored on this project (in markdown format)</small></p>
                    <b-row v-for="(agreement, idx) in project.agreements" :key="idx">
                        <b-col>
                            <b-form-textarea :rows="4" :max-rows="20" v-model="agreement.agreement" placeholder="Enter agreemenet text to be presented to the user"/>
                            <br>
                        </b-col>
                        <b-col cols="1">
                            <div class="button" @click="remove_agreement(idx)"><icon name="trash"/></div>
                        </b-col>
                    </b-row>
                    <p><b-button @click="project.agreements.push({agreement: ''})"><icon name="plus"/> Add Agreement</b-button></p>
                    <br>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Administrators</span>
                </b-col> 
                <b-col cols="9">
                    <contactlist v-model="project.admins"></contactlist>
                    <p class="text-muted"><small>Users who can update the project metadata, and groups</small></p>
                </b-col>
            </b-row>
            
            <b-row>
                <b-col cols="3">
                    <span class="form-header">Members</span>
                </b-col> 
                <b-col cols="9">
                    <contactlist v-model="project.members"></contactlist>
                    <p class="text-muted"><small>Users who can update datasets in this project. Also for a private project: Users who can run Apps registered on this project.</small></p>     
                </b-col>
            </b-row>
            
            <b-row>
                <b-col cols="3">
                    <span class="form-header">Guests</span>
                </b-col> 
                <b-col cols="9">
                    <contactlist v-model="project.guests"></contactlist>
                    <p class="text-muted"><small>For Private project, users who has read access to datasets.</small></p>
                </b-col>
            </b-row>
            
            <b-row>
                <b-col cols="3">
                    <span class="form-header">Avatar</span>
                </b-col> 
                <b-col cols="9">
                    <b-input type="text" v-model="project.avatar" placeholder="Image URL for the project avatar (if not set, randomly generate)"/>
                    <br>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header"></span>
                </b-col> 
                <b-col cols="9">
                    <b-form-checkbox v-if="project._id" v-model="project.removed">Removed</b-form-checkbox>
                    <br>
                </b-col>
            </b-row>

            <div class="form-action">
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
            <pre v-highlightjs="JSON.stringify(project, null, 4)"><code class="json hljs"></code></pre>
        </div>
        </b-form>
    </div><!--main-section-->
</div>
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import contactlist from '@/components/contactlist'
import license from '@/components/license'
import VueMarkdown from 'vue-markdown'
//import {public_project_consent} from '@/consents'

export default {
    components: { sidemenu, contactlist, pageheader, license, VueMarkdown },
    data () {
        return {
            project: {
                _id: null, 
                name: "New Project",
                desc: "",
                access: "private",
                admins: [Vue.config.user.sub],
                //members: [Vue.config.user.sub],
                members: [],
                //license: "ccby.40",
                agreements: [],
            },

            //public_project_consent,
            //consent: false,

            submitting: false,

            config: Vue.config,
        }
    },
    mounted: function() {
        if(this.$route.params.id !== '_') {
            //load project to edit
            this.$http.get('project', {params: {
                find: JSON.stringify({_id: this.$route.params.id})
            }}).then(res=>{
                this.project = res.data.projects[0];
                if(!this.project.agreements) Vue.set(this.project, "agreements", []); //backward compatibility
            });
        } else {
            //new project
        } 
    },

    computed: {
    },

    methods: {
        changeadmins(admins) {
            //this.project.admins = admins;
        },

        cancel() {
            if(this.project._id) this.$router.push('/project/'+this.project._id);
            else this.$router.push('/project');
        },

        remove_agreement(idx) {
            this.project.agreements.splice(idx, 1);
            //this.$forceUpdate();
        },

        submit(evt) {
            console.log("submitting");
            if(this.submitting) return;
            this.submitting = true;
            evt.preventDefault();
            if(this.project._id) {
                //update
                this.$http.put('project/'+this.project._id, this.project).then(res=>{
                    this.$root.$emit("refresh_jwt");
                    this.$router.push('/project/'+this.project._id);
                    this.submitting = false;
                }).catch(err=>{
                    console.error(err);
                    this.submitting = false;
                });
            } else {
                //create
                this.$http.post('project', this.project).then(res=>{
                    this.$root.$emit("refresh_jwt");
                    this.$router.push('/project/'+res.data._id);
                }).catch(err=>{
                    console.error(err);
                    this.submitting = false;
                });
            }
        }
    },
}
</script>

<style scoped>
.main-section {
position: fixed;
padding: 20px;
left: 50px;
right: 0px;
top: 130px;
bottom: 0px;
overflow: auto;
}
.fixed-top {
background-color: white;
padding: 20px;
position: fixed;
top: 50px;
left: 50px;
right: 0px;
height: 80px;
z-index: 1;
border-bottom: 1px solid #eee;
}
.fixed-top h3 {
opacity: 0.8;
}
.form-action {
text-align: right;
position: fixed;
right: 0px;
left: 50px;
bottom: 0px;
padding: 10px 30px;
background-color: rgba(100,100,100,0.4);
}
.readme {
background-color: white;
max-height: 500px;
overflow: auto;
padding: 20px;
}
</style>

