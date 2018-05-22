<template> <!--
v-select has some issue with clicking scrollbar closing the select dropdown..
https://github.com/sagalbot/vue-select/issues/474
-->
<b-form-select v-model="selected" :options="options" :required="true">
<!--
    <option :value="null" v-if="allownull">{{placeholder}}</option>
    <option v-for="project in options" :key="project._id" :value="project._id">
        {{project.name}}
    </option>
-->
</b-form-select>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'
//import VueSelect from 'vue-select'

export default {
    components: { projectaccess },
    props: [ 
        'value', 
        'allownull', 
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
            options: [], 
        }
    },

    watch: {
        selected: function() {
            if(this.selected) {
                console.log("new select", this.selected);
                localStorage.setItem('last_projectid_used', this.selected);
                this.$emit('input', this.selected);
            } else {
                this.$emit('input', null);
            }
        }
    },
    /*
    destroyed() {
        this.$el.select2('remove');
    },
    */

    mounted: function() {
        var find = null
        if(this.canwrite) {
            //only load project that user has write access to
            find = {
                $or: [
                    {members: Vue.config.user.sub},
                    {admins: Vue.config.user.sub},
                ],
                removed: false,
            };
        } else {
            //load project that user is admin/member/guest, or public (who can read from datasets)
            find = {
                removed: false,
            };
        }

        if(this.datatype) {
            //only pull projects that has datasets with specified datatype
            let project_query = {
                datatype: this.datatype,
                removed: false,
            } 
            if(this.datatype_tags && this.datatype_tags.length > 0) {
                //project_query.datatype_tags = { $all: this.datatype_tags };
                var ands = [];
                this.datatype_tags.forEach(tag=>{
                    if(tag[0] == "!") ands.push({datatype_tags: {$ne: tag.substring(1)}});
                    else ands.push({datatype_tags: tag});
                });
                project_query.$and = ands;
            }
            this.$http.get('dataset/distinct', {params: {
                find: JSON.stringify(project_query),
                distinct: 'project',
            }}).then(res=>{
                console.log('projects that has ', this.datatype);
                var project_ids = res.body;
                find._id = {$in: project_ids};
                //TODO - if there are no project, not point of querying for datasets.
                //we should warn user that they can't execue this app until data derivative is generated
                this.populate_options();
            });
        } else {    
            //no further query
            this.populate_options();
        }
    },
    methods: {
        populate_options: function() {
            this.options = [];
            if(this.allownull) this.options.push({value: null, text: this.placeholder||''});
            this.$http.get('project', {params: {
                find: JSON.stringify(find),
                sort: 'name',
            }}).then(res=>{
                res.body.projects.forEach(project=>{
                    this.options.push({value: project._id, text: project.name});
                });
                let found = this.options.find(it=>it.value == this.value);
                if(found) this.selected = found.value;
                console.log("populated", found);
                
                //if null is not allowed, I need to set it to something.
                if(!this.allownull && !this.selected) {
                    //try last selected project
                    var last = localStorage.getItem('last_projectid_used');
                    found = this.options.find(it=>it.value == last);
                    if(found) {
                        this.selected = find.value;
                    } else if(this.options.length > 0) {
                        //select first one in the list
                        this.selected = this.options[0].value;
                    }
                }
            });
        }
    }
}
</script>
