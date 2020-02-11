<template>
<div class="project" @click="open">
    <b-row>
        <b-col md="6">
            <projectavatar class="avatar" :project="project" :width="25" :height="25"/>
            <div class="header-row">
                <projectaccess :access="project.access"/>
                <div style="float: right; font-size: 90%; opacity: 0.9;" v-if="project.stats.datasets && project.stats.datasets.subject_count">
                    {{project.stats.datasets.subject_count}} <span style="opacity: 0.5;">sub</span>
                    <span style="opacity: 0.2;">|</span>
                    {{project.stats.datasets.count}} <span style="opacity: 0.5;">objs</span>
                    <div v-if="project.stats.datasets.size" style="display: inline-block; opacity: 0.5;">
                        <span>
                            ({{project.stats.datasets.size | filesize}})
                        </span>
                    </div>
                </div>
                <span class="title">
                    {{project.name}}
                </span>
                <div class="desc">{{project.desc||'no description'}}</div>
            </div>
        </b-col>
        <b-col md="1" v-if="config.user">
            <div class="contacts">
                <contact v-for="c in contacts" :key="c._id" :id="c" size="tiny" style="margin-left: -6px; margin-bottom: -4px"/>
            </div>
        </b-col>
        <b-col md="2">
            <div class="datatypes" v-if="project.stats && project.stats.datasets" style="display: inline-block;">
                <datatypetag v-for="datatype in project.stats.datasets.datatypes_detail" :key="datatype._id" :datatype="datatype.type" style="font-size: 85%; margin-right: 2px"/>
            </div>
        </b-col>
        <b-col md="1">
            <b-badge pill class="bigpill">
                <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;{{new Date(project.create_date).toLocaleDateString()}}
            </b-badge>
        </b-col>
        <b-col md="2" style="font-size: 85%; margin-top: 2px;">
            <stateprogress v-if="project.stats && project.stats.instances && !project.openneuro" 
                :states="project.stats.instances" height="15px"/>
            <!--
            <icon name="robot" scale="0.8"/>&nbsp;{{project.stats.rules.active}}
            <span v-if="project.stats.rules.inactive > 0">/ {{project.stats.rules.inactive+project.stats.rules.active}}</span>
            -->
        </b-col>
    </b-row>
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
    computed: {
        /*
        instance_count: function() {
            if(!this.project.stats) return 0;
            let sum = 0;
            for(let state in this.project.stats.instances) {
                //if(state == "others") continue; //ignore this for now.
                sum += this.project.stats.instances[state];
            }
            return sum;
        }
        */
        contacts() {
            return [...new Set([...this.project.admins, ...this.project.members])];
        }
    },
}
</script>

<style scoped>
.project {
background-color: white;
padding: 3px 6px;
margin-bottom: 1px;
}
.project:hover {
background-color: #f9f9f9;
cursor: pointer;
}
.header-row {
margin-left: 40px;
}
.datatypes {
font-size: 85%;
}
.avatar {
float: left;
}
.private {
float: left;
color: #dc3545;
margin-right: 3px;
}
.title {
font-size: 95%;
font-weight: bold;
}
.desc {
font-size: 85%;
opacity: 0.7;
}
</style>
