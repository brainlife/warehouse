<template>
<div v-if="project">
    <pageheader/>
    <sidemenu active="/projects"/>
    <div class="page-content">
        <div class="header">
            <b-container>
                <b-row>
                    <b-col>
                        <div style="float: left; margin-right: 40px; margin-bottom: 15px; height: 100%;">
                            <projectavatar :project="project"/>
                        </div>
                        <div>
                            <h3 style="color: #666; margin-bottom: 10px;">
                                <projectaccess :access="project.access"/>
                                {{project.name}}
                            </h3>
                            <p class="text-muted">{{project.desc}}</p>
                        </div>
                    </b-col>
                    <b-col cols="3">
                        <b-button-group style="float: right;" v-if="project._canedit">
                            <b-button variant="danger" @click="remove()" v-if="!project.removed"><icon name="trash"/></b-button>
                            <b-button variant="default" @click="edit()"><icon name="pencil"/> Edit</b-button>
                        </b-button-group>
                    </b-col>
                </b-row>
            </b-container>
        </div><!--header-->

        <b-container>
            <b-row>
                <b-col>
                    <el-alert v-if="project.removed" title="This project has been removed" type="warning" show-icon :closable="false"></el-alert>
                    <b-card no-body>
                        <b-list-group flush>
                            <b-list-group-item>
                                <b-row>
                                    <b-col>
                                        <h6>Admins</h6>
                                        <p class="text-muted">Users who can update name / desc / project members</p>
                                        <contact v-for="c in project.admins" key="c._id" :id="c"></contact>
                                    </b-col>
                                    <b-col>
                                        <h6>Members</h6>
                                        <p class="text-muted">Users who can update datasets published on this project</p>
                                        <contact v-for="c in project.members" key="c._id" :id="c"></contact>
                                    </b-col>
                                </b-row>
                            </b-list-group-item>
                            <b-list-group-item v-if="project.license">
                                <!--
                                <h6>License</h6>
                                <p class="text-muted">Datasets / Applications published under this project are bounded to following licensing</p>
                                -->
                                <license :id="project.license"/>
                            </b-list-group-item>
                        </b-list-group>
                    </b-card>
                    <br>

                    <vue-markdown v-if="project.readme" :source="project.readme"></vue-markdown>
                    <!--
                    <tr>
                        <th>TODO</th>
                        <td>
                            <p class="text-muted">What else can I show? Maybe timeline of various events that happened to this project?</p>
                            <p class="text-muted">Or maybe we can display Facebook style community messaging capability?</p>
                        </td>
                    </tr>
                    -->
                </b-col>
                <b-col cols="3">
                    <div v-if="datasets_attribs.num_subjects">
                        <center>
                            <p class="text-muted">Subjects</p>
                            <h5>{{datasets_attribs.num_subjects}}</h5>
                            <br>

                            <p class="text-muted">Datasets</p>
                            <h5>{{datasets_attribs.num_datasets}}</h5>
                            <br>
                        </center>
                    </div>
                </b-col>
            </b-row>
        </b-container>

    </div><!--page-content-->
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'
import VueMarkdown from 'vue-markdown'

import sidemenu from '@/components/sidemenu'
import contactlist from '@/components/contactlist'
import project from '@/components/project'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import projectaccess from '@/components/projectaccess'
import projectavatar from '@/components/projectavatar'
import license from '@/components/license'

export default {
    components: { 
        sidemenu, contactlist, project, 
        projectaccess, pageheader, contact, 
        VueMarkdown, projectavatar, license,
    },

    data () {
        return {
            project: null,
            datasets_attribs: {
                num_datasets: null,
                num_subjects: null
            },
            
            config: Vue.config,
        }
    },

    mounted: function() {
        this.$http.get('project', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
        }})
        .then(res=>{
            this.project = res.body.projects[0];
            
            return this.$http.get('dataset', {params: {
                find: JSON.stringify({
                    project: this.project._id,
                    storage: {$exists: true},
                    removed: false
                })
            }});
        })
        .then(res => {
            this.datasets_attribs.num_datasets = res.body.count;
            return this.$http.get('dataset/distinct', {params: {
                find: JSON.stringify({
                    project: this.project._id,
                    removed: false
                }),
                distinct: 'meta.subject'
            }})
        })
        .then(res => {
            this.datasets_attribs.num_subjects = res.body.length;
        })
        .catch(console.error);
    },

    methods: {
        edit: function() {
            this.$router.push('/project/'+this.project._id+'/edit');
        },
        remove: function() {
            if(confirm("Do you really want to remove this project?")) {
                this.$http.delete('project/'+this.project._id)
                .then(res=>{
                    this.go('/projects');        
                });
            }
        },
        go: function(path) {
            this.$router.push(path);
        },
    },
}
</script>

<style scoped>
.datasets_link {
color:#44f;
cursor:pointer;
font-weight:bold;
}
.datasets_link:hover {
color:#88f;
}

.header {
background-color: white;
margin-bottom: 30px;
padding: 30px 0px 20px 0px;
border-bottom: 1px solid #ccc;
}


</style>
