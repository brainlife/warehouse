<template>
<div class="pubcard clickable" :class="{'pub-removed': pub.removed}" @click="click">
    <div style="background-color: white; padding: 20px; border-radius: 10px;">
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

        <div style="margin-right: 150px;">
            <h5 class="name serif">
                <b-badge v-if="pub.removed" variant="danger">Removed</b-badge>
                {{pub.name}}
            </h5>
            <p>
                <doibadge :doi="pub.doi"/>
                <b-badge pill class="bigpill" title="Registration Date">
                    <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;<small>Registered</small>&nbsp;&nbsp;{{new Date(pub.create_date).toLocaleDateString()}}
                </b-badge>
            </p>
            <p class="desc serif">
                {{pub.desc}}
            </p>
            <p>
                <contact v-for="contact in pub.authors.filter(a=>a&&a.sub)" :id="contact.sub.toString()" :key="contact.sub" size="small"/>
            </p>
            <p>
                <b-badge v-for="tag in pub.tags" :key="tag" class="topic">{{tag}}</b-badge>
            </p>
        </div>
    </div>

    <div v-for="release in pub.releases" :key="release._id">
        <div v-if="!release.removed" style="clear: both; padding: 10px; margin-left: 10px; border-left: 5px solid #0002">
            <span class="form-header" style="opacity: 0.7; display: inline-block;">Release</span> <b>{{release.name}}</b>
            <b-badge pill class="bigpill" style="margin-left: 10px; transform: scale(0.9); transform-origin: left; position: relative; top: -2px;" v-if="release.subjects">
                <icon name="user-friends" style="opacity: 0.4;"/>&nbsp;&nbsp;{{release.subjects}} <small>subjects</small> 
                <span v-if="release.sessions"><span style="opacity: 0.4"> | </span>{{release.sessions}} <small>sessions</small></span>
            </b-badge>

            <small style="float: right; padding-right: 10px;">
                <icon name="calendar" style="opacity: 0.4;"/> {{new Date(release.create_date).toLocaleDateString()}}
            </small>
            <br>
            <p v-if="release.desc" class="serif"><small>{{release.desc}}</small></p>
            <div v-if="release.sets">
                <div v-for="(set, idx) in release.sets.slice(0,10)" :key="idx" 
                    style="margin-left: 10px; display: inline-block;">
                    <releaseset :set="set"/>
                </div>
                <span v-if="release.sets.length >= 10">
                    ... <small>{{release.sets.length - 10}} more</small>
                </span>
            </div>
            <gaarchive v-for="gaarchive in release.gaarchives" :key="gaarchive._id" 
                :gaarchive="gaarchive" 
                style="margin-top: 10px; background-color: #fff7;"/>
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
            setShowMax: [],
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
    clear: both;
}
.name {
    color: #666;
}
.desc {
    line-height: 180%;
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
    background-color: #f0f0f0;
    transition: 0.3s background-color;
}
</style>
