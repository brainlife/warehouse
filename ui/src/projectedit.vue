<template>
<div>
    <pageheader/>
    <sidemenu active="/projects"></sidemenu>
    <div class="fixed-top">
        <b-container>
            <h2>{{project.name||'No name'}}</h2>
        </b-container>
    </div>

    <div class="main-section">
        <b-container>
            <p style="float: right">
                <a href="https://brain-life.github.io/docs/user/project/">Help</a>
            </p>
            <br clear="both">

            <b-form @submit="submit">
                <b-form-group label="Name" horizontal>
                    <el-input type="text" v-model="project.name" placeholder="Project Name"></el-input>
                </b-form-group>
                <b-form-group label="Description" horizontal>
                    <el-input type="textarea" autosize v-model="project.desc" placeholder="Enter description for this project."></el-input>
                </b-form-group>
                <b-form-group label="README" horizontal>
                    <b-form-textarea :rows="4" :max-rows="20" v-model="project.readme" placeholder="Enter extended README content"/>
                    <small class="text-muted">in <a href="https://help.github.com/articles/basic-writing-and-formatting-syntax/" target="_blank">markdown format</a></small>
                
                </b-form-group>

                <b-form-group label="Access Policy" horizontal>
                    <el-select v-model="project.access">
                        <el-option label="Private" value="private"></el-option>
                        <el-option label="Protected" value="protected"></el-option>
                        <el-option label="Public" value="public"></el-option>
                    </el-select>
                </b-form-group>

                <!--
                <b-form-group label="License" horizontal>
                   <b-form-radio-group v-model="project.license">
                        <b-form-radio value="ccby.40"> <license id="ccby.40"/> </b-form-radio>
                        <b-form-radio value="cc0"> <license id="cc0"/> </b-form-radio>
                    </b-form-radio-group>
                </b-form-group>
                -->

                <b-form-group label="Administrators" horizontal>
                    <contactlist v-model="project.admins"></contactlist>
                    <p class="text-muted"><small>Users who can update the project metadata, and groups</small></p>
                </b-form-group>
                <b-form-group label="Members" horizontal>
                    <contactlist v-model="project.members"></contactlist>
                    <p class="text-muted"><small>For public project: Uers who can update datasets in this project. For private project: Users who read/update datasets in this project and use application registered on this project.</small></p>
                </b-form-group>
                <b-form-group label="Guests" horizontal v-if="project.access == 'private'">
                    <contactlist v-model="project.guests"></contactlist>
                    <p class="text-muted"><small>For Private project only: users who has read access to datasets.</small></p>
                </b-form-group>
                <b-form-group label="Guests" horizontal v-if="project.access == 'private'">
                    <contactlist v-model="project.guests"></contactlist>
                    <p class="text-muted">For private project: Give read access to guest members</p>
                </b-form-group>
                <b-form-group label="Avatar" horizontal>
                    <el-input type="text" v-model="project.avatar" placeholder="Image URL for the project avatar (if not set, randomly generate)"/>
                </b-form-group>
                <b-form-group horizontal>
                    <b-form-checkbox v-if="project._id" v-model="project.removed">Removed</b-form-checkbox>
                </b-form-group>
                <b-form-group horizontal>
                    <b-button type="button" variant="secondary" @click="cancel">Cancel</b-button>
                    <b-button type="submit" variant="primary">Submit</b-button>
                </b-form-group>
            </b-form>
                
            <br>
            <el-card v-if="config.debug">
                <div slot="header">Debug</div>
                <h3>project</h3>
                <pre v-highlightjs="JSON.stringify(project, null, 4)"><code class="json hljs"></code></pre>
            </el-card>
        </b-container>
    </div><!--main-section-->
</div>
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import contactlist from '@/components/contactlist'
import license from '@/components/license'

export default {
    components: { sidemenu, contactlist, pageheader, license },
    data () {
        return {
            project: {
                _id: null, 
                name: "New Project",
                desc: "",
                access: "private",
                admins: [Vue.config.user.sub],
                members: [Vue.config.user.sub],
                license: "ccby.40",
            },

            config: Vue.config,
        }
    },
    mounted: function() {
        if(this.$route.params.id !== '_') {
            //load project to edit
            this.$http.get('project', {params: {
                find: JSON.stringify({_id: this.$route.params.id})
            }}).then(res=>{
                this.project = res.body.projects[0];
            });
        } else {
            //new project
        } 
    },
    computed: {
    },
    methods: {
        changeadmins: function(admins) {
            //this.project.admins = admins;
        },

        add: function(it) {
            it.push({
                id: "",
                datatype: null,
                datatype_tags: [],
            });
        },

        cancel: function() {
            if(this.project._id) this.$router.push('/project/'+this.project._id);
            else this.$router.push('/project');
        },

        submit: function(evt) {
            evt.preventDefault();
            if(this.project._id) {
                //update
                this.$http.put('project/'+this.project._id, this.project).then(res=>{
                    this.$root.$emit("refresh_jwt");
                    this.$router.push('/project/'+this.project._id);
                }).catch(console.error);
            } else {
                //create
                this.$http.post('project', this.project).then(res=>{
                    this.$root.$emit("refresh_jwt");
                    this.$router.push('/project/'+res.body._id);
                }).catch(console.error);
            }
        }
    },
}
</script>

<style scoped>
.main-section {
position: fixed;
padding: 20px;
left: 90px;
right: 0px;
top: 130px;
bottom: 0px;
overflow: auto;
}
.fixed-top {
background-color: #666;
padding: 20px;
color: white;
position: fixed;
top: 50px;
left: 90px;
right: 0px;
height: 80px;
z-index: 1;
border-bottom: 1px solid #666;
}
</style>

