<template>
<div v-if="pub">
    <pageheader/>
    <sidemenu active="/pubs"></sidemenu>
    <div class="page-content">
        <div class="header">
            <b-container>
                <!--
                        inspiration
                        https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/24301
                        https://searchworks.stanford.edu/view/rt034xr8593
                -->
                <b-row>
                    <b-col>
                        <div style="float: left; margin-right: 40px; margin-bottom: 15px; height: 100%;">
                            <projectavatar :project="pub.project"/>
                        </div>
                        <div>
                            <h4 style="color: #666; margin-bottom: 10px;">
                                <b-badge style="float: right; opacity: 0.7;">DOI {{pub.doi}}</b-badge>
                                {{pub.name}} 
                            </h4>
                            <p class="text-muted">{{pub.desc}}</p>
                        </div>
                        <div style="line-height: 180%;">
                            <b-badge v-for="topic in pub.tags" :key="topic" class="topic">{{topic}}</b-badge>
                        </div>
                    </b-col>
                    <!--
                    <b-col cols="3">
                        <b-button-group style="float: right;">
                            <b-button @click="remove()" v-if="pub._canedit" icon="delete">Remove</b-button>
                            <b-button @click="go('/pub/'+app._id+'/edit')" v-if="app._canedit" icon="edit">Edit</b-button>
                            <b-button variant="primary" @click="go('/app/'+app._id+'/submit')">Submit</b-button>
                        </b-button-group>
                    </b-col>
                    -->
                </b-row>
                <br>
                <b-tabs class="brainlife-tab" v-model="tab_index">
                    <b-tab title="Details"/>
                    <b-tab title="Datasets"/>
                    <b-tab title="Apps"/>
                </b-tabs>
            </b-container>
        </div><!--header-->

        <!--main content-->
        <b-container>
            <b-row>
                <b-col>
                    <el-alert v-if="pub.removed" title="This publication has been removed" type="warning" show-icon :closable="false"></el-alert>
                    <!-- detail -->
                    <div v-if="tab_index == 0">
                        <b-row>
                            <b-col cols="3">
                                <b class="text-muted">Publish Date</b>
                            </b-col>
                            <b-col>
                                <p><time>{{new Date(pub.create_date).toLocaleDateString()}}</time></p>
                            </b-col>
                        </b-row>                         
                        <b-row>
                            <b-col cols="3">
                                <b class="text-muted">Abstract</b>
                            </b-col>
                            <b-col>
                                <vue-markdown :source="pub.readme"></vue-markdown>
                            </b-col>
                        </b-row>  
                        <b-row v-if="pub.citation">
                            <b-col cols="3">
                                <b class="text-muted">Citation</b>
                            </b-col>
                            <b-col>
                                <i>{{pub.citation}}</i>
                            </b-col>
                        </b-row>  
                        <b-row>
                            <b-col cols="3">
                                <b class="text-muted">Authors</b>
                            </b-col>
                            <b-col>
                                <ul style="list-style: none; padding: 0px;">
                                    <li v-for="contact in pub.authors" key="contact._id">
                                        <contact :fullname="contact.fullname" :email="contact.email"></contact>
                                    </li>
                                </ul>
                            </b-col>
                        </b-row>
                        <b-row>
                            <b-col cols="3">
                                <b class="text-muted">Contributors</b>
                            </b-col>
                            <b-col>
                                <ul style="list-style: none; padding: 0px;">
                                    <li v-for="contact in pub.contributors" key="contact._id">
                                        <contact :fullname="contact.fullname" :email="contact.email"></contact>
                                    </li>
                                </ul>
                            </b-col>
                        </b-row>
                        <b-row>
                            <b-col cols="3">
                                <b class="text-muted">License</b>
                            </b-col>
                            <b-col>
                                <b-card><license :id="pub.license"/></b-card>
                                <br>
                            </b-col>
                        </b-row> 
                        <b-row>
                            <b-col cols="3">
                                <b class="text-muted">Project</b>
                            </b-col>
                            <b-col>
                                <!--<projectcard :project="pub.project"/>-->
                                <b-card :header="pub.project.name">
                                    {{pub.project.desc}}
                                </b-card>
                                <br>
                            </b-col>
                        </b-row>                      
                        <b-row>
                            <b-col cols="3">
                                <b class="text-muted">Funded by</b>
                            </b-col>
                            <b-col>
                                <ul style="list-style: none; padding: 0px;">
                                    <li v-for="funding in pub.fundings" key="funding._id" class="funder">
                                        <div v-if="funding.funder == 'nsf'" class="funder-label bg-success">NSF</div>
                                        <div v-if="funding.funder == 'nih'" class="funder-label bg-info">NIH</div>
                                        {{funding.id}}
                                    </li>
                                </ul>
                            </b-col>
                        </b-row>
                    </div>
                    <div v-if="tab_index == 1">
                        <!-- datasets -->
                        <div style="float: right">
                            <b>{{datasets_count}}</b> <span class="text-muted">Datasets</span>
                        </div>
                        <b-pagination :total-rows="datasets_count" v-model="datasets_page" :per-page="datasets_perpage"/>
                        <table class="table table-hover table-sm">
                            <thead class="thead-light">
                                <tr> 
                                    <th>Subject</th>
                                    <th>Datatype</th>
                                    <th>Tags / Description</th>
                                    <th>DL Count</th>
                                    <th>Size</th>
                                    <th width="180px;">ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="dataset in datasets" :key="dataset._id" @click="download(dataset._id)" class="dataset">
                                    <td><span v-if="dataset.meta">{{dataset.meta.subject}}</span></td>
                                    <td><datatypetag :datatype="datatypes[dataset.datatype]" :tags="dataset.datatype_tags"></datatypetag></td>
                                    <td>
                                        <tags :tags="dataset.tags"></tags>
                                        {{dataset.desc}}
                                    </td>
                                    <td><span class="text-muted">{{dataset.download_count}}</span></td>
                                    <td><span v-if="dataset.size" class="text-muted">{{dataset.size|filesize}}</span></td>
                                    <td><small><pre style="margin-bottom: 0px;" class="text-muted">{{dataset._id}}</pre></small></td>
                                </tr>
                            </tbody>
                        </table>
                        <b-pagination :total-rows="datasets_count" v-model="datasets_page" :per-page="datasets_perpage"/>
                    </div>
                </b-col>
            </b-row>
        </b-container>
        <br>
        <br>
    </div><!--page-content-->
</div>
</template>

<script>
import Vue from 'vue'
import pageheader from '@/components/pageheader'
import sidemenu from '@/components/sidemenu'
import projectavatar from '@/components/projectavatar'
import projectcard from '@/components/projectcard'
import contact from '@/components/contact'
import VueMarkdown from 'vue-markdown'
import license from '@/components/license'
import datatypetag from '@/components/datatypetag'
import tags from '@/components/tags'

export default {
    components: { pageheader, sidemenu, projectavatar, contact, VueMarkdown, license, projectcard, datatypetag, tags },
    data () {
        return {

            pub: null, //publication detail

            /*
            datasets_page: 1,
            datasets_perpage: 100,
            datasets_count: null,
            datasets: null, //datasets for current page
            datatypes: null,
            */

            tab_index: 0,
            query: "",
            config: Vue.config,
        }
    },

    watch: {
        datasets_page: function() {
            this.load_page();
        }
    },

    mounted: function() {
        this.$http.get('pub', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
            populate: 'project',
        }})
        .then(res=>{
            this.pub = res.body.pubs[0];

            //load all datatypes
            return this.$http.get('datatype')
        })
        .then(res=>{
            this.datatypes = {};
            res.body.datatypes.forEach((d)=>{
                this.datatypes[d._id] = d;
            });

            this.load_page();

/*

            //load some extra counts
            return this.$http.get('pub/stats/'+this.$route.params.id, {params: {
                //nothing..
            }})
        })
        .then(res=>{
            //aggregate stats
            this.subjects = 0;
             
            this.stats = res.body;
*/

        }).catch(console.error);
    },
    
    methods: {
        download: function(id) {
            document.location = Vue.config.api+'/dataset/download/'+id;
        },

        load_page: function() {
            this.$http.get('pub/datasets/'+this.$route.params.id, {params: {
                //find: JSON.stringify({_id: this.$route.params.id}),
                //populate: 'project',
                sort: 'meta.subject datatype tags',
                skip: this.datasets_perpage*(this.datasets_page-1),
                //limit: this.datasets_perpage,
                limit: 5000,
            }}).then(res=>{
                this.datasets = res.body.datasets;
                this.datasets_count = res.body.count;
            }).catch(console.error);
        }
    }
}
</script>

<style scoped>
.header {
background-color: white;
margin-bottom: 30px;
padding: 30px 0px 0px 0px;
border-bottom: 1px solid #ccc;
}
.topic {
padding: 6px 8px; 
background-color: #eee;
text-transform: uppercase;
color: #999;
border-radius: 0px;
margin-right: 4px;
}
.funder {
background-color: white;
margin: 5px;
display: inline-block;
padding-right: 10px;
font-weight: bold;
color: #999;
}
.funder .funder-label {
color: white;
display: inline-block;
padding: 3px 5px;
}
.dataset {
cursor: pointer;
}
</style>

