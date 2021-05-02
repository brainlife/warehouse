<template>
<div>
    <a :name="'release.'+release._id">
        <div class="header">

            <span style="float: right; opacity: 0.8; font-size: 90%; padding-top: 4px;">
                {{new Date(release.create_date).toLocaleDateString()}}
            </span>
            <span style="font-size: 110%;"><small>Release /</small> <b>{{release.name}}</b></span>
            <b-badge pill class="bigpill" v-if="release.subjects" style="margin-left: 10px;">
                <icon name="user-friends" style="opacity: 0.4;"/>&nbsp;&nbsp;{{release.subjects}} <small>subjects</small> 
                <span v-if="release.sessions"><span style="opacity: 0.4"> | </span>{{release.sessions}} <small>sessions</small></span>
            </b-badge>
        </div>
    </a>

    <p v-if="release.desc" style="margin-bottom: 0px;"><small>{{release.desc}}</small></p>
    <p v-if="release.sets && release.sets.length">
        <b-badge pill class="bigpill clickable" @click="downloadDataset(release.set)" style="float: right">
            <icon name="download" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;<small>Dowload this dataset</small>
        </b-badge>
        <releaseset :set="set" v-for="(set, idx) in release.sets" :key="idx"/>
    </p>

    <div v-if="release.apps && release.apps.length">
        <small>The following Apps were used to generate the data in this release.</small>
        <!--
        <table class="table table-sm">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>DOI</th>
                    <th>Github</th>
                    <th>Branch</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="rec in release.apps" :key="rec.app.doi">
                    <td>{{rec.app.name}}</td>
                    <td><a :href="'https://doi.org/'+rec.app.doi" :target="'doi_'+rec.app.doi">{{rec.app.doi}}</a></td>
                    <td><a :href="'https://github.com/'+rec.service+'/tree/'+(rec.service_branch||'master')" :target="'github_'+rec.service">{{rec.service}}</a></td>
                    <td>{{rec.service_branch||'master'}}</td>
                </tr>
            </tbody>
        </table>
        -->
        <div v-for="rec in release.apps" :key="rec._id" style="margin-top: 10px; border-left: 3px solid #f0f0f0; border-bottom: 1px solid #eee;">
            <doibadge :doi="rec.app.doi" :jump="true" style="position: relative; float: right; z-index: 1; transform: scale(0.8); transform-origin: right;"/>
            <app :appid="rec.app._id" :branch="rec.service_branch" :compact="true">
                <taskconfig :task="rec.task" style="margin: 10px;"/>
            </app>
        </div>
        <br>
    </div>

    <!--
    <div v-if="dataset_groups">
        <span class="button" @click="downscript({})">
            <b>{{total.subjects}}</b> Subjects <span style="opacity: 0.2">|</span> 
            <b>{{total.count}} objects</b> <span v-if="total.size"> ({{total.size|filesize}} Total)</span>
            <icon name="download" scale="0.8" style="opacity: 0.5; position: relative; top: -2px;"/> 
        </span>
    </div>
    <div v-else style="opacity: 0.5">Loading ... <icon name="cog" spin/></div>
    -->

    <!--
    <div style="background-color: white">
        <div class="group" v-for="(group, subject) in dataset_groups" :key="subject">
            <b-row>
                <b-col cols="2">
                    &nbsp;
                    <span class="button" @click="downscript({'meta.subject': subject})">
                        <b>{{subject}}</b>
                        <icon name="download" class="download-subject" scale="0.8"/>
                    </span>
                </b-col>
                <b-col>
                    <div v-for="(datatype, datatype_id) in group.datatypes" :key="datatype_id">
                        <div v-for="(block, datatype_tags_s) in datatype.datatype_tags" :key="datatype_tags_s" style="margin-bottom: 3px;">
                            <div @click="toggle(block, subject, datatype_id, JSON.parse(datatype_tags_s))" class="toggler">
                                <div style="width: 20px; display: inline-block;" class="text-muted">
                                    <icon name="caret-right" v-if="!block.show"/> 
                                    <icon name="caret-down" v-if="block.show"/> 
                                </div>
                                <datatypetag :datatype="datatypes[datatype_id]" :tags="JSON.parse(datatype_tags_s)" :clickable="false"/>
                                &nbsp;
                                <small class="text-muted" style="float: right;">{{block.count}} objects <span v-if="block.size">{{block.size|filesize}}</span></small>
                            </div>
                            <transition name="fadeHeight">
                                <b-list-group class="datasets" v-if="block.show && block.datasets">
                                    <b-list-group-item v-for="(dataset, idx) in block.datasets" :key="idx" class="dataset" @click="view(dataset._id)">
                                        {{dataset.desc}}
                                        <span v-if="!dataset.desc" class="text-muted">{{dataset._id}}.tar.gz</span>
                                        <tags :tags="dataset.tags"/>
                                        <div style="float: right; width: 90px; text-align: right">{{new Date(dataset.create_date).toLocaleDateString()}}</div>
                                        <div style="float: right; width: 90px;"><span v-if="dataset.size" class="text-muted">{{dataset.size|filesize}}</span>&nbsp;</div>
                                        <div style="float: right; width: 90px;"><span v-if="dataset.download_count" class="text-muted"><icon name="download" scale="0.6"/> {{dataset.download_count}} times</span>&nbsp;</div>
                                    </b-list-group-item>
                                </b-list-group>
                            </transition>
                        </div>
                    </div>
                </b-col>
            </b-row>
        </div>
    </div>
    -->

    <div v-if="release.gaarchives && release.gaarchives.length > 0">
        <!-- <span class="form-header">Group Analysis</span>-->

        <!-- <small>Derived data was analysed by the following group analysis code.</small>-->
        <div v-for="ga in release.gaarchives" :key="ga._id">
            <p style="border-bottom: 1px solid #eee; margin-bottom: 5px;">
                <b style="opacity: 0.8; font-size: 100%;"><gaarchive :gaarchive="ga"/></b><!--for header-->
            </p>
            <p style="float: right; margin-bottom: 0px;">
                <b-badge pill class="bigpill clickable" @click="downloadNotebook(ga)">
                    <icon name="download" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;<small>Dowload this notebook</small>
                </b-badge>
                &nbsp;
                <b-badge pill class="bigpill clickable" @click="launchGA(release, ga)">
                    <icon name="play" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;<small>Launch this notebook</small>
                </b-badge>
            </p>
            <!--<b style="opacity: 0.5; font-size: 125%;">{{ga.notebook}}</b>-->
            <ganotebook :ga="ga" style="clear: both;"/>
        </div>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

import datatypetag from '@/components/datatypetag'
import ganotebook from '@/components/ganotebook'
import releaseset from '@/components/releaseset'
import gaarchive from '@/components/gaarchive'
import app from '@/components/app'
import taskconfig from '@/components/taskconfig'
import doibadge from '@/components/doibadge'

import agreementMixin from '@/mixins/agreement'

export default {
    mixins: [agreementMixin],

    components: {
        datatypetag,
        ganotebook,
        releaseset,
        gaarchive,
        app,
        taskconfig,
        doibadge,
    },
    props: {
        project: Object,
        release: Object,
    },

    methods: {
        downloadNotebook(ga) {
            if(!Vue.config.user) return alert("Please Signup/Login first to download this notebook");
            this.check_agreements(this.project, ()=>{
                const url = Vue.config.api+'/dataset/download/'+ga.dataset_id+'?at='+Vue.config.jwt; 
                window.open(url, ga._id);
            });
        },

        launchGA(release, ga) {
            this.$root.$emit("galauncher.open", {
                //project: this.project._id, //default project to submit ga to
                preSelectedGAID: ga._id,
                cb(err, info) {
                    if(err) throw err;
                    //me.openWhenReady = task._id;
                    console.log("TODOD - jumpt to ");
                    console.dir(info);
                    this.$router.push('/project/'+info.project+'/groupanalysis#'+info.task._id);
                },
            });
        },

        downloadDataset(set) {
            if(!Vue.config.user) return alert("Please Signup/Login first to download this data-object");
            this.check_agreements(this.project, ()=>{
                this.$root.$emit("downscript.open", {
                    filter: true,
                    query: {
                        //project: this.project._id,
                        publications: this.release._id,
                    }
                });
            });
        },
    },
}
</script>

<style scoped>
.header {
    background-color: #eee;
    padding: 5px 10px;
    margin-bottom: 5px;
}
</style>
