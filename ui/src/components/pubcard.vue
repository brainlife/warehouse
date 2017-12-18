<template>
<b-card no-body class="pubcard clickable" :class="{'pub-removed': pub.removed}">
    <div @click="click()">
        <div style="float: left; margin-right: 15px;">
            <projectavatar :project="pub.project"/>
        </div>
        <div style="margin: 0px 10px 5px 100px;">
            <h5 class="name"><small>{{pub.project.name}} <icon name="arrow-right"/></small> {{pub.name}}</h5>
            <p style="opacity: 0.8;">{{pub.desc}}</p>
            <div style="line-height: 200%;">
                <b-badge v-for="tag in pub.tags" :key="tag" class="topic">{{tag}}</b-badge>
            </div>
        </div>
        <div v-if="!compact">
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
</b-card>
</template>

<script>
import Vue from 'vue'

import contact from '@/components/contact'
import projectavatar from '@/components/projectavatar'

export default {
    components: { contact, projectavatar },
    props: ['pub', 'compact'],

    methods: {
        click: function() {
            document.location = '/pub/'+this.pub._id;
        },
    }
}
</script>

<style scoped>
.pubcard {
transition: box-shadow 0.5s, background-color 0.5s;
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
box-shadow: 2px 2px 4px #999;
background-color: #f3f3f3;
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
padding: 8px; 
background-color: #eee;
text-transform: uppercase;
color: #999;
border-radius: 0px;
margin-right: 5px;
}
</style>
