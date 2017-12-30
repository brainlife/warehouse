<template>
<div>
    <pageheader/>
    <sidemenu active="/datatypes"></sidemenu>
    <div class="page-content">
        <div v-if="!datatypes" style="margin: 40px;"><h3>Loading ..</h3></div>
        <div class="margin20" v-if="datatypes">
            <h2 class="group-title">Datatypes</h2>
            <div v-if="datatype_tags != null" v-for="datatype in datatypes" :key="datatype._id" style="margin-bottom: 10px;">
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
                
                console.log(v.datatype_tags);
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
  },

}
</script>

<style>
.el-card {
box-shadow: none;
}
</style>

<style scoped>
.group-title {
color: #999;
padding-bottom: 10px;
border-bottom: 1px solid #ddd;
}
</style>
