<template>
<div class="project" @click="open">
    <b-row>
        <b-col md="6">
            <projectavatar class="avatar" :project="project" :width="25" :height="25"/>
            <div class="header-row">
                <projectaccess :access="project.access"/>
                <div style="float: right; font-size: 90%; opacity: 0.9;" v-if="project.stats.datasets">
                    <icon name="users" scale="0.8"/>&nbsp;{{project.stats.datasets.subject_count}}
                    <icon name="cubes" scale="0.8"/>&nbsp;{{project.stats.datasets.count}}
                    <span v-if="project.stats.datasets.size" style="opacity: 0.8; font-size: 85%;"> ({{project.stats.datasets.size | filesize}})</span>
                </div>
                <span class="title">
                    {{project.name}}
                </span>
                <div class="desc">{{project.desc||'no description'}}</div>
            </div>
        </b-col>
        <b-col md="2" style="font-size: 85%; margin-top: 2px;">
            <stateprogress v-if="project.stats && project.stats.instances && !project.openneuro" 
                :states="project.stats.instances" height="15px"/>
            <!--
            <icon name="robot" scale="0.8"/>&nbsp;{{project.stats.rules.active}}
            <span v-if="project.stats.rules.inactive > 0">/ {{project.stats.rules.inactive+project.stats.rules.active}}</span>
            -->
        </b-col>
        <b-col md="3">
            <div class="datatypes" v-if="project.stats">
                <datatypetag v-for="datatype_id in project.stats.datasets.datatypes" :key="datatype_id" :datatype="datatype_id" 
                    style="font-size: 85%; margin-right: 2px"/>
            </div>
        </b-col>
        <b-col md="1">
            <div class="contacts">
                <contact v-for="c in contacts" :key="c._id" :id="c" size="tiny" style="margin-left: -5px"/>
            </div>
        </b-col>
    </b-row>
</div>
</template>

<script>

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
box-shadow: 1px 1px 3px #ddd;
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
font-weight: bold;
}
.desc {
font-size: 85%;
opacity: 0.9;
}
.contacts {
}
.status {
}
.progress {
}
</style>
