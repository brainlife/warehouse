<template>
<v-select v-model="selected" :options="options" :placeholder="placeholder" label="name"/>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'
//import select2 from '@/components/select2'
import vSelect from 'vue-select'

export default {
    components: { projectaccess, vSelect },
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
                localStorage.setItem('last_projectid_used', this.selected._id);
                this.$emit('input', this.selected._id);
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
            //only load project that user is member of
            find = {
                members: Vue.config.user.sub,
                removed: false,
            };
        } else {
            //load project that user is admin/member, or public (who can read from datasets)
            find = {
                /*
                $or: [
                    { admins: Vue.config.user.sub }, 
                    { members: Vue.config.user.sub }, 
                    { access: "public" },
                ],
                */
                removed: false,
            };
        }

        if(this.datatype) {
            //only pull projects that has datasets with specified datatype
            let project_query = {
                datatype: this.datatype,
                removed: false,
            } 
            if(this.datatype_tags && this.datatype_tags.length > 0) project_query.datatype_tags = { $all: this.datatype_tags };
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
            //console.log("lpoading project with query", find);
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
                    if(found) that.selected = that.options.find(it=>it._id == last);
                    else that.selected = that.options[0];
                }
            });
        }
    }
}
</script>
