<template>
<div v-if="selected">
    <pageheader/>
    <sidemenu active="/projects"/>
    <projectmenu :active="selected._id" :projects="projects" @change="change_project"></projectmenu>
    <div class="header">
        <b-tabs class="brainlife-tab" v-model="tab">
            <b-tab v-for="tabinfo in tabs" :key="tabinfo.id" :title="tabinfo.label"/>
        </b-tabs>
    </div><!--header-->
    <div class="page-content">
        <!--detail-->
        <div v-if="tabs[tab].id == 'detail'">
            <b-row style="padding: 20px; background-color: #eee;">
                <b-col cols="2">
                    <projectavatar :project="selected"/>
                </b-col>
                <b-col>
                    <div style="float: right;" v-if="isadmin()">
                        <div @click="edit()" class="button">
                            <icon name="pencil" scale="1.25"/>
                        </div>
                        <div @click="remove()" v-if="isadmin() && !selected.removed" class="button">
                            <icon name="trash" scale="1.25"/>
                        </div>
                    </div>

                    <h3 style="color: #666; margin-bottom: 10px;">
                        <projectaccess :access="selected.access"/>
                        {{selected.name}}
                    </h3>
                    <el-alert v-if="selected.removed" style="border-radius: 0px" title="This project has been removed" type="warning" show-icon :closable="false"></el-alert>
                    <p style="opacity: 0.8;">{{selected.desc}}</p>
                </b-col>
            </b-row>

            <div class="margin20">
                <b-row>
                    <b-col cols="2">
                        <b class="text-muted">Admins</b>
                    </b-col>
                    <b-col>
                        <small class="text-muted">Users who can update name / desc / project members, and create publications.</small>
                        <p v-for="c in selected.admins" :key="c._id">
                            <contact :id="c"/>
                        </p>
                    </b-col>
                </b-row>
                
                <b-row>
                    <b-col cols="2"> 
                        <b class="text-muted">Members</b>
                    </b-col>
                    <b-col>
                        <small class="text-muted">Users who can archive and update datasets on this project, and create publications.</small>
                        <p v-for="c in selected.members" :key="c._id">
                            <contact :id="c"/>
                        </p>
                    </b-col>
                </b-row>
                <br>
                <b-row>
                    <b-col cols="2"> 
                        <b class="text-muted">README</b>
                    </b-col>
                    <b-col cols="10">
                        <p class="text-muted" v-if="!selected.readme">Please edit README content</p>
                        <vue-markdown v-if="selected.readme" :source="selected.readme" class="readme"></vue-markdown>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <b class="text-muted">Comments</b>
                    </b-col>
                    <b-col>
                        <vue-disqus shortname="brain-life" :identifier="selected._id"/>
                    </b-col>
                </b-row>
            </div>
        </div>

        <div v-if="tabs[tab].id == 'dataset'">
            <datasets :project="selected" :projects="projects"/>
        </div>

        <div v-if="tabs[tab].id == 'process'">
            <b-alert :show="!ismember()">Only the member of this project can access processes.</b-alert>
            <processes :project="selected" v-if="ismember()"/>
        </div>

        <div v-if="tabs[tab].id == 'pipeline'">
            <!-- <b-alert show><b>Coming Soon!</b> You will be able to view / register new pipeline rules.</b-alert>-->
            <pipelines :project="selected"/>
            <!--
            <div class="margin20">
                <p class="text-muted" v-if="!rules || rules.length == 0">No pipline registered</p>
                <div v-for="rule in rules" :key="rule._id">
                    <pre v-highlightjs><code class="json hljs">{{rule}}</code></pre>
                </div>
            </div>
            -->
        </div>

        <div v-if="tabs[tab].id == 'pub'">
            <publications :project="selected"/>
         </div>
    </div><!--page-content-->

    <!--modal-->
    <newtask-modal/>
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
import processes from '@/components/processes'
import publications from '@/components/publications'
import pipelines from '@/components/pipelines'

import VueDisqus from 'vue-disqus/VueDisqus.vue'

//modals
import newtaskModal from '@/modals/newtask'

export default {
    components: { 
        sidemenu, contactlist, project, 
        projectaccess, pageheader, contact, 
        VueMarkdown, projectavatar, license,
        projectmenu, pubcard, datasets,
        VueDisqus,
        processes, publications, pipelines,

        newtaskModal,
    },

    data () {
        return {
            selected: null, 

            tabs: [
                {id: "detail", label: "Detail"},
                {id: "dataset", label: "Datasets"},
                {id: "process", label: "Processes"},
                {id: "pipeline", label: "Pipelines"},
                {id: "pub", label: "Publications"},
            ],
            tab: 0, //current tab

            projects: null, //all projects that user has access to
            config: Vue.config,
        }
    },

    watch: {
        '$route': function() {
            //console.log("route changed");
            var project_id = this.$route.params.id;
            if(project_id && this.selected && project_id != this.selected._id) {
                this.open_project(this.projects[project_id]);
            }
            var tab_id = this.$route.params.tab;
            if(tab_id) {
                //find the tab requested
                this.tabs.forEach((tab, idx)=>{  
                    if(tab.id == tab_id) this.tab = idx; 
                });
            }         
        },

        tab: function() {
            //tab gets changed even if value doesn't change.. so I have to hve if statement like this..
            var tabid = this.tabs[this.tab].id;
            if(tabid != this.$route.params.tab) {
                console.log("tab seems to have really changed", tabid);

                //TODO - maybe make pubform a modal so that I don't have to do this.
                this.publishing = false;
                this.pub_editing = null;

                this.$router.replace("/project/"+this.selected._id+"/"+this.tabs[this.tab].id);
            }
        },
    },

    mounted: function() {
        //load all projects that user has read access
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

            //decide which project to open
            let project_id = this.$route.params.id
            if(!project_id) {
                //if no project is specified, jumpt to the first project.
                let ids = Object.keys(this.projects); 
                project_id = localStorage.getItem("last_projectid_used") || ids[0];
                this.$router.replace("/project/"+project_id);
            }
            this.open_project(this.projects[project_id]);

            //open tab requested..
            if(this.$route.params.tab) {
                //find the tab requested
                this.tabs.forEach((tab, idx)=>{  
                    if(tab.id == this.$route.params.tab) {
                        this.tab = idx; //this has an effect of *clicking* the tab..
                    }
                });
            } else {
                //if no tab is opened, open first page
                this.tab = 0;
                console.log("resetting url due to missing tab");
                this.$router.replace("/project/"+project_id+"/"+this.tabs[this.tab].id);
            }
        })
        .catch(res=>{
            console.error(res);
            this.$notify({type: 'error', text: res.body.message});
        });
    },

    methods: {
        edit: function() {
            this.$router.push('/project/'+this.selected._id+'/edit');
        },

        isadmin() {
            if(!this.selected) return false;
            if(~this.selected.admins.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        ismember() {
            if(!this.selected) return false;
            if(~this.selected.members.indexOf(Vue.config.user.sub)) return true;
            return false;
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
            this.$router.push('/project/'+project._id+'/'+this.$route.params.tab);
            this.open_project(project);
        },

        open_project: function(project) {
            if(this.selected == project) return; //no point of opening project if it's already opened
            this.selected = project;
            localStorage.setItem("last_projectid_used", project._id);
        },

        /*
        start_publish: function() {
            this.publishing = true;
        },

        publish: function(pub) {
            this.publishing = false;
            pub.project = this.selected; //pubcard needs project populated
            this.pubs.push(pub);
        }
        */
    },
}
</script>

<style scoped>
.page-content {
position: fixed;
left: 350px;
right: 0;
margin-top: 50px;
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
.pub-removed {
background-color: #aaa;
opacity: 0.6;
}
.pub:hover {
background-color: #eee;
}
</style>
