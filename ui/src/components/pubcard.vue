<template>
<div class="pubcard clickable" :class="{'pub-removed': pub.removed}" @click="click">
    <div>
        <div style="float: right;">
            <projectavatar v-if="pub.project" :project="pub.project" :width="100" :height="100" style="margin: 0 0 10px 10px;"/>
            <br>
            <div class='altmetric-embed'
                data-badge-type-dis='donut'
                data-badge-popover="left" 
                data-hide-no-mentions="true" 
                :data-doi="pub.doi||config.debug_doi"></div>
            <br>
        </div>

        <div style="margin-right: 150px; padding: 10px;">
            <h5 class="name">
                <b-badge v-if="pub.removed" variant="danger">Removed</b-badge>
                {{pub.name}}
            </h5>
            <p style="opacity: 0.8; line-height: 180%;">
                {{pub.desc}}
            </p>

            <p>
                <contact v-for="contact in pub.authors.filter(a=>a&&a.sub)" :id="contact.sub.toString()" :key="contact.sub" size="small"/>
            </p>

            <p>
                <b-badge v-for="tag in pub.tags" :key="tag" class="topic">{{tag}}</b-badge>
            </p>
        </div>

        <div v-for="(release, idx) in pub.releases" :key="idx">
            <div v-if="!release.removed" style="clear: both; border-top: 1px solid #e6e6e6; padding: 5px; padding-left: 20px;">
                <span class="form-header" style="opacity: 0.7; display: inline-block;">Release</span> <b>{{release.name}}</b>
                <small style="float: right; padding-right: 10px;">
                    <icon name="calendar" style="opacity: 0.4;"/> {{new Date(release.create_date).toLocaleDateString()}}
                </small>
                <br>
                <small v-if="release.desc">{{release.desc}}<br></small>

                <b-badge pill class="bigpill" style="margin-right: 5px;" v-if="release.subjects">
                    <icon name="user-friends" style="opacity: 0.4;"/>&nbsp;&nbsp;{{release.subjects}} <small>subjects</small> 
                    <span v-if="release.sessions"><span style="opacity: 0.4"> | </span>{{release.sessions}} <small>sessions</small></span>
                </b-badge>

                <div v-if="release.sets" v-for="(set, idx) in release.sets" :key="idx" style="margin-right: 5px; display: inline-block;">
                    <releaseset :set="set"/>
                </div>
                <!--
                <span class="form-header" v-if="release.gaarchives && release.gaarchives.length > 0" style="opacity: 0.7">
                    Group Analysis Notebook
                </span>
                -->
                <div v-for="(gaarchive, idx) in release.gaarchives" :key="idx" style="margin: 3px; display: inline-block;">
                    <gaarchive :gaarchive="gaarchive"/>
                </div>
            </div>
        </div>

        <br clear="both">
        <div style="background-color: #f0f0f0; padding: 10px;">
            <span style="float: right">
                <doibadge :doi="pub.doi"/>
                <b-badge pill class="bigpill" title="Registration Date">
                    <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;<small>Registerd</small>&nbsp;&nbsp;{{new Date(pub.create_date).toLocaleDateString()}}
                </b-badge>
            </span>
            <br clear="both">
        </div>
    </div>
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
        /*
        lastRelease() {
            if(!this.pub.releases || this.pub.releases.length == 0) return null;
            return this.pub.releases[this.pub.releases.length-1];
        }
        */
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
    clear: both;
}
h4 {
    font-size: 15px;
    font-weight: bold;
    color: #333;
}
.name {
    color: #333;
    padding: 0px;
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
.clickable:hover {
    /*
    transition: color 0.3s;
    color: #007bff
    */
    transition: box-shadow 0.3s;
    box-shadow: 1px 1px 4px #0003;
}

</style>
