<template>
<div>
    <pageheader :user="config.user"/>
    <sidemenu active="/projects"/>
    <div class="header" v-if="project">
        <el-button-group style="float: right;" v-if="project._canedit">
            <el-button @click="remove()" icon="delete">Remove Project</el-button>
            <el-button @click="edit()" icon="edit">Edit</el-button>
        </el-button-group>
        <h1><span class="text-muted"><icon name="shield" scale="1.5"/> Project |</span> {{project.name}}</h1>
    </div>
    <div class="page-content" v-if="project" style="margin-top: 80px">
        <table class="info">
        <tr>
            <th width="180px;">Description</th>
            <td>
                {{project.desc}}
            </td>
        </tr>
        <tr>
            <th>Access</th>
            <td>
                <projectaccess :access="project.access"/>
            </td>
        </tr>
        <tr>
            <th>Admins</th>
            <td>
                <contact v-for="c in project.admins" key="c._id" :id="c"></contact>
            </td>
        </tr>
        <tr>
            <th>Project Members</th>
            <td>
                <contact v-for="c in project.members" key="c._id" :id="c"></contact>
            </td>
        </tr>
        <tr v-if="project.readme">
            <th>README</th>
            <td>
                <vue-markdown :source="project.readme"></vue-markdown>
            </td>
        </tr>
        <tr>
            <th>TODO</th>
            <td>
                <p class="text-muted">What else can I show? Maybe timeline of various events that happened to this project?</p>
                <p class="text-muted">Or maybe we can display Facebook style community messaging capability?</p>
            </td>
        </tr>
        </table>

    </div><!--page-content-->
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'
import VueMarkdown from 'vue-markdown'

import sidemenu from '@/components/sidemenu'
import contactlist from '@/components/contactlist'
import project from '@/components/project'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import projectaccess from '@/components/projectaccess'

//hello

export default {
    components: { sidemenu, contactlist, project, projectaccess, pageheader, contact, VueMarkdown },

    data () {
        return {
            project: null,
            config: Vue.config,
        }
    },

    mounted: function() {
        this.$http.get('project', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
        }})
        .then(res=>{
            this.project = res.body.projects[0];
        }).catch(err=>{
            console.error(err);
        });
    },

    methods: {
        edit: function() {
            this.$router.push('/project/'+this.project._id+'/edit');
        },
        remove: function() {
            alert('todo');
        },
    },
}
</script>

<style scoped>
.header {
background: #666;
padding: 20px;
margin-top: 42px;
height: 30px;
position: fixed;
right: 0px;
left: 90px;
color: #666;
z-index: 1;
border-bottom: 1px solid #666;
}
.header h1 {
color: #eee;
}
.header-bottom {
height: 50px;
background-color: white;
position: fixed;
top: 140px;
right: 0px;
left: 90px;
border-bottom: 1px solid #ddd;
}</style>
