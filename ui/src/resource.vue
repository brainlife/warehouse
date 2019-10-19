<template>
<div>
    <sidemenu active="/resources"></sidemenu>
    <div class="page-content">
        <div v-if="!resource" class="loading">Loading ...</div>
        <div v-else>
            <div class="header header-sticky">
                <b-container>
                    <div style="float: right;">
                        <span class="button" @click="edit" v-if="resource._canedit" title="Edit"><icon name="edit" scale="1.25"/></span>
                    </div>
                    <b-row>
                        <b-col cols="2">
                            <div @click="back()" class="button">
                                <icon name="angle-left" scale="2"/>
                            </div>
                        </b-col>
                        <b-col>
                            <h2>
                                <b-badge v-if="!resource.active">Inactive</b-badge>
                                {{resource.name}}
                            </h2>
                            <p style="opacity: 0.6">{{resource._detail.desc}}</p>
                        </b-col>
                    </b-row>
                </b-container>
            </div>
            <br>
            <b-container>
                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Status</span>
                    </b-col>
                    <b-col>
                        <div class="box">
                            <h5 :class="{'text-danger': resource.status != 'ok', 'text-success': resource.status == 'ok'}">{{resource.status}}</h5>
                            <small>{{resource.status_msg}}</small>
                        </div>
                        <br>
                    </b-col>
                </b-row>

                <b-row v-if="groups && groups.length > 0">
                    <b-col cols="2">
                        <span class="form-header">Groups</span>
                    </b-col>
                    <b-col>
                        <p>
                            <small>The member of the following group has access to this resource.</small>
                        </p>
                        <div v-for="group in groups" :key="group._id" class="box">
                            <p>
                                <icon name="users"/> {{group.name}}
                                <small>{{group.desc}}</small>
                            </p>
                            <contact v-for="c in group.admins" :key="c._id" :fullname="c.fullname" :email="c.email"/>
                            <contact v-for="c in group.members" :key="c._id" :fullname="c.fullname" :email="c.email"/>
                        </div>
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Login Node <small>/Workdir</small></span>
                    </b-col>
                    <b-col>
                        <p class="box">
                            <pre>{{resource.config.username}}@{{resource.config.hostname}}:{{resource.config.workdir}}</pre>
                        </p>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Owner</span>
                    </b-col>
                    <b-col>
                        <p>
                            <contact :id="resource.user_id"/>
                        </p>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Apps</span>
                    </b-col>
                    <b-col>
                        <p>
                            <small>The following services are enabled by the owner to run on this resource</small>
                        </p>
                        <div class="box">
                            <b-row style="opacity: 0.5; margin-bottom: 5px;">
                                <b-col>
                                    <b>org/repo</b>
                                </b-col>
                                <b-col>
                                    <b>score</b>
                                </b-col>
                            </b-row>
                            <b-row v-for="service in resource.config.services" :key="service.name" style="border-top: 1px solid #eee; padding: 2px 0px">
                                <b-col>
                                    {{service.name}}
                                </b-col>
                                <b-col>
                                    {{service.score}}
                                </b-col>
                            </b-row>
                        </div>
                        <br>
                        <p style="opacity: 0.6;">
                           Up to <b>{{resource.config.maxtask}}</b> tasks will be submitted on this resource
                        </p>
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">ENVs</span>
                    </b-col>
                    <b-col>
                        {{resource._detail.envs}}
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Dates</span>
                    </b-col>
                    <b-col>
                        <div>
                            Create Date: <icon name="calendar"/> {{new Date(resource.create_date).toLocaleDateString()}}
                        </div>
                        <div>
                            Update Date: <icon name="calendar"/> {{new Date(resource.update_date).toLocaleDateString()}}
                        </div>
                        <div>
                            Last OK: <icon name="calendar"/> {{new Date(resource.lastok_date).toLocaleDateString()}}
                        </div>
                        <br>
                    </b-col>
                </b-row>

                <hr>

                <!--
                <b-row v-if="datatype.readme">
                    <b-col cols="2">
                        <span class="form-header">README</span>
                    </b-col>
                    <b-col>
                        <div>
                            <p v-if="!datatype.readme" style="opacity: 0.7">No README</p>
                            <vue-markdown v-else :source="datatype.readme" class="readme"/>
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
                        <div v-for="file in datatype.files" :key="file.id" style="background-color: white; padding: 8px; margin-bottom: 1px;">
                            <b-row>
                                <b-col>
                                    <span v-if="file.filename"><icon name="regular/file"/> {{file.filename}}</span>
                                    <span v-if="file.dirname"><icon name="folder"/> {{file.dirname}}</span>
                                    <b-badge v-if="file.ext">validator ext: {{file.ext}}</b-badge>
                                </b-col>
                                <b-col>
                                    <small><b style="opacity: 0.7">{{file.id}}</b></small>
                                </b-col>
                                <b-col>
                                    <b-badge v-if="file.required">required</b-badge>
                                    <small>{{file.desc}}</small>
                                </b-col>
                            </b-row>
                        </div>
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
                                <b-col cols="6">
                                    <datatypetag :datatype="datatype" :tags="dataset.datatype_tags"/>
                                </b-col>
                                <b-col>
                                    {{dataset.meta.subject}} <small>{{dataset.desc}}</small>
                                    <tags :tags="dataset.tags"/>
                                </b-col>
                            </b-row>
                        </div>
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Datatype Tags</span>
                    </b-col>
                    <b-col>
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

                        <p v-if="adhoc_datatype_tags.length > 0" style="">
                            <small style="opacity: 0.7">The following adhoc datatype tags are used for some datasets.</small>
                        </p>
                        <span v-for="tag in adhoc_datatype_tags" :key="tag" style="background-color: #ddd; padding: 2px 5px; margin-right: 3px; display: inline-block; opacity: 0.5;">{{tag}}</span>
                        <br>
                        <br>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Admins</span>
                    </b-col>
                    <b-col>
                        <p><small style="opacity: 0.7">Users who are responsible for this datatype.</small></p>
                        <div>
                            <p v-if="!datatype.admins || datatype.admins.length == 0" style="opacity: 0.8">No admins</p>
                            <p v-for="admin in datatype.admins" :key="admin._id">
                                <contact :id="admin"/>
                            </p>
                        </div>
                        <br>
                    </b-col>
                </b-row>

                <b-row v-if="datatype.bids && datatype.bids.maps.length > 0">
                    <b-col cols="2">
                        <span class="form-header">BIDS Export</span>
                    </b-col>
                    <b-col>
                        <p><small style="opacity: 0.7">The following file mapping is used to generate BIDS derivative exports.</small></p>
                        <div style="background-color: #f9f9f9; color: #bbb; padding: 5px"><b>{{datatype.bids.derivatives}}</b></div>
                        <pre v-highlightjs="JSON.stringify(datatype.bids.maps, null, 4)"><code class="json hljs"></code></pre>
                        <br>
                    </b-col>
                </b-row>

                <b-row v-if="datatype.validator">
                    <b-col cols="2">
                        <span class="form-header">Validator</span>
                    </b-col>
                    <b-col>
                        <p><small style="opacity: 0.7">The following validator service is used to validate/normalize when a dataset of this datatype is imported by Brainlife UI.</small></p>
                        <p><a :href="'https://github.com/'+datatype.validator"><b>{{datatype.validator}}</b></a></p>
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
                -->
            </b-container>
        </div>
    </div>
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import app from '@/components/app'
import tags from '@/components/tags'

export default {
    components: { 
        sidemenu, pageheader, app, contact, tags,
    },

    data () {
        return {
            resource: null, 
            groups: null,

            config: Vue.config,
        }
    },

    computed: {
        /*
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
        */
    },

    mounted() {
        this.load();
    },

    methods: {
        load() {
            console.log("loading resource:"+this.$route.params.id);
            this.$http.get(Vue.config.amaretti_api+'/resource', {params: {
                find: JSON.stringify({
                    _id: this.$route.params.id,
                }),
            }}).then(res=>{
                this.resource = res.data.resources[0];
                if(!this.resource) alert("no such resource");

                if(this.resource.gids) {
                    this.$http.get(Vue.config.auth_api+'/groups', {params: {
                        find: JSON.stringify({
                            id: {$in: this.resource.gids},
                        }),
                    }}).then(res=>{
                        this.groups = res.data;
                    });
                }
            }).catch(console.error);
        },

        back() {
            this.$router.push('/resources');
        },

        edit() {
            //this.editing = true;
            this.$router.push('/resource/'+this.resource._id+'/edit');
        },
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
.loading {
padding: 50px;
font-size: 20pt;
opacity: 0.5;
}
.box {
background-color: white;
padding: 10px;
}
</style>

