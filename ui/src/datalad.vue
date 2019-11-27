<template>
<div>
    <sidemenu active="/datalad"></sidemenu>
    <!--
    <div class="header">
        <b-container>
            <h2>Datalad</h2>
            <p style="opacity: 0.7;">
                Datatypes allow Apps to exchange data. Please visit <a href="https://app.slack.com/client/T3X5ND3U1/C946FA6PK">#datatype slack channel</a> to register new datatypes.
            </p>
        </b-container>
    </div>
    -->
    <div class="page-left">
        <div class="page-title"><!--<icon name="database"/>&nbsp;&nbsp;Datalad</div>-->
            <img src="https://pbs.twimg.com/profile_images/899900469119680512/XybpieA7_400x400.jpg" height="30px" class="datalad-logo">
            <b-dropdown text="datasets.datalad.org" variant="outline-secondary">
                <b-dropdown-item href="#">TODO (no other root)</b-dropdown-item>
            </b-dropdown>
        </div>

        <div style="padding: 20px;">
            <b-form-group label="Data Sources">
                <b-form-checkbox v-model="datasources" value="openneuro">OpenNeuro</b-form-checkbox>
                <b-form-checkbox v-model="datasources" value="fcp/indi">FCP/Indi</b-form-checkbox>
                <b-form-checkbox v-model="datasources" value="other1">Other1</b-form-checkbox>
            </b-form-group>
        </div>

    </div>
    <div class="page-header">
        <div class="search-box">
            <b-form-input v-model="query" type="text" placeholder="Search Dataset" @focus.native="focus_search()" @input="change_query_debounce" class="input"/>
            <icon name="search" class="search-icon" scale="1.5"/>
        </div>
    </div>
    <div class="page-main">
        <div v-for="dataset in datasets" :key="dataset._id" class="dataset">
            <div style="float: left; width: 100px;">
                <b class="text-success" style="font-size: 95%;">{{dataset.path | tailname}}</b>
            </div>
            <div style="margin-left: 120px;">
                <p style="margin-bottom:7px;">
                    <!--<b>{{dataset.path}}</b>-->
                    {{dataset.dataset_description.Name}}
                    <small v-for="(author, idx) in dataset.dataset_description.Authors" :key="idx"> | {{author}}</small>
                </p>
                <p style="margin-bottom:0px;">
                    <b-badge variant="light" v-for="(count, datatype_id) in dataset.stats.datatypes" :key="datatype_id" style="margin-right: 10px;">
                        <datatypetag :datatype="datatype_id"/> <small>{{count}}</small>
                    </b-badge>
                    <small>
                        &bull;
                        {{dataset.stats.subjects}} Subjects 
                        <span v-if="dataset.stats.sessions > 1"> <b>&bull;</b> {{dataset.stats.sessions}} Sessions</span>
                        <span><b>&bull;</b> {{license_label(dataset)}}</span>
                        <span><b>&bull;</b> <small>{{dataset._id}}</small></span>
                    </small>
                </p>
            </div>
        </div>
    </div>
    <div class="page-main-bottom" style="text-align: right;">
        <small><b>{{datasets.length}}</b> datasets</small>
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
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import datatypetag from '@/components/datatypetag'
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
        sidemenu, pageheader, datatypetag,
        //datatype, app, VueMarkdown, contact, tags,
    },

    data() {
        return {
            //editing: false, 
            datasets: [],
            datasources: [ 'openneuro' ],
            datasource_options: [  
                { text: "OpenNeuro", value: "openneuro" },
                { text: "FCP/indi", value: "indi" },
            ],
            config: Vue.config,
        }
    },

    filters: {
        tailname(path) {
            return path.split("/").splice(-1)[0];
        },
    },

    mounted() {
        this.$http('datalad/datasets', {params: {
            select: 'path name dataset_description stats',
            limit: 0,
        }}).then(res=>{
            this.datasets = res.data;
        });
    },
    
    methods: {
        license_label(dataset) {
            let license = dataset.dataset_description.License; 
            if(!license) return "?";
            if(license.length > 5) license = "CUST";
            return license;
        }
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
.page-left {
position: fixed;
background-color: #fcfcfc;
width: 300px;
left: 200px;
top: 0px;
bottom: 0px;
border-right: 1px solid #eee;
}
.page-title {
background-color: white;
padding: 5px 30px;
height: 50px;
border-bottom: 1px solid #eee;
}
.page-main {
position: fixed;
background-color: white;
left: 500px;
right: 0px;
top: 50px;
bottom: 30px;
overflow: auto;
overflow-x: hidden;
}
.page-main-bottom {
position: fixed;
height: 30px;
bottom: 0px;
left: 500px;
right: 0px;
background-color: white;
border-top: 1px solid #eee;
padding-top: 5px; 
padding-right: 35px;
}
.page-header {
left: 500px;
box-shadow: none;
border-bottom: 1px solid #eee;
}
.datalad-logo {
position: relative;
left: -13px;
}
.dataset {
padding: 10px 20px;
padding-left: 40px;
font-size: 95%;
border-bottom: 1px solid #eee;
}
</style>

