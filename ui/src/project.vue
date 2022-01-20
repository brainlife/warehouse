<template>
<div>
    <div v-if="error" class="page-content error">{{error}}</div>
    <div v-if="project">
        <div class="page-header">
            <div style="float: right;">
                <div @click="edit()" v-if="isadmin()" class="button" title="Edit project details">
                    <icon name="edit" scale="1.25"/>
                </div>
            </div>
            <h5 style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <projectaccess :access="project.access" style="position: relative; top: -3px;"/>
                {{project.name}}
            </h5>
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
                                v-if="project.stats && project.stats.datasets && project.stats.datasets.subject_count">
                               &nbsp;<icon name="user-friends" scale="0.8"/>&nbsp;&nbsp;{{project.stats.datasets.subject_count}}
                            </span>
                            <span title="Number of data-objects stored in archive"
                                v-if="project.stats && project.stats.datasets && project.stats.datasets.count">
                                &nbsp;<icon name="cubes" scale="0.8"/>&nbsp;&nbsp;{{project.stats.datasets.count}}
                            </span>
                        </span>

                        <span v-if="tabinfo.id == 'process'" title="Number of tasks" style="opacity: 0.8;">
                            <div v-if="project.stats && get_total(project.stats.instances) > 0" style="display: inline-block; width: 75px;">
                                <stateprogress :states="project.stats.instances"/>
                            </div>
                        </span>

                        <span v-if="tabinfo.id == 'pipeline' && project.stats && project.stats.rules && (project.stats.rules.active||project.stats.rules.inactive)"
                            title="Number of pipeline rules" style="opacity: 0.6; font-size: 80%;">
                            &nbsp;{{project.stats.rules.active}} <small>/ {{project.stats.rules.active + project.stats.rules.inactive}}</small>
                        </span>

                        <span v-if="tabinfo.id == 'groupanalysis' && project.stats && project.stats.groupanalysis && project.stats.groupanalysis.sessions.length > 0"
                            title="Number of analysis sessions" style="opacity: 0.6; font-size: 80%;">
                            &nbsp;{{project.stats.groupanalysis.sessions.length}}
                        </span>

                        <span v-if="tabinfo.id == 'pub' && project.stats && project.stats.publications > 0" style="opacity: 0.6; font-size: 80%;">
                            &nbsp;{{project.stats.publications}}
                        </span>
                    </template>
                </b-tab>
            </b-tabs>
        </div>

        <div v-if="tabs[tab].id == 'detail'">
            <div class="page-content">
                <!--detail-->

                <b-alert :show="project.removed" style="border-radius: 0px; color: #888;" variant="secondary">This project has been removed.</b-alert>
                <b-alert :show="project.access == 'private' && project.listed" style="border-radius: 0px; color: #888;" variant="secondary">
                    This project is listed for all users but only the members of the project can access its datasets, processes, and pipelines.
                </b-alert>

                <div class="project-header">

                    <div class="side" v-if="project.stats">
                        <projectavatar :project="project" :height="140" :width="140" style="float: right; margin: -20px 100px 30px 30px;"/>

                        <div v-if="project.importedDLDatasets && project.importedDLDatasets.length">
                            <span class="form-header">Data Source</span>
                            <p style="margin-bottom: 5px;"><small>This project contains data imported from the following sources.</small></p>
                            <p v-for="rec in project.importedDLDatasets" :key="rec._id" style="margin-bottom: 3px">
                                <b style="font-size: 85%">{{rec.dataset_description.DatasetDOI||rec.path}}</b><br>
                                <small>{{rec.dataset_description.Name}}</small>
                            </p>
                            <br>
                            <br>
                        </div>

                        <span class="form-header">Resources</span>
                        <p>
                            <small>The following resources will be used to run jobs submitted in this project</small>
                        </p>
                        <div v-if="!project.noPublicResource" class="resource">
                            <h5><b-badge variant="success">Public Resources</b-badge></h5>
                            <small>All public resources will be used to run jobs submitted on this project.</small>
                        </div>
                        <div v-if="project.noPublicResource">
                            <h4><b-badge variant="danger">No Public Resources</b-badge></h4>
                            <small>No public resources will be used to run jobs submitted on this project.</small>
                        </div>
                        <div v-if="resources && resources.length">
                            <div v-for="resource in resources" :key="resource._id" @click="openResource(resource)" class="resource">
                                <statustag :status="resource.status" style="float: right"/>
                                <b>{{resource.name}}</b><br>
                                <small>{{resource.config.desc}}</small>
                            </div>
                        </div>
                        <br>

                        <span class="form-header">Datatypes</span>
                        <p style="margin-bottom: 5px;"><small>This project contains the following datatypes</small></p>
                        <div v-if="project.stats.datasets.datatypes_detail">
                            <p v-for="detail in project.stats.datasets.datatypes_detail" :key="detail.type" style="margin-bottom: 3px;">
                                <datatypetag :datatype="detail.type" style="font-size: 85%"/>&nbsp;
                                <small style="opacity: 0.6;">
                                    <!-- <icon name="user-friends"/> {{detail.subject_count}} -->
                                    ({{detail.count}} objs <span v-if="detail.size"> | {{detail.size|filesize}}</span>)
                                </small>
                            </p>
                            <br>
                            <br>
                        </div>

                        <p>
                            <b-badge pill class="bigpill" title="Group ID used by amaretti">
                                <icon name="id-badge" style="opacity: 0.4;"/>&nbsp;&nbsp;{{project.group_id}}
                                <small>Group ID</small>
                            </b-badge>
                            <br>
                            <br>
                        </p>
                    </div>

                    <div class="main">
                        <p style="line-height: 2.5em; margin-bottom: 0px; position: relative; top: -8px">
                            <b-badge pill class="bigpill" title="Project creation date">
                                <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;
                                {{new Date(project.create_date).toLocaleDateString()}}
                            </b-badge>
                            <b-badge pill class="bigpill" title="Total size of data stored in archive"
                                v-if="project.stats && project.stats.datasets && project.stats.datasets.size">
                                <icon name="folder" style="opacity: 0.4;"/>&nbsp;&nbsp;{{project.stats.datasets.size|filesize}}
                                <small>Total</small> <br>
                            </b-badge>

                            <!-- redundant with pipeline tab
                            <b-badge pill class="bigpill" v-if="project.stats && project.stats.rules && project.stats.rules.active > 0" title="Number of pipeline rules configured for this project">
                                <icon name="robot" style="opacity: 0.4;"/>&nbsp;&nbsp;{{project.stats.rules.active}}
                                <small>Active Pipeline Rules</small>
                            </b-badge>
                            -->

                            <b-badge pill class="bigpill" title="Total CPU hours consumed by this project">
                                <icon name="server" style="opacity: 0.4;"/>&nbsp;&nbsp;{{(total_walltime/(3600*1000))|formatNumber}}
                                <small>CPU Hours</small>
                            </b-badge>
                        </p>

                        <p class="desc">
                            {{project.desc||'no description.'}}
                        </p>

                        <div v-if="project.agreements && project.agreements.length > 0">
                            <span class="form-header">Agreements</span>
                            <div v-if="project.agreements.length < 3 || showAgreements || !isAllAgreed(project)">
                                <p> <small class="text-muted">You must consent to the following agreement(s) before accessing data on this project.</small> </p>
                                <agreements :agreements="project.agreements"/>
                                <br>
                            </div>
                            <p v-else>
                                You have consented to all project agreements. <b-button @click="showAgreements = true" size="sm" variant="link">Show Agreements</b-button>
                            </p>
                        </div>

                        <b-row>
                            <b-col cols="4">
                                <span class="form-header" title="Admins can update project details, share processes, and create pipeline rules / publications.">
                                    Admins</span>
                                <p class="text-muted" v-if="project.admins.length == 0"><small>No Admins</small></p><!--only happens on dev?-->
                                <p v-else>
                                    <contact v-for="c in project.admins" :key="c._id" :id="c" size="small" style="line-height: 150%;"/>
                                </p>
                            </b-col>

                            <b-col lg>
                                <span class="form-header" title="Members have read/write access to archived data, processes, and create pipeline rules / publications.">
                                    Members</span>
                                <p class="text-muted" v-if="project.members.length == 0"><small>No Members</small></p>
                                <p v-else>
                                    <contact v-for="c in project.members" :key="c._id" :id="c" size="small" style="line-height: 150%;"/>
                                </p>
                            </b-col>

                            <b-col lg v-if="config.user && project.access == 'private' && project.guests && project.guests.length > 0">
                                <span class="form-header" title="has read access to data.">Guests</span>
                                <contact v-for="c in project.guests" :key="c._id" :id="c" size="small" style="line-height: 150%;"/>
                            </b-col>
                        </b-row>

                        <div v-if="project.xnat.enabled" style="background-color: #eee; padding: 10px; border-radius: 10px">
                            <span class="form-header">XNAT Integration</span>
                            <p>
                                <small>Data Archive on this project is mapped to the XNAT instance</small>
                            </p>
                            <b-row>
                                <b-col sm="3"><span class="form-sub-header">XNAT Hostname</span></b-col>
                                <b-col><pre>{{project.xnat.hostname}}</pre></b-col>
                            </b-row>
                            <br>
                            <b-row>
                                <b-col sm="3"><span class="form-sub-header">XNAT Project</span></b-col>
                                <b-col><b>{{project.xnat.project}}</b></b-col>
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
                                    <b-row v-for="(map, idx) in project.xnat.scans" :key="idx">
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
                                        <b-badge v-if="!project.publishParticipantsInfo"
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
                                    <small v-if="project.relatedPapers">{{project.relatedPapers.length}}</small>
                                </template>
                            </b-tab>

                            <b-tab>
                                <template v-slot:title>
                                    Comments
                                    <small v-if="project.stats.comments">{{project.stats.comments}}</small>
                                </template>
                            </b-tab>
                        </b-tabs>

                        <!--readme-->
                        <div v-if="detailTab == 0">
                            <vue-markdown v-if="project.readme" :source="project.readme" class="readme"></vue-markdown>
                            <p v-else><small>No README entered.</small></p>
                        </div>

                        <!--participants-->
                        <div v-if="detailTab == 1">
                            <p><small>Participants info provides information for each subject and can be used for the group analysis.</small></p>
                            <b-alert variant="secondary" :show="project.publishParticipantsInfo" style="margin-bottom: 15px;">
                                This information will be published as part of all publications made from this project.
                            </b-alert>

                            <participants v-if="participants && Object.keys(participants).length"
                                :rows="participants"
                                :columns="participants_columns"
                                style="overflow: auto; max-height: 500px;"/>

                        </div>

                        <!--app info-->
                        <div v-if="detailTab == 2">

                            <div v-if="project.stats.apps && project.stats.apps.length > 0">
                                <span class="form-header">App Usage</span>
                                <p><small>The following Apps were used to generate the data in this project.</small></p>
                                <b-row style="border-bottom: 1px solid #0003; margin-bottom: 10px; opacity: 0.7">
                                    <b-col cols="10">App</b-col>
                                    <b-col cols="2">Execution Count</b-col>
                                </b-row>
                                <b-row v-for="rec in project.stats.apps" :key="rec._id">
                                    <b-col cols="10">
                                        <div style="margin-bottom: 20px;">
                                            <app v-if="rec.app._id" :app="rec.app" :branch="rec.task.service_branch" :showDoi="true"/>
                                        </div>
                                    </b-col>
                                    <b-col cols="2"> <small>{{rec.count}}</small> </b-col>
                                </b-row>
                                <br>
                            </div>

                            <div v-if="resource_usage && total_walltime > 3600*1000">
                                <span class="form-header">Resource Usage</span>
                                <p><small>Data-objects on this project has been computed using the following resources.</small></p>
                                <ExportablePlotly :data="resource_usage.data"
                                    :layout="resource_usage.layout"
                                    :autoResize="true"
                                    :watchShallow="true"/>
                                <br>
                            </div>

                            <!--loading citations takes time and LOCK UP THE BROWSER WHILE LOADING IT!!!-->
                            <div v-if="project.stats.apps && project.stats.apps.length > 0">
                                <span class="form-header">Citations</span>

                                <p><small>Please use the following citations to cite the Apps/resources used by this project.</small></p>
                                <p v-for="app in project.stats.apps" :key="app._id">
                                    <icon name="robot" style="opacity: 0.5;"/> <b>{{app.app.name}}</b><br>
                                    <citation :doi="app.app.doi"/>
                                </p>

                                <div v-if="resource_citations.length > 0">
                                    <p><small>Please use the following citations to cite the resources used by this project.</small></p>
                                    <p v-for="(resource_citation, idx) in resource_citations" :key="idx">
                                        <icon name="server" style="opacity: 0.5;"/> <b>{{resource_citation.resource.name}}</b><br>
                                        <i>{{resource_citation.citation}}</i>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!--related papers-->
                        <div v-if="detailTab == 3">
                            <div v-if="project.relatedPapers && project.relatedPapers.length > 0">
                                <p>
                                    <small>We found the following journals/articles related to this project based on name/description</small>
                                </p>
                                <mag v-for="paper in project.relatedPapers" :key="paper._id" :paper="paper"/>
                            </div>
                        </div>

                        <div v-if="detailTab == 4">
                            <b-alert show variant="secondary" v-if="!config.user"> Please login to Comments.</b-alert>
                            <div v-else-if="comments && comments.length">
                                <div v-for="comment in comments" :key="comment._id" class="commentbox">
                                    <div class="comment-header">
                                        <contact :id="comment.user_id" size="small"/>
                                        <small><timeago :datetime="comment.update_date"/></small>
                                        <div style="float: right" v-if="isauthor(comment.user_id) || isadmin(comment.user_id)">
                                            <div @click="editComment(comment)" class="button" title="Edit Comment">
                                                <icon name="edit"/>
                                            </div>
                                            <div @click="deleteComment(comment)" class="button" title="Delete Comment">
                                                <icon name="trash"/>
                                            </div>
                                        </div>
                                    </div>
                                    <p v-if="comment.removed" class="comcoontent comment-removed">Comment removed</p>
                                    <p v-else class="comcontent" v-html="comment.comment"/>
                                </div>
                            </div>
                            <div style="position: relative">
                                <span @click="toggleEmojiMart()" style="position:absolute;top: 10px; right: 10px; cursor: pointer;">😋</span>
                                <b-form-textarea v-model="comment" placeholder="New Comment" required/>
                                <emojimart v-if="showMart" @select="addEmojiToComment" style="position: absolute; z-index: 1; right: 0; height:250px"/>
                            </div>
                            <br>
                            <b-button v-if="comment.length" @click="submitComment()">Post</b-button>
                            <div v-if="!comments.length && !comment.length" style="height:120px">
                                <p>Be the first one to comment !</p>
                            </div>
                            <br>
                        </div>
                    </div><!-- main content-->
                </div><!--project header-->
                <div v-if="config.debug">
                    <pre>{{project.mag}}</pre>
                    <pre>{{project}}</pre>
                </div>

            </div><!-- project detail content-->
        </div>

        <div v-if="tabs[tab].id == 'dataset'" class="page-content">
            <b-alert show variant="secondary" v-if="!config.user">
                Please login to see archived data objects.
            </b-alert>
            <b-alert show variant="secondary" v-else-if="project.access != 'public' && !(ismember()||isadmin()||isguest())">
                For non public project, only the admin/members/guests of this project can access processes.
            </b-alert>
            <datasets :project="project"  v-else :participants="participants"/>
        </div>

        <div v-if="tabs[tab].id == 'process'" class="page-content">
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">
                Only the admins or members of this project can access processes. Please contact the project admins to give you access.
            </b-alert>
            <processes :project="project" v-else/>
        </div>

        <div v-if="tabs[tab].id == 'pipeline'" class="page-content">
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">
                Only the admins or members of this project can access pipelines. Please contact the project admin to give you access.
            </b-alert>
            <pipelines :project="project" v-else/>
        </div>

        <div v-if="tabs[tab].id == 'groupanalysis'" class="page-content">
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">Only the admins or members of this project can access group analysis page. Please contact the project admin to give you access.</b-alert>
            <div v-else>
                <groupAnalysis :project="project"/>
            </div>
        </div>

        <div v-if="tabs[tab].id == 'pub'" class="page-content">
            <b-alert show variant="secondary" v-if="!(ismember()||isadmin())">Only the admins or members of this project can access publications. Please contact the project admin to give you access.</b-alert>
            <publications :project="project" v-else/>
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
import statustag from '@/components/statustag'

import newtaskModal from '@/modals/newtask'
import datatypeselecterModal from '@/modals/datatypeselecter'
import ReconnectingWebSocket from 'reconnectingwebsocket'
import citation from '@/components/citation'
import {VueEditor} from "vue2-editor"
import { Picker } from 'emoji-mart-vue'


import agreementMixin from '@/mixins/agreement'

//let ps;

export default {

    mixins: [
        agreementMixin,
    ],
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
        statustag,

        'groupAnalysis': ()=> import('@/components/groupanalysis'),

        //noprocess,
        resource,
        ExportablePlotly: ()=>import('@/components/ExportablePlotly'),

        newtaskModal,
        datatypeselecterModal,
        stateprogress,
        citation,
        emojimart: Picker,
    },

    data() {
        return {
            project: null,
            resources: null,

            resource_usage: null,
            total_walltime: 0,
            editcommentID : null,
            showMart: false,

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

            showAgreements: false,

            config: Vue.config,
            comment: "",
            comments: [],
            customToolbar:  [
                ["bold", "italic", "underline"],
                [{ list: "ordered" }, { list: "bullet" }],
            ]

        }
    },

    watch: {
        /* needed by dataset modal > instanceselecter but it causes infinite redraw bug*/
        '$route': function() {
            var project_id = this.$route.params.id;
            if(project_id && this.project && this.project._id != project_id) {
                console.log("project chagned from", this.project._id, "to", project_id)
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
                this.$router.replace("/project/"+this.project._id+"/"+this.tabs[this.tab].id);
            }
        },
        detailTab: function() {
            if(this.detailTab == 4) {
                this.axios.get("/comment/project/"+this.project._id).then(res=>{
                    var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
                    this.comments = res.data;
                }).catch(err=>{
                    console.error(err);
                    this.$notify({text: err.response.data.message, type: 'error' });
                })
            }
        }
    },

    computed: {
        sortedPapers : function() {
            return this.project.relatedPapers.sort((a,b)=> b.citationCount - a.citationCount );
        },
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
        addEmojiToComment(emoji) {
            this.comment += emoji.native;
            this.showMart = false;
        },
        toggleEmojiMart() {
            if(this.showMart) this.showMart = false;
            else this.showMart = true;
        },
        deleteComment(comment) {
            if(confirm("do you want to remove this comment?")) {
                this.$http.delete('comment/'+comment._id).then(res=>{
                    this.$notify({text: "removed"});
                }).catch(err=>{
                    console.error(err);
                    this.$notify({ text: err.response.data.message, type: 'error'});
                })
            }
        },
        editComment(comment) {
            this.comment = "";
            this.comment = comment.comment;
            this.editcommentID = comment._id;
        },
        format(date) {
            let month = date.toLocaleString("en-US", { month: 'short' })
            return date.getDate() + ' ' + month + ' ' + date.getFullYear();
        },

        get_total(instances) {
            if(!instances) return 0;
            let counts = 0;
            for(let key in instances) {
                counts += instances[key];
            }
            return counts;
        },

        handleRouteParams() {
            var tab_id = this.$route.params.tab;
            if(tab_id) this.tab = this.tabs.findIndex(tab=>tab.id == tab_id);
        },

        edit() {
            this.$router.push('/project/'+this.project._id+'/edit');
        },

        back() {
            if(window.history.length > 1) this.$router.go(-1);
            else this.$router.push('/projects');
        },

        isguest() {
            if(!Vue.config.user) return false;
            if(!this.project) return false;
            if(~this.project.guests.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        isadmin() {
            if(!Vue.config.user) return false;
            if(!this.project) return false;
            if(~this.project.admins.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        ismember() {
            if(!Vue.config.user) return false;
            if(!this.project) return false;
            if(~this.project.members.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        isauthor(sub) {
            if(!Vue.config.user) return false;
            if(Vue.config.user.sub == sub) return true;
        },

        remove() {
            if(confirm("Do you really want to remove this project?")) {
                this.$http.delete('project/'+this.project._id)
                .then(res=>{
                    this.project.removed = true;
                    this.$router.push('/project');
                });
            }
        },
        submitComment() {
            if(this.editcommentID) {
                this.$http.patch('comment/'+this.editcommentID, {comment: this.comment})
                .then(res=>{
                    // console.log(res.data);
                    /* events api will update*/
                    // this.comments[this.editcommentIndex] = res.data;
                    this.comment = "";
                    this.editcommentID = null;
                })
            } else {
                this.$http.post('comment/project/'+this.project._id, {
                    comment : this.comment
                }).then(res=>{
                    console.log(res.data);
                    // Vue.set(this.comments, this.comments.length, res.data);
                    this.comment = "";
                }).catch(err=>{
                    console.error(err);
                    this.$notify({ text: err.response.data.message, type: 'error'});
                })
            }
        },

        openResource(resource) {
            console.log("trying to open", resource);
            this.$router.push('/resource/'+resource._id);
        },

        openProject(projectId) {
            this.project = null;

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

                this.project = res.data.projects[0];

                //remove app.stats that doesn't have task (not yet migrated with new stats info)
                this.project.stats.apps = this.project.stats.apps.filter(a=>!!a.task);
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
                    this.ws.send(JSON.stringify({
                        bind: {
                            ex: "warehouse",
                            key: "comment_project.*.*."+projectId,
                        }
                    }));
                    this.ws.onmessage = (json)=>{
                        let event = JSON.parse(json.data);
                        if(event.dinfo.routingKey.startsWith("project.")) {
                            for(let k in event.msg) {
                                if(this.project[k] === undefined) this.project[k] = event.msg[k];
                                else {
                                    if(typeof this.project[k] == 'object') Object.assign(this.project[k], event.msg[k]);
                                    else this.project[k] = event.msg[k];
                                }
                            }
                        }
                        if(event.dinfo.routingKey.startsWith("comment_project.")) {
                            const comment = this.comments.find(c=>c._id == event.msg._id);
                            if(!comment) this.comments.push(event.msg);
                            else Object.assign(comment, event.msg);
                        }
                    }
                }

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

                //load shared resources
                this.$http.get(Vue.config.amaretti_api+'/resource', {params: {
                    find: {
                        gids: this.project.group_id,
                        status: {$ne: "removed"},
                    },
                    select: 'name active config.hostname config.desc status avatar',
                }}).then(res=>{
                    this.resources = res.data.resources;
                });

            }).catch(res=>{
                console.error(res);
                this.error = "Sorry, we were not able to load this project. Please check the URL/ID and try again";
            });
        },

        update_resource_usage_graph() {

            //create resource usage graph
            if(this.project.stats && this.project.stats.resources) {
                let resources = {};
                this.total_walltime = 0;
                //let services = [];
                const names = [];
                const walltimes = [];
                const counts = [];
                this.project.stats.resources.forEach(stat=>{
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
                    names.push(stat.name);
                    walltimes.push(stat.total_walltime/(3600*1000));
                    counts.push(stat.count.toString()+" jobs");
                });

                //create plotly graph
                var data = [{
                    y: names,
                    x: walltimes,
                    text: counts,
                    //name: stat.resource_id+" (private)",
                    type: "bar",
                    orientation: 'h'
                }];
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
                    //height: 17*services.length+120,
                    height: 17*names.length+120,
                    font: Vue.config.plotly.font,
                    paper_bgcolor: "#fff0",
                };
                this.resource_usage = {data, layout};

                //collection resource citation info
                let resource_ids = Object.keys(resources);
                this.$http.get(Vue.config.amaretti_api+"/resource", {params: {
                    find: JSON.stringify({
                        _id: {$in: resource_ids},
                    }),
                    select: 'name config.desc citation',
                }})
                .then(res=>{
                    //set resource names
                    res.data.resources.forEach(resource=>{
                        resources[resource._id].name = resource.name;
                    });
                    res.data.resources.forEach(resource=>{
                        if(!resource.citation) return; //don't show resources with no citations
                        //let resource = res.data.resources.find(r=>r._id == stat.resource_id);
                        //if(!resource) return; //no such resource?
                        //let resource_citations = this.resource_citations.find(r=>r.resource._id == stat.resource_id);
                        //if(!resource_citations) this.resource_citations.push({resource, citation: stat.citation});
                        this.resource_citations.push({resource, citation: resource.citation});
                    });

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
            this.$http.post("/xnat/load/"+this.project._id).then(res=>{
                this.$root.$emit("loading", {show: false});
                this.$notify({ text: "Loaded "+res.data.length+" objects" });
                console.dir(res);
            });
        },
    },
}
</script>

<style scoped>
.desc {
    opacity: 0.8;
    line-height: 180%;
}

.page-header {
    padding: 12px 15px;
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
    /* overflow: hidden; */
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
#commentEditor {
    height: 100px;
}
.commentbox {
    background-color: #ffffff;
    border-radius: 6px;
    margin: 5px;
}
.comcontent {
    margin: 8px;
}
.comment-removed {
    opacity: 0.8;
    margin: 10px 0;
    padding: 10px;
    background-color: #eee;
}
.resource {
    cursor: pointer;
    padding: 8px;
    border: 1px solid #0003;
    border-radius: 5px;
    margin-bottom: 10px;
}
</style>
