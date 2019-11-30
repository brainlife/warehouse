<template>
<div>
    <sidemenu active="/datalad"></sidemenu>
    <div class="page-header" :style="{width: splitter_pos-200+'px'}">
        <div class="search-box" :style="{width: splitter_pos-200+'px'}"> 
            <b-form-input v-model="query" type="text" placeholder="Search Datasets" @input="change_query_debounce" class="input"/>
            <icon name="search" class="search-icon" scale="1.5"/>
            <img src="https://pbs.twimg.com/profile_images/899900469119680512/XybpieA7_400x400.jpg" height="30px" class="datalad-logo">
        </div>
    </div>
    <div class="page-left-top" style="padding: 10px;" :style="{width: splitter_pos-200+'px'}">
        <b-form-group label="Datatypes">
            <b-form-checkbox-group v-model="datatypes">
                <b-form-checkbox v-for="datatype_id in datatype_options" :key="datatype_id" :value="datatype_id">
                    <span style="font-size: 90%">
                        <datatypetag :datatype="datatype_id" :clickable="false"/>
                    </span>
                </b-form-checkbox>
            </b-form-checkbox-group>
        </b-form-group>
    </div>
    <div class="page-left" ref="dataset-list" :style="{width: splitter_pos-200+'px'}">
        <p v-if="datasets.length == 0" style="padding: 20px; opacity: 0.8;">No matching dataset</p>
        <div v-for="dataset in datasets" :key="dataset._id" class="dataset" :title="dataset.path" :ref="dataset._id" @click="open_dataset(dataset._id)" 
            :class="{dataset_selected: (selected && dataset._id == selected._id)}"> 
            <p style="margin-bottom:7px;">
                <b-badge variant="light" style="font-size: 85%;">{{dataset.path | shortName}}</b-badge>
                {{dataset.dataset_description.Name}}
                <span v-if="dataset.dataset_description.Authors">
                    <small v-for="(author, idx) in dataset.dataset_description.Authors.slice(0, 3)" :key="idx"> | {{author}} </small>
                </span>
            </p>
            <p style="margin-bottom:0px;">
                <b-badge variant="light" v-for="(count, datatype_id) in dataset.stats.datatypes" :key="datatype_id" style="margin-right: 10px;">
                    <datatypetag :datatype="datatype_id" :clickable="false"/> <small>{{count}}</small>
                </b-badge>
                <small>
                    <span>{{license_label(dataset)}}</span>
                    {{dataset.stats.subjects}} Subjects 
                    <span v-if="dataset.stats.sessions > 1"> <b>&bull;</b> {{dataset.stats.sessions}} Sessions</span>
                </small>
            </p>
        
        </div>
    </div>
    <div class="page-left-bottom" style="text-align: right;" :style="{width: splitter_pos-200+'px'}">
        <small><b>{{datasets.length}}</b> datasets</small>
    </div>

    <div class="splitter" ref="splitter" :style="{left: splitter_pos+'px'}"/>
    <div class="page-main" v-if="selected" :style="{left: splitter_pos+10+'px'}">
        <div style="padding: 10px">
            <b-button variant="primary" @click="openImporter" class="import-button"><icon name="cloud-download-alt"/> Import</b-button>
            <p>
                <a v-if="selected.dataset_description.DatasetDOI" :target="selected._id" :href="'https://doi.org/'+selected.dataset_description.DatasetDOI">
                    <b-badge variant="light">{{selected.dataset_description.DatasetDOI}}</b-badge>
                </a>
                <pre v-else style="opacity: 0.5; font-size: 70%">{{selected.path}}</pre>

                <h5 style="font-size: 20px; margin-bottom: 0">{{selected.dataset_description.Name}}</h5>
                <small v-for="(author, idx) in selected.dataset_description.Authors" :key="idx"> 
                    <span v-if="idx > 0" style="opacity: 0.3;">|</span> {{author}} 
                </small>
            </p>
            
            <p>
                <b-badge pill class="bigpill" style="margin-right: 5px;">
                    <icon name="user-friends" style="opacity: 0.4;"/>&nbsp;&nbsp;{{selected.stats.subjects}} subjects 
                    <span v-if="selected.stats.sessions"><span style="opacity: 0.4"> | </span>{{selected.stats.sessions}} sessions</span>
                </b-badge>
                <span v-for="(count, datatype_id) in selected.stats.datatypes" :key="datatype_id" style="margin-right: 10px;">
                    <datatypetag :datatype="datatype_id" :clickable="false"/> <small>{{count}}</small>
                </span>    
            </p>

            <div v-if="selected.README">
                <span class="form-header">README</span>
                <vue-markdown v-if="selected.README" :source="selected.README" class="readme box"></vue-markdown>
                <hr>
            </div>
        
            <div v-if="selected.dataset_description.License">
                <span class="form-header">License</span>
                <div style="margin-left: 40px;" v-if="known_license(selected.dataset_description.License)">
                    <license :id="known_license(selected.dataset_description.License)"/>
                </div>
                <p v-else style="margin-left: 40px; font-style: italic;">{{selected.dataset_description.License}}</p>
            </div>

            <div v-if="selected.dataset_description.Acknowledgements">
                <span class="form-header">Acknowledgements</span>
                <ul><li v-for="(ack, idx) in selected.dataset_description.Acknowledgements" :key="idx">{{ack}}</li></ul>
            </div>

            <div v-if="selected.dataset_description.HowToAcknowledge">
                <span class="form-header">How To Acknowledge</span>
                <p style="margin-left: 40px;"><i>{{selected.dataset_description.HowToAcknowledge}}</i></p>
            </div>

            <div v-if="selected.dataset_description.Funding">
                <span class="form-header">Funding</span>
                <ul><li v-for="(fund, idx) in selected.dataset_description.Funding" :key="idx">{{fund}}</li></ul>
            </div>

            <div v-if="selected.dataset_description.ReferencesAndLinks">
                <span class="form-header">References And Links</span>
                <ul><li v-for="(ref, idx) in selected.dataset_description.ReferencesAndLinks" :key="idx">{{ref}}</li></ul>
            </div>

            <!--
            <div v-if="selected.dataset_description.DatasetDOI">
                <span class="form-header">Dataset DOI</span>
                <p style="margin-left: 40px;">
                    <doibadge :doi="selected.dataset_description.DatasetDOI"/>
                </p>
            </div>
            -->

            <div v-if="selected.CHANGES">
                <span class="form-header">CHANGES</span>
                <p>{{selected.CHANGES}}</p>
            </div>
        </div>

        <div v-if="subjects">
            <div class="table-header">
                <b-row>
                    <b-col cols="2">subject<small>/ses</small></b-col>
                    <b-col cols="3" v-if="selected.participants"><!--participants.json--></b-col>
                    <b-col>
                        <b-row>
                            <b-col>datatype</b-col>
                            <b-col>tags</b-col>
                        </b-row>
                    </b-col>
                </b-row>
            </div>
            <div class="table-body">
                <b-row v-for="(group, subses) in subjects" :key="subses" class="subject-group">
                    <b-col cols="2">{{subses}}</b-col>
                    <b-col cols="3" v-if="selected.participants">
                        <span class="keyvalue" v-for="(v, k) in selected.participants.find(p=>p.subject == group.subject)" :key="k" v-if="k != 'subject'">
                            <small>{{k}}</small> {{v}}
                        </span>
                    </b-col>
                    <b-col>
                        <b-row v-for="dataset in group.datasets" :key="dataset._id" class="dataobject">
                            <b-col>
                                <datatypetag :datatype="dataset.datatype" :clickable="false" :tags="dataset.datatype_tags" />
                            </b-col>
                            <b-col><tags :tags="dataset.tags"/></b-col>
                        </b-row>
                    </b-col>
                </b-row>
            </div>
            <p v-if="selected.participants_info"><pre>{{selected.participants_info}}</pre></p>
        </div>
        <!--
        <div v-if="config.debug">
            <pre>{{selected}}</pre>
        </div>
        -->
    </div>

    <div class="page-main" v-else style="padding: 20px 40px; opacity: 0.7; background-color: #eee;" :style="{left: splitter_pos+10+'px'}"> 
        <p v-if="loading_dataset" style="opacity: 0.6; font-size: 150%;">Loading...</p>
        <div v-else>
            <p style="font-size: 150%; margin-top: 200px;"><icon name="arrow-left"/> Select a dataset</p>
            <p>You can import datasets from various remote data sources such as OpenNeuro, FCP/INDI through datalad.</p>
            <br>
            <br>
            <br>
            <b-card>
                <img src="https://www.datalad.org/theme/img/logo/datalad_nav_wide.png" width="150px" align="right">
                <a href="https://www.datalad.org/">Datalad</a> allows you to easily search and access various public datasets. brianlife.io uses Datalad 
                to discover and allow users to import BIDS formatted datasets.
            </b-card>

        </div>
    </div>
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import datatypetag from '@/components/datatypetag'
import tags from '@/components/tags'
import license from '@/components/license'

import VueMarkdown from 'vue-markdown'

import 'perfect-scrollbar/css/perfect-scrollbar.css'
import PerfectScrollbar from 'perfect-scrollbar'

import pagesplitter from '@/mixins/pagesplitter'

let query_debounce = null;

export default {
    mixins: [pagesplitter],
    components: { 
        sidemenu, pageheader, datatypetag, VueMarkdown, tags, license,
        //datatype, app, VueMarkdown, contact, tags, 
    },
    
    //props: ['dataset_id'],

    data() {
        return {
            datasets: [], //dataset list

            //dataset filters
            /*
            sources: {
                openneuro: true,
                indi: true,
            },
            */
            //licenses: ['ANY'],
            datatypes: [],
            datatype_options: [ 
                "58c33bcee13a50849b25879a", //t1
                "594c0325fa1d2e5a1f0beda5", //t2
                "5d9cf81c0eed545f51bf75df", //flair
                "58c33c5fe13a50849b25879b", //dwi
                "59b685a08e5d38b0b331ddc5", //func
                "5c390505f9109beac42b00df", //fmap
                "5ddf1381936ca39318c5f045", //eeg
            ],
            //min_age: 0,
            //max_age: 100,

            //sex_m: true,
            //sex_f: true,

            query: "",
            dataset_ps: null, 

            loading_dataset: false,
            selected: null, 
            subjects: null, //dataobjects that belongs to selected dataset

            config: Vue.config,
        }
    },

    watch: {
        datatypes() {
            this.load_datasets();
        },
        "$route.params.dataset_id": function(dataset_id, ov) {
            console.log("route changed", dataset_id);
            if(dataset_id == ov) return;
            this.load_dataset(dataset_id);
        }
    },

    filters: {
        shortName(path) {
            if(path.startsWith("datasets.datalad.org/indi")) {
                return path.split("/").slice(1,3).join("/");
            }
            return path.split("/").splice(-1)[0];
        },
    },

    computed: {
        /*
        participants_columns() {
            if(!this.selected.participants) return [];

            let keys = [];
            for(let row of this.selected.participants) {
                for(let key in row) {
                    if(!keys.includes(key)) keys.push(key);
                }
            }
            console.dir(keys);
            return keys;
        },
        */

    },

    mounted() {
        this.load_datasets();
        let dataset_list  = this.$refs["dataset-list"];
        this.dataset_ps = new PerfectScrollbar(dataset_list);        
        this.init_splitter();

        let dataset_id = this.$route.params.dataset_id;
        if(dataset_id) this.load_dataset(dataset_id);
    },
    
    methods: {
        load_datasets() {
            this.datasets = [];
            let find = {};
            if(this.query) {
                find["$text"] = {$search: this.query};
            }
            for(let datatype_id of this.datatypes) {
                find["stats.datatypes."+datatype_id] = {$exists: true};
            }
            //console.dir(find);
            this.$http('datalad/datasets', {params: {
                find: JSON.stringify(find),
                select: 'path name dataset_description stats',
                limit: 0,
            }}).then(res=>{
                this.datasets = res.data;
                this.$refs["dataset-list"].scrollTop = 0;

                //scroll list to the selected element
                this.$nextTick(()=>{
                    if(this.$route.params.dataset_id) {
                        let item = this.$refs[this.$route.params.dataset_id][0];
                        item.scrollIntoView();
                    }
                });
            }).catch(console.error);
        },

        open_dataset(dataset_id) {
            if(this.selected && this.selected._id == dataset_id) {
                this.$router.push('/datalad');
            } else {
                this.$router.push('/datalad/'+dataset_id);
                document.getElementsByClassName("page-main")[0].scrollTop = 0;
            }
        },

        known_license(license) {
            license = license.toLowerCase().trim();
            
            //corrrect some common mistakes.. (should I do this?)
            if(license == "cco" || license == "cc") license = "cc0";
            if(license == "ppdl") license = "pddl";
            if(license == "ccby") license = "ccby.40";

            switch(license) {
            case "cc0":
            case "pddl":
            case "pd":
            case "ccby.40":
                return license;
            }
            console.log("unknown license");
            console.log(license);
            return null;
        },

        load_dataset(dataset_id) {
            this.selected = null;
            this.subjects = null;
            if(!dataset_id) return;

            //dataset details
            this.loading_dataset = true;
            this.$http('datalad/datasets', {params: {
                find: JSON.stringify({_id: dataset_id}), 
            }}).then(res=>{
                this.selected = res.data[0];
                if(this.selected.participants && this.selected.participants.length == 0) this.selected.participants = null;
            }).catch(console.error);

            //dataset files
            this.$http('datalad/items', {params: {
                find: JSON.stringify({dldataset: dataset_id}), 
                //sort: 'datasets.meta.subject datasets.meta.session', //slow?
                select: 'dataset.meta.subject dataset.meta.session dataset.desc dataset.datatype dataset.datatype_tags dataset.tags',
                limit: 0,
            }}).then(res=>{
                let items = res.data;

                //organize to subject-session and list of datasets
                this.subjects = {};
                for(let item of items) {
                    let subject = item.dataset.meta.subject;
                    let session = item.dataset.meta.session;
                    let group = subject;
                    if(session) group += " / "+session;
                    if(!this.subjects[group]) this.subjects[group] = {subject, session, datasets: []};
                    this.subjects[group].datasets.push(item.dataset);
                }
                //console.dir(this.subjects);
                this.loading_dataset = false;

            }).catch(console.error);            
        },

        change_query_debounce() {
            clearTimeout(query_debounce);
            query_debounce = setTimeout(this.change_query, 300);        
        },

        change_query() {
            if(this.loading) return setTimeout(this.change_query, 300);
            this.load_datasets();
        },

        license_label(dataset) {
            let license = dataset.dataset_description.License; 
            if(!license || license.length > 5) return ""; //don't show license that's too long (usually some bogus stuff)
            return license;
        },

        openImporter() {
            //console.dir(this.selected);
            if(Vue.config.user) {
                //this.$bvModal.show('importer'); 
                this.$root.$emit("importer.open", {dataset: this.selected, subjects: this.subjects});
            } else alert('Please signup/login before importing datasets.');
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
width: 400px;
left: 200px;
top: 175px;
bottom: 30px;
border-right: 1px solid #eee;
}
.page-main {
position: fixed;
right: 0px;
top: 0px;
bottom: 0px;
overflow: auto;
background-color: white;
overflow-x: hidden;
}

.page-bottom {
position: fixed;
right: 0px;
bottom: 0px;
height: 40%;
overflow: auto;
box-shadow: inset 0 4px 4px #ccc6;
font-size: 12px;
overflow-x: hidden;
}

.page-left-top {
position: fixed;
height: 125px;
top: 50px;
left: 200px;
width: 400px;   
}
.page-left-bottom {
position: fixed;
height: 30px;
bottom: 0px;
left: 200px;
width: 400px;
border-top: 1px solid #ddd;
padding-top: 5px; 
padding-right: 15px;
}
.page-header {
left: 200px;
box-shadow: none;
border-bottom: 1px solid #eee;
}
.datalad-logo {
position: absolute;
top: 3px;
right: 20px;
z-index: -1;
transition: color 0.5s;
opacity: 0.5;
}
.dataset {
padding: 7px 10px;
font-size: 95%;
border-top: 1px solid #eee;
background-color: white;
}
.dataset:hover {
cursor: pointer;
background-color: #eee;
}
.dataset.dataset_selected {
background-color: #2693ff;
color: white;
}
.count {
float: right;
opacity: 0.7;
font-size: 90%;
}

.dataset-header {
padding: 10px;
background-color: white;
color: black;
}

.table-header {
position: sticky; 
top: 0; 
background-color: #ddd; 
padding: 5px 10px;
z-index: 1;
text-transform: uppercase;
font-weight: bold;
}
.table-body {
padding: 0px 10px;
}
.subject-group {
border-bottom: 1px solid #ddd9;
padding: 5px 0px;
font-size: 90%;
}
.subject-group .dataobject:hover {
background-color: #eee;
}
.import-button {
float: right; 
position: sticky;
top: 10px;
margin-left: 30px;
}
</style>

