<template>
<div>
    <pageheader :user="config.user">
        <el-row :gutter="20">
            <el-col :span="14">
                <el-input icon="search" v-model="query" placeholder="Search ..."></el-input>
            </el-col>
            <el-col :span="10">
                <el-button v-if="user" @click="newproject()" icon="plus">Add Project</el-button>
            </el-col>
        </el-row>
    </pageheader>
    <sidemenu active="/projects"></sidemenu>
    <div class="page-content">
        <!--
        <el-table v-if="projects" :data="projects" style="width: 100%;" @row-click="click" row-class-name="clickable-row">
            <el-table-column label="Name" prop="name" sortable></el-table-column> 
            <el-table-column width="275" label="Description" prop="desc"></el-table-column> 
            <el-table-column width="100" label="Access" prop="access" sortable>
                <template scope="scope">
                    <projectaccess :access="scope.row.access"/>
                </template>
            </el-table-column> 
            <el-table-column width="375" label="Admins">
                <template scope="scope">
                    <contact v-for="id in scope.row.admins" key="id" :id="id"></contact>
                </template>
            </el-table-column> 
            <el-table-column>
                <template scope="scope">
                    <div style="float: right;">
                        <el-button v-if="scope.row._canedit" type="text" @click.stop="editp(scope.row)">Edit</el-button>
                    </div>
                </template>
            </el-table-column> 
        </el-table>
        -->
        <div v-if="!projects" style="margin: 40px;"><h3>Loading ..</h3></div>
        <div class="margin20" v-if="projects">
            <h2 class="group-title">Private Projects</h2>
            <div v-for="project in projects" :key="project._id" v-if="project.access == 'private'" style="margin-bottom: 10px;">
                <projectcard :project="project" class="private-project"/>
            </div>
            <br>
            <h2 class="group-title">Public Projects</h2>
            <div v-for="project in projects" :key="project._id" v-if="project.access == 'public'" style="margin-bottom: 10px;">
                <projectcard :project="project" class="public-project"/>
            </div>
        </div>
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
            msg: 'Welcome to Your Vue.js App',
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
            find: JSON.stringify({$or: [
                { members: Vue.config.user.sub}, 
                { admins: Vue.config.user.sub}, 
                { access: "public" },
            ]})
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
            /*
            //initialize
              this.edit = {
                name: "",
                desc: "",
                access: "public",
                admins: [Vue.config.user.sub.toString()],
                members: [Vue.config.user.sub.toString()],

                //ugly hack to get contactlist to not feedback list update
                init_admins: [Vue.config.user.sub.toString()],
                init_members: [Vue.config.user.sub.toString()],
              }
              Vue.nextTick(()=>{
                this.projectdialog.modal('show');
              });
            */
        },

        /*
        editproject: function(p) {
              this.edit = Object.assign({
                init_admins: p.admins,
                init_members: p.members,
              }, p);
              Vue.nextTick(()=>{
                console.log("showing");
                this.projectdialog.modal('show');
              });
            }
        */
  },

}
</script>

<style>
.el-card {
box-shadow: none;
}
.public-project .el-card__body {
border-left: 3px solid #159957;
}
.private-project .el-card__body {
border-left: 3px solid red;
}
</style>

<style scope>
.group-title {
color: #999;
}
</style>
