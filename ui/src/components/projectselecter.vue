<template>
<!--
v-select has some issue with clicking scrollbar closing the select dropdown..
https://github.com/sagalbot/vue-select/issues/474
-->
<b-form-select v-model="selected" :placeholder="placeholder">
    <option v-for="project in options" :key="project._id" :value="project._id">
        {{project.name}}
    </option>
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
        var that = this;
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
            //load project that user is admin/member, or public (who can read from datasets)
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
                query();
            });
        } else {    
            //no further query
            query();
        }

        function query() {
            that.$http.get('project', {params: {
                find: JSON.stringify(find),
                sort: 'name',
            }}).then(res=>{
                res.body.projects.forEach(project=>{
                    that.options.push(project);
                });
                that.selected = that.options.find(it=>it._id == that.value);
                if(!that.allownull && !that.selected) {
                    //need to preselect some value
                    var last = localStorage.getItem('last_projectid_used');
                    var found = res.body.projects.find(project=>project._id == last);
                    if(found) that.selected = that.options.find(it=>it._id == last)._id;
                    else if(that.options.length > 0) {
                        that.selected = that.options[0]._id;
                    }
                }
            });
        }
    }
}
</script>
