<template>
<div v-if="ready">
    <div class="page-header">
        <div style="margin-top: 2px; margin-left: 10px;">
            <b>{{rules.length}}</b> Pipeline Rules
        </div>
    </div>
    <div class="page-content" ref="scrolled">
        <ruleform :value="editing" v-if="editing" @cancel="cancel_edit" @submit="submit"/>
        <div v-else>
            <!--list view-->
            <p class="text-muted margin20" v-if="rules.length == 0">Pipeline rule allows you to automate bulk processing of your datasets by automatically submitting processes babsed on defined criterias.</p>
            <div v-for="rule in rules" :key="rule._id" :class="{'rule-removed': rule.removed}" class="rule" v-if="rule.removed == false">
                <div style="padding: 10px;">
                    <div style="float: right">
                        <time>{{rule.create_date}}</time>
                        <div class="button" @click="edit(rule)" v-if="ismember()"><icon name="pencil"/></div>
                        <div class="button" @click="remove(rule)" v-if="ismember()"><icon name="trash"/></div>
                        <!--<contact :id="rule.user_id"/>-->
                    </div>
                    <h5>
                        <b-badge v-if="rule.removed" variant="danger">Removed</b-badge>
                        <b-badge variant="success" v-if="rule.active">ON</b-badge>
                        <b-badge variant="danger" v-else>OFF</b-badge>
                        {{rule.name}} 
                    </h5>
                </div>

                <p class="text-muted" style="background-color: #f3f3f3; padding: 10px;">Submit the following app and archive output datasets to this project</p>
                <b-row>
                    <b-col>
                        <app :app="rule.app" :compact="true" :clickable="false" style="margin-left: 30px;"/>
                    </b-col>
                    <b-col>
                        <table class="table table-sm" style="font-size: 85%; background-color: #fbfbfb;">
                        <tbody>
                            <tr v-for="(v,k) in rule.config" :key="k">
                                <th :cols="3" style="font-size: 90%; opacity: 0.7">&nbsp;&nbsp;{{k}}</th>
                                <th v-if="typeof v == 'object'">
                                    <pre v-highlightjs style="margin-bottom: 0px;"><code class="json hljs">{{v}}</code></pre>
                                </th>
                                <th v-else>{{v}}</th>
                            </tr>
                        </tbody>
                        </table>
                    </b-col>
                </b-row>

                <p class="text-muted" style="background-color: #f3f3f3; padding: 10px;">On subjects with the following set of archived datasets</p>
                <div style="padding-left: 30px;">
                    <p v-if="rule.subject_match">
                        <span class="text-muted">Only process subjects that matches regex</span> <b>{{rule.subject_match}}</b>
                    </p>       
                    <p v-for="input in rule.app.inputs" :key="input.id">
                        <datatypetag :datatype="datatypes[input.datatype]" :tags="input.datatype_tags"/>
                        <span v-if="rule.input_tags && rule.input_tags[input.id]">
                            <small class="text-muted">with tags</small> <tags :tags="rule.input_tags[input.id]"/>
                        </span>
                        <span v-if="rule.input_project_override && rule.input_project_override[input.id]" class="text-muted">
                            From <icon name="shield"/> {{projects[rule.input_project_override[input.id]].name}}
                        </span>
                    </p>
                </div>

                <p class="text-muted" style="background-color: #f3f3f3; padding: 10px;">Only if the following output datasets aren't archived for the subject yet</p>
                <div style="margin-left: 30px;">
                    <p v-for="output in rule.app.outputs" :key="output.id">
                        <datatypetag :datatype="datatypes[output.datatype]" :tags="output.datatype_tags"/>
                        <span v-if="rule.output_tags && rule.output_tags[output.id]">
                            <small class="text-muted">with user tags of</small> <tags :tags="rule.output_tags[output.id]"/>
                        </span>
                    </p>
                </div>

                <br>
                
            </div><!--rule-->

            <!--
            <p class="text-muted" style="margin: 20px;" v-if="!rules || rules.length == 0">No pipeline rules registered for this project</p>
            -->

            <p style="padding-top: 100px;">&nbsp;</p>
            <b-button v-if="isadmin() || ismember()" @click="newrule" class="button-fixed" title="Create new rule">
                <icon name="plus" scale="2"/>
            </b-button>
        </div>
    </div>

</div>
</template>

<script>
import Vue from 'vue'

import contact from '@/components/contact'
import tags from '@/components/tags'
import app from '@/components/app'
import datatypetag from '@/components/datatypetag'
import ruleform from '@/components/ruleform'

import ReconnectingWebSocket from 'reconnectingwebsocket'

var debounce = null;

export default {
    props: [ 'project' ], 
    components: { 
        contact, tags, app,
        datatypetag, ruleform,
    },
    data () {
        return {
            editing: null,

            ready: false,

            rules: null, 
            datatypes: null,
            projects: null,
            config: Vue.config,
        }
    },

    mounted: function() {
        this.load();
    },

    watch: {
        project: function() {
            //console.log("project changed.. need to reload");
            this.ready = false;
            this.load();
        },

        '$route': function() {
            var subid = this.$route.params.subid;
            if(!subid) this.editing = null;
        },
    },

    methods: {
        load: function() {
            //console.log("load all publication");
            this.$http.get('rule', {params: {
                find: JSON.stringify({
                    project: this.project._id,
                    removed: false,
                }),
                populate: 'app', 
                //sort: '-active create_date', 
                sort: 'create_date', 
            }})
            .then(res=>{
                this.rules = res.body.rules; 

                if(this.$route.params.subid) {
                    this.editing = this.rules.find(rule=>{return rule._id == this.$route.params.subid});
                }

                //load datatypes referenced
                let ids = [];
                this.rules.forEach(rule=>{
                    rule.app.outputs.forEach(output=>{
                        if(!~ids.indexOf(output.datatype)) ids.push(output.datatype);
                    });
                    rule.app.inputs.forEach(input=>{
                        if(!~ids.indexOf(input.datatype)) ids.push(input.datatype);
                    });
                });
                return this.$http.get('datatype', {params: {
                    find: JSON.stringify({
                        _id: {$in: ids}
                    })
                }})
            })
            .then(res=>{
                this.datatypes = {};
                res.body.datatypes.forEach(datatype=>{
                    this.datatypes[datatype._id] = datatype;
                });

                //load projects referenced
                let ids = [];
                this.rules.forEach(rule=>{
                    for(let input_id in rule.input_project_override) {
                        let project_id = rule.input_project_override[input_id];
                        if(!~ids.indexOf(project_id)) ids.push(project_id);
                    } 
                });
                return this.$http.get('project', {params: {
                    find: JSON.stringify({
                        _id: {$in: ids}
                    })
                }})
            })
            .then(res=>{
                this.projects = {};
                res.body.projects.forEach(project=>{
                    this.projects[project._id] = project;
                });
                this.ready = true;
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
            console.error(err.status);
            this.$notify({type: 'error', text: err.body.message||err.status});
        },

        newrule: function() {
            //set to default
            this.editing = {
                name: "",
                config: {},
                active: false,
                removed: false,
            };
            this.$refs.scrolled.scrollTop = 0;
        },

        edit: function(rule) {
            this.$router.push("/project/"+this.project._id+"/pipeline/"+rule._id);
            this.$refs.scrolled.scrollTop = 0;
            this.editing = rule;
        },

        cancel_edit: function() {
            this.editing = null;
            this.$router.push("/project/"+this.project._id+"/pipeline/");
            this.$refs.scrolled.scrollTop = 0; //TODO - should I scroll to the rule that was being edited before?
        },

        submit: function(rule) {
            rule.project = this.project._id;

            if(rule._id) {
                /*
                //update
                this.rules.forEach(r=>{
                    if(r._id == rule._id) {
                        for(var k in rule) {
                            r[k] = rule[k]; 
                        }
                    }
                });
                */
                this.$http.put('rule/'+rule._id, rule).then(res=>{
                    this.load(); //need to reload all new datatypes, etc.. used by the updated rule

                    this.$notify({text: "Successfully updated a rule", type: "success"});
                    this.cancel_edit();
                }).catch(this.notify_error);
            } else {
                //create
                this.$http.post('rule', rule).then(res=>{
                    //this.rules.push(res.body);
                    this.load(); //need to reload all new datatypes, etc.. used by the new rule

                    this.$notify({text: "Successfully created a new rule", type: "success"});
                    this.cancel_edit();
                }).catch(this.notify_error);
            }
        },

        remove: function(rule) {
            if(confirm("Do you really want to remove this rule?")) {
                this.$http.delete('rule/'+rule._id)
                .then(res=>{
                    rule.removed = true;
                    this.$notify({text: "Removed!", type: "success"});
                });
            }
        },

    },
}

</script>

<style scoped>
.rule {
margin-bottom: 20px;
box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
}

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
overflow-x: hidden;
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
.config {
background-color: #f9f9f9;
}
</style>

