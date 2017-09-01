<template>
<div v-if="options">
    <select2 style="width: 100%"
        v-model="selected" 
        :options="options">
    </select2>
</div>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'
import select2 from '@/components/select2'

export default {
    components: { projectaccess, select2 },
    props: [ 'value' ],
    data() {
        return {
            selected: null, 
            options: null, 
        }
    },
    watch: {
        selected: function() {
            localStorage.setItem('last_projectid_used', this.selected);
            this.$emit('input', this.selected);
        }
    },
    mounted: function() {
        this.$http.get('project', {params: {
            find: JSON.stringify({
                $or: [
                    { members: Vue.config.user.sub}, 
                    { access: "public" },
                ],
                removed: false,
            })
        }}).then(res=>{
            this.options = [];
            res.body.projects.forEach(project=>{
                this.options.push({
                    id: project._id,
                    text: project.name,
                });
            });

            this.selected = this.value || localStorage.getItem('last_projectid_used') || this.options[0].id;
            //console.log("projectselecter init with", this.selected, this.options);
        });
    }
}
</script>
