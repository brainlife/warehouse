<template>
    <!-- <el-select ref="select" :value="project" @input="update" placeholder="Please select" style="width: 100%;">
        <el-option-group v-for="(projects, key) in project_groups" :label="key" :key="key">
            <el-option v-for="project in projects" :label="project.name" :value="project._id" :key="project._id">
                {{project.name}} 
            </el-option>
        </el-option-group>
    </el-select>  -->
    <div>
        <select2 v-if="projects" ref="select" :value="project" @input="update" :placeholder="placeholder||'Please Select'" style="width:100%;" :options="enumerated_projects"></select2>
    </div>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'
import select2 from '@/components/select2'

export default {
    components: { projectaccess, select2 },
    props: [ 'value', 'placeholder' ],
    data() {
        return {
            project: null, //selected
            projects: null,

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
            find: JSON.stringify({
                $or: [
                    { members: Vue.config.user.sub}, 
                    { access: "public" },
                ],
                removed: false,
            })
        }}).then(res=>{
            this.projects = res.body.projects;

            //group by public / private
            res.body.projects.forEach(project=>{
                this.project_groups[project.access].push(project);
            });
        });
    },
    
    computed: {
        enumerated_projects: function() {
            var result = [];
            for (var i in this.projects) {
                var project = this.projects[i];
                result.push({
                    id: project._id,
                    text: project.name
                });
            }
            return result;
        }
    }
}
</script>
