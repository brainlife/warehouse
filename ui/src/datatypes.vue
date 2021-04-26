<template>
<div>
    <div class="page-header">
        <div class="search-box onRight">
            <b-form-input v-model="query" type="text" placeholder="Search Datatypes" @input="changeQueryDebounce" class="input"/>
            <icon name="search" class="search-icon" scale="1.5"/>
            <icon name="times" class="clear-search" scale="1.5" @click="clearQuery()" v-if="query"/>
        </div>
    </div>
    <div class="page-content" ref="scrolled">
        <div class="header">
                <h2>Datatypes</h2>
                <p style="opacity: 0.7;">
                    Datatypes allow Apps to exchange data. Please visit <a href="https://app.slack.com/client/T3X5ND3U1/C946FA6PK">#datatype slack channel</a> to register new datatypes.
                </p>
        </div>
        <div v-if="!filtered.length && query.length">
            <h3 style="opacity: 0.8; margin: 40px;" variant="secondary">No matching Datatypes</h3>
        </div>
        <div v-else>
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
        </div>
        <b-button v-if="config.has_role('datatype.create')" class="button-fixed" @click="newdatatype">
            New Datatype
        </b-button>
    </div>
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import VueMarkdown from 'vue-markdown'

import datatype from '@/components/datatype'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import app from '@/components/app'
import tags from '@/components/tags'
let queryDebounce;
export default {
    components: { 
        pageheader, datatype, app, VueMarkdown, contact, tags,
    },

    data () {
        return {
            datatypes: null,
            query: "",
            filtered : [],

            //for selected item
            apps: [], //apps that uses selected datatype
            adhoc_datatype_tags: [], //datatype tags associated with selected datatype

            //sample_task: null,
            sample_datasets: [],
            
            //editing: false, 
            config: Vue.config,
        }
    },

    watch : {
        query : function (){
            this.load();
        }
    },
    mounted() {
        console.log("datatype loaded");
        this.$http.get('datatype', {params: {
            sort: 'name',
            select: 'name desc admins files groupAnalysis',
        }})
        .then(res=>{
            this.datatypes = res.data.datatypes;
            console.log("datatype loaded");
        }).catch(console.error);
    },

    methods: {
        back() {
            //this.$router.push('/apps');
            this.$router.go(-1);
        },
        open_sample_dataset(dataset_id) {
            //this.$router.replace('/project/'+this.project._id+'/dataset/'+dataset_id);
            this.$root.$emit('dataset.view', {id: dataset_id,  back: './'});
        },

        open(datatype) {
            //this.$router.push(`/datatype/${datatype._id}`);
            this.$router.push('/datatype/'+datatype._id);
        },

        newdatatype() {
            //this.$router.push(`/datatype/${datatype._id}`);
            this.$router.push('/datatype/_/edit');
        },

        get_datatypes(prefix) {
            if(!this.datatypes) return false;
            if(this.filtered.length){
                return this.filtered.filter(d=>~d.name.indexOf(prefix));
            }
            return this.datatypes.filter(d=>~d.name.indexOf(prefix));
        },

        get_not_datatypes(prefix) {
            if(!this.datatypes) return false;
            if(this.filtered.length){
                return this.filtered.filter(d=>!d.name.includes(prefix));
            }
            return this.datatypes.filter(d=>!d.name.includes(prefix));
        },

        clearQuery() {
            this.query = ''
            this.changeQuery();
        },

        changeQueryDebounce() {
            clearTimeout(queryDebounce);
            queryDebounce = setTimeout(this.changeQuery, 300);        
        },

        changeQuery() {
            if(!this.datatypes) return setTimeout(this.changeQuery, 300);
            //document.location="#"; //clear hash //TODO what is this?
            sessionStorage.setItem("datatypes.query", this.query);
            this.load();
        },

        load(){
            if(this.query){
                this.filtered = this.datatypes.filter((datatype) =>{
                    let subQuery = this.query.split(" ");
                    return subQuery.every(token => datatype.name.toLowerCase().includes(token.toLowerCase()) && datatype.desc.toLowerCase().includes(token.toLowerCase()))
                });
            }else {
                this.filtered = [];
            }
        }
    }, //methods
}
</script>

<style scoped>

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
h4.header-sticky {
padding: 9px;
height: 50px;
}
.apps-container {
display: flex;
flex-wrap: wrap;
}
.apps-container .app {
margin-right: 10px;
margin-bottom: 10px;
width: 400px;
box-sizing: border-box;
}
code.json {
background-color: white;
}
.form-action {
text-align: right;
position: fixed;
bottom:0;
right:0;
left:50px;
background-color: rgba(100,100,100,0.4);
padding: 10px;
}
.datatype-card {
cursor: pointer;
padding: 10px;
border: none;
box-shadow: 2px 2px 4px rgba(0,0,0,0.1);
transition: box-shadow 0.5s;
}
.datatype-card:hover {
box-shadow: 2px 2px 8px rgba(0,0,0,0.3);
}
.sample-dataset {
background-color: white;
border-bottom: 1px solid #ddd;
padding: 5px 10px;
cursor: pointer;
} 
.sample-dataset:hover {
background-color: #ddd;
}

.search-box .clear-search {
right: 260px;
}
</style>

