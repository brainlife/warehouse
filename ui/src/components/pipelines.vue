<template>
<div v-if="ready">
    <div v-if="!editing && rules.length > 0" class="page-header with-menu header">
        <b-row :no-gutters="true">
            <b-col>
                <b>{{rules.length}}</b> Pipeline Rules
            </b-col>
            <b-col :cols="4" style="position: relative; top: -5px; text-align: right;">
                <small>Order by</small>
                <b-dropdown :text="order" size="sm" :variant="'light'">
                    <b-dropdown-item @click="order = 'create_date'">Create Date (new first)</b-dropdown-item>
                    <b-dropdown-item @click="order = '-create_date'">Create Date (old first)</b-dropdown-item>
                    <b-dropdown-divider></b-dropdown-divider>
                    <b-dropdown-item @click="order = 'update_date'">Update Date (new first)</b-dropdown-item>
                    <b-dropdown-item @click="order = '-update_date'">Update Date (old first)</b-dropdown-item>
                    <b-dropdown-divider></b-dropdown-divider>
                    <b-dropdown-item @click="order = '-desc'">Description (a-z)</b-dropdown-item>
                    <b-dropdown-item @click="order = 'desc'">Description (z-a)</b-dropdown-item>
                </b-dropdown>
            </b-col>
            <b-col :cols="2" style="text-align: right;">
                <div class="date">Create Date</div>
            </b-col>
            <b-col :cols="2" style="text-align: right;">
                <div class="date">Update Date</div>
            </b-col>
        </b-row>
    </div>
    <ruleform :value="editing" v-if="editing" @cancel="cancel_edit" @submit="submit"/>
    <div v-else class="page-content with-menu content" ref="scrolled">
        <!--list view-->
        <div class="margin20" v-if="rules.length == 0">
            <p class="text-muted">Pipeline rule allows you to automate bulk submission of your processes based on defined criterias.</p>
            <p class="text-muted">This feature could potentially launch large number of processes. Please read our <a href="https://brainlife.io/docs/user/pipeline/" target="doc">Documentation</a> for more information.</p>
        </div>
        <div class="rules">
            <div v-for="rule in sorted_rules" :key="rule._id" :id="rule._id" :class="{'rule-removed': rule.removed, 'rule-selected': selected == rule, 'rule-inactive': !rule.active}" class="rule" v-if="rule.removed == false">
                <div class="rule-header" @click="toggle(rule)">
                    <b-row :no-gutters="true">
                        <b-col :cols="2" @click.stop="">
                            <b-form-checkbox switch v-model="rule.active" name="Online" @change="flip_switch(rule)" :disabled="rule.deactivating">
                                <b style="position: relative; top: 3px;">
                                    <span v-if="rule.active" class="text-primary">Online</span>
                                    <span v-else class="text-secondary">Offline</span>
                                </b>
                            </b-form-checkbox>
                        </b-col>
                        <b-col :cols="4">
                            <span>{{rule.app.name}}</span>
                            <small style="opacity: 0.5">{{rule.name}}</small>
                        </b-col>
                        <b-col :cols="2">
                            <!--<contact :id="rule.user_id" size="tiny"/>-->
                            <span v-if="rule.subject_match" title="Only handle subjects that matches this regex">
                                <icon name="filter" scale="0.8"/> <b>{{rule.subject_match}}</b>
                            </span>
                        </b-col>
                        <b-col :cols="2" style="text-align: right;">
                            <timeago :since="rule.create_date" :auto-update="10"/>
                        </b-col>
                        <b-col :cols="2" style="text-align: right;">
                            <timeago :since="rule.update_date" :auto-update="10"/>
                        </b-col>
                    </b-row>
                </div>

                <!--rule body-->
                <div v-if="selected == rule" transition="expand">
                    <!--
                    <div v-if="rule.active" style="margin: 0px 10px;">
                        <b-btn @click="deactivate(rule)" variant="outline-danger" size="sm" v-if="!rule.deactivating"><icon name="times"/> Deactivate </b-btn>
                        <b-btn variant="outline-danger" size="sm" v-if="rule.deactivating"><icon name="cog" :spin="true"/> Deactivating</b-btn>
                        <small style="opacity: 0.8; padding: 10px;"><b>{{rule.activetaskcount||0}}</b> Active Tasks</small>
                    </div>
                    <div v-else style="margin: 0px 10px;">
                        <b-btn @click="activate(rule)" variant="outline-success" size="sm" v-if="!rule.active"><icon name="play"/> Activate </b-btn>
                    </div>
                    -->

                    <div class="rule-body">
                        <div class="section-header">
                            <div style="float: right; position: relative; top: -4px;">
                                <div class="button" @click="copy(rule)" v-if="ismember() || isadmin()" size="sm" title="copy"><icon name="copy"/></div>
                                <div class="button" @click="edit(rule)" v-if="ismember() || isadmin()" size="sm" title="edit"><icon name="edit"/></div>
                                <div class="button" @click="remove(rule)" v-if="ismember() || isadmin()" size="sm" title="remove"><icon name="trash"/></div>
                            </div>
                            Submit the following App <small style="opacity: 0.5;">and archive all output datasets to this project</small>
                        </div>
                        <b-row>
                            <b-col>
                                <app :app="rule.app" :compact="true" :clickable="false" style="margin-left: 10px; margin-bottom: 10px;" :branch="rule.branch||'master'"/>
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

                        <div class="section-header">
                            On
                            <div style="display: inline-block; width: 300px;">
                                <b-input-group prepend="Subjects" size="sm" title="Only process subjects that matches this regex">
                                    <b-form-input v-model="rule.subject_match_edit" type="text" placeholder="(All)"></b-form-input>
                                    <b-input-group-append v-if="rule.subject_match != rule.subject_match_edit">
                                        <b-btn variant="primary" @click="update_subject_match(rule)"><icon name="check"/></b-btn>
                                        <!-- <b-btn variant="secondary" @click="rule.subject_match_edit = rule.subject_match;">Cancel</b-btn> -->
                                    </b-input-group-append>
                                </b-input-group>
                            </div>
                            <small style="opacity: 0.5">(regex)</small>
                            that have the following set of archived datasets
                        </div>
                        <div style="margin-left: 30px;">
                            <p v-for="input in rule.app.inputs" :key="input.id">
                                <small style="float: right; margin-right: 10px;">{{input.id}}</small>
                                <datatypetag :datatype="datatypes[input.datatype]" :tags="all_datatype_tags(rule, input)" v-if="datatypes"/>
                                <span v-if="rule.input_tags && rule.input_tags[input.id] && rule.input_tags[input.id].length > 0" style="opacity: 0.8">
                                    <!--<small class="text-muted">with tags</small> <tags :tags="rule.input_tags[input.id]"/>-->
                                    <small v-for="(tag,idx) in rule.input_tags[input.id]" :key="idx"> | {{tag}}</small>
                                </span>
                                <span v-if="rule.input_project_override && rule.input_project_override[input.id] && projects[rule.input_project_override[input.id]]" class="text-muted">
                                    <icon style="opacity: 0.5; margin: 0 5px" name="arrow-left" scale="0.8"/><small>from</small> <icon name="shield-alt"/> {{projects[rule.input_project_override[input.id]].name}}
                                </span>
                                <b v-if="rule.input_selection && rule.input_selection[input.id]">{{rule.input_selection[input.id]}}</b>
                            </p>
                        </div>

                        <div class="section-header">
                            If the following output datasets are missing
                        </div>
                        <div style="margin-left: 30px;">
                            <p v-for="output in rule.app.outputs" :key="output.id">
                                <small style="float: right; margin-right: 10px">{{output.id}}</small>
                                <datatypetag :datatype="datatypes[output.datatype]" :tags="output.datatype_tags" v-if="datatypes"/>
                                <span class="opacity: 0.7" v-if="rule.output_tags && rule.output_tags[output.id] && rule.output_tags[output.id].length > 0">
                                    <!--<small class="text-muted">with dataset tags of</small> <tags :tags="rule.output_tags[output.id]"/>-->
                                    <small v-for="(tag,idx) in rule.output_tags[output.id]" :key="idx"> | {{tag}}</small>
                                </span>
                            </p>
                        </div>

                        <div class="section-header">Log</div>
                        <rulelog :id="rule._id"/>
                        <br>
                    </div>
                    <br>
                </div>
            </div><!--rule-->
        </div><!--rules-->

        <p style="padding-top: 90px;">&nbsp;</p>
        <b-button v-if="isadmin() || ismember()" @click="newrule" class="button-fixed" title="Create new rule">
            <icon name="plus" scale="2"/>
        </b-button>
    </div><!--page-content-->
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

const async = require("async");

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
            order: 'create_date', //default (new > old)

            ready: false,

            rules: null, 
            datatypes: null,
            projects: null,

            //activetaskcount_int: null,

            config: Vue.config,
        }
    },

    mounted() {
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
        order: function() {
            let group_id = this.project.group_id;
            window.localStorage.setItem("pipelines.order."+group_id, this.order);
        },

        selected: function() {
            if(!this.selected) return;
            Vue.set(this.selected, 'subject_match_edit', this.selected.subject_match);

            /*
            //start activetaskcount query
            if(this.activetaskcount_int) clearInterval(this.activetaskcount_int);
            this.activetaskcount_int = setInterval(()=>{
                this.get_activetaskcount();    
            }, 5000);
            this.get_activetaskcount();
            */
        },
    },

    computed: {
        sorted_rules() {

            //then sort
            let order = 1;
            let field = this.order;
            if(field[0] == "-") {
                order = -1;
                field = field.substring(1); 
            } 
            return this.rules.sort((a,b)=>{
                switch(field) {
                case "desc":
                    a = a.name?a.name.toUpperCase():"";
                    b = b.name?b.name.toUpperCase():"";
                    break;

                //deprecated
                case "date": 
                    a = a.create_date?new Date(a.create_date):null;
                    b = b.create_date?new Date(b.create_date):null;
                    break;

                case "create_date": 
                    a = a.create_date?new Date(a.create_date):null;
                    b = b.create_date?new Date(b.create_date):null;
                    break;

                case "update_date": 
                    a = a.update_date?new Date(a.update_date):null;
                    b = b.update_date?new Date(b.update_date):null;
                    break;

                default: 
                    throw("no such field");
                }
                if(a < b) return order;
                if(a > b) return -(order);
                return 0;
            });
        },

    },

    methods: {
        /*
        get_activetaskcount() {
            if(!this.selected) return;
            //console.log("querying activetaskcount");
            //load number of tasks submitted by this rule (and active)
            this.$http.get(Vue.config.amaretti_api+"/task", {params: {
                find: JSON.stringify({
                    'config._rule.id': this.selected._id,
                    'config._app': {$exists: true}, //don't count number of staging
                    status: {$in: ["running", "running_sync", "requested"] }, //count active
                    //status: {$ne: "removed"},
                }),

                limit: 0, //I just need a count.
            }})
            .then(res=>{
                Vue.set(this.selected, 'activetaskcount', res.data.count);
            });  
        },
        */
        load(cb) {
            let group_id = this.project.group_id;
            this.order = window.localStorage.getItem("pipelines.order."+group_id)||"create_date";

            this.ready = false;
            this.$http.get('rule', {params: {
                find: JSON.stringify({
                    project: this.project._id,
                    removed: false,
                }),
                populate: 'app', 
                sort: 'create_date', 
            }})
            .then(res=>{
                this.rules = res.data.rules; 
                if(this.$route.params.subid) {
                    this.editing = this.rules.find(rule=>rule._id == this.$route.params.subid);
                }

                //TODO - why is this needed?
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
                res.data.datatypes.forEach(datatype=>{
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
                res.data.projects.forEach(project=>{
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

        notify_error(err) {
            console.error(err);
            console.error(err.status);
            this.$notify({type: 'error', text: err.body.message||err.status});
        },

        newrule() {
            //set to default
            this.editing = {
                name: "",
                config: {},
                project: this.project._id,
                active: false,
                removed: false,
            };
            this.$refs.scrolled.scrollTop = 0;
        },

        edit(rule) {
            if(rule.active) return alert("Please stop the rule before editing it");
            this.$router.push("/project/"+this.project._id+"/pipeline/"+rule._id);
            this.$refs.scrolled.scrollTop = 0;
            this.editing = rule;
            this.selected = rule; //I think it makes sense to select rule that user is editing?
        },

        copy(rule) {
            this.editing = Object.assign({}, rule);
            delete this.editing._id;
            this.editing.name = rule.name+" - copy";
            this.editing.active = false; //should deactivate if it's active
        },

        update_subject_match(rule) {
            Vue.set(rule, 'subject_match', rule.subject_match_edit);
            this.$http.put('rule/'+rule._id, rule).then(res=>{
                this.$notify({type: "success", text: "Updated filter"});
            }).catch(this.notify_error);
        },

        cancel_edit() {
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

        submit(rule) {
            rule.project = this.project._id; //rule editor doesn't set project id.
            console.log("submitting rule");
            console.dir(rule);
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
                    this.selected = res.data;
                    this.load(err=>{
                        this.$notify({text: "Successfully created a new rule. You must activate it so that it will run", type: "success"});
                        this.cancel_edit();
                    });
                }).catch(this.notify_error);
            }
        },

        remove(rule) {
            if(rule.active) return alert("Please stop the rule before removing it");
            if(confirm("Do you really want to remove this rule?")) {
                this.$http.delete('rule/'+rule._id)
                .then(res=>{
                    rule.removed = true;
                    this.$notify({text: "Removed!", type: "success"});
                });
            }
        },

        toggle(rule) {
            console.log("toggling");
            if(this.selected == rule) {
                this.selected = null;
            } else {
                this.selected = rule;
                Vue.nextTick(()=>{
                    //scroll to the selected rule (TODO - I think I should delay until animation is over?)
                    var elem = document.getElementById(rule._id);
                    this.$refs.scrolled.scrollTop = elem.offsetTop;
                });
            }
        },

        all_datatype_tags(rule, input) {
            let tags = input.datatype_tags;
            if(rule.extra_datatype_tags) tags = tags.concat(rule.extra_datatype_tags[input.id]);
            return tags;
        },
    
        flip_switch(rule) {
            if(rule.active) {
                //deactivate
                Vue.set(rule, 'deactivating', true);
                this.$notify({ title: 'Deactivating', text: 'Deactivating this rule and all tasks submitted from it', type: 'info', });
                this.$http.put('rule/deactivate/'+rule._id).then(res=>{
                    rule.deactivating = false;
                    this.$notify({ title: 'Deactivating', text: 'Successfully deactivated', type: 'success', });
                }).catch(this.notify_error);
            } else {
                //activate
                this.$http.put('rule/'+rule._id, {active: true}).then(res=>{
                    this.$notify({ title: 'Activating', text: 'Successfully activated', type: 'success', });
                }).catch(this.notify_error);
            }

            return true; //stop prop
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
.rule.rule-selected {
margin: 0px;
background-color: #f0f0f0;
margin-bottom: 20px;
box-shadow: none;
}
.rule.rule-selected .rule-header {
margin-bottom: 10px;
background-color: #f0f0f0;
}
.rule.rule-inactive .rule-header {
background-color: #ddd;
}
.rule.rule-inactive {
background-color: #eee;
}
.rule-header {
cursor: pointer;
transition: background-color 0.3s;
padding: 7px;
padding-top: 10px;

font-size: 88%;
}
.rule-header .custom-switch {
top: -2px;   
}
.rule.rule-selected .rule-header {
padding: 15px;
position: sticky;
top: 0px;
z-index: 5; /*make it on top of the most content*/
}
.rule.rule-selected:not(:first-child) .rule-header {
margin-top: 20px;
}
.rule-body {
margin-right: 100px; 
background-color: white; 
clear: both;
}
.rule.rule-selected .rule-body {
box-shadow: 2px 2px 3px rgba(0,0,0,0.2);
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
.rule-header:hover {
cursor: pointer;
background-color: #eee;
}

.header {
top: 95px;
padding: 10px;
margin: 0px 20px;
color: #999;
background-color: #f9f9f9;
z-index: 1; /*needed to make sort order dropdown box to show up on top of page-content*/
height: 40px;
}
.content {
top: 95px;
margin-top: 40px;
overflow-x: hidden; /*i can't figure out why there would be x scroll bar when a rule is active*/
}

.header, 
.content {
min-width: 500px;
}
.config {
background-color: #f9f9f9;
}
.date {
font-size: 80%;
}
.section-header {
background-color: #ddd; 
clear: both; 
padding: 10px; 
margin-bottom: 10px;
}
</style>

