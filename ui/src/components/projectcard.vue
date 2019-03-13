<template>
<div class="projectcard" @click="open">
    <projectavatar class="avatar" :project="project" :width="60" :height="60"/>
    <div class="private" v-if="project.access == 'private'"><icon name="lock"/></div>
    <p class="title">
        <!--<projectaccess :access="project.access"/>-->
        {{project.name}}
    </p>
    <p class="datatypes">
        <datatypetag v-for="datatype_id in project.stats.datasets.datatypes" :key="datatype_id" :datatype="datatype_id" style="font-size: 90%; margin-right: 3px"/>
    </p>
    <p class="desc">{{project.desc}}</p>
    <p class="contacts">
        <contact v-for="c in project.members" :key="c._id" :id="c" size="tiny"/>
    </p>
    <!--
    <p class="contacts">
        <b>Members</b> <contact v-for="c in project.members" :key="c._id" :id="c" size="small"/>
    </p>
    -->
    <div class="instances">
        <b-progress :max="instance_count" height="4px" v-if="instance_count > 0 && !project.openneuro"> 
            <b-progress-bar v-for="(count, state) in project.stats.instances" :key="state"
                :variant="getvariant(state)" 
                :animated="isanimated(state)"
                :value="count" 
                :label-dis="count.toString()" 
                :title="count+' '+state+' processes'"/>
        </b-progress>
        <div v-else style="height: 4px"></div>
    </div>
    <div class="status">
        <b-row v-if="project.stats && project.stats.datasets && project.stats.rules">
            <!--
            <b-col md="3" title="create date">
                <icon name="calendar" scale="0.8"/>&nbsp;<small>{{new Date(project.create_date).toLocaleDateString()}}</small>
            </b-col>
            -->
            <b-col md="3" title="unique subjects">
                <icon name="users" scale="0.8"/>&nbsp;{{project.stats.datasets.subject_count}}
            </b-col>
            <b-col md="3" title="active pipeline rules">
                <icon name="robot" scale="0.8"/>&nbsp;{{project.stats.rules.active}}
                <span v-if="project.stats.rules.inactive > 0">/ {{project.stats.rules.inactive+project.stats.rules.active}}</span>
            </b-col>
            <b-col md="3" title="number of datasets">
                <icon name="cubes" scale="0.8"/>&nbsp;{{project.stats.datasets.count}}
            </b-col>
            <b-col md="3" title="total dataset size">
                <span v-if="project.stats.datasets.size"><icon name="disk" scale="0.8"/>&nbsp;{{project.stats.datasets.size | filesize}}</span>
            </b-col>
        </b-row>
    </div>
</div>
</template>

<script>

import projectaccess from '@/components/projectaccess'
import projectavatar from '@/components/projectavatar'
import datatypetag from '@/components/datatypetag'
import contact from '@/components/contact'

export default {
    components: {
        projectavatar, contact, projectaccess, datatypetag,
    },
    watch: {
        /*
        project: {
            handler() {
                console.log("project updated", this.project._id);
                //if(this.project && this.project.avatar) this.avatar = this.project.avatar;
                this.$forceUpdate();
            },
            deep: true
        }
        */
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

        getvariant(state) {
            switch(state) {
            case "running": return "primary";
            case "requested": return "info";
            case "finished": return "success";
            case "stopped": return "secondary";
            case "failed": return "danger";
            default: return "dark";
            }
        },
        isanimated(state) {
            switch(state) {
            case "running": 
            case "requested":           
                return true;
            }
            return false;
        }
    },
    computed: {
        instance_count: function() {
            if(!this.project.stats) return 0;
            let sum = 0;
            for(let state in this.project.stats.instances) {
                //if(state == "others") continue; //ignore this for now.
                sum += this.project.stats.instances[state];
            }
            return sum;
        }
    },
}
</script>

<style scoped>

.projectcard {
border: none;
cursor: pointer;
box-shadow: 2px 2px 4px rgba(0,0,0,0.1);
background-color: white;
position: relative;
/*
transition: box-shadow 0.5s;
*/
}
.datatypes {
height: 25px;
padding: 0px 5px;
margin-bottom: 0px;
overflow: hidden; 
white-space: nowrap; 
text-overflow: ellipsis;
}
/*
.projectcard img {
filter: grayscale(100%);
transition: filter 1s;
}
.projectcard:hover img {
filter: none;
}
*/
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
background:#e0e0e0;
position: absolute;
padding-left: 23px;
}

.title {
font-weight: bold;
padding: 5px;
margin-bottom: 0px;
height: 30px;
overflow: hidden;
color: #666;
white-space: nowrap; 
text-overflow: ellipsis;
}
.desc {
padding: 5px;
font-size: 85%;
opacity: 0.8;
height: 55px;
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
color: #bbb;
clear: both;
/*
border-top: 1px solid #ddd;
*/
height: 30px;
}

.progress {
border-radius: 0;
}
.progress .bg-info {
background-color: #50bfff !important;
}
</style>
