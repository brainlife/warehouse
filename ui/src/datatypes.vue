<template>
<div>
    <pageheader/>
    <sidemenu active="/datatypes"></sidemenu>
    <div class="page-content">
        <div v-if="!datatypes" style="margin: 40px;"><h3>Loading ..</h3></div>
        <div class="margin20" v-if="datatypes">
            <h2 class="group-title">Datatypes</h2>
            <div v-for="datatype in datatypes" :key="datatype._id" style="margin-bottom: 10px;">
                <datatype :datatype="datatype"/>
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
        }).catch(err=>{
            console.error(err);
        });
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
