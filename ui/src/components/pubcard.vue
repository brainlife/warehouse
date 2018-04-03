<template>
<div class="pubcard clickable" :class="{'pub-removed': pub.removed}">
    <div @click="click()">
        <div style="float: left; margin-right: 15px;">
            <projectavatar :project="pub.project" width="80" height="80"/>
        </div>
        <div style="margin: 0px 10px 5px 100px;">
            <div v-if="pub.doi" style="float: right; margin: 10px;">
                <div class='altmetric-embed' data-badge-type='donut' data-badge-popover="left" data-hide-no-mentions="true" :data-doi="pub.doi"></div>
            </div>
            <!--<doibadge :doi="pub.doi" style="float: right; margin-top: 10px;"/>-->
            <div style="margin-right: 110px;">
                <h5 class="name"><small>{{pub.project.name}} <icon name="arrow-right"/></small> {{pub.name}}</h5>
                <p style="opacity: 0.8;">{{pub.desc}}</p>
                <div style="line-height: 200%;">
                    <b-badge v-for="tag in pub.tags" :key="tag" class="topic">{{tag}}</b-badge>
                </div>
            </div>
        </div>
        <div v-if="!compact" style="clear: both;">
            <hr>
            <div style="margin: 0px 10px 5px 100px;">
                <p>
                    <b class="text-muted">Authors</b> <contact v-for="contact in pub.authors" :key="contact.id" :fullname="contact.fullname" :email="contact.email"></contact>
                    <b class="text-muted">Published On </b> {{new Date(pub.create_date).toLocaleDateString()}}
                </p>
                <el-tag v-if="pub.removed" type="warning">Removed</el-tag>
            </div>
        </div>
    </div>
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

    methods: {
        click: function() {
            document.location = '/pub/'+this.pub._id;
        },
    },

    mounted: function() {
        _altmetric_embed_init(this.$el);
    },
}
</script>

<style scoped>
.pubcard {
transition: box-shadow 0.5s, background-color 0.5s;
box-shadow: 1px 1px 2px rgba(0,0,0,0.1);
padding-bottom: 5px;
}
h4 {
font-size: 15px;
font-weight: bold;
}
.pubcard.clickable {
background-color: white;
}
.pubcard.clickable:hover {
cursor: pointer;
box-shadow: 1px 1px 3px rgba(0,0,0,0.5);
}
.name {
color: #666;
padding: 0px;
padding-top: 10px;
}
.pub-removed {
opacity: 0.5;
}
.topic {
padding: 6px; 
background-color: #eee;
text-transform: uppercase;
color: #999;
border-radius: 0px;
margin-right: 5px;
}
</style>
