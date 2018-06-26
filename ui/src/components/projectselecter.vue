<template> 
<!--
v-select has some issue with clicking scrollbar closing the select dropdown..
https://github.com/sagalbot/vue-select/issues/474
-->
<div v-if="options">
    <b-alert show variant="danger" v-if="options.length == 0 && !allownull">You don't have any project that you can select. Please create a new project inside the project page.</b-alert>
    <b-form-select v-if="options.length > 0" v-model="selected" :options="options" :placeholder-nowork="placeholder" :required="!allownull">
    </b-form-select>
</div>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'

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
            options: null, 
        };
    },

    watch: {
        selected: function() {
            console.log("changing select...");
            if(this.selected) {
                console.log("new select", this.selected);
                localStorage.setItem('last_projectid_used', this.selected);
                this.$emit('input', this.selected);
            } else {
                this.$emit('input', null);
            }
        },
        value: function() {
            if (this.selected != this.value) {
                this.selected = this.value;
            }
        }
    },

    mounted: function() {
        this.load_projects();
    },

    methods: {

        load_projects: function() {         
            var find = null;
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

            //if datatype filter is set, only pull projects that has datasets with specified datatype
            if(this.datatype) {
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
                    this.query_projects(find);
                });
            } else {    
                //no further query
                this.query_projects(find);
            }
        },

        query_projects: function(find) {
            this.$http.get('project', {params: {
                find: JSON.stringify(find),
                sort: 'name',
            }}).then(res=>{
                this.options = [];
                if(this.allownull) this.options.push({value: null, text: this.placeholder||''});
                res.body.projects.forEach(project=>{
                    this.options.push({value: project._id, text: project.name});
                });

                //first, select project that client has requested
                let found = this.options.find(it=>it.value == this.value);
                if(found) this.selected = found.value;
                else {
                    //if not, then try selecting the last project used
                    var last = localStorage.getItem('last_projectid_used');
                    found = this.options.find(it=>it.value == last);
                    if(found) this.selected = found.value;
                    else if(!this.allownull && this.options.length > 0) {
                        //if we can't find it, and null not allowed, then select first one from the list
                        this.selected = this.options[0].value;
                    }
                }
            });
        },
    }
}
</script>
