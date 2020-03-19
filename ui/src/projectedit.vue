<template>
<div class="projectedit">
    <div class="page-header">
        <b-container>
            <p style="float: right">
                <b-button size="sm" variant="outline-secondary" href="https://brainlife.io/docs/user/project" target="doc">
                    <icon name="book"/> Documentation
                </b-button>
            </p>
            <h4 style="margin-right: 150px">{{project.name||'No name'}}</h4>
        </b-container>
    </div>
    <div class="page-content">
        <br>
        <b-form @submit="submit">
        <b-container>
            <b-row>
                <b-col cols="3">
                    <span class="form-header">Name *</span>
                </b-col> 
                <b-col cols="9">
                    <b-input type="text" v-model="project.name" placeholder="Project Name" required/>
                    <br>
                </b-col>
            </b-row>

            <b-row>
                <b-col cols="3">
                    <span class="form-header">Description *</span>
                </b-col> 
                <b-col cols="9">
                    <p>
                        <b-form-textarea :rows="2" v-model="project.desc" placeholder="Enter description for this project." required/>
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
                    <p class="text-muted"><small>List of agreements that user must agree before accessing datasets stored on this project</small></p>
                    <b-row v-for="(agreement, idx) in project.agreements" :key="idx">
                        <b-col>
                            <b-form-textarea :rows="4" :max-rows="20" v-model="agreement.agreement" placeholder="Enter agreemenet text(markdown) to be presented to the user"/>
                            <br>
                        </b-col>
                        <b-col cols="1">
                            <div class="button" @click="remove_agreement(idx)"><icon name="trash"/></div>
                        </b-col>
                    </b-row>
                    <p><b-button @click="project.agreements.push({agreement: ''})" size="sm"><icon name="plus"/> Add Agreement</b-button></p>
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
                    <p class="text-muted"><small>You can try choosing an image from websites like https://picsart.com/</small></p>
                </b-col>
            </b-row>

            <!--
            <b-row>
                <b-col cols="3">
                    <span class="form-header"></span>
                </b-col> 
                <b-col cols="9">
                    <b-form-checkbox v-if="project._id" v-model="project.removed">Removed</b-form-checkbox>
                    <br>
                </b-col>
            </b-row>
            -->

            <div class="page-footer">
                <b-container>
                    <b-button variant="danger" @click="remove" style="float: left"><icon name="trash"/> Remove</b-button>
                    <b-button variant="secondary" @click="cancel">Cancel</b-button>
                    <b-button type="submit" variant="primary" :disabled="submitting"><icon v-if="submitting" name="cog" spin/> Submit</b-button>
                </b-container>
            </div>
                
            <br>
            <br>
            <br>
        </b-container>
        <div v-if="config.debug">
            <pre>{{JSON.stringify(project, null, 4)}}</pre>
        </div>
        </b-form>
    </div><!--page-content-->
</div>
</template>

<script>
import Vue from 'vue'

import pageheader from '@/components/pageheader'
import contactlist from '@/components/contactlist'
import license from '@/components/license'
import VueMarkdown from 'vue-markdown'

export default {
    components: { contactlist, pageheader, license, VueMarkdown },
    data () {
        return {
            project: {
                _id: null, 
                name: "New Project",
                desc: "",
                access: "private",
                admins: [Vue.config.user.sub],
                members: [],
                agreements: [],
            },

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

    methods: {

        cancel() {
            //if(this.project._id) this.$router.push('/project/'+this.project._id);
            //else this.$router.push('/project');
            this.$router.go(-1);
        },

        remove() {
            if(confirm("Do you really want to remove this project?")) {
                this.$http.delete('project/'+this.project._id)
                .then(res=>{
                    this.$notify({text: 'successfully removed the project' });
                    this.$router.push('/projects');        
                });
            }
        },

        remove_agreement(idx) {
            this.project.agreements.splice(idx, 1);
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
                    //this.$router.push('/project/'+this.project._id);
                    this.$router.go(-1);
                    this.submitting = false;
                }).catch(err=>{
                    console.error(err);
                    this.$notify({text: err.response.data.message, type: 'error' });
                    this.submitting = false;
                });
            } else {
                //create
                this.$http.post('project', this.project).then(res=>{
                    this.$root.$emit("refresh_jwt");
                    this.$router.replace("/project/" + res.data._id);
                    this.submitting = false;
                }).catch(err=>{
                    console.error(err);
                    this.$notify({text: err.response.data.message, type: 'error' });
                    this.submitting = false;
                });
            }
        }
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
.readme {
background-color: white;
max-height: 500px;
overflow: auto;
padding: 20px;
}
</style>

