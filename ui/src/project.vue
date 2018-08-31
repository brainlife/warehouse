<template>
<div v-if="selected">
    <pageheader/>
    <sidemenu active="/projects"/>
    <projectmenu :active="selected._id" :projects="projects" @change="change_project"></projectmenu>
    <div class="page-header with-menu">
        <b-tabs class="brainlife-tab" v-model="tab">
            <b-tab v-for="tabinfo in tabs" :key="tabinfo.id" :title="tabinfo.label"/>
        </b-tabs>
    </div><!--header-->
    <div class="page-content with-menu">
        <!--detail-->
        <div v-if="tabs[tab].id == 'detail'">
            <div style="padding: 20px; background-color: #f0f0f0;">
            <b-row>
                <b-col cols="2">
                    <projectavatar :project="selected"/>
                </b-col>
                <b-col cols="10" style="background-color: rgb(240, 240, 240);"><!--hide avatar when screen is narrow-->
                    <div style="float: right;" v-if="isadmin()">
                        <div @click="edit()" class="button">
                            <icon name="edit" scale="1.25"/>
                        </div>
                        <div @click="remove()" v-if="isadmin() && !selected.removed" class="button">
                            <icon name="trash" scale="1.25"/>
                        </div>
                    </div>

                    <h4 style="color: #666; margin-bottom: 10px;">
                        <projectaccess :access="selected.access"/> 
                        {{selected.name}}
                    </h4>
                    <p style="opacity: 0.8;">{{selected.desc}}</p>
                </b-col>
            </b-row>
            </div>

            <b-alert :show="selected.removed" style="border-radius: 0px" variant="warning">This project has been removed.</b-alert>
            <b-alert :show="selected.access == 'private' && selected.listed" style="border-radius: 0px" variant="secondary">This project is listed for all users but only the members of the project can access its datasets, processes, and pipelines.</b-alert>
            <div class="margin20">
                <b-row v-if="selected.agreements && selected.agreements.length > 0">
                    <b-col cols="2"> 
                        <span class="form-header">Agreements</span>
                    </b-col>
                    <b-col cols="10">
                        <p> <small class="text-muted">You must consent to the following agreement before accessing datasets on this project.</small> </p>
                        <agreements :agreements="selected.agreements"/>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Admins</span>
                    </b-col>
                    <b-col>
                        <p>
                            <small class="text-muted">Users who can update name / desc / project members, share processes, and create rules / publications.</small>
                        </p>
                        <p v-for="c in selected.admins" :key="c._id">
                            <contact :id="c"/>
                        </p>
                        <br>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col cols="2"> 
                        <span class="form-header">Members</span>
                    </b-col>
                    <b-col>
                        <p>
                            <small class="text-muted">Users who have read/write access to datasets on this project, share processes, and create rules / publications.</small>
                        </p>
                        <p v-for="c in selected.members" :key="c._id">
                            <contact :id="c"/>
                        </p>
                        <p class="text-muted" v-if="selected.members.length == 0"><small>(No Members)</small></p>
                        <br>
                    </b-col>
                </b-row>

                <b-row v-if="selected.access == 'private'">
                    <b-col cols="2"> 
                        <span class="form-header">Guests</span>
                    </b-col>
                    <b-col>
                        <p> <small class="text-muted">Users who have read access to datasets on this project.</small> </p>
                        <p v-for="c in selected.guests" :key="c._id">
                            <contact :id="c"/>
                        </p>
                        <p class="text-muted" v-if="!selected.guests || selected.guests.length == 0"><small>(No Guests)</small></p>
                        <br>
                    </b-col>
                </b-row>


                <b-row>
                    <b-col cols="2"> 
                        <span class="form-header">Readme</span>
                    </b-col>
                    <b-col cols="10">
                        <p class="text-muted" v-if="!selected.readme">Please edit README.md content</p>
                        <vue-markdown v-if="selected.readme" :source="selected.readme" class="readme"></vue-markdown>
                    </b-col>
                </b-row>

                <hr>
                <b-row>
                    <b-col cols="2">
                    </b-col>
                    <b-col>
                        <vue-disqus ref="disqus" shortname="brain-life" :identifier="selected._id"/>
                    </b-col>
                </b-row>
            </div>
        </div>

        <div v-if="tabs[tab].id == 'dataset'">
            <b-alert show v-if="selected.access != 'public' && !(ismember()||isadmin()||isguest())">For non public project, only the admin/members/guests of this project can access processes.</b-alert>
            <datasets :project="selected" :projects="projects" v-else/>
        </div>

        <div v-if="tabs[tab].id == 'process'">
            <b-alert show v-if="!(ismember()||isadmin())">Only the admins or members of this project can access processes.</b-alert>
            <processes :project="selected" v-else/>
        </div>

        <div v-if="tabs[tab].id == 'pipeline'">
            <b-alert show v-if="!(ismember()||isadmin())">Only the admins or members of this project can access pipelines.</b-alert>
            <pipelines :project="selected" v-else/>
        </div>

        <div v-if="tabs[tab].id == 'pub'">
            <publications :project="selected"/>
         </div>
    </div><!--page-content-->

    <newtask-modal/>
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'
import VueMarkdown from 'vue-markdown'

import sidemenu from '@/components/sidemenu'
import contactlist from '@/components/contactlist'
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
import agreements from '@/components/agreements'

//modals
import newtaskModal from '@/modals/newtask'

export default {
    components: { 
        sidemenu, contactlist, 
        projectaccess, pageheader, contact, 
        VueMarkdown, projectavatar, license,
        projectmenu, pubcard, datasets,
        processes, publications, pipelines,
        agreements,

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

            projects: null, //all projects that user can see summary of
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
        //load all projects that user has summary access (including removed ones so we can open it)
        this.$http.get('project')
        .then(res=>{
            this.projects = {};
            res.body.projects.forEach((p)=>{
                this.projects[p._id] = p;
            });

            //decide which project to open
            let project_id = this.$route.params.id
            if(!this.projects[project_id]) project_id = null; //invalid project id specified?
            if(!project_id) {
                //if no project id is specified, use last_projectid_used
                let ids = Object.keys(this.projects); 
                project_id = localStorage.getItem("last_projectid_used");
                if(!this.projects[project_id]) project_id = ids[0];
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

        isguest() {
            if(!this.selected) return false;
            if(~this.selected.guests.indexOf(Vue.config.user.sub)) return true;
            return false;
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

            //https://github.com/ktquez/vue-disqus/issues/11#issuecomment-354023326
            if(this.$refs.disqus) {
                console.log("resetting disqus", this.selected._id);
                this.$refs.disqus.reset(window.DISQUS);
            }
        },
    },
}
</script>

<style scoped>
.page-header {
border-bottom: 1px solid #ccc;
overflow: hidden;
background-color: white;
z-index: 1;
}
.page-content {
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

.pub-removed {
background-color: #aaa;
opacity: 0.6;
}
.pub:hover {
background-color: #eee;
}
</style>
