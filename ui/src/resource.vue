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
                            <!--<p style="opacity: 0.6">{{resource._detail.desc}}</p>-->
                            <h2>
                                <b-badge v-if="!resource.active">Inactive</b-badge>
                                <b-badge v-if="!resource.gids || resource.gids.length == 0" variant="danger" title="Private resource"><icon name="lock"/></b-badge>
                                {{resource.name}}
                            </h2>
                            <p style="opacity: 0.6">{{resource.config.desc}}</p>
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
                            <b-btn style="float: right; top: -5px; position: relative;" size="sm" @click="test" variant="success" v-if="resource._canedit && !testing" title="Test">Test</b-btn>
                            <b-btn style="float: right; top: -5px; position: relative;" size="sm" v-if="testing" title="Test" disabled><icon name="cog" :spin="true"/> Testing ... </b-btn>
                            <statustag :status="resource.status"/>
                            <span style="padding-left: 15px; opacity: 0.8;">
                                Tested <timeago :since="resource.status_update" :auto-update="1"/>
                            </span>
                            <!--
                            <b :class="{'text-danger': resource.status != 'ok', 'text-success': resource.status == 'ok'}">{{resource.status.toUpperCase()}}</b>
                            -->
                            <pre v-if="resource.status != 'ok'" style="max-height: 300px; margin-top: 15px; overflow: auto; color: #dc3545">{{resource.status_msg}}</pre>
                        </div>
                        <br>
                    </b-col>
                </b-row>

                <!--
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
                -->

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Login Node (user:host)</span>
                    </b-col>
                    <b-col>
                        <p class="box">
                            <pre>{{resource.config.username}}@{{resource.config.hostname}}</pre>
                        </p>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                        <span class="form-header">Workdir</span>
                    </b-col>
                    <b-col>
                        <p class="box">
                            <pre>{{resource.config.workdir}}</pre>
                        </p>
                    </b-col>
                </b-row>

                <b-row v-if="resource.config.io_hostname">
                    <b-col cols="2">
                        <span class="form-header">IO Hostname</span>
                    </b-col>
                    <b-col>
                        <p>
                            <pre class="box">{{resource.config.io_hostname}}</pre> 
                            <small>Optional hostname used to transfer data in and out of this resource</small>
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

                <b-row v-if="resource.gids && resource.gids.length > 0">
                    <b-col cols="2">
                        <span class="form-header">Groups</span>
                    </b-col>
                    <b-col>
                        <p class="box">
                            <tags :tags="resource.gids"/><br>
                            <small>Group ID that this resource is shared with</small>
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

                <b-row v-if="resource.envs && Object.keys(resource.envs).length > 0">
                    <b-col cols="2">
                        <span class="form-header">ENVs</span>
                    </b-col>
                    <b-col>
                        <p class="box">
                            <pre>{{resource.envs}}</pre>
                        </p>
                    </b-col>
                </b-row>

                <b-row v-if="resource.citation">
                    <b-col cols="2">
                        <span class="form-header">Citation</span>
                    </b-col>
                    <b-col>
                        <p class="box">
                            {{resource.citation}}
                        </p>
                    </b-col>
                </b-row>

                <b-row>
                    <b-col cols="2">
                    </b-col>
                    <b-col>
                        <p>
                            <icon name="calendar"/> Created on {{new Date(resource.create_date).toLocaleDateString()}}
                        </p>
                        <p>
                            <icon name="calendar"/> Updated on {{new Date(resource.update_date).toLocaleDateString()}}
                        </p>
                        <p>
                            <icon name="calendar"/> Last OK date {{new Date(resource.lastok_date).toLocaleDateString()}}
                        </p>
                        <br>
                    </b-col>
                </b-row>

                <div v-if="config.debug"><pre>{{resource}}</pre></div>
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
import statustag from '@/components/statustag'

export default {
    components: { 
        sidemenu, pageheader, app, contact, tags, statustag,
    },

    data () {
        return {
            resource: null, 
            //groups: null,

            testing: false,
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
            }).catch(console.error);
        },

        back() {
            this.$router.go(-1);
            //this.$router.push('/resources');
        },

        test() {
            if(this.testing) return; //already testing
            this.testing = true;
            this.$http.put(Vue.config.amaretti_api+'/resource/test/'+this.$route.params.id).then(res=>{
                this.resource.status = res.data.status;
                this.resource.status_msg = res.data.message.trim(); 
                if(res.data.status == "ok") this.$notify({type: "success", text: "Successfully tested!"});
                else this.$notify({type: "error", text: "Resource test failed"});
                this.resource.status_update = new Date();
                this.testing = false;
            }).catch(err=>{
                this.testing = false;
                this.resource.status_update = new Date();
                this.$notify({type: "error", text: err});
            });
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

