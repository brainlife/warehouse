<template>
<div>
    <pageheader/>
    <sidemenu active="/datatypes"></sidemenu>
    <div class="page-content">
        <div v-if="!datatypes" style="margin: 40px;"><h3>Loading ..</h3></div>
        <div class="margin20" v-if="datatypes">
            <div v-if="datatype_tags != null" v-for="datatype in datatypes" :key="datatype._id" style="margin-bottom: 10px;" @click="open_datatype(datatype)" class="datatype-container">
                <datatype :datatype="datatype" :datatype_tags="datatype_tags[datatype._id]" />
            </div>
            
        </div>
    </div><!--page-content-->
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import sidemenu from '@/components/sidemenu'
import datatype from '@/components/datatype'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'

export default {
    components: { sidemenu, datatype, pageheader, contact } ,

    data () {
        return {
            datatypes: null,
            datatype_tags: null,
            
            view_datatype_id: null,
            count: 0, //total counts of datatypes (not paged)

            user: Vue.config.user, //see if user is logged in

            //placeholder for dialog
            edit: {
                _id: null, //set if editing
                name: "",
                desc: "",
                access: "",

                admins: [],
                members: [],
            },

            query: "",

            config: Vue.config,
        }
    },

    mounted: function() {
        this.$http.get('datatype', {params: {
            sort: 'name'
        }})
        .then(res=>{
            this.datatypes = res.body.datatypes;
            this.count = res.body.count;
            
            //load datatype_tags from all apps
            //from appedit
            // could return this promise or just have it all here...leaving it as is for now
            this.$http.get('app', {params: {
                select: 'inputs outputs',
            }}).then(res=>{
                var v = this;
                v.datatype_tags = {};
                v.datatypes.forEach(type=>{
                    v.datatype_tags[type._id] = [];
                });
                
                function aggregate_tags(dataset) {
                    if(!dataset.datatype_tags) return;
                    dataset.datatype_tags.forEach(tag=>{
                        if (!~v.datatype_tags[dataset.datatype].indexOf(tag)) v.datatype_tags[dataset.datatype].push(tag);
                    });
                }
                res.body.apps.forEach(app=>{
                    app.inputs.forEach(aggregate_tags);
                    app.outputs.forEach(aggregate_tags);
                });
                
                this.handle_route_params();
                
                // console.log(v.datatype_tags);
            });
        }).catch(console.error);
    },

    methods: {
        changemember: function(list, uids) {
            if(!uids) return;
            this.edit[list] = uids;
        },

        newdatatype: function() {
            this.$router.push('/datatype/_/edit');
        },
        
        open_datatype: function(datatype) {
            this.$router.push(`/datatypes/${datatype._id}`);
        },
        
        handle_route_params: function() {
            if (this.$route.params.id) this.$root.$emit('datatype.view', this.$route.params.id);
        },
  },
  
  watch: {
      '$route': function() {
            this.handle_route_params();
        }
  }
}
</script>

<style>
.el-card {
box-shadow: none;
}
</style>

<style scoped>
.datatype-container {
box-shadow: 1px 1px 2px rgba(0,0,0,0.10);
transition: box-shadow 0.3s;
cursor:pointer;
}
.datatype-container:hover {
box-shadow: 3px 3px 6px rgba(0,0,0,0.3);
}
</style>
