<template>
<div v-if="pub" class="pub page-content">
    <!--
    <div class="header">
        <b-container style="position: relative;">
            <div style="background-color: white;">
                <h4 style="color: #666; margin-bottom: 5px;">
                    {{pub.name}} 
                </h4>
                <b-tabs class="brainlife-tab" v-model="tab_index">
                    <b-tab title="Detail"/>
                    <b-tab v-for="release in pub.releases" :key="release._id">
                        <template slot="title">Release {{release.name}}</template>
                    </b-tab>
                </b-tabs>
            </div>
            <b-alert :show="pub.removed" variant="secondary">This publication has been removed</b-alert>
        </b-container>
    </div>
    -->

    <b-alert :show="pub.removed" variant="secondary">This publication has been removed</b-alert>

    <div style="background-color: white; padding-top: 5px; border-bottom: 1px solid #ddd;">
        <b-container>
            <div class="rightside">
                <div class="button" @click="edit()" v-if="canedit()" style="float: right;" title="Edit this publication"> 
                    <icon name="edit" scale="1.25"/>
                </div>
                <projectavatar :project="pub.project" :height="125" :width="125"/>
                <br>
                <br>

                <div v-if="pub.tags.length > 0"> 
                    <div class="content-subheader border-bottom">Topics</div>
                    <p style="line-height: 200%; margin-bottom: 0px;">
                        <b-badge v-for="topic in pub.tags" :key="topic" class="topic">{{topic}}</b-badge>
                    </p>
                    <br>
                </div>

                <div v-if="pub.releases.length" class="releases">
                    <!--
                    <div class="content-subheader border-bottom">Releases</div>
                    -->
                    <div v-for="release in pub.releases" :key="release._id" class="content-item">
                        <small style="float: right">
                            {{new Date(release.create_date).toLocaleDateString()}}
                        </small>
                        <div @click="jump('release.'+release.name)" class="clickable border-bottom">Release <b>{{release.name}}</b></div>
                        <p v-if="release.desc">
                            <small>{{release.desc}}</small>
                        </p>
                        <div v-if="release.sets && release.sets.length">
                            <small class="clickable" @click="jump('release.'+release.name+'.data')">
                                Data ({{release.sets.length}} subjects)
                            </small>
                        </div>
                        <div v-if="release.apps && release.apps.length">
                            <small class="clickable" @click="jump('release.'+release.name+'.preprocessing')">
                                Preprocessing ({{release.apps.length}} apps)
                            </small>
                        </div>
                        <div v-if="release.gaarchives && release.gaarchives.length">
                            <small class="clickable" @click="jump('release.'+release.name+'.analysis')">
                                Analysis ({{release.gaarchives.length}} notebooks)
                            </small>
                        </div>
                    </div>
                </div>
                <br>

                <div v-if="pub.contributors.length" class="clickable" @click="jump('contributors')">
                    <div class="content-subheader border-bottom">Contributors</div>
                    <span v-for="(contact, idx) in pub.contributors" :key="contact._id">
                        <span v-if="idx" style="opacity: 0.5;"> | </span> {{contact.fullname}} 
                    </span>
                    <br>
                    <br>
                </div>

                <div>
                    <div class="content-subheader border-bottom">Project</div>
                    <small class="text-muted">This publication was processed in the following brainlife.io project</small>
                    <br>
                    <div @click="openproject(pub.project._id)" class="clickable" style="background-color: #eee; padding: 5px 10px; border-left: 2px solid #999;">
                        <b>{{pub.project.name}}</b><br>
                        <small>{{pub.project.desc}}</small>
                    </div>
                    <br>
                </div>

                <div v-if="pub.project.importedDLDatasets && pub.project.importedDLDatasets.length" class="clickable" @click="jump('datasource')">
                    <div class="content-subheader border-bottom">Data Sources</div>
                    <small class="text-muted" style="margin-bottom: 5px;">The following data sources are used for this project</small>
                    <div v-for="rec in pub.project.importedDLDatasets" :key="rec._id" style="margin-bottom: 3px">
                        <p style="margin-bottom:7px;">
                            <small><b>{{rec.path}}</b></small><br>
                            <small>{{rec.dataset_description.Name}}</small>
                        </p>
                    </div>
                    <br>
                </div>

                <div v-if="pub.fundings.length" class="clickable" @click="jump('fundings')">
                    <div class="content-subheader border-bottom">
                        Funded By
                        <!-- <b-badge>{{pub.fundings.length}}</b-badge>-->
                    </div>
                    <div v-for="funding in pub.fundings" :key="funding._id" class="funder" style="font-size: 80%;">
                        <div v-if="funding.funder == 'NSF'" class="funder-label bg-success">NSF</div>
                        <div v-else-if="funding.funder == 'NIH'" class="funder-label bg-info">NIH</div>
                        <div v-else class="funder-label bg-warning">{{funding.funder}}</div>
                        {{funding.id}}
                    </div>
                    <br>
                </div>

                <div class="content-subheader clickable" @click="jump('license')">
                    License<br>
                    <div style="margin-top: 5px; opacity: 0.8; font-weight: normal;">{{pub.license}}</div>
                    <br>
                </div>

                <div class="content-subheader clickable" @click="jump('related')" v-if="pub.relatedPapers && pub.relatedPapers.length">
                    Related Articles <b-badge>{{pub.relatedPapers.length}}</b-badge>
                    <br>
                </div>
                <br>

                <div class="content-subheader clickable" @click="jump('disqus')">Disqus</div>
                <br>

               
                <br>
            </div>

            <!--main content-->
            <div class="main">
                <h4 style="color: #666; padding-top: 15px; padding-bottom: 5px; ">
                    {{pub.name}} 
                </h4>
                <p>
                    <doibadge :doi="pub.doi"/>
                    <b-badge pill class="bigpill">
                        <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;<small>Published</small>&nbsp;&nbsp;<time>{{new Date(pub.create_date).toLocaleDateString()}}</time>
                    </b-badge>
                </p>
                <p>{{pub.desc}}</p>
                <p>
                    <span v-for="contact in pub.authors" :key="contact._id">
                        <contact :fullname="contact.fullname" :email="contact.email"></contact>
                    </span>
                </p>
                <hr>
                <div v-if="pub.readme" class="readme" style="margin-bottom: 20px;">
                    <vue-markdown :source="pub.readme"/>
                </div>
                </b-col>

                <!--<span class="form-header">Releases</span>-->
                <release v-for="release in pub.releases" :key="release._id" :release="release" :project="pub.project"/>
                <br>

                <b-row v-if="participants && Object.keys(participants).length">
                    <b-col cols="2">
                        <span class="form-header">Participants Info</span>
                    </b-col>
                    <b-col>
                        <participants :rows="participants" :columns="participants_columns" style="overflow: auto; max-height: 500px;"/>
                    </b-col>
                </b-row>

            </div>
        </b-container>
        <br clear="right">
    </div>

    <!--footer-->
    <b-container>
        <div class="rightside">
            <!--side footer-->
            <div class='altmetric-embed' 
                data-badge-type='donut' 
                data-badge-details="right" 
                data-hide-no-mentions="false" 
                :data-doi="pub.doi||config.debug_doi"/>
        </div>
        <br>
        <div class="main">
            <b-row>
                <b-col>
                    <!--main footer-->
                    <b-row>
                        <b-col cols="2">
                            <span class="form-header">Citation</span>
                        </b-col>
                        <b-col cols="10">
                            <p>
                                <small class="text-muted">Citation for this publiction. Please see citation section under each release for App specific citations. </small>
                            </p>
                            <citation :doi="pub.doi||config.debug_doi"/>

                            <div v-if="resource_citations.length > 0">
                                <p><small>Published data objects are computed on the following resources.</small></p>
                                <p v-for="resource_citation in resource_citations">
                                    <icon name="caret-right"/> <b>{{resource_citation.resource.name}}</b>
                                    <small>{{resource_citation.resource.config.desc}}</small>
                                    <br>
                                    <i>{{resource_citation.citation}}</i>
                                </p>
                            </div>
                            <br>

                        </b-col>
                    </b-row>  

                    <b-row v-if="pub.contributors.length > 0">
                        <b-col cols="2">
                            <a name="contributors"/>
                            <span class="form-header">Contributors</span>
                        </b-col>
                        <b-col cols="10">
                            <p>
                                <span v-for="contact in pub.contributors" :key="contact._id">
                                    <contact :fullname="contact.fullname" :email="contact.email"></contact>
                                </span>
                            </p>
                            <br>
                        </b-col>
                    </b-row>

                    <b-row>
                        <b-col cols="2">
                            <span class="form-header">Project</span>
                        </b-col>
                        <b-col>
                            <p><small class="text-muted">This publication is hosted in the following brainlife.io project</small></p>
                            <!--
                            <div style="background-color: white; padding: 10px;" @click="openproject(pub.project._id)" class="clickable">
                                <h5><icon name="shield-alt"/> {{pub.project.name}}</h5>
                                <small>{{pub.project.desc}}</small>
                            </div>
                            -->
                            <projectcard :project="pub.project" :showInstanceStats="false"/>
                            <br>
                        </b-col>
                    </b-row>

                    <b-row v-if="pub.project.importedDLDatasets && pub.project.importedDLDatasets.length">
                        <b-col cols="2">
                            <a name="datasource"/>
                            <span class="form-header">Data Sources</span>
                        </b-col>
                        <b-col>
                            <small class="text-muted" style="margin-bottom: 5px;">The following data sources are used for this project</small>
                            <div v-for="rec in pub.project.importedDLDatasets" :key="rec._id" style="margin-bottom: 3px">
                                <p style="margin-bottom:7px;">
                                    <small><b>{{rec.path}}</b></small><br>
                                    {{rec.dataset_description.Name}}<br>
                                    <span v-if="rec.dataset_description.Authors">
                                        <small v-for="(author, idx) in rec.dataset_description.Authors.slice(0, 3)" :key="idx"><span v-if="idx">|</span> {{author}} </small>
                                    </span>
                                </p>
                            </div>
                            <br>
                            <br>
                        </b-col>
                    </b-row>

                    <b-row v-if="pub.fundings.length > 0">
                        <b-col cols="2">
                            <a name="fundings"/>
                            <span class="form-header">Funded By</span>
                        </b-col>
                        <b-col>
                            <div v-for="funding in pub.fundings" :key="funding._id" class="funder">
                                <div v-if="funding.funder == 'NSF'" class="funder-label bg-success">NSF</div>
                                <div v-else-if="funding.funder == 'NIH'" class="funder-label bg-info">NIH</div>
                                <div v-else class="funder-label bg-warning">{{funding.funder}}</div>
                                {{funding.id}}
                            </div>
                            <br>
                            <br>
                        </b-col>
                    </b-row>

                    <b-row>
                        <b-col cols="2">
                            <a name="license"/>
                            <span class="form-header" name="license">License</span>
                        </b-col>
                        <b-col>
                            <p><small class="text-muted">Published data is released under the following license.</small></p>
                            <license :id="pub.license"/>
                            <br>
                        </b-col>
                    </b-row> 
                    
                    <b-row v-if="pub.relatedPapers && pub.relatedPapers.length > 0">
                        <b-col cols="2">
                            <a name="related"/>
                            <span class="form-header">Related Articles</span>
                        </b-col>    
                        <b-col>
                            <mag v-for="paper in sortedPapers.slice(0, relatedPaperLimit)" :key="paper.Id" :paper="paper"/>
                            <center v-if="relatedPaperLimit < pub.relatedPapers.length">
                                <b-button size="sm" variant="outline-secondary" @click="relatedPaperLimit = pub.relatedPapers.length">&nbsp;&nbsp;&nbsp;Show More Related Articles&nbsp;&nbsp;&nbsp;</b-button> 
                            </center>
                        </b-col>   
                    </b-row>    

                    <hr>
                    <a name="disqus"/>
                    <vue-disqus shortname="brain-life" :identifier="pub._id"/>
                </b-col>
            </b-row>
        </div>
    </b-container>

    <br>
    <br>
</div>
</template>

<script>
import Vue from 'vue'
import projectavatar from '@/components/projectavatar'
import contact from '@/components/contact'
import VueMarkdown from 'vue-markdown'
import license from '@/components/license'
import tags from '@/components/tags'
import citation from '@/components/citation'
import app from '@/components/app'
import doibadge from '@/components/doibadge'
import mag from '@/components/mag'
import release from '@/components/release'
import projectcard from '@/components/projectcard'

import agreementMixin from '@/mixins/agreement'

export default {
    mixins: [agreementMixin],

    components: { 
        projectavatar, 
        contact, 
        VueMarkdown, 
        license, 
        tags, 
        app, 
        citation,
        doibadge,
        mag,
        release,
        projectcard,
        participants: ()=>import('@/components/participants'),
    },

    computed: {
        sortedPapers : function() {
            return this.pub.relatedPapers.sort((a,b)=> b.citationCount - a.citationCount );
        }
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
            meta,
        } 
    },

    data () {
        return {
            pub: null, //publication detail
            release: null, //currently opened release

            datatypes: {}, 
            resource_citations: [],

            relatedPaperLimit: 3,

            participants: null,
            participants_columns: null,

            query: "",
            config: Vue.config,
        }
    },

    async mounted() {
        //load publication detail
        const res = await this.$http.get('pub', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
            populate: 'project releases',
            deref_contacts: true,
        }});

        this.pub = res.data.pubs[0];
        if(!this.pub.project) alert('no project ');

        //sort release by date (new first)
        if(this.pub.releases) {
            this.pub.releases = this.pub.releases.sort((a,b)=>{
                if(a.create_date < b.create_date) return 1;
                if(a.create_date > b.create_date) return -1;
                return 0;
            }).filter(release=>!release.removed);
        }

        //load participants
        if(this.pub.project.publishParticipantsInfo) {
            const pres = await this.axios.get("/participant/"+this.pub.project._id);
            if(pres.data) {
                this.participants = pres.data.subjects||{}; 
                this.participants_columns = pres.data.columns||{}; 
            }
        }
    },

    updated() {
        //called when vue finishes rendering everything.
        //after rendering is done, we can jump to things that user might have requested via hash
        let hash = document.location.hash.split("#")[1];
        if(hash) this.jump(hash);
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

        jump(id) {
            window.location.href = "#"+id;
        },

        canedit() {
            if(!this.pub.project) return false;
            if(!Vue.config.user) return false;
            if(~this.pub.project.admins.indexOf(Vue.config.user.sub)) return true;
            if(~this.pub.project.members.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        openproject(project_id) {
            this.$router.push('/project/'+project_id);
        },

        /*
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
        */

        edit() {
            this.$router.push("/project/"+this.pub.project._id+"/pub/"+this.pub._id);
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
    top: 0;
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
    margin-bottom: 5px;
    padding-right: 10px;
    font-weight: bold;
    color: #999;
}
.funder .funder-label {
    color: white;
    display: inline-block;
    padding: 0px 5px;
}
.datasets {
    margin: 5px 20px;
}
.dataset {
    font-size: 85%;
}
.dataset:hover {
    cursor: pointer;
    background-color: #f7f7f7;
}
.toggler {
    padding: 1px 4px;
    margin: 0 20px;
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
    box-shadow: 0 0 3px #0002;
    border-radius: 4px;
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

.rightside{
    float: right; 
    width: 250px;
}
.rightside p {
    margin-bottom: 10px; 
    line-height: 125%;
}
.main {
    margin-right: 275px;
}
.content-subheader {
    font-size: 110%;
    font-weight: bold;
    opacity: 0.8;
    margin-bottom: 5px;
    line-height: 100%;
}
.border-bottom {
    border-bottom: 1px solid #ddd;
    padding-bottom: 8px;
    margin-bottom: 3px;
}
.content-item {
    color: brue;
    padding: 3px 0;
}
.clickable:hover {
    color: #2693ff;
}

.releases {
    border: 1px solid #e0e0e0; 
    border-radius: 5px; 
    padding: 7px; 
}

</style>

