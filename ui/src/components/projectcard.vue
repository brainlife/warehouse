<template>
<el-card :body-style="{padding: '0px'}" :class="{'project-removed': project.removed}">
    <div @click="click()" class="projectcard">
        <el-button v-if="project._canedit" type="text" class="editbutton" @click.stop="edit()">Edit</el-button>
        <div class="project-name">
            {{project.name}}
            <el-tag v-if="project.removed">Removed</el-tag>
        </div>
        <div class="project-description" :span="10">{{project.desc||'no desc..'}}</div>
        <div class="devs">
            <contact v-for="id in project.admins" :key="id" :id="id"></contact>
        </div>
    </div>
</el-card>
</template>

<script>
import Vue from 'vue'
import contact from '@/components/contact'
export default {
    components: { contact },
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

.projectcard:hover {
background-color: #eee;
cursor: pointer;
}
.projectcard:hover .editbutton {
display: inline-block;
}

.project-name {
font-size: 120%;
padding: 10px;
height: 30px;
}
.project-description {
padding: 10px;
display:inline-block;
height: 100px;
overflow:hidden;
text-overflow:ellipsis;
color: #666;
}
.project-removed {
opacity: 0.9;
background-color: #ddd;
}
.devs {
background-color:#eee;
padding:10px;
height: 55px;
overflow-y: auto;
overflow-x: hidden;
}
</style>
