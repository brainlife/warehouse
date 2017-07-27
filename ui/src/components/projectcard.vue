<template>
<el-card :body-style="{padding: '0px'}" class="projectcard clickable" :class="{'project-removed': project.removed}">
    <div @click="click()">
        <!--<el-button v-if="project._canedit" type="text" class="editbutton" @click.stop="edit()">Edit</el-button>-->
        <projectavatar :project="project" style="float: left;margin-right: 15px;"></projectavatar>
        <h4 class="name">{{project.name}}</h4>
        <div class="desc">
            <el-tag v-if="project.removed" type="warning">Removed</el-tag>
            {{project.desc||'no desc..'}}
        </div>
        <div class="devs">
            <contact v-for="id in project.admins" :key="id" :id="id"></contact>
        </div>
    </div>
</el-card>
</template>

<script>
import Vue from 'vue'

import contact from '@/components/contact'
import projectavatar from '@/components/projectavatar'

export default {
    components: { contact, projectavatar },
    props: ['project'],

    methods: {
        click: function() {
            this.$router.push('/project/'+this.project._id);
        },
        edit: function() {
            this.$router.push('/project/'+this.project._id+'/edit');
        },
    }
}
</script>

<style scoped>

.editbutton {
display: none;
float: right; 
margin-right: 10px;
}

.projectcard {
transition: box-shadow 0.5s;
}
.projectcard.clickable {
background-color: white;
}
.projectcard:hover {
cursor: pointer;
box-shadow: 2px 2px 4px #999;
}
.projectcard:hover .editbutton {
display: inline-block;
}

.name {
color: #666;
padding: 0px;
padding-top: 10px;
}
.desc {
height: 130px;
font-size: 13px;
color: #666;
line-height: 140%;
text-overflow:ellipsis;
overflow: hidden;
}
.project-removed {
opacity: 0.5;
}
.devs {
background-color:#eee;
padding:10px;
height: 55px;
overflow-y: auto;
overflow-x: hidden;
}
</style>
