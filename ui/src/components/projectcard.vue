<template>
<div @click="click()" class="projectcard">
    <el-card :class="{'project-removed': project.removed}">
        <el-row>
            <el-col :span="6" class="project-name">
                {{project.name}} 
                <el-tag v-if="project.removed">Removed</el-tag>
            </el-col>
            <el-col :span="10">{{project.desc||'no desc..'}}</el-col>
            <el-col :span="8">
                <el-button 
                    v-if="project._canedit" type="text" 
                    style="float: right;"
                    @click.stop="edit()">Edit</el-button>
                <contact v-for="id in project.admins" :key="id" :id="id"/>
            </el-col>
        </el-row>
    </el-card>
</div>
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
.projectcard .el-card:hover {
background-color: #eee;
cursor: pointer;
}
.project-name {
font-size: 120%;
color: #999;
}
.project-removed {
opacity: 0.9;
background-color: #ddd;
}
</style>
