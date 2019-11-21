<template>
<div>
    <sidemenu active="/datasources"></sidemenu>
    <div class="page-content" ref="scrolled">
        <div class="header">
            <b-container>
                <h2>Datasources</h2>
                <!--
                <p style="opacity: 0.7;">
                    Datatypes allow Apps to exchange data. Please visit <a href="https://app.slack.com/client/T3X5ND3U1/C946FA6PK">#datatype slack channel</a> to register new datatypes.
                </p>
                -->
            </b-container>
        </div>

        <!--
        <h4 class="header-sticky"><b-container>neuro/</b-container></h4> 
        <b-container>
            <b-card-group columns style="margin: 15px 0px;">
                <b-card no-body v-for="datatype in get_datatypes('neuro/')" :key="datatype._id" @click="open(datatype)" class="datatype-card">
                    <datatype :datatype="datatype"/>
                </b-card>
            </b-card-group>
        </b-container>

        <h4 class="header-sticky"><b-container>other</b-container></h4> 
        <b-container>
            <b-card-group columns style="margin: 15px 0px;">
                <b-card no-body v-for="datatype in get_not_datatypes('neuro/')" :key="datatype._id" @click="open(datatype)" class="datatype-card">
                    <datatype :datatype="datatype"/>
                </b-card>
            </b-card-group>
        </b-container>

        <b-button v-if="config.has_role('datatype.create')" class="button-fixed" @click="newdatatype" v-b-tooltip.hover title="New Datatype">
            <icon name="plus" scale="2"/>
        </b-button>
        -->
    </div><!--page-content-->
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
/*
import 'perfect-scrollbar/css/perfect-scrollbar.css'
import PerfectScrollbar from 'perfect-scrollbar'
import VueMarkdown from 'vue-markdown'

import datatype from '@/components/datatype'
import contact from '@/components/contact'
import app from '@/components/app'
import tags from '@/components/tags'
*/

export default {
    components: { 
        sidemenu, pageheader, 
        //datatype, app, VueMarkdown, contact, tags,
    },

    data () {
        return {
            //editing: false, 
            config: Vue.config,
        }
    },

    mounted() {
    },

    methods: {
    }, //methods
}
</script>

<style scoped>
.page-content {
top: 0px;
background-color: #eee;
}
.page-content h2 {
margin-bottom: 0px;
padding: 10px 0px;
font-size: 20pt;
}
.page-content h3 {
background-color: white;
color: gray;
padding: 20px;
margin-bottom: 0px;
}
.page-content h4 {
padding: 15px 20px;
background-color: white;
opacity: 0.8;
color: #999;
font-size: 17pt;
font-weight: bold;
}
.header {
padding: 10px;
background-color: white;
border-bottom: 1px solid #eee;
}
.header-sticky {
position: sticky;
top: 0px;
z-index: 1;
box-shadow: 0 0 1px #ccc;
}

</style>

