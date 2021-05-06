<template>
<div>
    <a :name="'release.'+release._id">
        <div class="header">
            <span style="float: right; opacity: 0.8; font-size: 90%; padding-top: 4px;">
                {{new Date(release.create_date).toLocaleDateString()}}
            </span>
            <span style="font-size: 120%;"><small>Release /</small> <b>{{release.name}}</b></span>
            <b-badge pill class="bigpill" v-if="release.subjects" style="margin-left: 10px; position: relative; top: -2px;">
                <icon name="user-friends" style="opacity: 0.4;"/>&nbsp;&nbsp;{{release.subjects}} <small>subjects</small> 
                <span v-if="release.sessions"><span style="opacity: 0.4"> | </span>{{release.sessions}} <small>sessions</small></span>
            </b-badge>
        </div>
    </a>

    <p v-if="release.desc" style="margin-bottom: 0px;"><small>{{release.desc}}</small></p>
    <div v-if="release.sets && release.sets.length">
        <span class="subheader">Data</span>
        <b-badge pill class="bigpill clickable" @click="downloadDataset(release.set)" style="float: right; background-color: #2693ff;  color: white;">
            <icon name="download" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;<small>Dowload</small>
        </b-badge>
        <p style="margin-bottom: 5px;"><small>The following data objects are published as part of this release.</small></p>
        <div style="border-top: 1px solid #eee; padding: 3px 0;" v-for="(set, idx) in release.sets" :key="idx">
            <b-row>
                <b-col cols="5">
                    <datatypetag :datatype="set.datatype" :tags="set.datatype_tags" :clickable="false"/>
                    <small v-if="set.subjects && set.subjects.length == 0">({{set.count||0}} obj <span style="opacity:0.5">|</span> {{(set.size||0)|filesize}})</small>
                </b-col>
                <b-col>
                    <p style="margin-bottom: 0px; line-height: 150%"><small>{{set.datatype.desc}}</small></p>
                </b-col>
            </b-row>
        </div>
        <br>
    </div>

    <div v-if="release.apps && release.apps.length">
        <span class="subheader">Preprocessing</span>
        <small>The following Apps were used to generate the data in this release.</small>
        <div v-for="rec in release.apps" :key="rec._id" style="margin-top: 10px; border-left: 3px solid #f0f0f0; border-bottom: 1px solid #eee;">
            <app :appid="rec.app" :branch="rec.task.service_branch" :compact="true" :showDoi="true">
                <taskconfig :task="rec.task" style="margin: 10px;"/>
            </app>
        </div>
        <br>
    </div>

    <div v-if="release.gaarchives && release.gaarchives.length > 0">
        <span class="subheader">Analysis</span>
        <small>The following jupyter notebook implements the post-processing and analysis step.</small>
        <div v-for="ga in release.gaarchives" :key="ga._id">
            <gaarchive :gaarchive="ga" style="margin: 5px 0;"/>
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
import gaarchive from '@/components/gaarchive'
import app from '@/components/app'
import taskconfig from '@/components/taskconfig'

import agreementMixin from '@/mixins/agreement'

export default {
    mixins: [agreementMixin],

    components: {
        datatypetag,
        ganotebook,
        gaarchive,
        app,
        taskconfig,
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
                preSelectedGAID: ga._id,
                cb(err, info) {
                    if(err) throw err;
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
                        publications: this.release._id,
                        datatype: {$ne: "6079f960f1481a4d788fba3e"}, //we don't want notebook archives
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
    padding: 10px;
    margin-bottom: 15px;
    position: sticky;
    top: 0;
    z-index: 2;
}
.subheader {
    font-weight: bold;
    font-size: 16px;
    display: block;
    margin: 5px 0;
    opacity: 0.7;
    padding-bottom: 5px;
    line-height: 100%;
    color: #2693ff;
    border-bottom: 2px solid #2693ff66;
}
</style>
