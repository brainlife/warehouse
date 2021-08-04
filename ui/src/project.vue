<template>
<div>
    <div v-if="error" class="page-content error">{{error}}</div>
    <div v-if="selected">
        <div class="page-header">
            <div style="float: right;">
                <div @click="edit()" v-if="isadmin()" class="button" title="Edit project details">
                    <icon name="edit" scale="1.25"/>
                </div>
            </div>
            <h4>
                <projectaccess :access="selected.access" style="position: relative; top: -3px;"/> 
                {{selected.name}}
            </h4>
        </div>
        <div class="page-content top-tabs">
            <b-tabs class="brainlife-tab" v-model="tab">
                <!--without setting active="true" on active tab, b-tabs emits change event back to tab 0 at mount-->
                <b-tab v-for="(tabinfo, idx) in tabs" :key="tabinfo.id" :title="tabinfo.label" :active="tab == idx">
                    <template v-slot:title>
                        {{tabinfo.label}}

                        <!--let's show tab specific info-->
                        <span v-if="tabinfo.id == 'detail'">
                        </span>
                        
                        <span v-if="tabinfo.id == 'dataset'" style="opacity: 0.6; font-size: 80%;">
                            <span title="Number of subjects stored in archive" 
                                v-if="selected.stats && selected.stats.datasets && selected.stats.datasets.subject_count">
                               &nbsp;<icon name="user-friends" scale="0.8"/>&nbsp;&nbsp;{{selected.stats.datasets.subject_count}} 
                            </span>
                            <span title="Number of data-objects stored in archive"
                                v-if="selected.stats && selected.stats.datasets && selected.stats.datasets.count">
                                &nbsp;<icon name="cubes" scale="0.8"/>&nbsp;&nbsp;{{selected.stats.datasets.count}}
                            </span>
                        </span>
                        
                        <span v-if="tabinfo.id == 'process'" title="Number of tasks" style="opacity: 0.8;"> 
                            <div v-if="selected.stats && get_total(selected.stats.instances) > 0" style="display: inline-block; width: 75px;">
                                <stateprogress :states="selected.stats.instances"/>
                            </div>
                        </span>
                        
                        <span v-if="tabinfo.id == 'pipeline' && selected.stats && selected.stats.rules && (selected.stats.rules.active||selected.stats.rules.inactive)" 
                            title="Number of pipeline rules" style="opacity: 0.6; font-size: 80%;">
                            &nbsp;{{selected.stats.rules.active}} <small>/ {{selected.stats.rules.active + selected.stats.rules.inactive}}</small>
                        </span>

                        <span v-if="tabinfo.id == 'groupanalysis' && selected.stats && selected.stats.groupanalysis && selected.stats.groupanalysis.sessions.length > 0" 
                            title="Number of analysis sessions" style="opacity: 0.6; font-size: 80%;">
                            &nbsp;{{selected.stats.groupanalysis.sessions.length}}
                        </span>

                        <span v-if="tabinfo.id == 'pub' && selected.stats && selected.stats.publications > 0" style="opacity: 0.6; font-size: 80%;">
                            &nbsp;{{selected.stats.publications}}
                        </span>
                    </template>
                </b-tab>
            </b-tabs>
        </div>

        <div v-if="tabs[tab].id == 'detail'">
            <div class="page-content">
                <!--detail-->

                <b-alert :show="selected.removed" style="border-radius: 0px; color: #888;" variant="secondary">This project has been removed.</b-alert>
                <b-alert :show="selected.access == 'private' && selected.listed" style="border-radius: 0px; color: #888;" variant="secondary">
                    This project is listed for all users but only the members of the project can access its datasets, processes, and pipelines.
                </b-alert>

                <div class="project-header">

                    <div class="side" v-if="selected.stats">
                        <projectavatar :project="selected" :height="140" :width="140" style="float: right; margin: -20px 100px 30px 30px;"/>

                        <div v-if="selected.importedDLDatasets && selected.importedDLDatasets.length">
                            <span class="form-header">Data Source</span>
                            <p style="margin-bottom: 5px;"><small>This project contains data imported from the following sources.</small></p>
                            <p v-for="rec in selected.importedDLDatasets" :key="rec._id" style="margin-bottom: 3px">
                                <!--
                                <small>{{rec.dataset_description}}</small>
                                <small>{{rec.stats}}</small>
                                -->
                                <b style="font-size: 85%">{{rec.dataset_description.DatasetDOI||rec.path}}</b><br>
                                <small>{{rec.dataset_description.Name}}</small>
                            </p>
                            <br>
                            <br>
                        </div>

                        <span class="form-header">Datatypes</span>
                        <p style="margin-bottom: 5px;"><small>This project contains the following datatypes</small></p>
                        <div v-if="selected.stats.datasets.datatypes_detail">
                            <p v-for="detail in selected.stats.datasets.datatypes_detail" :key="detail.type" style="margin-bottom: 3px;">
                                <datatypetag :datatype="detail.type" style="font-size: 85%"/>&nbsp;
                                <small style="opacity: 0.6;">
                                    <!-- <icon name="user-friends"/> {{detail.subject_count}} -->
                                    ({{detail.count}} objs <span v-if="detail.size"> | {{detail.size|filesize}}</span>)
                                </small>
                            </p>
                        </div>
                    </div>

                    <div class="main">
                        <p style="line-height: 2.5em; margin-bottom: 0px; position: relative; top: -8px">
                            <b-badge pill class="bigpill" title="Project creation date">
                                <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;
                                {{new Date(selected.create_date).toLocaleDateString()}}
                            </b-badge>
                            <b-badge pill class="bigpill" title="Total size of data stored in archive"
                                v-if="selected.stats && selected.stats.datasets && selected.stats.datasets.size">
                                <icon name="folder" style="opacity: 0.4;"/>&nbsp;&nbsp;{{selected.stats.datasets.size|filesize}}
                                <small>Total</small> <br>
                            </b-badge>
                            <b-badge pill class="bigpill" v-if="selected.stats && selected.stats.rules && selected.stats.rules.active > 0" title="Number of pipeline rules configured for this project">
                                <icon name="robot" style="opacity: 0.4;"/>&nbsp;&nbsp;{{selected.stats.rules.active}}
                                <small>Active Pipeline Rules</small>
                            </b-badge>
                            <b-badge pill class="bigpill" title="Total CPU hours consumed by this project">
                                <icon name="server" style="opacity: 0.4;"/>&nbsp;&nbsp;{{(total_walltime/(3600*1000))|formatNumber}}
                                <small>CPU Hours</small>
                            </b-badge>
                            <b-badge pill class="bigpill" title="Group ID used by amaretti">
                                <icon name="id-badge" style="opacity: 0.4;"/>&nbsp;&nbsp;{{selected.group_id}}
                                <small>Group ID</small>
                            </b-badge>
                        </p>

                        <p style="opacity: 0.8; margin-bottom: 0; line-height: 180%;">
                            {{selected.desc||'no description.'}}
                        </p>
                        <br>

                        <div v-if="selected.agreements && selected.agreements.length > 0">
                            <span class="form-header">Agreements</span>
                            <p> <small class="text-muted">You must consent to the following agreement(s) before accessing data on this project.</small> </p>
                            <agreements :agreements="selected.agreements"/>
                            <br>
                        </div>

                        <b-row>
                            <b-col lg>
                                <span class="form-header">Admins</span>
                                <p class="text-muted" v-if="selected.admins.length == 0"><small>No Admins</small></p><!--only happens on dev?-->
                                <p v-else>
                                    <contact v-for="c in selected.admins" :key="c._id" :id="c" size="small" style="line-height: 150%;"/>
                                </p>
                                <small class="text-muted">Admins can update project details, share processes, and create pipeline rules / publications.</small>
                                <br>
                            </b-col>

                            <b-col lg>
                                <span class="form-header">Members</span>
                                <p class="text-muted" v-if="selected.members.length == 0"><small>No Members</small></p>
                                <p v-else>
                                    <contact v-for="c in selected.members" :key="c._id" :id="c" size="small" style="line-height: 150%;"/>
                                </p>
                                <small class="text-muted">Members have read/write access to archived data, processes, and create pipeline rules / publications.</small>
                                <br>
                            </b-col>

                            <b-col lg v-if="config.user && selected.access == 'private' && selected.guests && selected.guests.length > 0">
                                <span class="form-header">Guests</span>
                                <p style="height: 50px; margin-bottom: 3px;">
                                    <small class="text-muted">has read access to data.</small>
                                </p>
                                <contact v-for="c in selected.guests" :key="c._id" :id="c" size="small" style="line-height: 150%;"/>
                                <br>
                            </b-col>
                        </b-row>
                        <br>
                        <br>

                        <div v-if="selected.xnat.enabled" style="background-color: #eee; padding: 10px; border-radius: 10px">
                            <span class="form-header">XNAT Integration</span>
                            <p>
                                <small>Data Archive on this project is mapped to the XNAT instance</small>
                            </p>
                            <b-row>
                                <b-col sm="3"><span class="form-sub-header">XNAT Hostname</span></b-col>
                                <b-col><pre>{{selected.xnat.hostname}}</pre></b-col>
                            </b-row>
                            <br>
                            <b-row>
                                <b-col sm="3"><span class="form-sub-header">XNAT Project</span></b-col>
                                <b-col><b>{{selected.xnat.project}}</b></b-col>
                            </b-row>
                            <br>
                            <b-row>
                                <b-col sm="3"><span class="form-sub-header">SCAN Mapping</span></b-col>
                                <b-col>
                                    <b-row>
                                        <b-col>
                                            <small>XNAT Scan</small>
                                        </b-col>
                                        <b-col sm="1"> </b-col>
                                        <b-col>
                                            <small>Brainlife Datatype</small>
                                        </b-col>
                                    </b-row>
                                    <hr style="margin: 5px;">
                                    <b-row v-for="(map, idx) in selected.xnat.scans" :key="idx">
                                        <b-col>
                                            <b>{{map.scan}}</b>
                                        </b-col>
                                        <b-col sm="1"> ➜ </b-col>
                                        <b-col>
                                            <datatypetag :datatype="map.datatype" :tags="map.datatype_tags"/>
                                        </b-col>
                                    </b-row>

                                    <br>
                                    <p>
                                        <small>brainlife.io will perodically crawl XNAT and update object listed in archive. If you'd like to load the objects now, please click this button.</small><br>
                                        <b-button size="sm" @click="loadXNATObjects">Load Objects</b-button>
                                    </p>

                                </b-col>

                            </b-row>
                        </div>
                        <br>

                        <b-tabs class="brainlife-tab sub-tab" v-model="detailTab">
                            <b-tab title="README" active/>
                            <b-tab>
                                <template v-slot:title>
                                    <span>
                                        <b-badge v-if="!selected.publishParticipantsInfo"
                                            variant="secondary" title="May contains sensitive information. Please do not share!"><icon name="lock" scale="0.8"/></b-badge>
                                        Participant Info <small v-if="participants">{{Object.keys(participants).length}}</small>
                                    </span>
                                </template>
                            </b-tab>

                            <b-tab>
                                <template v-slot:title>
                                    App/Resource Usage
                                </template>
                            </b-tab>

                            <b-tab>
                                <template v-slot:title>
                                    Related Articles
                                    <small v-if="selected.relatedPapers">{{selected.relatedPapers.length}}</small>
                                </template>
                            </b-tab>

                            <b-tab title="Disqus"/>
                        </b-tabs>

                        <!--readme-->
                        <div v-if="detailTab == 0">
                            <vue-markdown v-if="selected.readme" :source="selected.readme" class="readme"></vue-markdown>
                            <p v-else><small>No README entered.</small></p>
                        </div>

                        <!--participants-->
                        <div v-if="detailTab == 1">
                            <p><small>Participants info provides information for each subject and can be used for the group analysis.</small></p>                        
                            <b-alert variant="secondary" :show="selected.publishParticipantsInfo" style="margin-bottom: 15px;">This information will be published as part of all publications made from this project.</b-alert>
                            <participants v-if="participants && Object.keys(participants).length" :rows="participants" :columns="participants_columns" style="overflow: auto; max-height: 500px;"/>
                        </div>

                        <!--app info-->
                        <div v-if="detailTab == 2">

                            <div v-if="selected.stats.apps && selected.stats.apps.length > 0">
                                <span class="form-header">App Usage</span>
                                <p><small>The following Apps were used to generate the data in this project</small></p>                        
                                <b-row style="border-bottom: 1px solid #eee; margin-bottom: 10px;">
                                    <b-col cols="10"><!--<small>Apps</small>--></b-col>
                                    <b-col cols="2">Execution Count</b-col>
                                </b-row>
                                <b-row v-for="rec in selected.stats.apps" :key="rec._id">
                                    <b-col cols="10">
                                        <div style="margin-bottom: 10px; border-left: 3px solid #f0f0f0; border-bottom: 1px solid #eee;">
                                            <app v-if="rec.app._id" :app="rec.app" :branch="rec.task.service_branch" :compact="true" :showDoi="true"/>
                                        </div>
                                    </b-col>
                                    <b-col cols="2"> <small>{{rec.count}}</small> </b-col>
                                </b-row>
                                <br>
                            </div>

                            <div v-if="resource_usage && total_walltime > 3600*1000">
                                <span class="form-header">Resource Usage</span>
                                <p><small>Data-objects on this project has been computed using the following apps/resources.</small></p>             
                                <ExportablePlotly :data="resource_usage.data" 
                                        :layout="resource_usage.layout" 
                                        :autoResize="true" 
                                        :watchShallow="true"/>
                                <br>
                            </div>

                            <!--loading citations takes time and LOCK UP THE BROWSER WHILE LOADING IT!!!-->
                            <div v-if="selected.stats.apps && selected.stats.apps.length > 0">
                                <span class="form-header">Citations</span>

                                <p><small>Please use the following citations to cite the Apps/resources used by this project.</small></p>
                                <p v-for="app in selected.stats.apps" :key="app._id">
                                    <icon name="robot" style="opacity: 0.5;"/> <b>{{app.app.name}}</b><br>
                                    <citation :doi="app.app.doi"/> 
                                </p>

                                <div v-if="resource_citations.length > 0">
                                    <p><small>Please use the following citations to cite the resources used by this project.</small></p>
                                    <p v-for="(resource_citation, idx) in resource_citations" :key="idx">
                                        <icon name="server" style="opacity: 0.5;"/> <b>{{resource_citation.resource.name}}</b><br>
                                        <!--<small>{{resource_citation.resource.config.desc}}</small>-->
                                        <i>{{resource_citation.citation}}</i>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!--related papers-->
                        <div v-if="detailTab == 3">
                            <div v-if="selected.relatedPapers && selected.relatedPapers.length > 0">
                                <p>
                                    <small>We found the following journals/articles related to this project based on name/description</small>
                                </p>
                                <mag v-for="paper in selected.relatedPapers" :key="paper._id" :paper="paper"/>
                            </div>
                        </div>

                        <div v-if="detailTab == 4">
                            <vue-disqus ref="disqus" shortname="brain-life" :identifier="selected._id"/>
                        </div>

                    </div><!-- main content-->
                </div><!--project header-->

                <div v-if="config.debug">
                    <pre>{{selected.mag}}</pre>
                    <pre>{{selected}}</pre>
                </div>
        
            </div><!-- project detail content-->
        </div>

        <div v-if="tabs[tab].id == 'dataset'" class="page-content">
            <b-alert show variant="secondary" v-if="!config.user">
                Please login to see archived data objects.
            </b-alert>
            <b-alert show variant="secondary" v-else-if="selected.access != 'public' && !(ismember()||isadmin()||isguest())">
                For non public project, only the admin/members/guests of this project can access processes.
            </b-alert>
            <datasets :project="selected"  v-else :participants="participants"/>
        </div>

        <div v-if="tabs[tab].id == 'process'" class="page-content">
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">
                Only the admins or members of this project can access processes. Please contact the project admins to give you access.
            </b-alert>
            <processes :project="selected" v-else/>
        </div>

        <div v-if="tabs[tab].id == 'pipeline'" class="page-content">
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">
                Only the admins or members of this project can access pipelines. Please contact the project admin to give you access.
            </b-alert>
            <pipelines :project="selected" v-else/>
        </div>

        <div v-if="tabs[tab].id == 'groupanalysis'" class="page-content">
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">Only the admins or members of this project can access group analysis page. Please contact the project admin to give you access.</b-alert>
            <div v-else>
                <groupAnalysis :project="selected"/>
            </div>
        </div>

        <div v-if="tabs[tab].id == 'pub'" class="page-content">
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">Only the admins or members of this project can access publications. Please contact the project admin to give you access.</b-alert>
            <publications :project="selected" v-else/>
        </div>

        <newtask-modal/>
        <datatypeselecter-modal/>
    </div>
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'
import VueMarkdown from 'vue-markdown'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import projectaccess from '@/components/projectaccess'
import projectavatar from '@/components/projectavatar'
import license from '@/components/license'
import pubcard from '@/components/pubcard'
import datasets from '@/components/datasets'
import processes from '@/components/processes'
import publications from '@/components/publications'
import pipelines from '@/components/pipelines'
import agreements from '@/components/agreements'
import stateprogress from '@/components/stateprogress'
import resource from '@/components/resource'
import datatype from '@/components/datatype'
import datatypetag from '@/components/datatypetag'
import participants from '@/components/participants'
import doibadge from '@/components/doibadge'
import mag from '@/components/mag'
import app from '@/components/app'

import newtaskModal from '@/modals/newtask'
import datatypeselecterModal from '@/modals/datatypeselecter'
import ReconnectingWebSocket from 'reconnectingwebsocket'
import citation from '@/components/citation'

let ps;

export default {
    components: { 
        projectaccess, 
        pageheader,     
        contact, 
        VueMarkdown, 
        projectavatar, 
        license,
        pubcard, 
        datasets,
        processes, 
        publications, 
        pipelines,
        agreements, 
        datatypetag, 
        participants,
        mag,
        doibadge,
        app,

        'groupAnalysis': ()=> import('@/components/groupanalysis'),

        //noprocess, 
        resource, 
        ExportablePlotly: ()=>import('@/components/ExportablePlotly'),

        newtaskModal, 
        datatypeselecterModal, 
        stateprogress,
        citation,
    },

    data () {
        return {
            selected: null, 
            resource_usage: null,
            total_walltime: 0,

            participants: null,
            participants_columns: null,

            tabs: [
                {id: "detail", label: "Detail"},
                {id: "dataset", label: "Archive"},
                {id: "process", label: "Preprocess"},
                {id: "pipeline", label: "Pipeline"},
                {id: "groupanalysis", label: "Analysis"},
                {id: "pub", label: "Publication"},
            ],
            tab: 0, //initial tab top open

            detailTab: 0, //initial tab to open for detail section

            datatypes: {}, //datatypes loadded (used by datatype_groups)

            error: null, //used to display error message while loading a project

            resource_citations: [],

            ws: null,

            config: Vue.config,

        }
    },

    watch: {
        /* needed by dataset modal > instanceselecter but it causes infinite redraw bug*/
        '$route': function() {
            var project_id = this.$route.params.id;
            if(project_id && this.selected && this.selected._id != project_id) {
                console.log("project chagned from", this.selected._id, "to", project_id)
                this.openProject(project_id);
            } else {
                this.handleRouteParams();
            }
        },

        tab: function() {
            //TODO - maybe make pubform a modal so that I don't have to do this.
            this.publishing = false;
            this.pub_editing = null;
            if(this.$route.params.tab != this.tabs[this.tab].id) {
                console.log("switching to different tab............");
                this.$router.replace("/project/"+this.selected._id+"/"+this.tabs[this.tab].id);
            }
        },
    },

    computed: {
        sortedPapers : function() {
            return this.selected.relatedPapers.sort((a,b)=> b.citationCount - a.citationCount );
        }
    },

    mounted() {
        let projectId = this.$route.params.id
        //if no project id is specified, use last_projectid_used
        if(!projectId) projectId = localStorage.getItem("last_projectid_used");
        this.openProject(projectId);
    },

    destroyed() {
        if(this.ws) this.ws.close();
    },

    methods: {

        get_total(instances) {
            if(!instances) return 0;
            let counts = 0;
            for(let key in instances) {
                counts += instances[key];
            }
            return counts;
        },

        handleRouteParams() {
            console.log("handleRouteParams", this.$route.params)
            var tab_id = this.$route.params.tab;
            if(tab_id) {
                //lookup tab index from the tab_id
                this.tabs.forEach((tab, idx)=>{  
                    if(tab.id == tab_id) {
                        this.tab = idx; 
                    }
                });
            } else {
                //console.log("tab is not set.. switching to detail tab");
                //this.$router.replace("/project/"+this.selected._id+"/detail");
                //this.tab = "detail"; //should fire tab watcher
            }
        },

        edit() {
            this.$router.push('/project/'+this.selected._id+'/edit');
        },

        back() {
            if(window.history.length > 1) this.$router.go(-1);
            else this.$router.push('/projects');
        },

        isguest() {
            if(!Vue.config.user) return false;
            if(!this.selected) return false;
            if(~this.selected.guests.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        isadmin() {
            if(!Vue.config.user) return false;
            if(!this.selected) return false;
            if(~this.selected.admins.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        ismember() {
            if(!Vue.config.user) return false;
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

        openProject(projectId) {
            this.selected = null;

            //load full detail about the project
            this.$http.get('project', {params: {
                find: JSON.stringify({
                    _id: projectId,
                }),
                populate: "stats.apps.app",
            }}).then(res=>{
                if(res.data.projects.length == 0) {
                    this.error = "You don't have access to the project, or the project ID is invalid. Please contact the project owner and ask to add you to the member/guest of the project.";
                    return;
                }

                this.selected = res.data.projects[0];

                //remove app.stats that doesn't have task (not yet migrated with new stats info)
                this.selected.stats.apps = this.selected.stats.apps.filter(a=>!!a.task);
                localStorage.setItem("project."+projectId+".lastOpened",Date.now());
                localStorage.setItem("last_projectid_used", projectId);
                //https://github.com/ktquez/vue-disqus/issues/11#issuecomment-354023326
                if(this.$refs.disqus && window.DISQUS) {
                    this.$refs.disqus.reset(window.DISQUS);
                }

                this.handleRouteParams();
                this.update_resource_usage_graph();

                //subscribe to project update
                if(this.ws) this.ws.close();
                var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
                this.ws = new ReconnectingWebSocket(url, null, {reconnectInterval: 3000});
                this.ws.onopen = (e)=>{
                    this.ws.send(JSON.stringify({
                        bind: {
                            ex: "warehouse",
                            key: "project.update.*."+projectId,
                        }
                    }));
                    this.ws.onmessage = (json)=>{
                        var event = JSON.parse(json.data);
                        for(let k in event.msg) {
                            if(this.selected[k] === undefined) this.selected[k] = event.msg[k];
                            else Object.assign(this.selected[k], event.msg[k]);
                        }
                    };
                };
                    
                //optionally.. load participant info
                //TODO - maybe I should expose it if publishParticipantsInfo is true
                if(this.isadmin() || this.ismember()) {
                    this.participants = null;
                    this.axios.get("/participant/"+projectId).then(res=>{
                        if(res.data) {
                            this.participants = res.data.subjects||{}; 
                            this.participants_columns = res.data.columns||{}; 
                        }
                    });
                }
            }).catch(res=>{
                console.error(res);
                this.error = "Sorry, we were not able to load this project. Please check the URL/ID and try again";
            });
        },

        update_resource_usage_graph() {
            
            //create resource usage graph
            if(this.selected.stats && this.selected.stats.resources) {
                let resources = {};
                this.total_walltime = 0;
                let services = [];
                this.selected.stats.resources.forEach(stat=>{
                    if(stat.total_walltime == 0) return;
                    this.total_walltime += stat.total_walltime;
                    if(!resources[stat.resource_id]) {
                        resources[stat.resource_id] = {
                            x: [], //walltime
                            y: [], //list of apps for this resource
                            text: [], //count?
                            name: stat.resource_id+" (private)",
                            type: "bar",
                            orientation: 'h'
                        };
                    }
                    let d = resources[stat.resource_id];
                    if(!services.includes(stat.service)) services.push(stat.service);
                    if(!d.x.includes(stat.service)) {
                        d.x.push(stat.total_walltime/(3600*1000));
                        d.y.push(stat.service);
                        d.text.push(stat.count.toString()+" tasks");
                    }
                });

                //query resource info
                let resource_ids = Object.keys(resources);
                this.$http.get(Vue.config.amaretti_api+"/resource", {params: {
                    find: JSON.stringify({
                        _id: {$in: resource_ids},
                    }),
                    select: 'name config.desc',
                }})
                .then(res=>{
                    //set resource names
                    res.data.resources.forEach(resource=>{
                        resources[resource._id].name = resource.name;
                    });

                    //collect resource citation
                    this.selected.stats.resources.forEach(stat=>{
                        if(!stat.citation) return; //don't show resources with no citations
                        let resource = res.data.resources.find(r=>r._id == stat.resource_id);
                        if(!resource) return; //no such resource?
                        let resource_citations = this.resource_citations.find(r=>r.resource._id == stat.resource_id);
                        if(!resource_citations) this.resource_citations.push({resource, citation: stat.citation});    
                    });

                    //create plotly graph
                    var data = Object.values(resources);
                    var layout = {
                        yaxis: {
                            //title: 'Apps'
                        },
                        xaxis: {
                            title: 'Total Walltime (hour)',  
                            type: 'log',
                            //autorange: true
                            showgrid: true,
                        },
                        barmode: 'relative',
                        margin: {
                            t: 20,
                            l: 240,
                            pad: 10
                        },
                        height: 17*services.length+120,
                        font: Vue.config.plotly.font,
                        paper_bgcolor: "#fff0",
                    };

                    /*
                    let options = {
                        //until my PR gets accepted, we need to resize this ... https://github.com/statnett/vue-plotly/pull/18
                        toImageButtonOptions: {
                            width: 1200,
                            height: 600,
                        },
                        
                        modeBarButtonsToAdd: [{
                            name: 'SVG',

                            //TODO - I should find a better logo for svg export
                            icon: {
                                'width': 1792,
                                'path': 'M1344 1344q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm256 0q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128-224v320q0 40-28 68t-68 28h-1472q-40 0-68-28t-28-68v-320q0-40 28-68t68-28h465l135 136q58 56 136 56t136-56l136-136h464q40 0 68 28t28 68zm-325-569q17 41-14 70l-448 448q-18 19-45 19t-45-19l-448-448q-31-29-14-70 17-39 59-39h256v-448q0-26 19-45t45-19h256q26 0 45 19t19 45v448h256q42 0 59 39z',
                                'ascent': 1792,
                                'descent': 0,
                            },
                            click: ()=>{
                                let plot = this.$refs.resource_usage;
                                plot.downloadImage({format: 'svg'});
                            }
                        }],
                    }
                    */
                    this.resource_usage = {data, layout};
                });
            }
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

        loadXNATObjects() {
            this.$root.$emit("loading",{message: "Loading XNAT Objects"});
            this.$http.post("/xnat/load/"+this.selected._id).then(res=>{
                this.$root.$emit("loading", {show: false});
                this.$notify({ text: "Loaded "+res.data.length+" objects" });
                console.dir(res);
            });
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
.page-content {
    overflow-x: hidden;
    top: 95px;
}
.project-header {
    padding: 20px; 
    box-shadow: 0 0 2px #ccc;
    background-color: white;
    top: 0px;
    z-index: 7;
    overflow: hidden;
}
.top-tabs {
    top: 50px;
    height: 45px;
    background-color: white; 
    box-shadow: 0px 0px 2px #ccc;
    z-index: 1;
    overflow: hidden;
}
.sub-tab {
    min-height: 42px;
    margin-bottom: 20px;
    border-bottom: 1px solid #ccc;
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
    background-color: #fff; 
    padding: 20px; 
    margin-bottom: 20px;
    box-shadow: 0 0 3px #0002;
    border-radius: 4px;
}
.button-page {
    float: left;
    position: relative;
    left: -10px;
    z-index: 1;
    opacity: 0.6;
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
.bigpill {
    padding: 5px 10px;
}
.error {
    top: 0px;
    padding: 20px;
    background-color: #eee;
    color: #666;
}

.side {
    float: right; 
    width: 280px; 
    padding: 20px; 
    /* we need scrollbar..
    position: sticky; 
    top: 0px;
    */
    padding-top: 40px;
    margin-top: -20px;
    margin-right: -20px;
    background-color: #f8f8f8;
}
.main {
    margin-right: 300px;
}

@media only screen and (max-width: 1100px) {
    .side {
        display: none;
    }
    .main {
        margin-right: 20px;
    }
}
</style>
