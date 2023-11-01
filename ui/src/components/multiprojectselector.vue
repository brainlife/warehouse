<template>
    <select2 v-if="options" 
        style="width: 100%" 
        v-model="selected" 
        :options="options" 
        :allownull="allownull" 
        :placeholder="placeholder" multiple="multiple">
</select2>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'
import select2 from '@/components/select2'

export default {
    components: { projectaccess, select2 },
    props: [ 'value', 'allownull', 'placeholder', 'access' ],
    data() {
        return {
            selected: [], 
            options: null, 
        }
    },
    watch: {
        selected: function() {
            this.$emit('input', this.selected);
        }
    },
    mounted: function() {
        this.$http.get('project', {params: {
            find: JSON.stringify({
                $or: [
                    { members: Vue.config.user.sub}, 
                    { admins: Vue.config.user.sub}, 
                    { access: "public" },
                ],
                removed: false,
            }),
            limit: 500,
            sort: 'name',
            select: 'name access',
        }}).then(res=>{
            var option_groups = {} 
            res.data.projects.forEach(project=>{
                if(this.access && project.access != this.access) return; //filtered out by access filter
                if(!option_groups[project.access]) option_groups[project.access] = [];
                option_groups[project.access].push({ id: project._id, text: project.name, });
            });
            this.options = [];
            for(var access in option_groups) {
                if(option_groups.length == 0) continue;
                var group_header = access.charAt(0).toUpperCase() + access.slice(1) + " Project";
                this.options.push({text: group_header, children: option_groups[access]});
            }

            //user might not have access to the project that's already selected.. if so add it to "other"
            const others = [];
            this.value.forEach(id=>{
                const p = res.data.projects.find(p=>p._id == id);  
                if(p === undefined) others.push({id, text: id+" (you don't have access)"});
            });
            console.dir(others);
            if(others.length) {
                this.options.push({text: "others", children: others});
            }

            this.selected = this.value;
        });
    }
}
</script>
