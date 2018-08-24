<template>
<div v-if="ready">
    <div class="page-header with-menu header">
        <div style="margin-top: 2px; margin-left: 10px;">
            <b>{{rules.length}}</b> Pipeline Rules
        </div>
    </div>
    <div class="page-content with-menu content" ref="scrolled">
        <ruleform :value="editing" v-if="editing" @cancel="cancel_edit" @submit="submit"/>
        <div v-else>
            <!--list view-->
            <div class="margin20" v-if="rules.length == 0">
                <p class="text-muted">Pipeline rule allows you to automate bulk submission of your processes based on defined criterias.</p>
                <p class="text-muted">This feature could potentially launch large number of processes. Please read our <a href="https://brain-life.github.io/docs/user/pipeline/" target="doc">Documentation</a> for more information.</p>
            </div>
            <!--header-->
            <div v-else style="margin-right: 20px; padding: 5px 15px; opacity: 0.8; line-height: 200%;">
                <div class="date">
                    <small>Create Date</small>
                </div>
            </div>
            <br clear="both">
            <div v-for="rule in rules" :key="rule._id" :id="rule._id" :class="{'rule-removed': rule.removed, 'rule-active': selected == rule}" class="rule" v-if="rule.removed == false">
                <div class="rule-header" @click="toggle(rule)">
                    <div style="float: right; width: 130px; text-align: right;">
                        <timeago :since="rule.create_date" :auto-update="10"/>
                    </div>
                    <div style="float: right; width: 150px;">
                        <contact :id="rule.user_id" size="tiny"/>
                    </div>
                    <div class="rule-controls" style="float: right;">
                        <div class="button" @click.stop="edit(rule)" v-if="ismember() || isadmin()"><icon name="edit"/></div>
                        <div class="button" @click.stop="remove(rule)" v-if="ismember() || isadmin()"><icon name="trash"/></div>
                    </div>
                    <div>
                        <b-badge v-if="rule.removed" variant="danger">Removed</b-badge>
                        <b-badge variant="success" v-if="rule.active">ON</b-badge>
                        <b-badge variant="danger" v-else>OFF</b-badge>
                        <span>{{rule.app.name}}</span>
                        <small style="opacity: 0.5">{{rule.name}}</small>
                    </div>
                </div>

                <div class="rule-body" v-if="selected == rule" transition="expand">
                    <p class="text-muted" style="background-color: #f3f3f3; padding: 10px;">Submit the following app and archive output datasets to this project</p>
                    <b-row>
                        <b-col>
                            <app :app="rule.app" :compact="true" :clickable="false" style="margin-left: 30px; margin-bottom: 10px;"/>
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
                            <small style="float: right; margin-right: 10px;">{{input.id}}</small>
                            <datatypetag :datatype="datatypes[input.datatype]" :tags="input.datatype_tags" v-if="datatypes"/>
                            <span v-if="rule.input_tags && rule.input_tags[input.id] && rule.input_tags[input.id].length > 0">
                                <small class="text-muted">with tags</small> <tags :tags="rule.input_tags[input.id]"/>
                            </span>
                            <span v-if="rule.input_project_override && rule.input_project_override[input.id] && projects[rule.input_project_override[input.id]]" class="text-muted">
                                From <icon name="shield-alt"/> {{projects[rule.input_project_override[input.id]].name}}
                            </span>
                            <b v-if="rule.input_selection && rule.input_selection[input.id]">{{rule.input_selection[input.id]}}</b>
                        </p>
                    </div>

                    <p class="text-muted" style="background-color: #f3f3f3; padding: 10px;">Only if the following output datasets aren't archived for the subject yet</p>
                    <div style="margin-left: 30px;">
                        <p v-for="output in rule.app.outputs" :key="output.id">
                            <small style="float: right; margin-right: 10px">{{output.id}}</small>
                            <datatypetag :datatype="datatypes[output.datatype]" :tags="output.datatype_tags" v-if="datatypes"/>
                            <span v-if="rule.output_tags && rule.output_tags[output.id] && rule.output_tags[output.id].length > 0">
                                <small class="text-muted">with dataset tags of</small> <tags :tags="rule.output_tags[output.id]"/>
                            </span>
                        </p>
                    </div>

                    <p class="text-muted" style="background-color: #f3f3f3; padding: 10px; margin-bottom: 0px">Log</p>
                    <rulelog :id="rule._id"/>
                </div><!--rule-body-->
            </div><!--rule-->

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
import rulelog from '@/components/rulelog'

import ReconnectingWebSocket from 'reconnectingwebsocket'

var debounce = null;

export default {
    //mixins: [agreementMixin],
    props: [ 'project' ], 
    components: { 
        contact, tags, app,
        datatypetag, ruleform, rulelog,
    },
    data () {
        return {
            editing: null,
            selected: null,

            ready: false,

            rules: null, 
            datatypes: null,
            projects: null,

            //input_matches: {},
            //output_matches: {},

            config: Vue.config,
        }
    },

    mounted: function() {
        this.load();
    },

    watch: {
        project: function() {
            //console.log("project changed.. need to reload");
            this.load();
        },

        '$route': function() {
            var subid = this.$route.params.subid;
            if(!subid) this.editing = null;
        },
    },

    methods: {
        load: function(cb) {
            this.ready = false;
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
                    this.editing = this.rules.find(rule=>rule._id == this.$route.params.subid);
                }

                if(this.selected) {
                    this.selected = this.rules.find(rule=>rule._id == this.selected._id); //need to reselect..
                }

                this.load_referenced(err=>{
                    if(err) console.error(err);
                    this.ready = true;
                    if(cb) cb();
                });
            });
        },

        load_referenced(cb) {
            this.datatypes = null;

            //load referenced datatypes
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
                cb();
            }).catch(cb); 
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
            this.selected = rule; //I think it makes sense to select rule that user is editing?
        },

        cancel_edit: function() {
            this.editing = null;
            this.$router.push("/project/"+this.project._id+"/pipeline");
            Vue.nextTick(()=>{
                //scroll to the selected rule (TODO - I think I should delay until animation is over?)
                if(this.selected) {
                    var elem = document.getElementById(this.selected._id);
                    this.$refs.scrolled.scrollTop = elem.offsetTop;
                }
            });
        },

        submit: function(rule) {
            rule.project = this.project._id; //rule editor doesn't set project id.
            if(rule._id) {
                //update
                this.$http.put('rule/'+rule._id, rule).then(res=>{
                    this.load(err=>{
                        this.$notify({text: "Successfully updated a rule", type: "success"});
                        this.cancel_edit();
                    }); 
                }).catch(this.notify_error);
            } else {
                //create
                this.$http.post('rule', rule).then(res=>{
                    this.selected = res.body;
                    this.load(err=>{
                        this.$notify({text: "Successfully created a new rule", type: "success"});
                        this.cancel_edit();
                    });
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

        toggle: function(rule) {
            if(this.selected == rule) this.selected = null;
            else {
                this.selected = rule;
                Vue.nextTick(()=>{
                    //scroll to the selected rule (TODO - I think I should delay until animation is over?)
                    var elem = document.getElementById(rule._id);
                    this.$refs.scrolled.scrollTop = elem.offsetTop;
                });
            }
        },
    },
};

</script>

<style scoped>
.rule {
box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
margin: 0px 20px;
transition: margin 0.2s;
background-color: white;
}
.rule:first-child {
margin-top: 2px;
}

.rule.rule-active {
margin: 20px 0px;
}
.rule-header {
cursor: pointer;
transition: background-color 0.3s;
padding: 10px;
padding-top: 5px;
font-size: 88%;
}
.rule-header:hover {
cursor: pointer;
background-color: #ddd;
}
.rule-header .rule-controls {
opacity: 0;
transition: opacity 0.2s;
display: inline-block;
margin-right: 10px;
}
.rule.rule-active .rule-controls,
.rule-header:hover .rule-controls {
opacity: 1;
}
.rule.rule-active .rule-header {
padding: 20px;
position: sticky;
top: 0px;
background-color: white;
z-index: 2; /*make it on top of the most content*/
}

.expand-transition {
  transition: all .3s ease;
  height: 30px;
  padding: 10px;
  background-color: #eee;
  overflow: hidden;
}
.expand-enter, .expand-leave {
  height: 0;
  padding: 0 10px;
  opacity: 0;
}

.header {
top: 100px;
padding: 6px 10px;
color: #999;
background-color: #f9f9f9;
z-index: 1; /*needed to make sort order dropdown box to show up on top of page-content*/
height: 40px;
}
.content {
top: 100px;
margin-top: 40px;
overflow-x: hidden; /*i can't figure out why there would be x scroll bar when a rule is active*/
}

.header, 
.content {
min-width: 500px;
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
.date {
float: right;
width: 110px;
text-align: right;
font-size: 88%;
line-height: 200%;
}</style>

