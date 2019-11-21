<template> 
<!-- this is no longer an issue?
v-select has some issue with clicking scrollbar closing the select dropdown..
https://github.com/sagalbot/vue-select/issues/474
PR > https://github.com/sagalbot/vue-select/pull/373
-->
<div v-if="options">
    <b-alert show variant="secondary" v-if="options.length == 0 && required">You don't have access to any project that contains this datatype.</b-alert>
    <b-input-group prepend="Project" v-else>
        <b-form-select v-if="options.length > 0" v-model="selected"
            max-height="250px"
            :options="options" 
            :placeholder="placeholder" 
            :required="required">
        </b-form-select>
    </b-input-group>
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

    watch: {
        selected: function() {
            if(this.selected) {
                localStorage.setItem('last_projectid_used', this.selected);
                this.$emit('input', this.selected);
            } else {
                this.$emit('input', null);
            }
        },
        value: function() {
            /*
            if(this.selected != this.value) {
                this.selected = this.options.find(it=>it.value == this.value);
            }
            */
            this.selected = this.value;
        }
    },

    mounted: function() {
        this.load_projects();
    },

    methods: {

        load_projects() {         
            var find = null;
            if(this.canwrite) {
                //only load project that user has write access to
                console.log("only showing member/admin projects");
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
                    datatype: this.datatype._id||this.datatype,
                    removed: false,
                } 

                if(this.datatype_tags && this.datatype_tags.length > 0) {
                    var ands = [];
                    this.datatype_tags.forEach(tag=>{
                        if(tag[0] == "!") ands.push({datatype_tags: {$ne: tag.substring(1)}});
                        else ands.push({datatype_tags: tag});
                    });
                    project_query.$and = ands;
                }

                //query distinct project ids that has specified datasets
                this.$http.get('dataset/distinct', {params: {
                    find: JSON.stringify(project_query),
                    distinct: 'project',
                }}).then(res=>{
                    var project_ids = res.data;
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

        query_projects(find) {
            this.$http.get('project', {params: {
                find: JSON.stringify(find),
                limit: 500,
                sort: 'name',
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
                    var last = localStorage.getItem('last_projectid_used');
                    found = this.options.find(it=>it.value == last);
                    if(found) {
                        this.selected = found.value;
                    } else if(this.required && this.options.length > 0) {
                        //if we can't find it, and required field.. then select first one from the list
                        this.selected = this.options[0].value;
                    }
                }
            });
        },
    }
}
</script>
