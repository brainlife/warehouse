<template>
<!--TODO replace with v-select-->
<select2 v-if="options" style="width: 100%" v-model="selected" :options="options" :allowClear="allownull" :placeholder="placeholder" :required="required"/>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'
import select2 from '@/components/select2'

export default {
    components: { projectaccess, select2 },
    props: [ 'value', 'allownull', 'placeholder', 'canwrite', 'required' ],
    data() {
        return {
            selected: null, 
            options: null, 
        }
    },

    watch: {
        selected: function() {
            if(this.selected) localStorage.setItem('last_projectid_used', this.selected);
            this.$emit('input', this.selected);
        }
    },

    mounted: function() {

        var find = null
        if(this.canwrite) {
            //only load project that user is member of
            find = {
                members: Vue.config.user.sub,
                removed: false,
            };
        } else {
            //load project that user is admin/member, or public (who can read from datasets)
            find = {
                $or: [
                    { admins: Vue.config.user.sub }, 
                    { members: Vue.config.user.sub }, 
                    { access: "public" },
                ],
                removed: false,
            };
        }

        console.log("lpoading project");
        console.dir(find);        
        this.$http.get('project', {params: {
            find: JSON.stringify(find),
            sort: 'name',
        }}).then(res=>{
            var option_groups = {} 
            res.body.projects.forEach(project=>{
                if(!option_groups[project.access]) option_groups[project.access] = [];
                option_groups[project.access].push({ id: project._id, text: project.name, });
            });
            this.options = [];
            for(var access in option_groups) {
                if(option_groups.length == 0) continue;
                var group_header = access.charAt(0).toUpperCase() + access.slice(1) + " Project";
                this.options.push({text: group_header, children: option_groups[access]});
            }

            this.selected = this.value;
            if(!this.allownull && !this.selected) {
                //need to preselect some value
                this.selected = localStorage.getItem('last_projectid_used') || this.options[0].id;
            }
        });
    }
}
</script>
