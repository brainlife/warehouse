<template>
<div v-if="pubs">
    <!--
    <div class="info" v-if="pubs.length > 0">
        <b>{{pubs.length}}</b> Publications
    </div>
    -->
    <div class="list">
        <div v-if="editing" style="background-color: white; padding: 20px; padding-top: 10px;">
            <pubform :pub="editing" :project="project" @submit="save" @cancel="cancel"/>
        </div>
        <div v-else>
            <!--give space for Publications count-->
            <br>
            <br>
            <div v-for="pub in pubs" :key="pub._id" :class="{'pub-removed': pub.removed, 'pub-editable': (ismember()||isadmin())}" class="pub" @click="edit(pub)">
                <doibadge :doi="pub.doi" style="float: right;"/>
                <!--
                <div class="pub-action">
                    <div class="button" @click="edit(pub)" title="Edit publication metadata"> <icon name="edit"/> </div>
                    <div class="button" @click="open(pub)" title="See in published page"> <icon name="eye"/> </div>
                </div>
                -->
                <b-badge v-if="pub.removed" variant="danger">Removed</b-badge>
                <h5 style="margin-top: 10px;">
                    {{pub.name}}
                </h5>
                <p style="opacity: 0.7; margin-bottom: 5px;">
                    {{pub.desc}}
                </p>
                <p style="line-height: 180%; margin-bottom: 5px;" v-if="pub.tags.length > 0">
                    <small><tags :tags="pub.tags"/></small>
                </p>
                <!--<span style="float: right; opacity: 0.7;"><b>{{new Date(pub.publish_date||pub.create_date).toLocaleDateString()}}</b></span>-->
            </div>
            <div class="margin20 text-muted" v-if="!pubs || pubs.length == 0">
                <p>No publication registered for this project.</p>
                <p>To learn about how to submit publications, please refer to our <a href="https://brainlife.io/docs/user/publication/" target="doc">Documentation</a>.</p>
            </div>

            <!--space to make sure add button won't overwrap the pub list-->
            <p style="padding-top: 100px;">&nbsp;</p>

            <b-button v-if="isadmin() || ismember()" @click="newpub" class="button-fixed" v-b-tooltip.hover title="Create new publication">
                <icon name="plus" scale="2"/>
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

import ReconnectingWebSocket from 'reconnectingwebsocket'

var debounce = null;

export default {
    props: [ 'project' ], 
    components: { 
        pubform, tags,
        doibadge,
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

        isadmin() {
            if(!this.project) return false;
            if(~this.project.admins.indexOf(Vue.config.user.sub)) return true;
            return false;
        },

        ismember() {
            if(!this.project) return false;
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
            //if(this.ismember() || this.isadmin()) {
            this.$router.replace("/project/"+this.project._id+"/pub/"+pub._id);
            this.editing = pub;
            //} 
        },

        cancel() {
            //console.log("cancel");
            this.$router.replace("/project/"+this.project._id+"/pub/");
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
.list {
overflow-x: hidden; /*i can't figure out why there would be x scroll bar when a rule is active*/
position: fixed;
top: 95px;
bottom: 0px;
left: 40px;
right: 0px;
}

.pub:first-child {
margin-top: 2px;
}
.pub {
padding: 5px 15px;
margin: 0px 20px;
background-color: white;
box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
font-size: 88%;
cursor: pointer;
transition: background-color 0.5s;
}
.pub:hover {
background-color: #eee;
}
.pub.pub-editable {
cursor: pointer;
}
.pub-action {
margin-right: 10px;
opacity: 0;
transition: 0.3s opacity;
float: right;
}
.pub:hover .pub-action {
opacity: 1;
}
</style>

