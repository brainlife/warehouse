<template>
<div>
    <sidemenu active="/datatypes"></sidemenu>
    <div class="page-content" ref="scrolled">
        <div v-if="!selected">
            <div class="header">
                <b-container>
                    <h2>Datatypes</h2>
                    <p style="opacity: 0.7;">
                        Datatypes allow Apps to exchange data. Please contact the Brainlife administrator to register new datatypes.
                    </p>
                </b-container>
            </div>

            <h4 class="header-sticky"><b-container>neuro/</b-container></h4> 
            <b-container>
                <b-card-group columns style="margin: 10px;">
                    <b-card no-body v-for="datatype in get_datatypes('neuro/')" :key="datatype._id" @click="select(datatype)" class="datatype-card">
                        <datatype :datatype="datatype"/>
                    </b-card>
                </b-card-group>
            </b-container>

            <h4 class="header-sticky"><b-container>other</b-container></h4> 
            <b-container>
                <b-card-group columns style="margin: 10px;">
                    <b-card no-body v-for="datatype in get_not_datatypes('neuro/')" :key="datatype._id" @click="select(datatype)" class="datatype-card">
                        <datatype :datatype="datatype"/>
                    </b-card>
                </b-card-group>
            </b-container>

            <b-button v-if="config.is_admin" class="button-fixed" @click="newdatatype" title="New Datatype">
                <icon name="plus" scale="2"/>
            </b-button>
        </div>

        <div v-if="selected">
            <div class="header header-sticky">
                <b-container>
                    <div style="float: right;">
                        <span class="button" @click="edit" v-if="canedit && !editing" title="Edit"><icon name="edit" scale="1.25"/></span>
                    </div>
                    <h2>
                        <b-form-input v-if="editing" type="text" v-model="selected.name" placeholder="neuro/somename"></b-form-input>
                        <datatypetag v-else :datatype="selected" :trimname="!!(~selected.name.indexOf('neuro/'))"/>
                    </h2>
                    <b-form-textarea v-if="editing" v-model="selected.desc" :rows="2"></b-form-textarea>
                    <p v-else style="opacity: 0.6">{{selected.desc}}</p>
                </b-container>
            </div>
            <br>
            <b-container>
                <b-row v-if="selected.readme">
                    <b-col cols="2">
                        <span class="form-header">README</span>
                    </b-col>
                    <b-col>
                        <b-form-textarea v-if="editing" v-model="selected.readme" :rows="2"></b-form-textarea>
                        <!--
                        <div v-else>
                            <p v-if="!selected.readme" style="opacity: 0.7">No README</p>
                            <vue-markdown v-else :source="selected.readme" class="readme"/>
                        </div>
                        -->
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Admins</span>
                    </b-col>
                    <b-col>
                        <p><small style="opacity: 0.7">Users who are responsible for this datatype.</small></p>
                        <contactlist v-if="editing" v-model="selected.admins"></contactlist>
                        <div v-else>
                            <p v-if="!selected.admins || selected.admins.length == 0" style="opacity: 0.8">No admins</p>
                            <p v-for="admin in selected.admins" :key="admin._id">
                                <contact :id="admin"/>
                            </p>
                        </div>
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Files/Dirs</span>
                    </b-col>
                    <b-col>
                        <p><small style="opacity: 0.7">The following files/dirs are expected to be part of this datatype</small></p>
                        <pre v-highlightjs="JSON.stringify(selected.files, null, 4)"><code class="json hljs"></code></pre>
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Datatype Tags</span>
                    </b-col>
                    <b-col>
                        <p v-if="selected.datatype_tags.length > 0"><small style="opacity: 0.7">The following datatype tags are used for this datatype.</small></p>
                        <p v-else><small style="opacity: 0.7">No officially registered datatype tags</small></p>
                        <b-row v-for="(entry, idx) in selected.datatype_tags" :key="idx" style="margin-bottom: 5px;">
                            <b-col cols="3">
                                <span style="background-color: #ddd; padding: 2px 5px; display: inline-block;">{{entry.datatype_tag}}</span>
                            </b-col>
                            <b-col cols="9">
                                {{entry.desc}}
                            </b-col>
                        </b-row>

                        <p v-if="adhoc_datatype_tags.length > 0"><small style="opacity: 0.7">The following adhoc datatype tags are used for some datasets.</small></p>
                        <b-row v-for="tag in adhoc_datatype_tags" :key="tag" style="margin-bottom: 5px;">
                            <b-col cols="3">
                                <span style="background-color: #ddd; padding: 2px 5px; display: inline-block;">{{tag}}</span>
                            </b-col>
                            <b-col cols="9">
                                <span style="opacity: 0.7">Ad-hoc</span>
                            </b-col>
                        </b-row>

                        <br>
                    </b-col>
                </b-row>

                <b-row v-if="sample_datasets.length > 0">
                    <b-col cols="2">
                        <span class="form-header">Sample Datasets</span>
                    </b-col>
                    <b-col>
                        <div v-for="dataset in sample_datasets" :key="dataset._id" class="sample-dataset" @click="open_sample_dataset(dataset._id)">
                            <b-row>
                                <b-col cols="3">
                                    <icon name="cubes"/>&nbsp;
                                    <datatypetag :datatype="selected" :tags="dataset.datatype_tags"/>
                                </b-col>
                                <b-col>
                                    {{dataset.meta.subject}} <small>{{dataset.desc}}</small>
                                    <!-- <span style="float: right"><b>From</b> {{dataset.project.name}}</span> -->
                                </b-col>
                                <b-col cols="3">
                                    <tags :tags="dataset.tags"/>
                                </b-col>
                            </b-row>
                        </div>
                        <!--
                        <filebrowser v-if="sample_task" :path="selected.sample" :task="sample_task" style="background-color: white; margin: 5px; margin-bottom: 5px"/>
                        <p v-if="selected.uis.length == 0" style="opacity: 0.8;">No visualizer</p>
                        <p v-else><small style="opacity: 0.7">The following visualizers can be used to visualize this datatype on Brainlife.</small></p>
                        <b-row>
                            <b-col :cols="4" class="ui" v-for="ui in selected.uis" :key="ui._id">
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
                        -->
                        <br>
                    </b-col>
                </b-row>

                <b-row v-if="selected.bids.maps.length > 0">
                    <b-col cols="2">
                        <span class="form-header">BIDS Export</span>
                    </b-col>
                    <b-col>
                        <p><small style="opacity: 0.7">The following file mapping is used to generate BIDS derivative exports.</small></p>
                        <b>{{selected.bids.derivatives}}</b>
                        <pre v-highlightjs="JSON.stringify(selected.bids.maps, null, 4)"><code class="json hljs"></code></pre>
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Apps</span>
                    </b-col>
                    <b-col>
                        <p v-if="input_apps.length == 0"><small>No App uses this datatype as input.</small></p>
                        <p v-else>
                            <small>The following Apps uses this datatype for input.</small>
                        </p>
                        <div class="apps-container" style="border-left: 4px solid rgb(0, 123, 255); padding-left: 15px;">
                            <app v-for="app in input_apps" :key="app._id" :app="app" class="app" height="270px"/>
                        </div>
                        <br>

                        <p v-if="output_apps.length == 0"><small>No App uses this datatype as output.</small></p>
                        <p v-else>
                            <small>The following Apps outputs this datatype.</small>
                        </p>
                        <div class="apps-container" style="border-left: 4px solid rgb(40, 167, 69); padding-left: 15px;">
                            <app v-for="app in output_apps" :key="app._id" :app="app" class="app" height="270px"/>
                        </div>
                        <br>

                    </b-col>
                </b-row>

                <b-row v-if="selected.validator">
                    <b-col cols="2">
                        <span class="form-header">Validator</span>
                    </b-col>
                    <b-col>
                        <p><small style="opacity: 0.7">The following validator service is used to validate/normalize when a dataset of this datatype is imported by Brainlife UI.</small></p>
                        <p><a :href="'https://github.com/'+selected.validator"><b>{{selected.validator}}</b></a></p>
                        <!--<p v-else style="opacity: 0.8">No validator</p>-->
                        <br>
                    </b-col>
                </b-row>

            </b-container>

            <div v-if="editing" class="form-action">
                <b-container>
                    <b-button @click="cancel">Cancel</b-button>
                    <b-button @click="submit" variant="primary">Submit</b-button>
                </b-container>
            </div>
        </div>
    </div><!--page-content-->
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import 'perfect-scrollbar/css/perfect-scrollbar.css'
import PerfectScrollbar from 'perfect-scrollbar'
import VueMarkdown from 'vue-markdown'

import sidemenu from '@/components/sidemenu'
import datatype from '@/components/datatype'
import datatypetag from '@/components/datatypetag'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import app from '@/components/app'
import contactlist from '@/components/contactlist'
import tags from '@/components/tags'
//import filebrowser from '@/components/filebrowser'

export default {
    components: { 
        sidemenu, pageheader, datatype, 
        datatypetag, app, VueMarkdown, 
        contact, contactlist, tags,
        //filebrowser 
    },

    data () {
        return {
            datatypes: null,
            selected: null, //selected datatype

            //for selected item
            apps: [], //apps that uses selected datatype
            adhoc_datatype_tags: [], //datatype tags associated with selected datatype

            //sample_task: null,
            sample_datasets: [],
            
            editing: false, 
            config: Vue.config,
        }
    },

    computed: {
        input_apps() {
            if(!this.apps) return [];
            return this.apps.filter(a=>{
                return a.inputs.find(it=>it.datatype._id == this.selected._id);
            });
        },
        output_apps() {
            if(!this.apps) return [];
            return this.apps.filter(a=>{
                return a.outputs.find(it=>it.datatype._id == this.selected._id);
            });
        },
        canedit() {
            if(!Vue.config.user) return false;
            return ~this.selected.admins.indexOf(Vue.config.user.sub);
        }
    },

    mounted: function() {
        console.log("datatype loaded");
        this.$http.get('datatype', {params: {
            sort: 'name',
        }})
        .then(res=>{
            this.datatypes = res.data.datatypes;
            this.selected = this.datatypes.find(d=>d._id == this.$route.params.id);
            console.log("datatype loaded");
        }).catch(console.error);
    },

    methods: {
        open_sample_dataset(dataset_id) {
            //this.$router.replace('/project/'+this.project._id+'/dataset/'+dataset_id);
            this.$root.$emit('dataset.view', {id: dataset_id,  back: './'});
        },
        /*
        openvis(ui) {
            if(!this.selected.sample) {
                alert("No sample dataset is registered for this datatype. Please contact the datatype administrator.");
                return;
            }
            console.dir(this.selected.sample); 
            console.dir(ui);
            //look for prestaged task for this dataset
        },
        */

        select(datatype) {
            this.selected = datatype;
            this.$nextTick(()=>{
                this.$refs.scrolled.scrollTo(0, 0);
            });
            this.$router.push(`/datatypes/${datatype._id}`);

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
            if(!this.selected.datatype_tags) return;
            return this.selected.datatype_tags.find(d=>d.datatype_tag == tag);
        },

        edit() {
            this.editing = true;
        },

        newdatatype() {
            this.selected = {
                name: "tbd",
                desc: "tbd desc",
                readme: "tdb readme",
                admins: [ Vue.config.user.sub ],
                files: [],
                datatype_tags: [],
                bids: {
                    derivatives: "",
                    maps: [],
                },
                uis: [],
            }
            this.editing = true;
        },

        cancel() {
            if(this.selected._id) {
                //revert by loading previous state
                this.$http.get('datatype', {params: {
                    sort: 'name',
                    find: JSON.stringify({_id: this.selected._id}),
                }}).then(res=>{
                    Object.assign(this.selected, res.data.datatypes[0]);
                });
            } else {
                this.selected = null;
            }
            this.editing = false; 
        },
        
        submit() {
            alert('todo');
        },

        trim(n) {
            return n.split("/").splice(1).join("/");
        },

        gethsl(n) {
            let hash = n.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
            let numhash = Math.abs(hash+120)%360;
            return "hsl("+(numhash%360)+", 50%, 60%)";
        },
    },

    destroyed() {
        //this.ps.destroy();
    },
  
    watch: {
        '$route': function() {
            this.selected = this.datatypes.find(d=>d._id == this.$route.params.id);
        },

        selected() {
            if(!this.selected) return; 
            if(!this.selected._id) return; //editing new

            //load apps that uses this datatype
            this.$http.get('app', {params: {
                find: JSON.stringify({
                    removed: false,
                    $or: [
                        {'inputs.datatype': this.selected._id},
                        {'outputs.datatype': this.selected._id},
                    ]
                }),
                select: 'name desc inputs outputs stats github',
                populate: 'inputs.datatype outputs.datatype', //<app> likes datatypes populated
                limit: 500, //TODO - this is not sustailable
            }}).then(res=>{
                this.apps = res.data.apps;
            })

            //load adhoc datatype_tags used for this datatype
            let registered_datatype_tags = this.selected.datatype_tags.map(entry=>entry.datatype_tag);
            this.$http.get('dataset/distinct', {params: {
                distinct: 'datatype_tags',
                find: JSON.stringify({
                    removed: false,
                    datatype: this.selected._id,
                    datatype_tags: {$nin: registered_datatype_tags},
                }),
                
            }}).then(res=>{
                this.adhoc_datatype_tags = res.data;
            });

            /*
            //load prestaged task for sample
            if(this.selected.sample) {
                this.$http.get(Vue.config.amaretti_api+'/task', {params: {
                    find: JSON.stringify({
                        "service": "brainlife/app-stage",
                        $or: [
                            //{"config.datasets.id": this.selected.sample},
                            {"config._outputs.id": this.selected.sample}, //works for both original and copy
                        ]
                    }),
                    limit: 1, 
                }}).then(res=>{
                    console.log("loaded sample");
                    if(res.data.tasks.length == 1) this.sample_task = res.data.tasks[0];
                });
            }
            */

            //load sample datasets
            if(this.selected.samples) {
                this.$http.get('/dataset', {params: {
                    find: JSON.stringify({
                        _id: {$in: this.selected.samples},
                    }),
                    //populate: 'project',
                }}).then(res=>{
                    console.dir(res);
                    this.sample_datasets = res.data.datasets;
                });
            }
        },
    }
}
</script>

<style scoped>
.page-content {
top: 0px;
background-color: #eee;
}
.page-content h2 {
color: #999;
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
/*
.card-img {
heightkj
}

.card-text {
height: 70px
}
*/
.sample-dataset {
background-color: white;
border-bottom: 1px solid #ddd;
padding: 5px 10px;
cursor: pointer;
} 
.sample-dataset:hover {
background-color: #ddd;
}
</style>

