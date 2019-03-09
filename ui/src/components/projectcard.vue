<template>
<!--
<div class="projectcard">
    <p class="name">
        <projectavatar :project="project" :width="20" :height="20" class="projectavatar"/>
        {{project.name}} <icon v-if="project.access == 'private'" name="lock" scale="0.8"></icon>
    </p>
    <div class="desc">{{project.desc}}</div>
    {{project}}
</div>
-->
<b-card no-body class="projectcard" @click="open">
    <projectavatar class="avatar" :project="project" :width="70" :height="70"/>
    <p class="title">
        <projectaccess :access="project.access"/> 
        {{project.name}}
    </p>
    <p class="desc">{{project.desc}}</p>
    <p class="contacts">
        <contact v-for="c in project.admins" :key="c._id" :id="c" size="small"/>
    </p>
    <!--
    <p class="contacts">
        <b>Members</b> <contact v-for="c in project.members" :key="c._id" :id="c" size="small"/>
    </p>
    -->
    <div class="status">
        <span style="float: right;">
            <icon name="calendar" scale="0.8"/>&nbsp;<time>{{new Date(project.create_date).toLocaleDateString()}}</time>
        </span>
    </div>
</b-card>
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
    }
}
</script>

<style scoped>

.projectcard {
border: none;
cursor: pointer;
box-shadow: 2px 2px 4px rgba(0,0,0,0.1);
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
.projectcard:hover {
box-shadow: 4px 4px 8px rgba(0,0,0,0.2);
}
.avatar {
float: right;
margin-bottom: 5px;
}
.title {
font-weight: bold;
padding: 5px;
margin-bottom: 0px;
}
.desc {
padding: 5px;
font-size: 85%;
opacity: 0.8;
}
.contacts {
padding: 5px;
margin-bottom: 5px;
font-size: 90%;
}
.status {
margin-top: 5px;
background-color: #eee;
padding: 4px 10px;
color: #aaa;
clear: both;
/*
border-top: 1px solid #ddd;
*/
height: 30px;
}
</style>