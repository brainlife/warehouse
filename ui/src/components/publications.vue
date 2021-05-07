<template>
<div v-if="pubs">
    <!--
    <div class="info" v-if="pubs.length > 0">
        <b>{{pubs.length}}</b> Publications
    </div>
    -->
    <div class="page-content" ref="scrolled">
        <div v-if="editing" style="background-color: white; padding: 20px; padding-top: 10px;">
            <pubform :pub="editing" :project="project" @submit="save" @cancel="cancel"/>
        </div>
        <div v-else>
            <br>
            <div class="margin20 text-muted" v-if="!pubs || pubs.length == 0">
                <p>No publication registered for this project.</p>
                <!--
                <p>To learn about how to submit publications, please refer to our <a href="https://brainlife.io/docs/user/publication/" target="doc">Documentation</a>.</p>
                -->
            </div>
            <div v-for="pub in pubs" :key="pub._id" :class="{'pub-removed': pub.removed, 'pub-editable': canedit()}" class="pub">
                <div style="padding: 10px 15px">
                    <div class="pub-action">
                        <div class="button" @click="edit(pub)" v-if="canedit()" title="Edit publication detail"> <icon name="edit"/> </div>
                        <div class="button" size="sm" @click="open(pub)" title="See in published page"> <icon name="eye"/> </div>
                    </div>
                    <b-badge v-if="pub.removed" variant="danger">Removed</b-badge>
                    <h5>
                        {{pub.name}}
                    </h5>
                    <p style="opacity: 0.7; margin-bottom: 5px;">
                        {{pub.desc}}
                    </p>
                    <p style="line-height: 180%; margin-bottom: 5px;" v-if="pub.tags.length > 0">
                        <small><tags :tags="pub.tags"/></small>
                    </p>

                    <b-alert show="pub.releases.length == 0" variant="danger">No Releases</b-alert>
                    <div v-for="release in pub.releases.filter(r=>!r.removed)" :key="release._id" style="clear: both; padding: 5px 0; margin: 5px 0; border-top: 1px solid #eee; margin-bottom: 5px">
                        <span style="float: right; margin-right: 10px; font-size: 85%;">
                            <icon name="calendar" style="opacity: 0.4;" scale="0.8"/>&nbsp;&nbsp;
                            {{new Date(release.create_date).toLocaleDateString()}}
                        </span>

                        <h6><span style="opacity: 0.5">Release</span> {{release.name}}</h6>
                        <releaseset v-for="(set, idx) in release.sets" :key="idx" style="margin-right: 10px; display: inline-block;" :set="set"/>
                        <p v-if="release.gaarchives.length" style="margin-bottom: 0;">
                            <gaarchive v-for="(gaarchive, idx) in release.gaarchives" :key="idx" style="margin-right: 10px; margin-top: 10px;" :gaarchive="gaarchive"/>
                        </p>
                    </div>
                </div>

                <div style="background-color: #eee; padding: 10px 15px;">
                    <doibadge :doi="pub.doi" style="float: right;"/>
                    <b-badge pill class="bigpill" style="float: right; margin-right: 10px;">
                        <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;
                        {{new Date(pub.create_date).toLocaleDateString()}}
                    </b-badge>
                    <br clear="both">
                </div>
                <!--<span style="float: right; opacity: 0.7;"><b>{{new Date(pub.publish_date||pub.create_date).toLocaleDateString()}}</b></span>-->
            </div>
            <!--space to make sure add button won't overwrap the pub list-->
            <p style="padding-top: 100px;">&nbsp;</p>
            <b-button v-if="canedit()" @click="newpub" class="button-fixed">
                New Publication
            </b-button>
        </div><!--pubs-->
    </div>

</div>
</template>

<script>
import Vue from 'vue'

import pubform from '@/components/pubform'
import tags from '@/components/tags'
import doibadge from '@/components/doibadge'
import gaarchive from '@/components/gaarchive'
import releaseset from '@/components/releaseset'

import ReconnectingWebSocket from 'reconnectingwebsocket'

var debounce = null;

export default {
    props: [ 'project' ], 
    components: { 
        pubform, 
        tags,
        doibadge,
        gaarchive,
        releaseset,
    },
    data () {
        return {
            pubs: null, 

            //publishing: false,
            editing: null,

            config: Vue.config,
        }
    },

    mounted: function() {
        console.log("publications mounted", this.$route.params);
        this.load();
    },

    watch: {
        project: function() {
            console.log("project changed.. need to reload");
            this.load();
        },

        '$route': function() {
            var subid = this.$route.params.subid;
            if(!subid) this.editing = null;
        },
    },

    methods: {
        load() {
            console.log("load all publication");
            this.$http.get('pub', {params: {
                find: JSON.stringify({
                    project: this.project._id,
                }),
                populate: 'project', //needed by pubcard
            }})
            .then(res=>{
                this.pubs = res.data.pubs; 

                //find opened publication
                if(this.$route.params.subid) {
                    this.editing = this.pubs.find(pub=>{return pub._id == this.$route.params.subid});
                }
            });
        },

        canedit() {
            if(!this.project) return false;
            if(!Vue.config.user) return false;
            if(~this.project.admins.indexOf(Vue.config.user.sub)) return true;
            if(~this.project.members.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        notify_error(err) {
            console.error(err);
            this.$notify({type: 'error', text: err.body.message});
        },

        /*
        start_publish: function() {
            this.publishing = true;
        },
        */

        newpub() {
            this.editing = {
                //defaults
                name: "",
                desc: "",
                tags: [],
                readme: "",
                license: "ccby.40",
            
                //publisher: "Nature",

                fundings: [],
                authors: [ Vue.config.user.sub ],
                contributors: [],
                releases: [],
            };
        },

        save(pub) {
            pub.project = this.project._id;
            if(pub._id) {
                //update
                this.$http.put('pub/'+pub._id, pub).then(res=>{
                    for(var k in pub) {
                        this.editing[k] = res.data[k]; //will load release._id
                    }
                    this.$router.replace('/project/'+this.project._id+'/pub/');
                    this.editing = null;
                    this.$notify("Successfully updated!");
                    this.$refs.scrolled.scrollTop = 0;
                }).catch(res=>{
                    this.$notify({type: 'error', text: res.data});
                });
            } else {
                //new publication
                this.$http.post('pub', pub).then(res=>{
                    this.pubs.push(res.data);
                    this.$notify("Registered new publication!");
                    this.editing = null;
                }).catch(res=>{
                    this.$notify({type: 'error', text: res.data});
                });
            }
        },

        open(pub) {
            document.location = "/pub/"+pub._id;
        },

        edit(pub) {
            this.$router.replace("/project/"+this.project._id+"/pub/"+pub._id);
            this.editing = pub;
        },

        cancel() {
            //console.log("cancel");
            this.$router.replace("/project/"+this.project._id+"/pub/");
            this.$refs.scrolled.scrollTop = 0;
            this.editing = false;
        },
    },
}

</script>

<style scoped>
.info {
top: 95px;
padding: 10px 20px;
color: #999;
background-color: #f9f9f9;
z-index: 1; /*needed to make sort order dropdown box to show up on top of page-content*/
}
.page-content {
overflow-x: hidden; /*i can't figure out why there would be x scroll bar when a rule is active*/
top: 95px;
}

.pub:first-child {
margin-top: 2px;
}
.pub {
    margin: 0px 20px;
    background-color: white;
    box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
    font-size: 88%;
    transition: background-color 0.3s;
    margin-bottom: 20px;
}
.pub-action {
    float: right;
}
</style>

