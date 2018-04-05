<template>
<div>
    <pageheader>
        <el-input icon="search" v-model="query" placeholder="Search ..."></el-input>
    </pageheader>
    <sidemenu active="/projects"></sidemenu>
    <div class="page-content">
        <div v-if="!projects" style="margin: 40px;"><h3>Loading ..</h3></div>
        <div class="margin20" v-if="projects">
            <h4 class="group-title">Private Projects</h4>
            <p class="text-muted">Only the members of project can access datasets inside private projects.</p>
            <div v-for="project in projects" :key="project._id" class="project" v-if="project.access == 'private'">
                <projectcard :project="project"/>
            </div>
            <br clear="both">
            <br>

            <h4 class="group-title">Public Projects</h4>
            <p class="text-muted">Datasets are accessible to any users but only project member can update them.</p>
            <div v-for="project in projects" :key="project._id" class="project" v-if="project.access == 'public'">
                <projectcard :project="project"/>
            </div>
            <br clear="both">
        </div>
        <b-button class="button-fixed" v-if="user" @click="newproject()" title="Create New Project"><icon name="plus" scale="2"/></b-button>
    </div><!--page-content-->
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import sidemenu from '@/components/sidemenu'
import contactlist from '@/components/contactlist'
import project from '@/components/project'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import projectcard from '@/components/projectcard'

export default {
    components: { sidemenu, contactlist, project, pageheader, contact, projectcard},

    data () {
        return {
            projects: null,
            count: 0, //total counts of projects (not paged)

            user: Vue.config.user, //see if user is logged in

            //placeholder for dialog
            edit: {
                _id: null, //set if editing
                name: "",
                desc: "",
                access: "",

                admins: [],
                members: [],
            },

            query: "",

            config: Vue.config,
        }
    },

    mounted: function() {
        this.$http.get('project', {params: {
            /*
            find: JSON.stringify({$or: [
                { members: Vue.config.user.sub}, 
                { admins: Vue.config.user.sub}, 
                { access: "public" },
            ]})
            */
        }})
        .then(res=>{
            this.projects = res.body.projects;
            this.count = res.body.count;
        }).catch(err=>{
            console.error(err);
        });
    },

    methods: {
        changemember: function(list, uids) {
            if(!uids) return;
            this.edit[list] = uids;
        },

        newproject: function() {
            this.$router.push('/project/_/edit');
        },
  },

}
</script>

<style scoped>
.group-title {
color: #999;
text-transform: uppercase;
padding-bottom: 10px;
border-bottom: 1px solid #ddd;
}
.project {
margin-right: 10px;
margin-bottom: 10px;
width: 350px;
float: left;
}
</style>
