<template>
<div class="pubcard clickable" :class="{'pub-removed': pub.removed}">
    <div @click="click()">

        <div style="float: right;">
            <projectavatar v-if="pub.project" :project="pub.project" :width="100" :height="100" style="margin: 10px 0 10px 10px;"/>
            <br>
            <div class='altmetric-embed'
                data-badge-type-dis='donut'
                data-badge-popover="left" 
                data-hide-no-mentions="true" 
                :data-doi="pub.doi||config.debug_doi"></div>
            <br>
        </div>

        <div style="margin-right: 150px; padding-top: 10px;">
            <h5 class="name" style="margin-bottom: 10px;">
                <b-badge  v-if="pub.removed" variant="danger">Removed</b-badge>
                <!--<small>{{pub.project.name}} <icon name="arrow-right"/></small>-->
                {{pub.name}}
            </h5>
            <p>
                <contact v-for="contact in pub.authors.filter(a=>a&&a.sub)" :id="contact.sub.toString()" :key="contact.sub" size="small"/>
            </p>
        </div>

        <!--
        <p style="opacity: 0.8; line-height: 180%; max-height: 125px; overflow: auto;">
        -->
        <p style="opacity: 0.8; line-height: 180%;">
            {{pub.desc}}
        </p>
        <div style="float: right; clear: both; padding: 10px 0;">
            <b-badge pill class="bigpill" title="Registration Date">
                <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;<small>Registerd</small>&nbsp;&nbsp;{{new Date(pub.create_date).toLocaleDateString()}}
            </b-badge>
            <doibadge :doi="pub.doi"/>
        </div>
        <p>
            <b-badge v-for="tag in pub.tags" :key="tag" class="topic">{{tag}}</b-badge>
        </p>

        <b-row v-if="lastRelease" style="clear: both; border-top: 1px solid #eee; padding-top: 10px;">
            <b-col>
                <span class="form-header" v-if="lastRelease.sets && lastRelease.sets.length > 0" style="opacity: 0.7">Data Release</span>
                <div v-for="(set, idx) in lastRelease.sets" :key="idx" style="margin-bottom: 5px;">
                    <releaseset :set="set"/>
                </div>
            </b-col>
            <b-col>
                <span class="form-header" v-if="lastRelease.gaarchives && lastRelease.gaarchives.length > 0" style="opacity: 0.7">
                    Group Analysis Notebook
                </span>
                <div v-for="(gaarchive, idx) in lastRelease.gaarchives" :key="idx" style="margin-bottom: 5px;">
                    <gaarchive :gaarchive="gaarchive"/>
                </div>
            </b-col>
        </b-row>

    </div>
    <br style="clear: right"/>
</div>
</template>

<script>
import Vue from 'vue'

import contact from '@/components/contact'
import projectavatar from '@/components/projectavatar'
import doibadge from '@/components/doibadge'
import gaarchive from '@/components/gaarchive'
import releaseset from '@/components/releaseset'

export default {
    components: { 
        contact, 
        projectavatar, 
        doibadge,
        gaarchive,
        releaseset,
    },
    props: ['pub', 'compact'],
    data() {
        return {
            config: Vue.config,
        }
    },

    computed: {
        lastRelease() {
            if(!this.pub.releases || this.pub.releases.length == 0) return null;
            return this.pub.releases[this.pub.releases.length-1];
        }
    },

    methods: {
        click: function() {
            document.location = '/pub/'+this.pub._id;
        },
    },

    mounted: function() {
    },
}
</script>

<style scoped>
.pubcard {
transition: background-color 0.3s, box-shadow 0.3s;
clear: both;
padding: 0 10px;
}
h4 {
font-size: 15px;
font-weight: bold;
color: #333;
}
.name {
color: #333;
padding: 0px;
padding-top: 10px;
transition: color 0.3s;
}
.pubcard.clickable:hover .name {
color: #2693ff;
}
.pub-removed {
opacity: 0.5;
}
.topic {
padding: 4px; 
background-color: #eee;
text-transform: uppercase;
color: #999;
border-radius: 0px;
margin-right: 4px;
margin-bottom: 2px;
}
</style>
