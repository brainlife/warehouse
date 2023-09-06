<template> 
<div v-if="options">
    <b-alert show variant="secondary" v-if="options.length == 0 && required">You don't have access to any project that contains this datatype.</b-alert>
    <!--- i don't think required works with v-select-->
    <v-select v-else 
        :options="options" 
        :reduce="option=>option.value" 
        label="text"
        :placeholder="placeholder"  
        v-model="selected" 
        :required="required" 
        @input="change"></v-select>
</div>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'

export default {
    components: { projectaccess },
    props: [ 
        'value', 
        'placeholder', 
        'canwrite', 
        'required', 

        //set these to filter projects that only has datasets with these datatype/tags
        'datatype',
        'datatype_tags',
    ],
    data() {
        return {
            selected: null, 
            options: null, 
        };
    },

    mounted: function() {
        this.load_projects();
    },

    methods: {

        change() {
            if(this.selected) {
                localStorage.setItem('last_projectid_used', this.selected);
                this.$emit('input', this.selected);
            } else {
                this.$emit('input', null);
            } 
        },

        load_projects() {         
            var find = {
                removed: false,
                //openneuro: {$exists: false}, //don't show openneuro pseudo projects anymore
            };  

            if(this.canwrite) {
                //only load project that user has write access to
                find['$or'] = [
                    {members: Vue.config.user.sub},
                    {admins: Vue.config.user.sub},
                ];
            }

            if(this.datatype) {
                find['stats.datasets.datatypes_detail.type'] = {$in: this.datatype._id||this.datatype};
            }

            this.query_projects(find);
        },

        query_projects(find) {
            this.$http.get('project', {params: {
                find: JSON.stringify(find),
                limit: 500,
                sort: 'name',
                select: 'name desc',
            }}).then(res=>{
                this.options = [];
                if(!this.required) this.options.push({value: null, text: this.placeholder||''});
                res.data.projects.forEach(project=>{
                    this.options.push({value: project._id, text: project.name, desc: project.desc});
                });

                //first, select project that client has requested
                let found = this.options.find(it=>it.value == this.value);
                if(found) {
                    this.selected = found.value;
                } else {
                    //if not, then try selecting the last project used
                    var last_value = localStorage.getItem('last_projectid_used');
                    found = this.options.find(it=>it.value == last_value);
                    if(found) {
                        this.selected = found.value;
                    } else if(this.required && this.options.length > 0) {
                        //if we can't find it, and required field.. then select first one from the list
                        this.selected = this.options[0].value;
                    }
                    this.$emit('input', this.selected);
                }
            });
        },
    }
}
</script>
