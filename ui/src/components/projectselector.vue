<template>
    <el-select ref="select" :value="project" @input="update" placeholder="Please select" style="width: 100%;">
        <el-option v-for="project in projects" :label="project.name" :value="project._id" :key="project._id">{{project.name}} <projectaccess :access="project.access"/></el-option>
    </el-select>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'

export default {
    components: { projectaccess },
    props: [ 'value' ],
    data() {
        return {
            projects: null,
            project: null,

            config: Vue.config,
        }
    },
    methods: {
        update: function(value) {
            localStorage.setItem('projectselector.previous', value);
            this.project = value;
            this.$emit('input', value);
        }
    },
    mounted: function() {
        this.project = this.value;

        //set it to previously selected value
        if(!this.project) {
            var value = localStorage.getItem('projectselector.previous');
            this.project = value; 
            this.$emit('input', value);
        }

        this.$http.get('project', {params: {
            find: JSON.stringify({members: Vue.config.user.sub}),
            populate: ' ', //load all default
        }}).then(res=>{
            this.projects = res.body.projects;
        });
    }
}
</script>
