<template>
<div v-if="selected">
    <sidemenu active="/projects"/>
    <div class="page-header">
        <div style="float: right;">
            <div @click="openneuro()" v-if="selected.openneuro" class="button">
                <icon name="external-link-alt" scale="1.25"/>
                OpenNeuro
            </div>
            <div @click="edit()" v-if="isadmin()" class="button">
                <icon name="edit" scale="1.25"/>
            </div>
        </div>
        <div @click="back()" class="button button-page">
            <icon name="angle-left" scale="1.25"/>
        </div>
        <h4>
            <!--<icon name="shield-alt" scale="1.5"  style="position: relative; top: -2px; opacity: 0.8;"/>-->
            <!--<projectavatar :project="selected" :width="50" :height="50" style="position: absolute; top: 0; left: 0;"/>-->
            <projectaccess :access="selected.access"/> 
            {{selected.name}}
        </h4>
    </div>
    <div class="sub-header">
        <b-tabs class="brainlife-tab" v-model="tab">
            <!--without setting active="true" on active tab, b-tabs emits change event back to tab 0 at mount-->
            <b-tab v-for="(tabinfo, idx) in tabs" :key="tabinfo.id" :title="tabinfo.label" :active="tab == idx"/>
        </b-tabs>
    </div>
    <div class="page-content">
        <!--detail-->
        <div v-if="tabs[tab].id == 'detail'">
            <div class="project-header">
                <b-row>
                    <b-col cols="3">
                        <projectavatar :project="selected"/>
                    </b-col>
                    <b-col cols="9"><!--hide avatar when screen is narrow-->
                        <p style="opacity: 0.8;">{{selected.desc||'no description.'}}</p>
                    </b-col>
                </b-row>
            </div>

            <b-alert :show="selected.removed" style="border-radius: 0px" variant="secondary">This project has been removed.</b-alert>
            <b-alert :show="selected.access == 'private' && selected.listed" style="border-radius: 0px; color: #888;" variant="secondary">
                This project is listed for all users but only the members of the project can access its datasets, processes, and pipelines.
            </b-alert>
            
            <b-alert v-if="selected.stats && selected.stats.datasets && selected.stats.datasets.size < selected.quota" show variant="danger">
                This project is currently over quota for archive storage. 
                (<b>{{selected.stats.datasets.size|filesize}}</b> stored with <b>{{selected.quota|filesize}}</b> project quota)
                Please remove any data derivatives that are no longer needed for subsequent data processing. You may not be able to 
                archive new output datasets on this project. 
            </b-alert>

            <div style="margin: 20px;">
                <b-row>
                    <b-col cols="3" class="sideinfo">
                        <!-- seems redundant with datasets section
                        <div class="datatypes">
                            <div class="datatypes-header">Datatypes</div>
                            <datatypetag v-for="datatype_id in selected.stats.datasets.datatypes" :key="datatype_id" :datatype="datatype_id" style="margin-right: 3px; margin-bottom: 3px;"/>
                        </div>
                        -->
                        <p class="info">
                            <icon name="calendar"/>
                            {{new Date(selected.create_date).toLocaleDateString()}}
                        </p>
                        <div v-if="selected.stats">
                            <p class="info" v-if="selected.stats.datasets && selected.stats.datasets.subject_count">
                                <icon name="users"/>
                                {{selected.stats.datasets.subject_count}} <span style="opacity: 0.6">Subjects</span>
                            </p>                           
                            <p class="info" v-if="selected.stats.datasets && selected.stats.datasets.count">
                                <icon name="cubes"/>     
                                {{selected.stats.datasets.count}} <span style="opacity: 0.6">Datasets</span>
                            </p>
                            <p class="info" v-if="selected.stats.datasets && selected.stats.datasets.size">                           
                                <span>{{selected.stats.datasets.size|filesize}}</span> <span style="opacity: 0.6">Total</span> 
                                <br>                          
                                <span>{{selected.quota|filesize}}</span> <span style="opacity: 0.6">Quota</span> 
                            </p>
                            <p class="info" v-if="selected.stats.rules">
                                <icon name="robot"/>
                                {{selected.stats.rules.active}} 
                                <!--<span v-if="selected.stats.rules.inactive">/ {{selected.stats.rules.inactive}}</span>-->
                                <span style="opacity: 0.6">Pipeline Rules</span>
                            </p>
                            <p class="info"  v-if="!selected.openneuro && selected.stats.instances && Object.keys(selected.stats.instances).length > 0">
                                <icon name="paper-plane"/>
                                <stateprogress :states="selected.stats.instances"/>
                            </p>
                        </div>
                    </b-col>

                    <b-col cols="9">
                        <!--
                        <div v-if="!selected.openneuro && selected.stats.instances && Object.keys(selected.stats.instances).length > 0">
                            <span class="form-header">Processes</span>
                            <p>
                                <small class="text-muted">Processes are used to run analysis.</small>
                            </p>
                            <p>
                                <stateprogress :states="selected.stats.instances"/>
                            </p>
                        </div>
                        -->

                        <div v-if="selected.agreements && selected.agreements.length > 0">
                            <span class="form-header">Agreements</span>
                            <p> <small class="text-muted">You must consent to the following agreement(s) before accessing datasets on this project.</small> </p>
                            <agreements :agreements="selected.agreements"/>
                            <br>
                        </div>

                        <div>
                            <span class="form-header">Admins</span>
                            <p>
                                <small class="text-muted">Users who can update name / desc / project members, share processes, and create rules / publications.</small>
                            </p>
                            <p v-for="c in selected.admins" :key="c._id">
                                <contact :id="c"/>
                            </p>
                            <br>
                        </div>

                        <div>
                            <span class="form-header">Members</span>
                            <p>
                                <small class="text-muted">Users who have read/write access to datasets on this project, share processes, and create rules / publications.</small>
                            </p>
                            <p v-for="c in selected.members" :key="c._id">
                                <contact :id="c"/>
                            </p>
                            <p class="text-muted" v-if="selected.members.length == 0"><small>(No Members)</small></p>
                            <br>
                        </div>

                        <div v-if="selected.access == 'private'">
                            <span class="form-header">Guests</span>
                            <p> <small class="text-muted">Users who have read access to datasets on this project.</small> </p>
                            <p v-for="c in selected.guests" :key="c._id">
                                <contact :id="c"/>
                            </p>
                            <p class="text-muted" v-if="!selected.guests || selected.guests.length == 0"><small>(No Guests)</small></p>
                            <br>
                        </div>

                        <div v-if="selected.readme">
                            <span class="form-header">Readme</span>
                            <p class="text-muted" v-if="!selected.readme">No readme</p>
                            <vue-markdown v-if="selected.readme" :source="selected.readme" class="readme box"></vue-markdown>
                            <br>
                        </div>
                        
                        <div v-if="selected.datatype_groups">
                            <span class="form-header">Datasets</span>
                            <p class="text-muted">This project currently contains the following datasets</p>
                            <b-card-group deck v-for="(group, datatype_id) in selected.datatype_groups" :key="datatype_id" style="margin-bottom: 10px;">
                                <b-card header-tag="header">
                                    <div slot="header">
                                        <datatypetag :datatype="datatypes[datatype_id]"/>
                                        <b>{{group.count}}</b> datasets <small style="opacity: 0.8">({{group.size|filesize}})</small>
                                        on <b>{{group.subjects.size}}</b> subjects
                                    </div>

                                    <!--<p style="opacity: 0.5; margin-bottom: 5px">Tags</p>-->
                                    <b-list-group>
                                        <b-list-group-item v-for="(stats, tags_s) in group.datatype_tags" :key="tags_s" >
                                            <datatypetag :datatype="datatypes[datatype_id]" :tags="JSON.parse(tags_s)"/>
                                            <b>{{stats.count}}</b> datasets                             
                                        </b-list-group-item>
                                    </b-list-group>

                                    <p style="opacity: 0.3">
                                        TODO.. show product.json info
                                    </p>
                    
                                </b-card>
                            </b-card-group>
                        </div>

                    </b-col>
                </b-row>
                <hr>
                <b-row>
                    <b-col cols="3">
                    </b-col>
                    <b-col cols="9">
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
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">Only the admins or members of this project can access processes. Please contact the project admins to give you access.</b-alert>
            <processes :project="selected" v-else/>
        </div>

        <div v-if="tabs[tab].id == 'pipeline'">
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">Only the admins or members of this project can access pipelines. Please contact the project admin to give you access.</b-alert>
            <pipelines :project="selected" v-else/>
        </div>

        <div v-if="tabs[tab].id == 'pub'">
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">Only the admins or members of this project can access publications. Please contact the project admin to give you access.</b-alert>
            <publications :project="selected" v-else/>
         </div>
    </div><!--page-content-->

    <newtask-modal/>
    <datatypeselecter-modal/>
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'
import VueMarkdown from 'vue-markdown'

import sidemenu from '@/components/sidemenu'
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
import datatypetag from '@/components/datatypetag'
import stateprogress from '@/components/stateprogress'

//modals
import newtaskModal from '@/modals/newtask'
import datatypeselecterModal from '@/modals/datatypeselecter'

export default {
    components: { 
        sidemenu, 
        projectaccess, pageheader, contact, 
        VueMarkdown, projectavatar, license,
        projectmenu, pubcard, datasets,
        processes, publications, pipelines,
        agreements, datatypetag,

        newtaskModal, datatypeselecterModal, stateprogress,
    },

    data () {
        return {
            selected: null, 

            tabs: [
                {id: "detail", label: "Detail"},
                {id: "dataset", label: "Archive"},
                {id: "process", label: "Processes"},
                {id: "pipeline", label: "Pipelines"},
                {id: "pub", label: "Publications"},
            ],

            tab: 0, //initial tab
            projects: null, //all projects that user can see summary of
            config: Vue.config,

            datatypes: {}, //datatypes loadded (used by datatype_groups)
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
                    if(tab.id == tab_id) {
                        this.tab = idx; 
                    }
                });
            }         
        },

        tab: function() {
            //tab gets changed even if value doesn't change.. so I have to hve if statement like this..
            console.log(this.tab, this.tabs);
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

    mounted() {
        //load all projects that user has summary access (including removed ones so we can open it)
        this.$http.get('project', {params: {
            limit: 500,
            select: '-readme'
        }}).then(res=>{
            this.projects = {};
            res.data.projects.forEach((p)=>{
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
                //this.$router.replace("/project/"+project_id);
            }
            this.open_project(this.projects[project_id]);
    
            //open tab requested..
            if(this.$route.params.tab) {

                //find the tab requested
                this.tabs.forEach((tab, idx)=>{  
                    if(tab.id == this.$route.params.tab) {
                        console.log("setting tab", idx);
                        this.tab = idx; //this has an effect of *clicking* the tab..
                    }
                });
            } else {
                //if no tab is opened, open first pag
                console.log("resetting url due to missing tab");
                this.$router.replace("/project/"+project_id+"/"+this.tabs[this.tab].id);
            }
        })
        .catch(res=>{
            console.error(res);
            this.$notify({type: 'error', text: res.data.message});
        });
    },

    methods: {
        edit() {
            this.$router.push('/project/'+this.selected._id+'/edit');
        },

        back() {
            this.$router.push('/projects');
        },

        openneuro() {
            document.location = "https://openneuro.org/datasets/"+this.selected.openneuro.dataset_id;
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

        remove() {
            if(confirm("Do you really want to remove this project?")) {
                this.$http.delete('project/'+this.selected._id)
                .then(res=>{
                    this.selected.removed = true;
                    this.$router.push('/project');        
                });
            }
        },

        change_project(project) {
            console.log("change project");
            this.$router.push('/project/'+project._id+'/'+this.$route.params.tab);
            this.open_project(project);
        },

        open_project(project) {
            if(this.selected == project) return; //no point of opening project if it's already opened
            this.selected = project;
            this.$http.get('project', {params: {
                find: JSON.stringify({
                    _id: project._id,
                }),
            }}).then(res=>{
                let full_project = res.data.projects[0];
                for(var key in full_project) {
                    this.selected[key] = full_project[key];
                }
                localStorage.setItem("last_projectid_used", project._id);

                //https://github.com/ktquez/vue-disqus/issues/11#issuecomment-354023326
                if(this.$refs.disqus && window.DISQUS) {
                    this.$refs.disqus.reset(window.DISQUS);
                }
            });

            //load list of datatypes stored in this project
            let groups = {};
            this.$http.get('dataset/inventory', {params: {
                find: JSON.stringify({
                    removed: false,
                    project: project._id,
                }),
            }})
            .then(res=>{
                //group datasets by datatype
                res.data.forEach(rec=>{
                    let subject = rec._id.subject;
                    let datatype = rec._id.datatype;
                    let datatype_tags = rec._id.datatype_tags;
                    let datatype_tags_s = JSON.stringify(rec._id.datatype_tags);
                    if(!groups[datatype]) {
                        groups[datatype] = { size: 0, count:0, datatype_tags: {}, subjects: new Set()};
                    }
                    if(!groups[datatype].datatype_tags[datatype_tags_s]) {
                        groups[datatype].datatype_tags[datatype_tags_s] = {size: 0, count: 0};
                    }
                    groups[datatype].subjects.add(subject);
                    let name = datatype+"."+datatype_tags.join(":");
                    groups[datatype].datatype_tags[datatype_tags_s].size += rec.size;
                    groups[datatype].datatype_tags[datatype_tags_s].count += rec.count;
                    groups[datatype].size += rec.size;
                    groups[datatype].count += rec.count;
                });

                //load datatype details
                return this.$http.get('datatype', {params: {
                    find: JSON.stringify({_id: {$in: Object.keys(groups)}}),
                }});
            }) 
            .then(res=>{
                res.data.datatypes.forEach((d)=>{
                    this.datatypes[d._id] = d;
                });

                Vue.set(this.selected, "datatype_groups", groups);
                this.$forceUpdate();
            }).catch(console.error);
        },
        getvariant(state) {
            switch(state) {
            case "running": return "primary";
            case "requested": return "info";
            case "finished": return "success";
            case "stopped": return "secondary";
            case "failed": return "danger";
            default: return "dark";
            }
        },
    },
}
</script>

<style scoped>
.page-header {
padding: 10px 20px;    
}

.page-header h4 {
margin-right: 150px; 
}

.sub-header {
position: fixed;
top: 50px;
height: 45px;
left: 200px;  
right: 0px; 
background-color: white; 
box-shadow: 0px 0px 2px #ccc;
z-index: 1;
}
.page-content {
top: 95px;
}

.project-header {
padding: 20px; 
box-shadow: 0 0 2px #aaa;
background-color: #eee;
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
.box {
background-color: white;
padding: 20px;
box-shadow: 2px 2px 3px #eee;
margin-left: -20px;
margin-top: 10px;
}
.button-page {
float: left;
position: relative;
left: -10px;
z-index: 1;
}

p.info {
position: relative;
margin-left: 25px;
}
p.info .fa-icon {
position: absolute;
left: -25px;
top: 2px;
}
.datatypes {
padding: 10px;
box-shadow: 1px 1px 3px #ddd;
margin-bottom: 10px;
}
.datatypes .datatypes-header {
opacity: 0.5; 
font-weight: bold; 
font-size: 85%;
margin-bottom: 5px; 
text-transform: uppercase;    
}
</style>
