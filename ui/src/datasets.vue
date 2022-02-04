<template>
<div>
    <div class="page-header">
        <div class="search-box">
            <b-form-input v-model="query" type="text" placeholder="Search Datasets" class="input"/>
            <icon name="search" class="search-icon" scale="1.5"/>
            <img src="https://pbs.twimg.com/profile_images/899900469119680512/XybpieA7_400x400.jpg" height="30px" class="datalad-logo">
        </div>
    </div>
    <div class="page-content">
        <div v-if="datatype_options" style="margin: 5px; padding-right: 15px;">
            <v-select v-if="datatype_options" v-model="datatypes" :options="datatype_options" 
                :reduce="dt => dt._id" label="name" :multiple="true" placeholder="Filter by Datatype">
                <template slot="option" slot-scope="option">
                    <datatypetag :datatype="option" :clickable="false"/>
                    <small>{{option.desc}}</small>
                </template>
                <template slot="selected-option" slot-scope="option">
                    <datatypetag :datatype="option" :clickable="false"/>
                </template>
            </v-select>
        </div>

        <div class="hint">
            <p>The following are the list of publically avaiable datasets that you can import to your brainlife projects.</p>
            <p>The list includes datasets published on OpenNeuro, FCP/INDI, and other sources that can be accessed via <a href="https://datalad.org" target="datalad">Datalad</a>.</p>
        </div>

        <p v-if="loading_datasets" style="padding: 20px; opacity: 0.8;">Loading...</p>
        <p v-else-if="filteredGroups.length == 0" style="padding: 20px; opacity: 0.8;">No matching dataset</p>
        <div v-for="group in filteredGroups" :key="group.key" class="dataset" @click="openDataset(group.key)">
            <small style="opacity: 0.7;"><b>{{group.key}}</b></small>
            <p style="margin-bottom: 0px;">
                <span class="serif">{{group.dsDesc.Name}}</span>
                <span v-if="group.dsDesc.Authors">
                    <small v-for="(author, idx) in group.dsDesc.Authors.slice(0, 3)" :key="idx"> <span style="opacity: 0.3;">|</span> {{author}} </small>
                </span>

                <span style="opacity: 0.3;">&bull;</span>
                <small>
                    {{group.stats.subjects}} <span style="opacity: 0.5;">sub</span>
                    <span v-if="group.stats.sessions"> 
                        <span style="opacity: 0.3;">|</span> {{group.stats.sessions}} <span style="opacity: 0.5;">ses</span>
                    </span>
                </small>

                <span style="opacity: 0.3;">&bull;</span>
                <small v-for="(count, datatype_id) in group.stats.datatypes" :key="datatype_id" style="margin-right: 10px;">
                    <datatypetag :datatype="datatype_id" :clickable="false"/> <small>{{count}}</small>
                </small>

                <!-- multiple versions? -->
                <!--
                <b-badge v-if="group.datasets.length > 1">Multi Versions</b-badge>
                -->
                <!--
                <div v-if="group.datasets.length > 1" style="display: inline-block;">
                    <span style="opacity: 0.3;">Versions</span>
                    <b-badge v-for="dataset in group.datasets" :key="dataset._id" style="margin-right: 5px;">{{dataset.version}}</b></b-badge>
                </div>
                -->
            </p>
        </div>
        <p style="padding: 5px 10px; background-color: #ddd; margin: 0;">
            <small v-if="groups.length != filteredGroups.length">Matching Filter <b>{{filteredGroups.length}}</b> datasets | </small>
            <small>Total <b>{{groups.length}}</b> datasets </small>
        </p>
    </div>
    <!--
    <div class="page-content" style="text-align: right;" :style="{width: listWidth+'px'}">
        <small><b>{{datasets.length}}</b> datasets</small>
    </div>
    -->
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import pageheader from '@/components/pageheader'
import datatypetag from '@/components/datatypetag'
import tags from '@/components/tags'
import license from '@/components/license'

import VueMarkdown from 'vue-markdown'

import PerfectScrollbar from 'perfect-scrollbar'

//import pagesplitter from '@/mixins/pagesplitter'
import datatypecache from '@/mixins/datatypecache'

//let query_debounce = null;

import {debounce} from './lib'

export default {
    mixins: [ datatypecache ],
    components: { 
        pageheader, datatypetag, VueMarkdown, tags, license, 
    },

    data() {
        return {
            //dataset list - grouped by
            groups: [],
            filteredGroups: [],

            datatypes: [], //selected datatypes
            datatype_options: null, //{label: .. datatype: } opbjects

            //datatype ids to use in filter
            datatype_ids: [ 
                "58c33bcee13a50849b25879a", //t1
                "594c0325fa1d2e5a1f0beda5", //t2
                "5d9cf81c0eed545f51bf75df", //flair
                "58c33c5fe13a50849b25879b", //dwi
                "59b685a08e5d38b0b331ddc5", //func
                "5c390505f9109beac42b00df", //fmap

                "60007567aacf9e1615a691dd", //eeg/bdf
                "6000753eaacf9e6591a691d9", //eeg/brainvision
                "600074f6aacf9e7acda691d7", //eeg/edf
                "60007410aacf9e4edda691d4", //eeg/eeglab

                "6000714baacf9e22a6a691c8", //meg/ctf
                "6000737faacf9ee51fa691cb", //meg/fif

                //"5ddf1381936ca39318c5f045", //eeg
                //"5dcecaffc4ae284155298383", //meg
            ],

            query: "",
            dataset_ps: null,

            loading_datasets: false,
            loading_dataset: false,
            selected: null,
            subjects: null, //dataobjects that belongs to selected dataset

            itemLimit: 0,
            hasMore: false,

            config: Vue.config,
        }
    },

    watch: {
        datatypes() {
            //this.load_datasets();
            this.updateFilteredGroups();
        },

        /*
        "$route.params.dataset_id": function(dataset_id, ov) {
            if(dataset_id == ov) return;
            this.load_dataset(dataset_id);
        },
        */

        query: debounce(function(v) {
            this.updateFilteredGroups();
        }, 500),
    },

    filters: {
        shortName(path) {
            if(path.startsWith("datasets.datalad.org/indi")) {
                return path.split("/").slice(1,3).join("/");
            }
            if(path.startsWith("OpenNeuro")) {
                return path.split("/")[1];
            }
            return path.split("/").splice(-1)[0];
        },
    },

    mounted() {
        this.load_datatypes();
        this.load_datasets();
        let dataset_id = this.$route.params.dataset_id;
        if(dataset_id) this.load_dataset(dataset_id);
    },

    methods: {
        showAll() {
            this.load_dataset(this.selected._id, 0);
        },

        updateFilteredGroups() {
            this.filteredGroups = this.groups.filter(group=>{
                let match = true;

                //apply query
                if(this.query) {
                    const tokens = this.query.split(" ").map(t=>t.toLowerCase());
                    const name = group.dsDesc.Name.toLowerCase();
                    const key = group.key.toLowerCase();
                    tokens.forEach(t=>{
                        if(name.includes(t)) return;
                        if(key.includes(t)) return;
                        match = false;
                    });
                }

                if(this.datatypes.length) {
                    //apply datatype query
                    //see if there is any dataset that contains all specified datatypes
                    let hasMatchingDataset = false;
                    group.datasets.forEach(dataset=>{
                        for(let datatype_id of this.datatypes) {
                            if(!dataset.stats.datatypes[datatype_id]) return; //missing!
                        }
                        hasMatchingDataset = true;
                    });
                    if(!hasMatchingDataset) match = false;
                }

                return match;
            });
        },

        load_datatypes(cb) {
            this.$http.get('datatype', {params: {
                find: JSON.stringify({_id: {$in: this.datatype_ids}}),
            }}).then(res=>{
                this.datatype_options = res.data.datatypes;
                if(cb) return cb();
            });
        },

        load_datasets() {
            this.loading_datasets = true;
            this.groups = [];

            const find = {
                removed: false,
                path: { $not: { $regex: "^OpenNeuroDatasets\/" } },
            };

            this.$http('datalad/datasets', {params: {
                find: JSON.stringify(find),
                select: 'path name dataset_description stats version',
                sort: '-create_date',
                limit: 0,
            }}).then(res=>{
                //make sure certain key information is set
                res.data.forEach(dataset=>{
                    if(!dataset.dataset_description) dataset.dataset_description = {};
                    if(!dataset.dataset_description.Name) dataset.dataset_description.Name = "untitled";
                });

                //group different versions for OpenNeuroDatasets together
                res.data.forEach(dataset=>{
                    let key = dataset.path;
                    if(dataset.path.startsWith("OpenNeuro/")) {
                        //trim the version name for ON dataset
                        const ptokens = dataset.path.split("/");
                        ptokens.pop();
                        key = ptokens.join("/");
                    }
                    let group = this.groups.find(d=>d.key == key);
                    if(!group) {
                        group = {
                            key,
                            dsDesc: dataset.dataset_description,
                            datasets: [],
                            stats: dataset.stats,
                        }
                        this.groups.push(group);
                    }
                    group.datasets.push(dataset);
                });

                this.updateFilteredGroups();

                this.loading_datasets = false;

            }).catch(err=>{
                this.loading_datasets = false;
                console.error(err);
            });
        },

        openDataset(key) {
            console.log("opening /dataset/"+key);
            this.$router.push('/dataset/'+key);
        },

        load_dataset(dataset_id, limit = 100) {
            this.itemLimit = limit;
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
                select: 'dataset.meta.subject dataset.meta.session dataset.desc dataset.datatype dataset.datatype_tags dataset.tags',
                limit: this.itemLimit,
                sort: 'dataset.meta.subject',
            }}).then(res=>{
                let items = res.data;

                //organize to subject-session and list of datasets
                this.subjects = {};
                for(let item of items) {
                    let subject = item.dataset.meta.subject;
                    let session = item.dataset.meta.session;
                    item.dataset._id = item._id;
                    let group = subject;
                    if(session) group += " / "+session;
                    if(!this.subjects[group]) this.subjects[group] = {subject, session, datasets: []};
                    this.subjects[group].datasets.push(item.dataset);
                }
                this.loading_dataset = false;
                this.hasMore = (items.length == this.itemLimit);
            }).catch(console.error);
        },

        license_label(dataset) {
            let license = dataset.dataset_description.License; 
            if(!license || license.length > 5) return ""; //don't show license that's too long (usually some bogus stuff)
            return license;
        },

        openImporter() {
            if(Vue.config.user) {
                //this.$bvModal.show('importer'); 
                this.$root.$emit("importer.open", {
                    dataset: this.selected, 
                    subjects: this.subjects,
                });
            } else alert('Please signup/login before importing datasets.');
        },

        click_dataset(item) {
            if(item.showmeta) {
                item.showmeta = false;
                this.$forceUpdate();
            } else {
                item.showmeta = true;
                if(item._meta) {
                    this.$forceUpdate();
                    return; //already loaded?
                }
                this.$http('datalad/items', {params: {
                    find: JSON.stringify({_id: item._id}), 
                    select: 'dataset.meta dataset.storage_config.files',
                }}).then(res=>{
                    item._meta = res.data[0].dataset.meta;     
                    item._files = res.data[0].dataset.storage_config.files;     
                    this.$forceUpdate();
                });     
            } 
        },
    }, //methods
}
</script>

<style scoped>
.page-content {
    top: 50px;
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
    background-color: #fcfcfc;
    top: 50px;
    bottom: 40px;
    border-right: 1px solid #eee;
}
.page-main {
    bottom: 0px;
    overflow: auto;
    background-color: white;
    overflow-x: hidden;
    transition: left 0s;
    z-index: 1;
}
.page-left-top {
    top: 50px;
    height: 50px;
    background-color: #f0f0f0;
    overflow: hidden;
}
.page-left-bottom {
    height: 40px;
    top: inherit;
    border-top: 1px solid #ddd;
    padding-top: 5px; 
    padding-right: 15px;
}
.page-header {
    box-shadow: none;
    border-bottom: 1px solid #eee;
    padding-left: 0;
}
.datalad-logo {
    position: absolute;
    top: 3px;
    right: 20px;
    z-index: -1;
    opacity: 0.5;
}
.dataset {
    padding: 7px 10px;
    font-size: 95%;
    border-top: 1px solid #0001;
    background-color: #fff;
}

.dataset:hover {
    cursor: pointer;
    background-color: #9993;
}

.dataset.dataset_selected {
/*
position: sticky;
//making it sticky on top causes some browser bug? the list will go on top
//of selected element. adjusting z-index causes scrollbar to be hidden 
//under the selected item
top: 0;
bottom: 0;
*/
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

.subject-group .dataobject-clickable:hover {
    background-color: #eee;
    cursor: pointer;
}

.import-button {
    float: right; 
    position: sticky;
    top: 10px;
    margin-left: 30px;
    z-index: 1;
}
.search-icon {
    left: 12px;
}

.disableText {
    user-select: none;
}
.hint {
    padding: 10px;
    opacity: 0.8;
}
</style>

