<template>
<div>
    <a :name="'release.'+release.name">
        <div class="header">
            <span style="float: right; opacity: 0.8; font-size: 90%; padding-top: 4px;">
                {{new Date(release.create_date).toLocaleDateString()}}
            </span>
            <span style="font-size: 120%;"><small>Release</small> <b>{{release.name}}</b></span>
            <b-badge pill class="bigpill" v-if="release.subjects" style="margin-left: 10px; position: relative; top: -2px;">
                <icon name="user-friends" style="opacity: 0.4;"/>&nbsp;&nbsp;{{release.subjects}} <small>subjects</small> 
                <span v-if="release.sessions"><span style="opacity: 0.4"> | </span>{{release.sessions}} <small>sessions</small></span>
            </b-badge>
        </div>
    </a>

    <p v-if="release.desc"><small>{{release.desc}}</small></p>
    <a :name="'release.'+release.name+'.data'" class="anchor"></a>
    <div v-if="release.sets && release.sets.length">
        <b-button @click="downloadDataset(release.set)" style="float: right;" size="sm" variant="outline-secondary">
            <icon name="download"/>&nbsp;&nbsp;Download
        </b-button>
        <span class="subheader">Data</span>
        <p style="margin-bottom: 5px;">
            <small>The following data objects are published as part of this release.</small>
        </p>
        <div style="border-top: 1px solid #eee; padding: 3px 0;" v-for="(set, idx) in release.sets" :key="idx">
            <b-row>
                <b-col cols="5">
                    <datatypetag :datatype="set.datatype" :tags="set.datatype_tags" :clickable="false" style="font-size: 90%;"/>
                    <small v-if="set.subjects && set.subjects.length == 0">({{set.count||0}} obj <span style="opacity:0.5">|</span> {{(set.size||0)|filesize}})</small>
                </b-col>
                <b-col>
                    <p style="margin-bottom: 0px; line-height: 150%"><small>{{set.datatype.desc}}</small></p>
                </b-col>
            </b-row>
        </div>
        <br>
    </div>

    <a :name="'release.'+release.name+'.preprocessing'" class="anchor"></a>
    <div v-if="release.apps && release.apps.length">
        <span class="subheader">Preprocessing</span>
        <p style="margin-bottom: 5px">
            <small>The following Apps were used to generate the data in this release.</small>
        </p>
        <div v-for="rec in release.apps" :key="rec._id" class="box">
            <app :appid="rec.app" :branch="rec.task.service_branch" :compact="true" :showDoi="true">
                <taskconfig :task="rec.task" style="margin: 10px; margin-right: 100px;"/>
            </app>
        </div>
        <br>
    </div>
    
    <a :name="'release.'+release.name+'.analysis'" class="anchor"></a>
    <div v-if="release.gaarchives && release.gaarchives.length > 0">
        <span class="subheader">Analysis</span>
        <p style="margin-bottom: 5px;">
            <small>The following jupyter notebook implements the post-processing and analysis step.</small>
        </p>
        <div v-for="ga in release.gaarchives" :key="ga._id" class="box">
            <gaarchive :gaarchive="ga"/>
            <p style="float: right; margin-bottom: 0px;">
                <b-badge pill class="bigpill clickable" @click="downloadNotebook(ga)">
                    <icon name="download" style="opacity: 0.8;"/>&nbsp;&nbsp;&nbsp;<small style="opacity: 1">Download this notebook</small>
                </b-badge>
                &nbsp;
                <b-badge pill class="bigpill clickable" @click="launchGA(release, ga)">
                    <icon name="play" style="opacity: 0.8;"/>&nbsp;&nbsp;&nbsp;<small style="opacity: 1">Launch this notebook</small>
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
    padding: 10px 25px;
    margin-bottom: 15px;
    margin-left: -25px;
    margin-right: -15px;
    position: sticky;
    top: 0;
    z-index: 2;
}
.subheader {
    font-weight: bold;
    font-size: 16px;
    display: inline-block;
    margin: 5px 0;
    opacity: 0.7;
    padding-bottom: 5px;
    line-height: 100%;
    color: #2693ff;
}
.anchor { 
    position:relative;
    top:-80px;
}
.box {
    margin-top: 10px;
    margin-left: -20px;
    margin-right: -10px;
    padding: 10px;
    box-shadow: 1px 1px 4px #0003;
    border-radius: 5px;
}
</style>
