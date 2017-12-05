<template>
<div v-if="selected">
    <pageheader/>
    <sidemenu active="/projects"/>
    <projectmenu :active="selected._id" :projects="projects" @change="change_project"></projectmenu>
    <div class="header">
        <!--
        <b-row>
            <b-col>
                <div style="float: left; margin-right: 40px; margin-bottom: 15px; height: 100%;">
                    <projectavatar :project="selected"/>
                </div>
                <div>
                    <h3 style="color: #666; margin-bottom: 10px;">
                        <projectaccess :access="selected.access"/>
                        {{selected.name}}
                    </h3>
                    <p class="text-muted">{{selected.desc}}</p>
                </div>
            </b-col>
            <b-col cols="3">
                <b-button-group style="float: right;" v-if="selected._canedit">
                    <b-button variant="danger" @click="remove()" v-if="!selected.removed"><icon name="trash"/></b-button>
                    <b-button variant="default" @click="edit()"><icon name="pencil"/> Edit</b-button>
                </b-button-group>
            </b-col>
        </b-row>
        -->
        <b-tabs class="brainlife-tab" v-model="tab">
            <b-tab title="Detail"/>
            <b-tab title="Datasets"/>
            <b-tab title="Processes"/>
            <b-tab title="Pipelines"/>
            <b-tab title="Publications"/>
        </b-tabs>
    </div><!--header-->
    <div class="page-content">
        <div class="margin20">
            <el-alert v-if="selected.removed" title="This project has been removed" type="warning" show-icon :closable="false"></el-alert>

            <!--detail-->
            <div v-if="tab == 0">
                <b-row>
                    <b-col cols="3">
                        <projectavatar :project="selected"/>
                    </b-col>
                    <b-col>
                        <b-button-group style="float: right;" v-if="selected._canedit">
                            <b-button variant="danger" @click="remove()" v-if="!selected.removed"><icon name="trash"/></b-button>
                            <b-button variant="default" @click="edit()"><icon name="pencil"/> Edit</b-button>
                        </b-button-group>

                        <h3 style="color: #666; margin-bottom: 10px;">
                            <projectaccess :access="selected.access"/>
                            {{selected.name}}
                        </h3>
                        <p>{{selected.desc}}</p>
                    </b-col>
                </b-row>


                <hr>

                <b-row>
                    <b-col cols="3">
                        <b class="text-muted">Admins</b>
                    </b-col>
                    <b-col>
                        <p>
                            <contact v-for="c in selected.admins" key="c._id" :id="c"></contact>
                        </p>
                        <p class="text-muted">Users who can update name / desc / project members</p>
                    </b-col>
                </b-row>
                
                <b-row>
                    <b-col cols="3"> 
                        <b class="text-muted">Members</b>
                    </b-col>
                    <b-col>
                        <p>
                            <contact v-for="c in selected.members" key="c._id" :id="c"></contact>
                        </p>
                        <p class="text-muted">Users who can update datasets published on this project</p>
                    </b-col>
                </b-row>

                <!--
                <b-row v-if="datasets_attribs.num_subjects">
                    <b-col cols="3"> 
                        <b class="text-muted">Datasets</b>
                    </b-col>
                    <b-col>
                        <b-card>
                            <b-row>
                                <b-col>
                                    <p class="text-muted">Subjects</p>
                                    <h5>{{datasets_attribs.num_subjects}}</h5>
                                </b-col>

                                <b-col>
                                    <p class="text-muted">Datasets</p>
                                    <h5>{{datasets_attribs.num_datasets}}</h5>
                                </b-col>
                            </b-row>
                        </b-card>
                    </b-col>
                </b-row>
                -->

                <br>
                <b-row>
                    <b-col cols="3"> 
                        <b class="text-muted">README</b>
                    </b-col>
                    <b-col>
                        <p class="text-muted" v-if="!selected.readme">Please edit README content</p>
                        <vue-markdown v-if="selected.readme" :source="selected.readme" class="readme"></vue-markdown>
                    </b-col>
                </b-row>

            </div>

            <div v-if="tab == 1">
                <datasets :project="selected"></datasets>
            </div>

            <div v-if="tab == 2">
                <b-alert show>
                    <b>Coming Soon!</b> 
                    Processes page will be moved here soon by organizing each process under a specific project.
                    For now please visit the old processes page via the left hand side menu.
                </b-alert>
            </div>

            <div v-if="tab == 3">
                <b-alert show><b>Coming Soon!</b> You will be able to view / register new pipeline rules.</b-alert>
                <p class="text-muted" v-if="!rules || rules.length == 0">No pipline registered</p>
                <div v-for="rule in rules" :key="rule._id">
                    <pre v-highlightjs><code class="json hljs">{{rule}}</code></pre>
                </div>
            </div>

            <div v-if="tab == 4">
                <p class="text-muted" v-if="!pubs || pubs.length == 0">No publication registered</p>
                <div v-for="pub in pubs" :key="pub._id">
                    <pubcard :pub="pub"/>
                </div>
            </div>

            <!--
            <tr>
                <th>TODO</th>
                <td>
                    <p class="text-muted">What else can I show? Maybe timeline of various events that happened to this project?</p>
                    <p class="text-muted">Or maybe we can display Facebook style community messaging capability?</p>
                </td>
            </tr>
            -->
        </div>
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
import projectmenu from '@/components/projectmenu'
import pubcard from '@/components/pubcard'
import datasets from '@/components/datasets'

export default {
    components: { 
        sidemenu, contactlist, project, 
        projectaccess, pageheader, contact, 
        VueMarkdown, projectavatar, license,
        projectmenu, pubcard, datasets,
    },

    data () {
        return {
            selected: null, 
            /*
            datasets_attribs: {
                num_datasets: null,
                num_subjects: null
            },
            */

            rules: null, 
            pubs: null, 

            tab: 0,
            projects: null, //all projects that user has access to
            config: Vue.config,
        }
    },

    mounted: function() {

        this.$http.get('project', {params: {
            find: JSON.stringify({
            $or: [
                { members: Vue.config.user.sub }, 
                { admins: Vue.config.user.sub }, 
                { access: "public" },
            ]})
        }})
        .then(res=>{
            this.projects = {};
            res.body.projects.forEach((p)=>{
                this.projects[p._id] = p;
            });

            this.parse_params();
            this.load();

            //TODO.. selecte default?
            //this.check_project_id(res.body.projects[0]);
        })
        .catch(console.error);
    },

    watch: {
        //when user select different project, this gets called (mounted() won't be called anymore)
        /*
        $route: function() {
            var prev = this.selected;
            this.parse_params();
            if(prev != this.selected) {
                console.log("project changed. loading project detail");
                this.load();
            }
        },
        */

        tab: function() {
            this.$router.replace("/project/"+this.selected._id+"/"+this.tab);
        },
    },

    methods: {
        edit: function() {
            this.$router.push('/project/'+this.selected._id+'/edit');
        },

        remove: function() {
            if(confirm("Do you really want to remove this project?")) {
                this.$http.delete('project/'+this.selected._id)
                .then(res=>{
                    this.selected.removed = true;
                    this.$router.push('/project');        
                });
            }
        },

        change_project: function(project) {
            console.log("project changed too", project);
            this.$router.replace("/project/"+project._id+"/"+this.tab);
            this.parse_params();
            this.load();
        },

        parse_params: function() {
            //decide which project to load
            let project_id = this.$route.params.id
            if(!project_id) {
                //grab the first project.
                let ids = Object.keys(this.projects); 
                project_id = localStorage.getItem("last_projectid_used") || ids[0];
                this.$router.replace("/project/"+project_id);
            }
            localStorage.setItem("last_projectid_used", project_id);
            this.selected = this.projects[project_id]

            //open tab
            if(this.$route.params.tab) {
                this.tab = parseInt(this.$route.params.tab);
            }

            //open dataset view
            if(this.$route.params.subid) {
                this.$root.$emit('dataset.view', this.$route.params.subid);
            }
        },

        //load other details about currently selected project
        load: function() {
            if(!this.selected) return; //no project selected..

            //load all details about this project
            this.$http.get('pub', {params: {
                find: JSON.stringify({
                    project: this.selected._id,
                }),
                populate: 'project', //needed by pubcard
            }})
            .then(res=>{
                this.pubs = res.body.pubs; 

                return this.$http.get('rule', {params: {
                    find: JSON.stringify({
                        project: this.selected._id, 
                    }),
                }})
            })
            .then(res=>{
                this.rules = res.body.rules; 
            })  
            .catch(console.error);
        }
    },
}
</script>

<style scoped>
.page-content {
position: fixed;
left: 350px;
right: 0;
margin-top: 60px;
}

.datasets_link {
color:#44f;
cursor:pointer;
font-weight:bold;
}

.datasets_link:hover {
color:#88f;
}

.header {
position: fixed;
top: 50px;
left: 350px;
right: 0px;

background-color: white;
margin-bottom: 20px;
padding: 0;
border-bottom: 1px solid #ccc;
z-index: 1;
}
</style>
