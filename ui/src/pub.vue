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
                                {{pub.name}} 
                            </h4>
                            <p style="opacity: 0.8">{{pub.desc}}</p>
                        </div>
                        <p style="line-height: 180%;">
                            <b-badge v-for="topic in pub.tags" :key="topic" class="topic">{{topic}}</b-badge>
                        </p>
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
                                <b class="text-muted">DOI</b>
                            </b-col>
                            <b-col>
                                <p>
                                    <a v-if="pub.doi" :href="'https://doi.org/'+pub.doi">{{pub.doi}}</a>
                                    <span v-else style="opacity: 0.5">Not Issued</span>
                                </p>
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
                        <b-row v-if="pub.contributors.length > 0">
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
                                <b-card>
                                    <h6>{{pub.project.name}}</h6>
                                    <p>
                                        {{pub.project.desc}}
                                        <router-link :to="'/project/'+pub.project._id">More..</router-link>
                                    </p>
                                </b-card>
                                <br>
                            </b-col>
                        </b-row>                      
                        <b-row v-if="pub.fundings.length > 0">
                            <b-col cols="3">
                                <b class="text-muted">Funded by</b>
                            </b-col>
                            <b-col>
                                <ul style="list-style: none; padding: 0px;">
                                    <li v-for="funding in pub.fundings" key="funding._id" class="funder">
                                        <div v-if="funding.funder == 'NSF'" class="funder-label bg-success">NSF</div>
                                        <div v-else-if="funding.funder == 'NIH'" class="funder-label bg-info">NIH</div>
                                        <div v-else class="funder-label bg-warning">{{funding.funder}}</div>
                                        {{funding.id}}
                                    </li>
                                </ul>
                            </b-col>
                        </b-row>
                        <b-row>
                            <b-col cols="3">
                                <b class="text-muted">Comments</b>
                            </b-col>
                            <b-col>
                                <vue-disqus shortname="brain-life" :identifier="pub._id"/>
                            </b-col>
                        </b-row>
                    </div>
                    <div v-if="tab_index == 1">
                        <!-- datasets -->
                        <!--
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
                        -->
                        <h6>
                            <b>{{ds.subjects}}</b> <span class="text-muted">Subjects</span> |
                            <b>{{ds.count}}</b> <span class="text-muted">Datasets</span>
                            (<b>{{ds.size | filesize}}</b>)
                        </h6>
                        <br>

                        <b-list-group>
                            <b-list-group-item v-for="(group, subject) in dataset_groups" :key="subject">
                                <b-row>
                                    <b-col cols="3">
                                        <b>{{subject}}</b>
                                        <small class="text-muted">
                                            <br v-if="group.count > 1">
                                            <span><b>{{group.count}}</b> datasets</span>
                                            <span><b>{{group.size | filesize}}</b></span>
                                        </small>
                                    </b-col>
                                    <b-col>
                                        <div v-for="(datatype, datatype_id) in group.datatypes" :key="datatype_id">
                                            <b-row v-for="(block, datatype_tags_s) in datatype.datatype_tags" :key="datatype_tags_s" style="margin-bottom: 3px;">
                                                <div @click="toggle(block, subject, datatype_id, JSON.parse(datatype_tags_s))" class="toggler">
                                                    <div style="width: 20px; display: inline-block;" class="text-muted">
                                                        <icon name="caret-right" v-if="!block.show"/> 
                                                        <icon name="caret-down" v-if="block.show"/> 
                                                    </div>
                                                    <datatypetag :datatype="datatypes[datatype_id]" :tags="JSON.parse(datatype_tags_s)"/>
                                                    &nbsp;
                                                    <span class="text-muted">{{datatypes[datatype_id].desc}}</span>
                                                    <small class="text-muted" style="float: right;">{{block.count}} datasets {{block.size|filesize}}</small>
                                                </div>
                                                <transition name="fadeHeight">
                                                    <b-list-group class="datasets" v-if="block.show && block.datasets">
                                                        <b-list-group-item v-for="(dataset, idx) in block.datasets" :key="idx" class="dataset" @click="download(dataset._id)">
                                                            <icon name="file-zip-o"/>
                                                            {{dataset.desc}}
                                                            <span v-if="!dataset.desc" class="text-muted">{{dataset._id}}.tar.gz</span>
                                                            <tags :tags="dataset.tags"/>
                                                            <div style="float: right; width: 90px; text-align: right">{{new Date(dataset.create_date).toLocaleDateString()}}</div>
                                                            <div style="float: right; width: 90px;"><span v-if="dataset.size" class="text-muted">{{dataset.size|filesize}}</span>&nbsp;</div>
                                                            <div style="float: right; width: 90px;"><span v-if="dataset.download_count" class="text-muted"><icon name="download"/> {{dataset.download_count}} times</span>&nbsp;</div>
                                                            <!--<td>{{dataset.storage}}</td>-->
                                                        </b-list-group-item>
                                                    </b-list-group>
                                                </transition>
                                            </b-row>
                                        </div>
                                    </b-col>
                                </b-row>
                            </b-list-group-item>
                        </b-list-group>
                            
                    </div>
                    <div v-if="tab_index == 2">
                        <!--apps-->
                        <p class="text-muted">Following applications are used to generate published datasets.</p>
                        <b-row>
                            <b-col cols="6" v-for="app in apps" key="app._id" style="margin-bottom: 10px;">
                                <app :app="app" descheight="130px" :compact="true"></app>
                            </b-col>
                        </b-row>
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
import app from '@/components/app'

import VueDisqus from 'vue-disqus/VueDisqus.vue'

export default {

    components: { 
        pageheader, sidemenu, projectavatar, 
        contact, VueMarkdown, license, 
        projectcard, datatypetag, tags, 
        app, VueDisqus,
    },

    data () {
        return {
            pub: null, //publication detail
            dataset_groups: null, //datasets inventory grouped 
            apps: null, //list of apps

            datatypes: {}, 

            tab_index: 0,
            query: "",
            config: Vue.config,
        }
    },

    computed: {
        ds: function() {
            let stats = {subjects: 0, count: 0, size: 0};
            for(var subject in this.dataset_groups) {
                stats.subjects++; 
                stats.size += this.dataset_groups[subject].size;
                stats.count += this.dataset_groups[subject].count;
            }
            return stats;
        }
    },

    mounted: function() {
        //load publication detail
        this.$http.get('pub', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
            populate: 'project',
            deref_contacts: true,
        }})
        .then(res=>{
            this.pub = res.body.pubs[0];

            //load all datatypes
            return this.$http.get('datatype');
        })
        .then(res=>{
            res.body.datatypes.forEach((d)=>{
                this.datatypes[d._id] = d;
            });

            //load inventory..
            return this.$http.get('pub/datasets-inventory/'+this.$route.params.id);
        })
        .then(res=>{
            let groups = {};
            res.body.forEach(rec=>{
                let subject = rec._id.subject;
                let datatype = rec._id.datatype;
                let datatype_tags = rec._id.datatype_tags;
                let datatype_tags_s = JSON.stringify(rec._id.datatype_tags);
                if(!groups[subject]) {
                    groups[subject] = { size: 0, count: 0, datatypes: {} };
                }
                if(!groups[subject].datatypes[datatype]) {
                    groups[subject].datatypes[datatype] = { size: 0, count:0, datatype_tags: {}};
                }
                if(!groups[subject].datatypes[datatype].datatype_tags[datatype_tags_s]) {
                    groups[subject].datatypes[datatype].datatype_tags[datatype_tags_s] = {size: 0, count: 0, show: false, datasets: null};
                }
                groups[subject].datatypes[datatype].datatype_tags[datatype_tags_s].size += rec.size;
                groups[subject].datatypes[datatype].datatype_tags[datatype_tags_s].count += rec.count;
                groups[subject].datatypes[datatype].size += rec.size;
                groups[subject].datatypes[datatype].count += rec.count;
                groups[subject].size += rec.size;
                groups[subject].count += rec.count;
            });
            this.dataset_groups = groups;

            //load apps
            return this.$http.get('pub/apps/'+this.$route.params.id, {params: {
                //populate: 'inputs.datatype outputs.datatype contributors',
            }});
        })
        .then(res=>{
            this.apps = res.body;
        }).catch(console.error);
    },
    
    methods: {
        download: function(id) {
            document.location = Vue.config.api+'/dataset/download/'+id;
        },

        /*
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
        },
        */

        toggle: function(block, subject, datatype, datatype_tags) {
            block.show = !block.show;
            if(!block.datasets) {
                //load datasets
                this.$http.get('pub/datasets/'+this.$route.params.id, {params: {
                    find: JSON.stringify({
                        'meta.subject': subject,
                        datatype: datatype,
                        datatype_tags: datatype_tags,
                    }),
                    //populate: 'project',
                    //sort: 'meta.subject datatype tags',
                    //skip: this.datasets_perpage*(this.datasets_page-1),
                    //limit: this.datasets_perpage,
                }}).then(res=>{
                    block.datasets = res.body.datasets;
                }).catch(console.error);
            }
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
.datasets {
margin: 5px;
width: 100%;
box-shadow: 2px 2px 2px #ddd;
}
.dataset:hover {
cursor: pointer;
background-color: #f7f7f7;
}
.toggler {
padding: 1px 5px;
width: 100%;
}
.toggler:hover {
cursor: pointer;
background-color: #eee;
}
.fadeHeight-enter-active,
.fadeHeight-leave-active {
  transition: all 0.2s;
  max-height: 230px;
}
.fadeHeight-enter,
.fadeHeight-leave-to
{
  opacity: 0;
  max-height: 0px;
}
</style>


