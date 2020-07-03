<template>
<div v-if="pub">
    <div class="page-content">
        <div class="header">
            <b-container style="position: relative;">
                <div @click="back()" class="button button-page">
                    <icon name="angle-left" scale="1.5"/>
                </div>
                <!--
                        inspiration
                        https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/24301
                        https://searchworks.stanford.edu/view/rt034xr8593
                        https://chemrxiv.org/articles/Repurposing_Therapeutics_for_the_Wuhan_Coronavirus_nCov-2019_Supercomputer-Based_Docking_to_the_Viral_S_Protein_and_Human_ACE2_Interface/11871402/3
                -->
                <b-row>
                    <b-col cols="10" style="background-color: white;"><!--hide avatar when screen is narrow-->
                        <h4 style="color: #666; margin-bottom: 5px;">
                            {{pub.name}} 
                        </h4>
                        <p style="opacity: 0.7; min-height: 60px; max-height: 105px; overflow-y: auto; margin-bottom: 0px">{{pub.desc}}</p>
                        
                        <b-tabs class="brainlife-tab" v-model="tab_index">
                            <b-tab title="Detail"/>
                            <b-tab v-for="release in pub.releases" :key="release._id">
                                <template slot="title"><!--<icon name="file" scale="0.9"/>--> Release {{release.name}}</template>
                            </b-tab>
                        </b-tabs>

                    </b-col>
                    <b-col cols="2">
                        <projectavatar :project="pub.project" :height="125" :width="125"/>
                    </b-col>
                </b-row>
            </b-container>
        </div><!--header-->

        <!--main content-->
        <b-container>
            <b-alert :show="pub.removed" variant="secondary">This publication has been removed</b-alert>
            <!-- detail -->
            <div v-if="tab_index == 0">
                <b-row>
                    <b-col cols="10">                     
                        <div class="box">

                            <b-row>
                                <b-col>
                                    <span class="form-header">Authors</span>
                                    <br>
                                    <p v-for="contact in pub.authors" :key="contact._id">
                                        <contact :fullname="contact.fullname" :email="contact.email"></contact>
                                    </p>
                                </b-col>
                                <b-col v-if="pub.contributors.length > 0">
                                    <span class="form-header">Contributors</span>
                                    <br>
                                    <p v-for="contact in pub.contributors" :key="contact._id">
                                        <contact :fullname="contact.fullname" :email="contact.email"></contact>
                                    </p>
                                </b-col>
                            </b-row>

                        </div>
                        <div v-if="pub.readme" class="box">
                            <vue-markdown :source="pub.readme" class="readme"></vue-markdown>
                        </div>  

                        <b-row>
                            <b-col cols="2">
                                <span class="form-header">Citation</span>
                            </b-col>
                            <b-col cols="10">
                                <p>
                                    <small class="text-muted">Citation for this publiction. Please see citation section under each release for App specific citations. </small>
                                </p>
                                <citation :doi="pub.doi||config.debug_doi"/>
                                <br>
                            </b-col>
                       </b-row>  

                       <b-row v-if="pub.fundings.length > 0">
                            <b-col cols="2">
                                <span class="form-header">Funded By</span>
                            </b-col>
                            <b-col>
                                <ul style="list-style: none; padding: 0px;">
                                    <li v-for="funding in pub.fundings" :key="funding._id" class="funder">
                                        <div v-if="funding.funder == 'NSF'" class="funder-label bg-success">NSF</div>
                                        <div v-else-if="funding.funder == 'NIH'" class="funder-label bg-info">NIH</div>
                                        <div v-else class="funder-label bg-warning">{{funding.funder}}</div>
                                        {{funding.id}}
                                    </li>
                                </ul>
                            </b-col>
                        </b-row>
                        <b-row>
                            <b-col cols="2">
                                <span class="form-header">License</span>
                            </b-col>
                            <b-col>
                                <p><small class="text-muted">Datasets are published with the following license.</small></p>
                                <license :id="pub.license"/>
                                <br>
                            </b-col>
                        </b-row> 

                        <b-row>
                            <b-col cols="2">
                                <span class="form-header">Project</span>
                            </b-col>
                            <b-col>
                                <p><small class="text-muted">This publication is hosted in the following Brainlife project</small></p>
                                <a href="javascript:void(0)" @click="openproject(pub.project._id)"><h5><icon name="shield-alt"/> {{pub.project.name}}</h5></a>
                                <p class="text">{{pub.project.desc}}</p>
                                <!--
                                <p><small class="text-muted">This publication was created from the following project.</small></p>
                                <projectcard :project="pub.project"/>
                                -->
                                <br>
                            </b-col>
                        </b-row>
                    
                        <div v-if="resource_citations.length > 0" class="box">
                            <span class="form-header">Resource Citations</span>
                            <p><small>Datasets published on this dataset are computed on the following resources.</small></p>
                            <p v-for="resource_citation in resource_citations">
                                <icon name="caret-right"/> <b>{{resource_citation.resource.name}}</b>
                                <small>{{resource_citation.resource.config.desc}}</small>
                                <br>
                                <i>{{resource_citation.citation}}</i>
                            </p>
                        </div>

                        <hr>
                        <vue-disqus shortname="brain-life" :identifier="pub._id"/>

                    </b-col>
                    <b-col cols="2">
                        <p>
                            <h3 class="brainlife-logo">brainlife.io</h3>
                            <!--
                            <img src="@/assets/images/logo.png" width="80px"/>
                            -->
                        </p>

                        <doibadge :doi="pub.doi" style="margin-bottom: 20px;"/>
                        <p>
                            <b-badge pill class="bigpill">
                                <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;<small>Published</small>&nbsp;&nbsp;<time>{{new Date(pub.create_date).toLocaleDateString()}}</time>
                            </b-badge>
                        </p>
                        <p>
                            <div class='altmetric-embed' data-badge-type='donut' data-badge-details="right" data-hide-no-mentions="false" :data-doi="pub.doi||config.debug_doi"/>
                        </p>
                        <p> <span class="form-header">Topics</span> </p>
                        <p style="line-height: 190%;">
                            <b-badge v-for="topic in pub.tags" :key="topic" class="topic">{{topic}}</b-badge>
                        </p>

                    </b-col>
                </b-row>

            </div>

            <div v-if="tab_index > 0">
                <!-- release -->
                <p style="opacity: 0.7; float: right;"><span style="opacity: 0.5">Released on</span> <time>{{new Date(release.create_date).toLocaleDateString()}}</time></p>

                <div v-if="dataset_groups">
                    <span class="button" @click="downscript({})">
                        <b>{{total.subjects}}</b> Subjects <span style="opacity: 0.2">|</span> 
                        <b>{{total.count}} Datasets</b> <span v-if="total.size"> ({{total.size|filesize}} Total)</span>
                        <icon name="download" scale="0.8" style="opacity: 0.5; position: relative; top: -2px;"/> 
                    </span>
                </div>
                <div v-else style="opacity: 0.5">Loading ... <icon name="cog" spin/></div>

                <div class="group" v-for="(group, subject) in dataset_groups" :key="subject">
                    <b-row>
                        <b-col cols="2">
                            <span class="button" @click="downscript({'meta.subject': subject})">
                                <b>{{subject}}</b>
                                <icon name="download" class="download-subject" scale="0.8"/>
                            </span>
                        </b-col>
                        <b-col>
                            <div v-for="(datatype, datatype_id) in group.datatypes" :key="datatype_id">
                                <b-row v-for="(block, datatype_tags_s) in datatype.datatype_tags" :key="datatype_tags_s" style="margin-bottom: 3px;">
                                    <div @click="toggle(block, subject, datatype_id, JSON.parse(datatype_tags_s))" class="toggler">
                                        <div style="width: 20px; display: inline-block;" class="text-muted">
                                            <icon name="caret-right" v-if="!block.show"/> 
                                            <icon name="caret-down" v-if="block.show"/> 
                                        </div>
                                        <datatypetag :datatype="datatypes[datatype_id]" :tags="JSON.parse(datatype_tags_s)" :clickable="false"/>
                                        &nbsp;
                                        <!--<span class="text-muted">{{datatypes[datatype_id].desc}}</span>-->
                                        <small class="text-muted" style="float: right;">{{block.count}} datasets <span v-if="block.size">{{block.size|filesize}}</span></small>
                                    </div>
                                    <transition name="fadeHeight">
                                        <b-list-group class="datasets" v-if="block.show && block.datasets">
                                            <b-list-group-item v-for="(dataset, idx) in block.datasets" :key="idx" class="dataset" @click="view(dataset._id)">
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
                </div>

                <hr>

                <!--apps-->
                <div>
                    <p style="opacity: 0.8;">
                        The following Apps were used to generate the files in this release.
                    </p>
                    <div v-for="rec in apps" :key="rec.app.doi" style="width: 33%; float: left;">
                        <div style="margin-right: 10px; margin-bottom: 10px; position: relative;">
                            <app :app="rec.app" height="270px" :branch="rec.service_branch||'master'"></app>
                        </div>
                    </div>
                    <br clear="both">
                    <br>
                </div>

                <!--citations-->
                <div>
                    <p style="opacity: 0.8;">
                        Please use the following citations to cite these Apps.
                    </p>
                    <div class="box">
                        <div v-for="rec in apps" :key="rec.app.doi">
                            <citation :doi="rec.app.doi"/>
                        </div>
                    </div>
                    <br>
                </div>

                <!--resource usage TODO.. let's show all resources used by the project on the detail page for now
                <div v-for="resource in pub.project.stats.resources">
                    {{resource.name}}
                    {{resource.desc}}
                    {{resource.citation}}
                </div>
                -->
            </div>


        </b-container>
        <br>
        <br>
    </div><!--page-content-->
</div>
</template>

<script>
import Vue from 'vue'
import projectavatar from '@/components/projectavatar'
import contact from '@/components/contact'
import VueMarkdown from 'vue-markdown'
import license from '@/components/license'
import datatypetag from '@/components/datatypetag'
import tags from '@/components/tags'
import citation from '@/components/citation'
import app from '@/components/app'
import doibadge from '@/components/doibadge'

import agreementMixin from '@/mixins/agreement'

export default {
    mixins: [agreementMixin],

    components: { 
        projectavatar, 
        contact, VueMarkdown, license, 
        datatypetag, tags, 
        app, citation,
        doibadge, 
    },

    //https://help.altmetric.com/support/solutions/articles/6000141419-what-metadata-is-required-to-track-our-content-
    //https://github.com/declandewet/vue-meta
    metaInfo() {
        var meta = [];
        if(this.pub) {
            meta.push({name: 'DC.DOI', content: this.pub.doi});
            meta.push({name: 'DC.title', content: this.pub.name});
            meta.push({name: 'DC.description', content: this.pub.desc});
            this.pub.authors.forEach(author=>{
                meta.push({name: 'DC.creator', content: author.fullname});
            });
            this.pub.tags.forEach(tag=>{
                meta.push({name: 'DC.subject', content: tag});
            });
        }
        return {
            //title: "hi", 
            meta,
        } 
    },

    data () {
        return {
            pub: null, //publication detail
            release: null, //currently opened release
            dataset_groups: null, //datasets inventory grouped 
            apps: null, //list of apps

            datatypes: {}, 
            resource_citations: [],

            tab_index: 0,
            query: "",
            config: Vue.config,
        }
    },

    watch: {
        tab_index() {
            if(this.tab_index == 0) return; //not release view
            this.dataset_groups = null;
            this.apps = null;

            this.release = this.pub.releases[this.tab_index-1];

            //load release
            this.$http.get('pub/datasets-inventory/'+this.release._id).then(res=>{
                let groups = {};
                res.data.forEach(rec=>{
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
                return this.$http.get('pub/apps/'+this.release._id, {params: {
                    //populate: 'inputs.datatype outputs.datatype contributors',
                }});
            })
            .then(res=>{
                this.apps = res.data;
            });
        }
    },

    computed: {
/*
        resource_citations: function() {
            if(!this.pub) return [];
            if(!this.pub.project) return [];
            if(!this.pub.project.stats) return [];
            let citations = [];
            this.pub.project.stats.resources.forEach(resource=>{
                if(resource.citation) citations.push(resource.citation); 
            });
        },
*/

        social_url: function() {
            if(this.pub.doi) return "http://doi.org/"+this.pub.doi;
            return null;
        },

        total: function() {
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
            this.pub = res.data.pubs[0];

            //sort release by date (new first)
            if(this.pub.releases) {
                this.pub.releases = this.pub.releases.sort((a,b)=>{
                    if(a.create_date < b.create_date) return 1;
                    if(a.create_date > b.create_date) return -1;
                    return 0;
                }).filter(release=>!release.removed);
            }

            //load all datatypes
            return this.$http.get('datatype');
        })
        .then(res=>{
            res.data.datatypes.forEach((d)=>{
                this.datatypes[d._id] = d;
            });

            //open dataset previously selected
            if(document.location.hash) {
                let id = document.location.hash.substring(1);
                this.$root.$emit('dataset.view', {id});
            }

            Vue.nextTick(()=>{
                //re-initialize altmetric badge - now that we have badge <div> placed
                _altmetric_embed_init(this.$el);
            });

            //load all resources referenced for citations
            let resource_ids = this.pub.project.stats.resources.map(r=>r.resource_id);
            return this.$http.get(Vue.config.amaretti_api+"/resource", {params: {
                find: JSON.stringify({
                    _id: {$in: resource_ids},
                }),
                select: 'name config.desc',
            }})
        }).then(res=>{
            //collect resource citation
            this.pub.project.stats.resources.forEach(stat=>{
                if(!stat.citation) return; //don't show resources with no citations
                let resource = res.data.resources.find(r=>r._id == stat.resource_id);
                if(!resource) return; //no such resource?
                let resource_citations = this.resource_citations.find(r=>r.resource._id == stat.resource_id);
                if(!resource_citations) this.resource_citations.push({resource, citation: stat.citation});    
            });

        }).catch(console.error);
    },
    
    methods: {
        back() {
            if(window.history.length > 1) this.$router.go(-1);
            else this.$router.push('/pubs');
        },

        view(id) {
            document.location.hash = id;
            this.$root.$emit('dataset.view', {id});
        },

        openproject(project_id) {
            this.$router.push('/project/'+project_id);
        },

        toggle(block, subject, datatype, datatype_tags) {
            block.show = !block.show;
            this.release = this.pub.releases[this.tab_index-1];
            if(!block.datasets) {
                //load datasets
                this.$http.get('pub/datasets/'+this.release._id, {params: {
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
                    block.datasets = res.data.datasets;
                }).catch(console.error);
            }
        },

        downscript(query) {
            this.check_agreements(this.pub.project, ()=>{
                query.publications = this.release._id;
                this.$root.$emit("downscript.open", {find: query});
            });
        },
    }
}
</script>

<style>
.social-buttons span[data-link] {
background-color: white;
border-radius: 10px;
padding: 10px;
margin: 5px;
display: inline-block;
width: 140px;
transition: 0.5s background-color, 0.5s color;
}
.social-buttons span[data-link]:hover {
background-color: #007bff;
color: white;
cursor: pointer;
}
.social-buttons svg {
position: relative;
top: 2px;
height: 15px;
width: 15px;
margin: 0 5px;
color: #999;
transition: 0.5s color;
}
.social-buttons span[data-link]:hover svg {
color: white;
}
</style>

<style scoped>
.page-content {
top: 0px;
}
.header {
background-color: white;
margin-bottom: 30px;
padding: 15px 0px 0px 0px;
border-bottom: 1px solid #eee;
position: sticky;
top: 0px;
z-index: 1;
}
.topic {
padding: 6px; 
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
width: 100%;
margin-top: 5px;
margin-bottom: 5px;
margin-left: 28px;
}
.dataset:hover {
cursor: pointer;
background-color: #f7f7f7;
}
.toggler {
padding: 1px 4px;
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
.project h5 {
color: #007bff;
}
.group {
margin-top: 10px;
padding-top: 10px;
border-top: 1px solid #eee;
}
.download-subject {
opacity: 0.5;
position: relative;
top: -2px;
}
.group .button:hover .download-subject {
opacity: 1;
}
.app-download {
position: absolute;
bottom: 40px;
right: 5px;
}
.box {
background-color: white;
padding: 20px;
margin-bottom: 20px;
}
.citation-box {
border: none;
box-shadow: 2px 2px 3px #0001;
}
.button-page {
position: absolute;
left: -30px;
z-index: 1;
opacity: 0.6;
}
.brainlife-logo {
font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
font-size: 19pt;
font-weight: bold;
background: linear-gradient(to right, #2693ff, #159957);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
}
</style>


