<template>
<div>
    <div class="page-content">
        <div v-if="!datatype" class="loading">Loading ...</div>
        <div v-else>
            <div class="header">
                <b-container style="position: relative;">
                    <div style="float: right; z-index: 1; position: relative;">
                        <b-btn @click="edit" v-if="canedit" variant="secondary" size="sm"><icon name="edit"/> Edit</b-btn>
                    </div>
                    <h2>
                        <!--<datatypetag :datatype="datatype" :trimname="!!(~datatype.name.indexOf('neuro/'))"/>-->
                        <datatypetag :datatype="datatype" :trimname="false"/>
                    </h2>

                    <b-tabs class="brainlife-tab" v-model="tab">
                        <b-tab>
                            <template v-slot:title>Detail</template>
                        </b-tab>
                        <b-tab>
                            <template v-slot:title>README</template>
                        </b-tab>
                        <b-tab>
                            <template v-slot:title>Samples</template>
                        </b-tab>
                        <b-tab>
                            <template v-slot:title>
                                <small>
                                    {{input_apps.length}} 
                                    <icon name="caret-right" scale="0.8"/>
                                </small>
                                Apps
                                <small>
                                    <icon name="caret-right" scale="0.8"/>
                                    {{output_apps.length}}
                                </small>
                            </template>
                        </b-tab>
                    </b-tabs>
                </b-container>
            </div><!--header-->

            <div v-if="tab == 0">
                <div style="background-color: white; padding-top: 15px; border-bottom: 1px solid #ddd;">
                    <b-container>
                        <p style="line-height: 250%;">
                            <b-badge pill v-if="datatype.create_date" class="bigpill" title="Registration Date">
                                <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;<small>Registerd</small>&nbsp;&nbsp;{{new Date(datatype.create_date).toLocaleDateString()}}
                            </b-badge>
                        </p>
                        <p>{{datatype.desc}}</p>
                    </b-container>
                </div><!--sub header-->
                <b-container>
                    <br>
                    <b-alert show variant="secondary" v-if="datatype.groupAnalysis">The data can be used for group analysis</b-alert>
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

                    <br>
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

                    <div class="box" v-if="datatype.validator">
                        <span class="form-header">Validator</span>
                        <p><small style="opacity: 0.7">The following validator service is used to validate/normalize when a data object of this datatype is imported by Brainlife UI.</small></p>
                        <p>
                            <a :href="'https://github.com/'+datatype.validator"><b>{{datatype.validator}}</b> <b-badge variant="secondary">{{datatype.validator_branch}}</b-badge></a>
                        </p>
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
                                <p>{{entry.desc}}</p>
                            </b-col>
                        </b-row>

                        <p v-if="datatype._datatype_tags.length > 0">
                            <small style="opacity: 0.7">The following adhoc(not officially recognized) datatype tags are used for some data objects.</small><br>
                            <span v-for="tag in adhoc_datatype_tags" :key="tag" style="background-color: #ddd; padding: 2px 5px; margin-right: 4px; margin-bottom: 4px; display: inline-block; opacity: 0.5;">{{tag}}</span>
                        </p>
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
                    <!--
                    <div class="box" v-if="datatype.bids && datatype.bids.maps.length > 0">
                        <span class="form-header">BIDS Export</span>
                        <p><small style="opacity: 0.7">The following file mapping is used to generate BIDS derivative exports.</small></p>
                        <div style="background-color: #f9f9f9; color: #bbb; padding: 5px"><b>{{datatype.bids.derivatives}}</b></div>
                        <pre>{{JSON.stringify(datatype.bids.maps, null, 4)}}</pre>
                    </div>
                    -->
                </b-container>
            </div>

            <div v-if="tab == 1">
                <b-container>
                    <br>
                    <div v-if="datatype.readme">
                        <vue-markdown :source="datatype.readme" class="readme"/>
                    </div>
                    <div v-else style="opacity: 0.5;">No README</div>

                    <!--upload hint-->
                    <hr>
                    <span class="form-header">Upload Hints</span>
                    <p><small style="opacity: 0.7">You can upload your data in this datatype using <a href="https://brainlife.io/docs/cli/install/" target="cli">brainlife CLI</a>.</small></p>
                    <pre>$ bl data upload --datatype {{datatype.name}} --project (project ID) --subject (subject name) \
   <span v-for="file in datatype.files.filter(f=>f.required)" :key="file.id">--{{file.id}} (file path for {{file.id}}) </span></pre>

                    <br>
                    <p><small style="opacity: 0.7">(project ID) can be found in the URL when you open your project on brainlife.</small></p>
                    <p><small style="opacity: 0.7">(subject name) can be any alphanumeric (no space) name for your subject.</small></p>
                    <p><small style="opacity: 0.7">You can also set a session name by setting <b>--session (session name)</b></small></p>
                    <br>

                    <div>
                        <p><small style="opacity: 0.7">You can/should upload metadata (JSON sidecar) along with your data if available. If you have a JSON file that looks like ...</small></p>
                        <pre>{
    "key1": "value1",
    "key2": "value2"
}</pre>
                        <p><small style="opacity: 0.7">Then you can upload this sidecar to be associated with your data as metadata by </small></p>
                        <pre>$ bl data upload --meta (path to the sidecar JSON) ...</pre>
                        <br>
                    </div>

                    <div v-if="datatype.datatype_tags.length > 0">
                        <p><small style="opacity: 0.7">You can add datatype tags by adding --datatype_tag options..</small></p>
                        <pre>$ bl data upload <span v-for="tag in datatype.datatype_tags">--datatype_tag {{tag.datatype_tag}} </span> ...</pre>
                        <br>
                    </div>

                    <div>
                        <p><small style="opacity: 0.7">You can add data object tags by adding --tag options.</small></p>
                        <pre>$ bl data upload --tag (tag1) --tag (tag2) ...</pre>
                        <br>
                    </div>

                    <div v-if="datatype.validator">
                        <p><small style="opacity: 0.7">You can also upload this datatype through Project > Archive > <b>Upload Data</b> page.</small></p>
                        <br>
                    </div>
                    <div v-else>
                        <p><small style="opacity: 0.7">
                            We currently don't have a validator registered for this datatype. 
                            Please make sure that the file content you are uploading has the correct data structure.
                        </small></p>
                        <br>
                    </div>

                    <p>
                        <small style="opacity: 0.7">
                            Please run <b>bl data upload -h</b> for full list of options. 
                            You can also read <a href="https://brainlife.io/docs/cli/upload/" target="cli">CLI Upload document</a> for more detail.
                        </small>
                    </p>

                </b-container>
            </div>

            <div v-if="tab == 2">
                <b-container>
                    <br>
                    <div v-if="sample_datasets.length > 0" class="box">
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
                    <small v-else>No sample data object is registered. Please contact the administrator for this datatype.</small>
                </b-container>
            </div>

            <div v-if="tab == 3">
                <b-container>
                    <br>

                    <p v-if="input_apps.length == 0"><small>No App uses this datatype as input.</small></p>
                    <p v-else>
                    <small>The following {{input_apps.length}} Apps use data in this datatype for input.</small>
                    </p>
                    <div class="apps-container" style="border-left: 4px solid rgb(0, 123, 255); padding-left: 15px;">
                        <app v-for="app in input_apps" :key="app._id" :app="app" class="app" height="270px"/>
                    </div>
                    <br>

                    <p v-if="output_apps.length == 0"><small>No App uses this datatype as output.</small></p>
                    <p v-else>
                    <small>The following {{output_apps.length}} Apps output data in this datatype.</small>
                    </p>
                    <div class="apps-container" style="border-left: 4px solid rgb(40, 167, 69); padding-left: 15px;">
                        <app v-for="app in output_apps" :key="app._id" :app="app" class="app" height="270px"/>
                    </div>
                    <br>

                </b-container>
            </div>
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

            tab: 0,
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
                    select: 'name desc inputs outputs stats github projects',
                    populate: 'inputs.datatype outputs.datatype', //<app> likes datatypes populated
                    limit: 500, //TODO - this is not sustailable
                }}).then(res=>{
                    this.apps = res.data.apps;
                })

                let registered_datatype_tags = this.datatype.datatype_tags.map(entry=>entry.datatype_tag);
                this.adhoc_datatype_tags = this.datatype._datatype_tags.filter(tag=>!registered_datatype_tags.includes(tag));

                //load sample datasets
                if(this.datatype.samples) {
                    this.$http.get('/dataset', {params: {
                        find: JSON.stringify({
                            _id: {$in: this.datatype.samples},
                        }),
                        //populate: 'project',
                    }}).then(res=>{
                        //console.dir(res);
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
background-color: white;
padding: 15px 0 0 0;
border-bottom: 1px solid #ddd;
position: sticky;
top: 0px;
z-index: 5;/*has to be above vue-ace line number*/
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

