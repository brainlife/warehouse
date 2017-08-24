<template>
<b-card no-body class="projectcard clickable" :class="{'project-removed': project.removed}">
    <div @click="click()">
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
</b-card>
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
.projectcard {
transition: box-shadow 0.5s;
}
.projectcard.clickable {
background-color: white;
}
.projectcard.clickable:hover {
cursor: pointer;
box-shadow: 2px 2px 4px #999;
background-color: #f3f3f3;
}
.name {
color: #666;
padding: 0px;
padding-top: 10px;
}
.desc {
height: 130px;
font-size: 13px;
color: #333;
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
height: 75px;
overflow-y: auto;
overflow-x: hidden;
}
</style>
