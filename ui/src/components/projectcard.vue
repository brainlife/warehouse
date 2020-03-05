<template>
<div class="projectcard" @click="open">
    <projectavatar class="avatar" :project="project" :width="60" :height="60"/>
    <div class="private" v-if="project.access == 'private'"><icon name="lock"/></div>
    <div class="main-content">
        <p class="title">
            {{project.name}}
        </p>
        <p class="datatypes" v-if="project.stats && project.stats.datasets">
            <datatypetag v-for="datatype in project.stats.datasets.datatypes_detail" :key="datatype._id" :datatype="datatype.type" style="font-size: 85%; margin-right: 2px"/>
        </p>
        <p class="desc">{{project.desc}}</p>
        <p v-if="config.user" class="contacts" style="margin-left: 5px;">
            <contact v-for="c in project.members" :key="c._id" :id="c" size="tiny" style="margin-left: -5px"/>
        </p>
    </div>
    <div class="status">
        <b-row v-if="project.stats" no-gutters="true">
            <b-col md="9" title="unique subjects" v-if="project.stats.datasets && project.stats.datasets.subject_count">
                {{project.stats.datasets.subject_count}} <span style="opacity:0.6;">sub</span>
                <span style="opacity:0.2;">|</span>
                {{project.stats.datasets.count}} <span style="opacity:0.6;">objs</span>
                <span v-if="project.stats.datasets.size" style="opacity:0.8;">({{project.stats.datasets.size | filesize}})</span>
            </b-col>
            <b-col md="3" title="active pipeline rules" v-if="project.stats.rules" style="font-size: 90%; text-align: right;">
                <icon name="robot" scale="0.8"/>&nbsp;{{project.stats.rules.active}}
                <span v-if="project.stats.rules.inactive > 0">/ {{project.stats.rules.inactive+project.stats.rules.active}}</span>
            </b-col>
        </b-row>
    </div>
    <div class="instances">
        <stateprogress v-if="project.stats && project.stats.instances && !project.openneuro" 
            :states="project.stats.instances" height="3px" :show_label="false"/>
        <div v-else style="height: 3px"></div>
    </div>
</div>
</template>

<script>

import Vue from 'vue'

import projectaccess from '@/components/projectaccess'
import projectavatar from '@/components/projectavatar'
import datatypetag from '@/components/datatypetag'
import contact from '@/components/contact'
import stateprogress from '@/components/stateprogress'

export default {
    components: {
        projectavatar, contact, projectaccess, datatypetag, stateprogress,
    },
        
    props: {
        project: { type: Object },
    },

    data() {
        return {
            config: Vue.config,
        }
    },

    created() {
        //delete this.project.stats;
        if(!this.project.stats) this.project.stats = {
            instances: {},    
            rules: {
                active: 0,
                inactive: 0,
            }
        }
    },

    methods: {
        open() {
            this.$router.push("/project/"+this.project._id);
        },
    },
}
</script>

<style scoped>

.projectcard {
border: none;
cursor: pointer;
box-shadow: 2px 2px 3px rgba(0,0,0,0.05);
background-color: white;
position: relative;
/*
transition: filter 0.5s;
filter: saturate(20%);
*/
}
.datatypes {
padding: 0px 5px;
margin-bottom: 0px;
overflow: hidden; 
font-size: 85%;
}
.avatar {
float: right;
position: relative;
margin-left: 10px;
margin-bottom: 10px;
}

.private {
width: 40px;
height: 40px;
right: 0px;
clip-path: polygon(0 0, 100% 0, 100% 100%);
background:#3333;
position: absolute;
padding-left: 23px;
}

.main-content {
height: 150px;
overflow: hidden;    
}

.title {
font-weight: bold;
padding: 5px;
margin-bottom: 0px;
height: 30px;
overflow: hidden;
white-space: nowrap; 
text-overflow: ellipsis;
}
.desc {
padding: 5px;
font-size: 85%;
opacity: 0.8;
height: 40px;
overflow: hidden;
padding-bottom: 5px;
}
.contacts {
padding: 5px;
margin-bottom: 5px;
font-size: 90%;
height: 30px;
overflow: hidden;
}
.status {
background-color: #f7f7f7;
padding: 4px 10px;
color: #666;
clear: both;
font-size: 90%;
/*
border-top: 1px solid #ddd;
*/
height: 25px;
}

.progress {
border-radius: 0;
}
</style>
