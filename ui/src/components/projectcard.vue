<template>
<div @click="click()" class="projectcard">
    <el-card :class="{'project-removed': project.removed}">
        <el-row>
            <el-col :span="16">
                <div class="project-name">
                    {{project.name}}
                    <el-tag v-if="project.removed">Removed</el-tag>
                </div>
            </el-col>
            <el-col :span="8">
                <el-button 
                    v-if="project._canedit" type="text" 
                    style="float: right;"
                    @click.stop="edit()">Edit</el-button>
            </el-col>
        </el-row>
        <div class="project-description" :span="10">{{project.desc||'no desc..'}}</div>
        <div class="devs">
            <contact v-for="id in project.admins" :key="id" :id="id"></contact>
        </div>
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
.projectcard {
display:inline-block;
width:330px;
}
.projectcard .el-card:hover {
background-color: #eee;
cursor: pointer;
}

.project-name {
font-size: 120%;
color: #999;
}
.project-description {
display:inline-block;
margin-top:8px;
min-height:130px;
max-height:130px;
overflow:hidden;
text-overflow:ellipsis;
}
.project-removed {
opacity: 0.9;
background-color: #ddd;
}

.devs {
background-color:#eee;
margin:0 -15px -15px -15px;
padding:10px;
}
</style>
