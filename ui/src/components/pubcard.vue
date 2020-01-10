<template>
<div class="pubcard clickable" :class="{'pub-removed': pub.removed}">
    <div @click="click()">

        <div style="float: right; margin-right: 15px;">
            <projectavatar :project="pub.project" :width="100" :height="100" style="margin: 10px 0;"/>
            <br>
            <div class='altmetric-embed'
                data-badge-type-dis='donut'
                data-badge-popover="left" 
                data-hide-no-mentions="true" 
                :data-doi="pub.doi||config.debug_doi"></div>
            <br>
        </div>

        <div style="margin-right: 150px;">
            <h5 class="name">
                <b-badge  v-if="pub.removed" variant="danger">Removed</b-badge>
                <!--<small>{{pub.project.name}} <icon name="arrow-right"/></small>-->
                {{pub.name}}
            </h5>
            <p style="opacity: 0.8; line-height: 170%;">
                {{pub.desc}}
                <br>
                <b-badge v-for="tag in pub.tags" :key="tag" class="topic">{{tag}}</b-badge>
            </p>
            <p style="float: right;">
                <b-badge pill class="bigpill" title="Registration Date">
                    <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;<small>Registerd</small>&nbsp;&nbsp;{{new Date(pub.create_date).toLocaleDateString()}}
                </b-badge>
                <doibadge :doi="pub.doi"/>
            </p>
            <p>
                <contact v-for="contact in pub.authors" :id="contact.sub.toString()" :key="contact.sub" size="small"/>
            </p>
        </div>

    </div>
    <br style="clear: right"/>
</div>
</template>

<script>
import Vue from 'vue'

import contact from '@/components/contact'
import projectavatar from '@/components/projectavatar'
import doibadge from '@/components/doibadge'

export default {
    components: { contact, projectavatar, doibadge },
    props: ['pub', 'compact'],
    data() {
        return {
            config: Vue.config,
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
transition: background-color 0.3s, color 0.3s, box-shadow 0.3s;
border-bottom: 1px solid #eee;
font-size: 90%;
clear: both;
padding: 0 10px;
}
h4 {
font-size: 15px;
font-weight: bold;
color: #333;
}
.pubcard.clickable {
cursor: pointer;
}
.pubcard.clickable:hover {
background-color: #fffc;
box-shadow: 1px 1px 4px #0004;
}
.name {
color: #333;
padding: 0px;
padding-top: 10px;
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
