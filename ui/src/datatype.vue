<template>
<div>
    <div class="page-content">
        <div v-if="!datatype" class="loading">Loading ...</div>
        <div v-else>
            <div class="header header-sticky">
                <b-container style="position: relative;">
                    <div style="float: right; z-index: 1; position: relative;">
                        <b-btn @click="edit" v-if="canedit" variant="secondary" size="sm"><icon name="edit"/> Edit</b-btn>
                    </div>
                    <div @click="back()" class="button button-page" style="position: absolute; left: -30px;">
                        <icon name="angle-left" scale="1.5"/>
                    </div>
                    <h2 style="position: relative; top: -3px;">
                        <datatypetag :datatype="datatype" :trimname="!!(~datatype.name.indexOf('neuro/'))"/>
                    </h2>
                    <p style="opacity: 0.6">{{datatype.desc}}</p>
                </b-container>
            </div>
            <br>
            <b-container>
                <div class="box">
                    <span class="form-header">Files/Dirs</span>
                    <p><small style="opacity: 0.7">The following files/dirs are expected to be part of this datatype</small></p>
                    <div v-for="file in datatype.files" :key="file.id" style="background-color: white; padding: 8px; margin-bottom: 1px;">
                        <b-row>
                            <b-col>
                                <span v-if="file.filename"><icon name="regular/file"/> {{file.filename}}</span>
                                <span v-if="file.dirname"><icon name="folder"/> {{file.dirname}}</span>
                                <b-badge v-if="file.ext" variant="light" title="Validator extension check">{{file.ext}}</b-badge>
                            </b-col>
                            <b-col cols="3">
                                <small><b style="opacity: 0.7">{{file.id}}</b></small>
                                <b-badge v-if="!file.required" style="float: right;">optional</b-badge>
                            </b-col>
                            <b-col>
                                <small>{{file.desc}}</small>
                            </b-col>
                        </b-row>
                    </div>
                </div>

                <div v-if="datatype.readme" class="box">
                    <span class="form-header">README</span>
                    <p v-if="!datatype.readme" style="opacity: 0.7">No README</p>
                    <vue-markdown v-else :source="datatype.readme" class="readme"/>
                </div>

                <div class="box">
                    <span class="form-header">Datatype Tags</span>
                    <p v-if="datatype.datatype_tags.length > 0"><small style="opacity: 0.7">The following datatype tags are used for this datatype.</small></p>
                    <p v-else><small style="opacity: 0.7">No officially registered datatype tags</small></p>
                    <b-row v-for="(entry, idx) in datatype.datatype_tags" :key="idx" style="margin-bottom: 10px;">
                        <b-col cols="3">
                            <span style="background-color: #ddd; padding: 2px 5px; display: inline-block;">{{entry.datatype_tag}}</span>
                        </b-col>
                        <b-col cols="9">
                            <small>{{entry.desc}}</small>
                        </b-col>
                    </b-row>

                    <p v-if="adhoc_datatype_tags.length > 0">
                        <small style="opacity: 0.7">The following adhoc(not officially recognized) datatype tags are used for some datasets.</small><br>
                        <span v-for="tag in adhoc_datatype_tags" :key="tag" style="background-color: #ddd; padding: 2px 5px; margin-right: 4px; margin-bottom: 4px; display: inline-block; opacity: 0.5;">{{tag}}</span>
                    </p>
                </div>

                <div v-if="sample_datasets.length > 0" class="box">
                    <span class="form-header">Sample Data</span>
                    <p>
                        <small style="opacity: 0.7;">Please use the following data objects are template.</small>
                    </p>
                    <div v-for="dataset in sample_datasets" :key="dataset._id" class="sample-dataset" @click="open_sample_dataset(dataset)">
                        <b-row>
                            <b-col cols="6">
                                <datatypetag :datatype="datatype" :tags="dataset.datatype_tags"/>
                            </b-col>
                            <b-col>
                                {{dataset.meta.subject}} <span v-if="dataset.meta.session">{{dataset.meta.session}}</span> <small>{{dataset.desc}}</small>
                                <!-- <span style="float: right"><b>From</b> {{dataset.project.name}}</span> -->
                                <tags :tags="dataset.tags"/>
                            </b-col>
                        </b-row>
                    </div>
                </div>

                <div class="box">
                    <span class="form-header">Visualizers</span>
                    <p v-if="datatype.uis.length == 0" style="opacity: 0.8;">No visualizer</p>
                    <p v-else><small style="opacity: 0.7">The following visualizers can be used to visualize this datatype</small></p>
                    <b-row>
                        <b-col :cols="3" class="ui" v-for="ui in datatype.uis" :key="ui._id">
                            <b-card 
                                :header-bg-variant="ui.docker?'success':'dark'" 
                                header-text-variant="white" 
                                :header="ui.name" 
                                class="card" 
                                @click="openvis(ui)"
                                style="max-width: 25rem; margin-bottom: 20px;"
                                :img-src="ui.avatar"> 
                                <p class="card-text">{{ui.desc}}</p>
                            </b-card>
                        </b-col>
                    </b-row>
                </div>

                <div class="box">
                    <span class="form-header">Admins</span>
                    <p><small style="opacity: 0.7">Users who are responsible for this datatype.</small></p>
                    <div>
                        <p v-if="!datatype.admins || datatype.admins.length == 0" style="opacity: 0.8">No admins</p>
                        <p v-for="admin in datatype.admins" :key="admin._id">
                            <contact :id="admin"/>
                        </p>
                    </div>
                </div>

                <div class="box" v-if="datatype.bids && datatype.bids.maps.length > 0">
                    <span class="form-header">BIDS Export</span>
                    <p><small style="opacity: 0.7">The following file mapping is used to generate BIDS derivative exports.</small></p>
                    <div style="background-color: #f9f9f9; color: #bbb; padding: 5px"><b>{{datatype.bids.derivatives}}</b></div>
                    <pre>{{JSON.stringify(datatype.bids.maps, null, 4)}}</pre>
                </div>

                <div class="box" v-if="datatype.validator">
                    <span class="form-header">Validator</span>
                    <p><small style="opacity: 0.7">The following validator service is used to validate/normalize when a dataset of this datatype is imported by Brainlife UI.</small></p>
                    <p>
                        <a :href="'https://github.com/'+datatype.validator"><b>{{datatype.validator}}</b> <b-badge variant="secondary">{{datatype.validator_branch}}</b-badge></a>
                    </p>
                </div>

                <div class="box">
                    <span class="form-header">Apps</span>
            
                    <p v-if="output_apps.length == 0"><small>No App uses this datatype as output.</small></p>
                    <p v-else>
                        <small>The following Apps outputs datasets in this datatype.</small>
                    </p>
                    <div class="apps-container" style="border-left: 4px solid rgb(40, 167, 69); padding-left: 15px;">
                        <app v-for="app in output_apps" :key="app._id" :app="app" class="app" height="270px"/>
                    </div>
                    <br>

                    <p v-if="input_apps.length == 0"><small>No App uses this datatype as input.</small></p>
                    <p v-else>
                        <small>The following Apps uses datasets in this datatype for input.</small>
                    </p>
                    <div class="apps-container" style="border-left: 4px solid rgb(0, 123, 255); padding-left: 15px;">
                        <app v-for="app in input_apps" :key="app._id" :app="app" class="app" height="270px"/>
                    </div>
                </div>

            </b-container>
        </div>
    </div>
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import VueMarkdown from 'vue-markdown'

import datatype from '@/components/datatype'
import datatypetag from '@/components/datatypetag'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import app from '@/components/app'
import tags from '@/components/tags'

export default {
    components: { 
        pageheader, datatype, datatypetag, app, VueMarkdown, contact, tags,
    },

    data () {
        return {
            datatype: null, //datatype datatype

            //for datatype item
            apps: [], //apps that uses datatype datatype
            adhoc_datatype_tags: [], //datatype tags associated with datatype datatype

            //sample_task: null,
            sample_datasets: [],
            
            //editing: false, 
            config: Vue.config,
        }
    },

    computed: {
        input_apps() {
            if(!this.apps) return [];
            return this.apps.filter(a=>{
                return a.inputs.find(it=>it.datatype._id == this.datatype._id);
            });
        },
        output_apps() {
            if(!this.apps) return [];
            return this.apps.filter(a=>{
                return a.outputs.find(it=>it.datatype._id == this.datatype._id);
            });
        },
        canedit() {
            if(!Vue.config.user) return false;
            return ~this.datatype.admins.indexOf(Vue.config.user.sub);
        }
    },

    mounted() {
        this.load();
    },

    methods: {
        load() {
            console.log("loading datatype:"+this.$route.params.id);
            this.$http.get('datatype', {params: {
                find: JSON.stringify({
                    _id: this.$route.params.id,
                }),
                //sort: 'name',
            }})
            .then(res=>{
                this.datatype = res.data.datatypes[0];
                if(!this.datatype) alert("no such datatype");

                //load apps that uses this datatype
                this.$http.get('app', {params: {
                    find: JSON.stringify({
                        removed: false,
                        $or: [
                            {'inputs.datatype': this.datatype._id},
                            {'outputs.datatype': this.datatype._id},
                        ]
                    }),
                    select: 'name desc inputs outputs stats github',
                    populate: 'inputs.datatype outputs.datatype', //<app> likes datatypes populated
                    limit: 500, //TODO - this is not sustailable
                }}).then(res=>{
                    this.apps = res.data.apps;
                })

                //load adhoc datatype_tags used for this datatype
                let registered_datatype_tags = this.datatype.datatype_tags.map(entry=>entry.datatype_tag);
                this.$http.get('dataset/distinct', {params: {
                    distinct: 'datatype_tags',
                    find: JSON.stringify({
                        removed: false,
                        datatype: this.datatype._id,
                        datatype_tags: {$nin: registered_datatype_tags},
                    }),
                    
                }}).then(res=>{
                    this.adhoc_datatype_tags = res.data;
                });

                //load sample datasets
                if(this.datatype.samples) {
                    this.$http.get('/dataset', {params: {
                        find: JSON.stringify({
                            _id: {$in: this.datatype.samples},
                        }),
                        //populate: 'project',
                    }}).then(res=>{
                        console.dir(res);
                        this.sample_datasets = res.data.datasets;
                    });
                }
            }).catch(console.error);
        },

        back() {
            if(window.history.length > 1) this.$router.go(-1);
            else this.$router.push('/datatypes');
        },
        open_sample_dataset(dataset) {
            console.log("click sample", dataset._id);
            this.$router.replace('/project/'+dataset.project+'/dataset/'+dataset._id);
            //this.$root.$emit('dataset.view', {id: dataset_id,  back: './'});
        },

        get_datatypes(prefix) {
            if(!this.datatypes) return false;
            return this.datatypes.filter(d=>{
                if(~d.name.indexOf(prefix)) {
                    return true;
                }
                return false;
            }); 
        },

        get_not_datatypes(prefix) {
            if(!this.datatypes) return false;
            return this.datatypes.filter(d=>{
                if(!~d.name.indexOf(prefix)) {
                    return true;
                }
                return false;
            }); 
        },

        get_official_desc(tag) {
            if(!this.datatype.datatype_tags) return;
            return this.datatype.datatype_tags.find(d=>d.datatype_tag == tag);
        },

        edit() {
            //this.editing = true;
            this.$router.push('/datatype/'+this.datatype._id+'/edit');
        },

        /*
        trim(n) {
            return n.split("/").splice(1).join("/");
        },

        gethsl(n) {
            let hash = n.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
            let numhash = Math.abs(hash+120)%360;
            return "hsl("+(numhash%360)+", 50%, 60%)";
        },
        */
    },

    destroyed() {
        //this.ps.destroy();
    },
  
    watch: {
        '$route': function() {
            load();
        },
    }
}
</script>

<style scoped>
.page-content {
top: 0px;
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
.card-img {
height: 150px;
}
.card-text {
}
.sample-dataset {
background-color: white;
padding: 5px 10px;
cursor: pointer;
} 
.sample-dataset:hover {
background-color: #ddd;
}
.loading {
padding: 50px;
font-size: 20pt;
opacity: 0.5;
}
.button-page {
margin-top: 10px;
opacity: 0.6;
}
.box {
background-color: white;
padding: 20px;
margin-bottom: 20px;
margin-left: -20px;
}
</style>

