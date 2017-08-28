<template>
<div>
    <pageheader :user="config.user"/>
    <sidemenu active="/projects"/>
    <div class="header" v-if="project">
        <b-button-group style="float: right;" v-if="project._canedit">
            <b-button @click="remove()" v-if="!project.removed">Remove</b-button>
            <b-button @click="edit()">Edit</b-button>
        </b-button-group>
        <projectavatar :project="project" style="float: left; margin-right: 20px; border: 4px solid white; box-shadow: 3px 3px 3px rgba(0,0,0,0.3);"></projectavatar>
        <h2>{{project.name}}</h2>
    </div>
    <div class="page-content" v-if="project" style="margin-top: 80px; padding-top: 20px">
        <div style="margin-left: 130px; margin-bottom: 20px; min-height: 20px;">
            <p style="line-height: 150%;">{{project.desc}}</p>
        </div>
        <el-alert v-if="project.removed" title="This project has been removed" type="warning" show-icon :closable="false"></el-alert>
        <table class="info">
            <tr>
            <th>Stats</th>
            <td>
                <el-row>
                    <el-col :span="8" v-if="datasets_attribs.num_subjects">
                        <h4>{{datasets_attribs.num_subjects}}</h4>
                        <b class="text-muted">Subjects</b>
                    </el-col>
                    <el-col :span="8" v-if="datasets_attribs.num_datasets">
                        <h4>{{datasets_attribs.num_datasets}}</h4>
                        <b class="text-muted">Datasets</b>
                    </el-col>
                </el-row>
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
import projectavatar from '@/components/projectavatar'

export default {
    components: { 
        sidemenu, contactlist, project, 
        projectaccess, pageheader, contact, 
        VueMarkdown, projectavatar 
    },

    data () {
        return {
            project: null,
            datasets_attribs: {
                num_datasets: null,
                num_subjects: null
            },
            
            config: Vue.config,
        }
    },

    mounted: function() {
        this.$http.get('project', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
        }})
        .then(res=>{
            this.project = res.body.projects[0];
            
            return this.$http.get('dataset', {params: {
                find: JSON.stringify({
                    project: this.project._id,
                    storage: {$exists: true},
                    removed: false
                })
            }});
        })
        .then(res => {
            this.datasets_attribs.num_datasets = res.body.count;
            console.log(this.datasets_attribs);
            
            return this.$http.get('dataset/distinct', {params: {
                find: JSON.stringify({
                    project: this.project._id,
                    removed: false
                }),
                distinct: 'meta.subject'
            }})
        })
        .then(res => {
            this.datasets_attribs.num_subjects = res.body.length;
        })
        .catch(err=>{
            console.error(err);
        });
    },

    methods: {
        edit: function() {
            this.$router.push('/project/'+this.project._id+'/edit');
        },
        remove: function() {
            this.$http.delete('project/'+this.project._id)
            .then(res=>{
                this.go('/projects');        
            });
        },
        go: function(path) {
            console.log(path);
            this.$router.push(path);
        },
    },
}
</script>

<style scoped>
.datasets_link {
color:#44f;
cursor:pointer;
font-weight:bold;
}
.datasets_link:hover {
color:#88f;
}
.header {
background: #666;
padding: 20px;
padding-bottom: 30px;
height: 80px;
position: fixed;
top: 50px;
right: 0px;
left: 90px;
color: #666;
z-index: 1;
border-bottom: 1px solid #666;
}
.header h2 {
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
}
.el-alert {
border-radius: inherit;
}

</style>
