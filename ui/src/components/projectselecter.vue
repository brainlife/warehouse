<template>
    <div>
        <select2 v-if="enumerated_projects" ref="select" :value="project" @input="update" :placeholder="placeholder||'Please Select'" style="width:100%;" :options="enumerated_projects"></select2>
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
            enumerated_projects: [], // [{id, text}, ...]

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
            //group by public / private
            res.body.projects.forEach(project=>{
                this.enumerated_projects.push({
                    id: project._id,
                    text: project.name
                });
            });
        });
    }
}
</script>
