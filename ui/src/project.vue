<template>
<div v-if="selected">
    <pageheader/>
    <sidemenu active="/projects"/>
    <projectmenu :active="selected._id" :projects="projects" @change="change_project"></projectmenu>
    <div class="header">
        <b-tabs class="brainlife-tab" v-model="tab" @input="tab_change">
            <b-tab v-for="tabinfo in tabs" :key="tabinfo.id" :title="tabinfo.label"/>
        </b-tabs>
    </div><!--header-->
    <div class="page-content">
        <div class="margin20">

            <!--detail-->
            <div v-if="tabs[tab].id == 'detail'">
                <b-row>
                    <b-col cols="2">
                        <projectavatar :project="selected"/>
                    </b-col>
                    <b-col>
                        <div style="float: right;" v-if="selected._canedit">
                            <div @click="remove()" v-if="!selected.removed" class="button button-danger">
                                <icon name="trash" scale="1.25"/>
                            </div>
                            <div @click="edit()" class="button">
                                <icon name="pencil" scale="1.25"/>
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

                <b-row>
                    <b-col cols="2">
                        <b class="text-muted">Admins</b>
                    </b-col>
                    <b-col>
                        <p v-for="c in selected.admins" :key="c._id">
                            <contact :id="c"/>
                        </p>
                        <p class="text-muted">Users who can update name / desc / project members</p>
                    </b-col>
                </b-row>
                
                <b-row>
                    <b-col cols="2"> 
                        <b class="text-muted">Members</b>
                    </b-col>
                    <b-col>
                        <p v-for="c in selected.members" :key="c._id">
                            <contact :id="c"/>
                        </p>
                        <p class="text-muted">Users who can update datasets published on this project</p>
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

            <div v-if="tabs[tab].id == 'dataset'">
                <datasets :project="selected"></datasets>
            </div>

            <div v-if="tabs[tab].id == 'process'">
                <b-alert show>
                    <b>Coming Soon!</b> 
                    Processes page will be moved here soon by organizing each process under a specific project.
                    For now please visit the old processes page via the left hand side menu.
                </b-alert>
            </div>

            <div v-if="tabs[tab].id == 'pipeline'">
                <b-alert show><b>Coming Soon!</b> You will be able to view / register new pipeline rules.</b-alert>
                <p class="text-muted" v-if="!rules || rules.length == 0">No pipline registered</p>
                <div v-for="rule in rules" :key="rule._id">
                    <pre v-highlightjs><code class="json hljs">{{rule}}</code></pre>
                </div>
            </div>

            <div v-if="tabs[tab].id == 'pub'">
                <div v-if="publishing">
                    <h3 style="opacity: 0.7">New Publication</h3>
                    <publisher :project="selected" @close="publishing = false" @submit="publish"/>
                </div>
                <div v-else-if="pub_editing">
                    <h3 style="opacity: 0.7">Edit Publication</h3>
                    <p style="opacity: 0.7">Only the publication metadata can be edited at this time. To update published datasets, please contact administrator.</p>
                    <pubform :pub="pub_editing" @submit="save_pub">
                        <button type="button" class="btn btn-secondary" @click="tab_change()">Cancel</button>
                    </pubform>
                </div>
                <div v-else>
                    <b-card no-body>
                        <b-list-group flush>
                            <b-list-group-item v-for="pub in pubs" :key="pub._id" :class="{'pub-removed': pub.removed}">
                                <b-row>
                                <b-col>
                                    <b-badge v-if="pub.removed" variant="danger">Removed</b-badge>
                                    <b>{{pub.name}}</b><br>
                                    <p style="opacity: 0.8;">{{pub.desc}}</p>
                                </b-col>
                                <b-col cols="2">
                                    <div class="button" style="float: right;" @click.stop="edit_pub(pub)">
                                        <icon name="pencil"/>
                                    </div>
                                    <div class="button" style="float: right;" @click.stop="open_pub(pub)">
                                        <icon name="eye"/>
                                    </div>
                                    <span style="clear: right; float: right; opacity: 0.7;"><b>{{new Date(pub.create_date).toLocaleDateString()}}</b></span>
                                    <!--
                                    <contact :id="pub.user_id"/>     
                                    -->
                                </b-col>
                                </b-row>
                            </b-list-group-item>
                        </b-list-group>
                        <p class="text-muted" style="margin: 20px;" v-if="!pubs || pubs.length == 0">No publication registered for this project</p>
                    </b-card>

                    <!--space to make sure add button won't overwrap the pub list-->
                    <p style="padding-top: 100px;">&nbsp;</p>
                    <b-button v-if="selected._canedit" class="button-fixed" @click="start_publish" title="Create new publication"><icon name="plus" scale="2"/></b-button>
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
import publisher from '@/components/publisher'
import pubform from '@/components/pubform'

import VueDisqus from 'vue-disqus/VueDisqus.vue'

export default {
    components: { 
        sidemenu, contactlist, project, 
        projectaccess, pageheader, contact, 
        VueMarkdown, projectavatar, license,
        projectmenu, pubcard, datasets,
        publisher, pubform, VueDisqus,
    },

    data () {
        return {
            selected: null, 
            rules: null, 
            pubs: null, 

            publishing: false,
            pub_editing: null,

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
            this.parse_params();
            this.parse_sub_params();
        }
    },

    mounted: function() {

        /*
        this.$root.$on("dataset.close", ()=>{
            console.log("project.view receivved dataset.close");
            this.$router.replace("/project/"+this.selected._id+"/"+this.tabs[this.tab].id);
        });
        */

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
        .catch(res=>{
            this.$notify({type: 'error', text: res.body});
        });
    },

    methods: {
        edit: function() {
            this.$router.push('/project/'+this.selected._id+'/edit');
        },

        save_pub: function(pub) {
            this.$http.put('pub/'+pub._id, pub)
            .then(res=>{
                this.$notify("Successfully updated!");
                for(var k in res.body) {
                    this.pub_editing[k] = res.body[k];
                }
                this.tab_change();
            }).catch(res=>{
                this.$notify({type: 'error', text: res.body});
            });
        },

        open_pub: function(pub) {
            document.location = "/pub/"+pub._id;
        },

        edit_pub: function(pub) {
            this.$router.push("/project/"+this.selected._id+"/pub/"+pub._id);
            this.pub_editing = pub;
        },

        tab_change: function() {
            console.log("tab updated");
            this.publishing = false;
            this.pub_editing = null;
            this.$router.push("/project/"+this.selected._id+"/"+this.tabs[this.tab].id);
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
            this.$router.replace("/project/"+project._id+"/"+this.tabs[this.tab].id);
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
                this.tabs.forEach((tab, idx)=>{  
                    if(tab.id == this.$route.params.tab) this.tab = idx;
                });
            } else {
                this.$router.replace("/project/"+project_id+"/detail");
            }
        },

        parse_sub_params: function() {
            //handle subid
            this.publishing = false;
            this.pub_editing = null;
            if(this.$route.params.subid) {
                let subid = this.$route.params.subid;
                let tab = this.tabs[this.tab];
                switch(tab.id) {
                case "dataset":
                    //request dataset modal to load subid
                    this.$root.$emit('dataset.view', subid);
                    break;
                case "pub":
                    this.pub_editing = this.pubs.find(pub=>{return pub._id == subid});
                    break;
                } 
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
                this.parse_sub_params();
            }).catch(res=>{
                this.$notify({type: 'error', text: res.body});
            });
        },

        start_publish: function() {
            this.publishing = true;
        },

        publish: function(pub) {
            this.publishing = false;
            pub.project = this.selected; //pubcard needs project populated
            this.pubs.push(pub);
        }
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
