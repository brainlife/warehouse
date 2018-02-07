<template>
<div v-if="pubs">
    <div class="page-header">
        <div style="margin-top: 2px; margin-left: 10px;">
            <b>{{pubs.length}}</b> Publications
        </div>
    </div>
    <div class="page-content">
        <div v-if="publishing">
            <h3 style="opacity: 0.7">New Publication</h3>
            <publisher :project="project" @close="publishing = false" @submit="publish"/>
        </div>
        <div v-else-if="pub_editing">
            <h3 style="opacity: 0.7">{{pub_editing.doi||pub_editing._id+' (no doi)'}}</h3>
            <b-tabs class="brainlife-tab">
                <br>
                <b-tab title="Details">
                    <pubform :pub="pub_editing" @submit="save_pub">
                        <button type="button" class="btn btn-secondary" @click="cancel_pub">Cancel</button>
                    </pubform>
                </b-tab>
                <b-tab title="Datasets">
                    <b-alert show variant="warning">Only the publication detail can be edited at this time. To update published datasets, please contact the administrator.</b-alert>
                     
                </b-tab>
            </b-tabs>
        </div>
        <div v-else>
            <!--list view-->
            <div v-for="pub in pubs" :key="pub._id" :class="{'pub-removed': pub.removed}" class="pub" @click="edit(pub)">
                <b-row>
                <b-col>
                    <b-badge v-if="pub.removed" variant="danger">Removed</b-badge>
                    <h5 style="margin-top: 10px;">
                        {{pub.name}}
                    </h5>
                    <p style="opacity: 0.7;">
                        {{pub.desc}}
                        <small><tags :tags="pub.tags"/></small>
                    </p>
                </b-col>
                <b-col :cols="3">
                    <!--<span style="float: right; opacity: 0.7;"><b>{{new Date(pub.publish_date||pub.create_date).toLocaleDateString()}}</b></span>-->
                    <!--<doibadge :doi="pub.doi"/>-->
                    <div class="pub-action" style="display: inline-block; float: right; margin-right: 10px;" v-if="ismember()">
                        <div class="button" @click.stop="open_pub(pub)" title="See in published page">
                            <icon name="eye"/>
                        </div>
                    </div>
                    <div class="text-muted" style="float: right; margin: 5px;">{{pub.doi}}</div>
                </b-col>
                </b-row>
            </div>
            <p class="text-muted" style="margin: 20px;" v-if="!pubs || pubs.length == 0">No publication registered for this project</p>

            <!--space to make sure add button won't overwrap the pub list-->
            <p style="padding-top: 100px;">&nbsp;</p>

            <b-button v-if="isadmin() || ismember()" @click="start_publish" 
                class="button-fixed" 
                title="Create new publication">
                <icon name="plus" scale="2"/>
            </b-button>
        </div><!--pubs-->
    </div>

</div>
</template>

<script>
import Vue from 'vue'

import pubform from '@/components/pubform'
import publisher from '@/components/publisher'
import tags from '@/components/tags'
import doibadge from '@/components/doibadge'

import ReconnectingWebSocket from 'reconnectingwebsocket'

var debounce = null;

export default {
    props: [ 'project' ], 
    components: { 
        pubform, publisher, tags,
        doibadge,
    },
    data () {
        return {
            pubs: null, 

            publishing: false,
            pub_editing: null,

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
            if(!subid) this.pub_editing = null;
        },
    },

    methods: {
        load: function() {
            console.log("load all publication");
            this.$http.get('pub', {params: {
                find: JSON.stringify({
                    project: this.project._id,
                }),
                populate: 'project', //needed by pubcard
            }})
            .then(res=>{
                this.pubs = res.body.pubs; 

                if(this.$route.params.subid) {
                    this.pub_editing = this.pubs.find(pub=>{return pub._id == this.$route.params.subid});
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

        notify_error: function(err) {
            console.error(err);
            this.$notify({type: 'error', text: err.body.message});
        },

        start_publish: function() {
            this.publishing = true;
        },

        save_pub: function(pub) {
            this.$http.put('pub/'+pub._id, pub)
            .then(res=>{
                this.$notify("Successfully updated!");
                for(var k in res.body) {
                    this.pub_editing[k] = res.body[k];
                }
                this.$router.push('/project/'+this.project._id+'/pub');
            }).catch(res=>{
                this.$notify({type: 'error', text: res.body});
            });
        },

        open_pub: function(pub) {
            document.location = "/pub/"+pub._id;
        },

        edit: function(pub) {
            if(this.ismember()) {
                this.$router.push("/project/"+this.project._id+"/pub/"+pub._id);
                this.pub_editing = pub;
            } else {
                //non member can't edit, but jump to publication page
                this.open_pub(pub);
            }
        },

        cancel_pub: function() {
            console.log("cancel");
            this.$router.push("/project/"+this.project._id+"/pub/");
        },

        publish: function(pub) {
            this.publishing = false;
            pub.project = this.project; //pubcard needs project populated
            this.pubs.push(pub);
        }
    },
}

</script>

<style scoped>

.page-header {
position: fixed;
top: 100px;
left: 350px;
padding: 10px;
width: 300px;
height: 45px;
color: #999;
z-index: 1;
}

.page-content {
position: fixed;
top: 100px;
left: 350px;
bottom: 0px;
right: 0px;
overflow: auto;
padding: 20px;
margin-top: 45px;
background-color: white;
}

.pub {
padding: 5px 15px;
background-color: white;
box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
cursor: pointer;
}
.pub-action {
opacity: 0;
transition: 0.3s opacity;
}
.pub:hover .pub-action {
opacity: 1;
}
</style>

