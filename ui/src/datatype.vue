<template>
<div>
    <pageheader/>
    <sidemenu active="/datatypes"/>
    <div class="header" v-if="datatype">
        <el-button-group style="float: right;" v-if="datatype._canedit">
            <el-button @click="remove()" icon="delete">Remove Datatype</el-button>
            <el-button @click="edit()" icon="edit">Edit</el-button>
        </el-button-group>
        <h1><span class="text-muted"><icon name="shield-alt" scale="1.5"/> Datatype |</span> {{datatype.name}}</h1>
    </div>
    <div class="page-content" v-if="datatype" style="margin-top: 80px">
        <table class="info">
        <tr>
            <th width="180px;">Description</th>
            <td>{{datatype.desc}}</td>
        </tr>
        <tr>
            <th>Access</th>
            <td>
                <datatypeaccess :access="datatype.access"/>
            </td>
        </tr>
        <tr>
            <th>Admins</th>
            <td>
                <contact v-for="c in datatype.admins" :key="c._id" :id="c"></contact>
            </td>
        </tr>
        <tr>
            <th>Datatype Members</th>
            <td>
                <contact v-for="c in datatype.members" :key="c._id" :id="c"></contact>
            </td>
        </tr>
        <tr>
            <th>TODO</th>
            <td>
                <p class="text-muted">What else can I show? Maybe timeline of various events that happened to this datatype?</p>
                <p class="text-muted">Or maybe we can display Facebook style community messaging capability?</p>
            </td>
        </tr>
        </table>

    </div><!--page-content-->
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import sidemenu from '@/components/sidemenu'
import contactlist from '@/components/contactlist'
import datatype from '@/components/datatype'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'

//hello

export default {
    components: { sidemenu, contactlist, datatype, pageheader, contact },

    data () {
        return {
            datatype: null,

            config: Vue.config,
        }
    },

    mounted: function() {
        this.$http.get('datatype', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
            //populate: 'inputs.datatype outputs.datatype',
        }})
        .then(res=>{
            this.datatype = res.body.datatypes[0];
        }).catch(err=>{
            console.error(err);
        });
    },

    methods: {
        edit: function() {
            this.$router.push('/datatype/'+this.datatype._id+'/edit');
        },
        remove: function() {
            alert('todo');
        },
    },
}
</script>

<style scoped>
.header {
background: #666;
padding: 20px;
margin-top: 42px;
height: 40px;
position: fixed;
right: 0px;
left: 50px;
color: #666;
z-index: 1;
border-bottom: 1px solid #666;
}
.header h1 {
color: #eee;
}
.header-bottom {
height: 50px;
background-color: white;
position: fixed;
top: 140px;
right: 0px;
left: 90px;
border-bottom: 1px solid #ddd;
}</style>
