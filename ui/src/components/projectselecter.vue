<template>
    <el-select ref="select" :value="project" @input="update" placeholder="Please select" style="width: 100%;">
        <el-option-group v-for="(projects, key) in project_groups" :label="key" :key="key">
            <el-option v-for="project in projects" :label="project.name" :value="project._id" :key="project._id">
                {{project.name}} 
                <!--<projectaccess :access="project.access"></projectaccess>-->
            </el-option>
        </el-option-group>
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
            project: null, //selected

            //options
            project_groups: {
                private: [],
                public: [],
            },


            config: Vue.config,
        }
    },
    methods: {
        update: function(value) {
            localStorage.setItem('projectselecter.previous', value);
            this.project = value;
            this.$emit('input', value);
        }
    },
    mounted: function() {
        this.project = this.value;

        //set it to previously selected value
        if(!this.project) {
            var value = localStorage.getItem('projectselecter.previous');
            this.project = value; 
            this.$emit('input', value);
        }

        this.$http.get('project', {params: {
            /*
            find: JSON.stringify({$or: [
                { members: Vue.config.user.sub}, 
                { access: "public" },
            ]})
            */
            find: JSON.stringify({$and: [
                {$or: [
                    { members: Vue.config.user.sub}, 
                    { access: "public" },
                ]},
                {$or: [
                    { removed: false },
                    { removed: {$exists: false }},
                ]}
            ]})
        }}).then(res=>{
            this.projects = res.body.projects;

            //group by public / private
            res.body.projects.forEach(project=>{
                this.project_groups[project.access].push(project);
            });
        });
    }
}
</script>
