<template>
<div>
    <pageheader :user="config.user">
        <el-row :gutter="20">
            <el-col :span="14">
                <el-input icon="search" v-model="query" placeholder="Search ..."></el-input>
            </el-col>
            <!--
            <el-col :span="10">
                <el-button v-if="user" @click="newdatatype()" icon="plus">Add Datatype</el-button>
            </el-col>
            -->
        </el-row>
    </pageheader>
    <sidemenu active="/datatypes"></sidemenu>
    <div class="page-content">
        <div v-if="!datatypes" style="margin: 40px;"><h3>Loading ..</h3></div>
        <div class="margin20" v-if="datatypes">
            <!--
            <h2 class="group-title">Private Datatypes</h2>
            <div v-for="datatype in datatypes" :key="datatype._id" v-if="datatype.access == 'private'" style="margin-bottom: 10px;">
                <datatypecard :datatype="datatype" class="private-datatype"/>
            </div>
            <br>
            <h2 class="group-title">Public Datatypes</h2>
            <div v-for="datatype in datatypes" :key="datatype._id" v-if="datatype.access == 'public'" style="margin-bottom: 10px;">
                <datatypecard :datatype="datatype" class="public-datatype"/>
            </div>
            -->
            <h2 class="text-muted">Datatypes</h2>
            <div v-for="datatype in datatypes" :key="datatype._id" style="margin-bottom: 10px;">
                {{datatype}}
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
//import datatypecard from '@/components/datatypecard'

export default {
    components: { sidemenu, datatype, pageheader } ,

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
            /*
            find: JSON.stringify({$or: [
                { members: Vue.config.user.sub}, 
                { access: "public" },
            
            ]})
            */
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

<style scope>
.group-title {
color: #999;
}
</style>
