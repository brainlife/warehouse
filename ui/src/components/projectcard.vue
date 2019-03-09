<template>
<div class="projectcard" @click="open">
    <projectavatar class="avatar" :project="project" :width="45" :height="45"/>
    <p class="title">
        <projectaccess :access="project.access"/> 
        {{project.name}}
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
        <b-progress :max="instance_count" height="20px">
            <b-progress-bar v-for="(count, state) in project.stats.instances" :key="state" 
                :variant="getvariant(state)" :value="count" :label="count.toString()" :title="count+' '+state+' processes'"/>
        </b-progress>
    </div>
    <div class="status">
        <b-row>
            <b-col md="3">
                <span v-if="project.stats" title="unique subjects">
                    <icon name="users" scale="0.8"/>&nbsp;{{project.stats.subjects}}
                </span>
            </b-col>
            <b-col md="3">
                <span v-if="project.stats" title="datasets">
                    <icon name="cubes" scale="0.8"/>&nbsp;{{project.stats.datasets}}
                </span>
            </b-col>
            <b-col md="3" title="active pipeline rules">
                <icon name="robot" scale="0.8"/>&nbsp;{{project.stats.rules.active}}
            </b-col>
            <b-col md="3" title="create date">
                <icon name="calendar" scale="0.8"/>&nbsp;<small>{{new Date(project.create_date).toLocaleDateString()}}</small>
            </b-col>
        </b-row>
    </div>
</div>
</template>

<script>

import projectaccess from '@/components/projectaccess'
import projectavatar from '@/components/projectavatar'
import contact from '@/components/contact'

export default {
    components: {
        projectavatar, contact, projectaccess,
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
/*
transition: box-shadow 0.5s;
*/
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
margin: 5px;
position: relative;
border-radius: 50%;
border: 3px solid white;
}
.title {
font-weight: bold;
padding: 5px;
margin-bottom: 0px;
height: 30px;
overflow: hidden;
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
height: 50px;
overflow: hidden;
}
.status {
background-color: #e0e0e0;
padding: 4px 10px;
color: #999;
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