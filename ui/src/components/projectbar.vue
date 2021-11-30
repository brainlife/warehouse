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

                    {{project.stats.datasets.count}} <span style="opacity: 0.5;">obj</span>
                    <div v-if="project.stats.datasets.size" style="display: inline-block; opacity: 0.5;">
                        <span>
                            ({{project.stats.datasets.size | filesize}})
                        </span>
                    </div>
                    <!--
                    <span style="opacity: 0.2;">|</span>
                    <icon name="id-badge" scale="0.7" style="opacity: 0.6" title="group id"/> {{project.group_id}}
                    -->
                </div>
                <span class="title">
                    {{project.name}} <b-badge class="list-badge" variant="primary" v-if="project.new">New</b-badge> 
                </span>
                <div class="desc">{{trim(project.desc)}}</div>
            </div>
        </b-col>
        <b-col md="3">
            <div class="datatypes" v-if="project.stats && project.stats.datasets" style="display: inline-block;">
                <datatypetag v-for="datatype in project.stats.datasets.datatypes_detail" :key="datatype._id" :datatype="datatype.type" style="font-size: 85%; margin-right: 2px"/>
            </div>
        </b-col>
        <b-col md="1">
            <span style="font-size: 90%">{{new Date(project.create_date).toLocaleDateString()}}</span>
        </b-col>
        <b-col md="1">
            <stateprogress v-if="project.stats && project.stats.instances && !project.openneuro" 
                :states="project.stats.instances" height="26px"/>
        </b-col>
        <b-col md="1" v-if="config.user">
            <div class="contacts">
                <contact v-for="c in contacts" :key="c._id" :id="c" size="tiny" style="margin-left: -6px; margin-bottom: -4px"/>
            </div>
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
        trim(s) {
            if(!s) return "Untitled"; 
            if(s.length < 300) return s; 
            return s.substring(0, 300)+"...";
        },
    },
    computed: {
        contacts() {
            return [...new Set([...this.project.admins, ...this.project.members])];
        }
    },
}
</script>

<style scoped>
.project {
background-color: white;
padding: 7px 6px;
margin-bottom: 1px;
}
.project:hover {
background-color: #f9f9f9;
cursor: pointer;
}
.header-row {
margin-left: 42px;
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
font-size: 90%;
font-weight: bold;
}
.desc {
font-size: 85%;
opacity: 0.7;
padding-top: 5px;
}
</style>
