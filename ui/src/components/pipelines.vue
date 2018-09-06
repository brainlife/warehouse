<template>
<div v-if="ready">
    <div v-if="!editing" class="page-header with-menu header">
        <div style="margin-top: 2px; margin-left: 10px;">
            <div v-if="rules.length > 0" style="float: right">
                <div style="display: inline-block;">
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
                </div>
                <div class="date">Create Date</div>
                <div class="date">Update Date</div>
            </div>
            <b>{{rules.length}}</b> Pipeline Rules
        </div>
    </div>
    <ruleform :value="editing" v-if="editing" @cancel="cancel_edit" @submit="submit"/>
    <div v-else class="page-content with-menu content" ref="scrolled">
        <!--list view-->
        <div class="margin20" v-if="rules.length == 0">
            <p class="text-muted">Pipeline rule allows you to automate bulk submission of your processes based on defined criterias.</p>
            <p class="text-muted">This feature could potentially launch large number of processes. Please read our <a href="https://brain-life.github.io/docs/user/pipeline/" target="doc">Documentation</a> for more information.</p>
        </div>
        <div class="rules">
            <div v-for="rule in sorted_rules" :key="rule._id" :id="rule._id" :class="{'rule-removed': rule.removed, 'rule-selected': selected == rule, 'rule-active': rule.active}" class="rule" v-if="rule.removed == false">
                <div class="rule-header" @click="toggle(rule)">
                    <div style="float: right; width: 110px; text-align: right;">
                        <timeago :since="rule.update_date" :auto-update="10"/>
                    </div>
                    <div style="float: right; width: 110px; text-align: right;">
                        <timeago :since="rule.create_date" :auto-update="10"/>
                    </div>
                    <div style="float: right;">
                        <contact :id="rule.user_id" size="tiny"/>
                    </div>
                    <div>
                        <!--
                        <div class="bg-dark" style="color: white; float:left; width: 60px" v-if="rule.removed" variant="danger">Removed</div>
                        -->
                        <div class="bg-success" style="color: white; float:left; padding: 0px 5px;" v-if="rule.active">Active</div>
                        <div class="bg-danger" style="color: white; float:left; padding: 0px 5px;" v-else>Inactive</div>
                        <div style="margin-left: 80px">
                            <span>{{rule.app.name}}</span>
                            <small style="opacity: 0.5">{{rule.name}}</small>
                        </div>
                    </div>
                </div>

                <!--rule body-->
                <div v-if="selected == rule" transition="expand">
                    <div style="padding: 10px;">
                        <span style="float: right; margin-right: 90px;">
                            <b-btn @click="edit(rule)" v-if="ismember() || isadmin()" size="sm"><icon name="edit"/></b-btn>
                            <b-btn @click="remove(rule)" v-if="ismember() || isadmin()" size="sm" variant="danger"><icon name="trash"/></b-btn>
                        </span>
                        <span>
                            <b-btn @click="deactivate(rule)" variant="danger" size="sm" v-if="rule.active && !deactivating"><icon name="times"/> Deactivate </b-btn>
                            <b-btn variant="danger" size="sm" v-if="deactivating"><icon name="times"/> Deactivating <b-badge>{{deactivating_remain}}</b-badge></b-btn>
                            <b-btn @click="activate(rule)" variant="success" size="sm" v-if="!rule.active"><icon name="play"/> Activate</b-btn>
                        </span>
                    </div>

                    <div style="margin-right: 100px; background-color: white; box-shadow: 0px 2px 4px #ccc">
                        <div class="section-header">
                            Submit the following App and archive all output datasets to this project
                        </div>
                        <b-row>
                            <b-col>
                                <app :app="rule.app" :compact="true" :clickable="false" style="margin-left: 10px; margin-bottom: 10px;"/>
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
                            On subjects with the following set of archived datasets
                        </div>
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

                        <div class="section-header">
                            Only if the following output datasets aren't archived for the subject yet
                        </div>
                        <div style="margin-left: 30px;">
                            <p v-for="output in rule.app.outputs" :key="output.id">
                                <small style="float: right; margin-right: 10px">{{output.id}}</small>
                                <datatypetag :datatype="datatypes[output.datatype]" :tags="output.datatype_tags" v-if="datatypes"/>
                                <span v-if="rule.output_tags && rule.output_tags[output.id] && rule.output_tags[output.id].length > 0">
                                    <small class="text-muted">with dataset tags of</small> <tags :tags="rule.output_tags[output.id]"/>
                                </span>
                            </p>
                        </div>

                        <div class="section-header">Log</div>
                        <rulelog :id="rule._id"/>
                    </div>
                    <br>
                </div>
            </div><!--rule-->
        </div><!--rules-->

        <p style="padding-top: 100px;">&nbsp;</p>
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

            deactivating: null,
            deactivating_remain: null,

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
        order: function() {
            let group_id = this.project.group_id;
            window.localStorage.setItem("pipelines.order."+group_id, this.order);
        },
    },

    computed: {
        sorted_rules() {

            /*
            //apply filter
            let filtered = this.instances.filter(i=>{
                if(!this.show) return true; //show all
                if(this.selected == i) return true; //always show selected one
                if(i.status == this.show) return true;
                return false;
            });
            */
    
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
        load: function(cb) {
            let group_id = this.project.group_id;
            this.order = window.localStorage.getItem("pipelines.order."+group_id)||"create_date";

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
                active: true,
                removed: false,
            };
            this.$refs.scrolled.scrollTop = 0;
        },

        edit(rule) {
            if(rule.active) return alert("Please deactivate the rule before editing it");
            this.$router.push("/project/"+this.project._id+"/pipeline/"+rule._id);
            this.$refs.scrolled.scrollTop = 0;
            this.editing = rule;
            this.selected = rule; //I think it makes sense to select rule that user is editing?
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

        remove(rule) {
            if(rule.active) return alert("Please deactivate the rule before removing it");
            if(confirm("Do you really want to remove this rule?")) {
                this.$http.delete('rule/'+rule._id)
                .then(res=>{
                    rule.removed = true;
                    this.$notify({text: "Removed!", type: "success"});
                });
            }
        },

        toggle(rule) {
            if(this.selected == rule) {
                this.selected = null;
            } else {
                this.selected = rule;
                Vue.nextTick(()=>{
                    //scroll to the selected rule (TODO - I think I should delay until animation is over?)
                    var elem = document.getElementById(rule._id);
                    this.$refs.scrolled.scrollTop = elem.offsetTop;
                });

                /*
                //load task info for this rule
                this.$http.get(Vue.config.amaretti_api+"/task", {params: {
                    find: JSON.stringify({
                        'config._rule.id': rule._id
                    }),
                    limit: 0, //I just need a count
                }})
                .then(res=>{
                    this.rule_task_count = res.body.count;
                });
                */
            }
        },

        activate(rule) {
            this.$http.put('rule/'+rule._id, {active: true}).then(res=>{
                rule.active = true;
            }).catch(this.notify_error);
        },

        deactivate(rule) {
            //see if any tasks should be removed
            this.$http.get(Vue.config.amaretti_api+"/task", {params: {
                find: JSON.stringify({
                    'config._rule.id': rule._id,
                    status: {$ne: "removed"},
                }),
                limit: 5000, //big enough to grab all tasks?
            }})
            .then(res=>{
                if(res.body.count > 0) {
                    if(confirm("Deactivating rule will remove "+res.body.count+" active tasks submitted by this rule. Should we proceed?")) {
                        this.deactivating = rule;
                        this.deactivating_remain = res.body.count;
                        this.$notify({ title: 'Removing Task', text: 'Removing'+res.body.count+' tasks', type: 'info', });

                        async.eachSeries(res.body.tasks, (task, next_task)=>{
                            console.log("removing", task._id);
                            this.$http.delete(Vue.config.wf_api+'/task/'+task._id).then(res=>{
                                this.deactivating_remain--;
                                next_task();
                            }).catch(next_task);
                        }, err=>{
                            if(err) return this.notify_error(err);
                            this.$notify({ title: 'Removing Task', text: 'Removed '+res.body.count+' tasks', type: 'success', });
                            //console.log("now deactivating rule");
                            this.$http.put('rule/'+rule._id, {active: false}).then(res=>{
                                rule.active = false;
                                this.deactivating = null;
                            }).catch(this.notify_error);
                        });
                    }
                } else {
                    this.$http.put('rule/'+rule._id, {active: false}).then(res=>{
                        rule.active = false;
                        this.$notify({ text: 'Rule has been deactivated', type: 'success'});
                    }).catch(this.notify_error);
                }
            });
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
.rule.rule-selected .rule-header,
.rule.rule-selected {
margin: 0px;
background-color: #f0f0f0;
}
.rule-header {
cursor: pointer;
transition: background-color 0.3s;
padding: 7px;
font-size: 88%;
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
.rule.rule-selected {
margin-bottom: 20px;
box-shadow: none;
}
.rule-header:hover {
cursor: pointer;
background-color: #eee;
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
.config {
background-color: #f9f9f9;
}
.date {
width: 110px;
text-align: right;
font-size: 70%;
line-height: 200%;
display: inline-block;
position: relative;
right: 25px;
}
.section-header {
background-color: #eee; 
clear: both; 
padding: 10px; 
margin-bottom: 10px;
}
</style>

