<template>
<div>
    <!--no instance contents-->
    <p v-if="!instances" class="loading"><icon name="cog" spin scale="1.5"/> Loading..</p>
    <div class="instances" v-if="instances">
        <!--instances list-->
        <div class="instances-header">

            <b-button-group style="background-color: white;">
                <b-button size="sm" variant="outline-secondary" :pressed="show == null" @click="show = null">
                    <span style="font-size: 80%;">All&nbsp;<b>{{instances.length}}</b></span>
                </b-button>
                <b-button size="sm" v-for="state in ['requested', 'running', 'finished', 'failed']"  :key="state"
                        :pressed="show == state" :variant="state2variant(state)" @click="show = state">
                        <span style="font-size: 80%;">{{state.toUpperCase()}}&nbsp;<b>{{instance_counts[state]||0}}</b></span>
                </b-button>
            </b-button-group>

            <div style="padding-top: 10px;">
                <div style="float: right;">
                    <!--<small><icon name="sort"/></small>-->
                    <b-dropdown :text="order" size="sm" right variant="outline-secondary">
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

                <div style="margin-right: 140px; position: relative;">
                    <icon name="search" style="position: absolute; top: 7px; left: 10px; color: #ccc;"/>
                    <b-form-input class="filter" 
                        @input="change_query"
                        :class="{'filter-active': query != ''}" 
                        size="sm" v-model="query" style="padding-left: 30px;">
                    </b-form-input>
                </div>
            </div>
            <div style="padding-top: 5px; padding-right: 5px;">
                <div class="date">
                    <small>Update Date</small>
                </div>
                <div class="date">
                    <small>Create Date</small>
                </div>
            </div>
        </div>

        <div class="instances-list" ref="instances-list">
            <!--no instances show help doc-->
            <div v-if="instances.length == 0" style="margin: 20px; opacity: 0.7">
                <p>Here, you can submit a series of Apps to analyze dataset one subject at a time.</p>
                <p>Output datasets will be removed within 25 days unless archived.</p>
                <p>To learn about how to submit processes, please refer to our <a href="https://brainlife.io/docs/user/process/" target="doc">Documentation</a>.</p>
                <a href="https://brainlife.io/docs/user/process/" target="doc">
                    <b-img src="https://brainlife.io/docs/img/processes.png" width="400px" thumbnail/>  
                </a>
            </div>
            <!--show list-->
            <div v-if="instances.length > 0">
                <div v-for="instance in sorted_and_filtered_instances" :key="instance._id" :id="instance._id" v-if="instance.config && !instance.config.removing">
                    <div class="instance-header" :class="instance_class(instance)" @click="toggle_instance(instance)" :id="instance._id+'-header'">
                        <div class="instance-status" :class="'instance-status-'+instance.status" style="float: left;">
                            <statusicon :status="instance.status" :scale="0.6" style="top: -3px"/>
                        </div>

                        <timeago :since="instance.update_date" :auto-update="10" class="date"/>
                        <timeago :since="instance.create_date" :auto-update="10" class="date"/>
                        <!--
                        <div v-if="instance == selected" class="process-action instance-info" style="float: right; position: relative; top: -3px; margin-right: 5px;">
                            <div @click.stop="editdesc(instance)" class="button">
                                <icon name="edit"/>
                            </div>
                            <div @click.stop="remove(instance)" class="button">
                                <icon name="trash"/>
                            </div>
                        </div>
                        -->
                        <div class="instance-desc">
                            <icon name="robot" v-if="instance.config.rule_subject" style="opacity: 0.5"/>
                            <!--<b>{{instance.name}}</b>-->
                            {{instance.desc}}
                            <span v-if="!instance.desc" style="opacity: 0.4;">No Description ({{instance._id}})</span>
                            &nbsp;
                            <div v-if="instance.config && instance.config.summary" style="display: contents; opacity: 0.8;">
                                <span v-for="summary in instance.config.summary" v-if="summary.service!='soichih/sca-product-raw' && summary.service!='brainlife/app-stage' && summary.name" 
                                    :class="summary_class(summary)" :title="summary.name+' (t.'+summary.tid+')'" @click.stop="select_task(instance, summary)" :key="summary.task_id">
                                    {{summary.name.substring(0,4).trim()}}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!--prevent list to hide add process list -->
            <br>
            <br>
            <br>
            <br>
            <br>
        </div>

        <b-button class="button-fixed" @click="newinstance" title="Create New Process"><icon name="plus" scale="2"/></b-button>     
    </div>
    <transition   
        name="fade">
        <process transition="slide" :project="project" :instance="selected" v-if="selected" class="process" 
                @updatedesc="updatedesc" @remove="toggle_instance(selected)"/>
        <p v-if="instances && !selected" class="nosel-note">Please create / select process to open.</p>  
    </transition>
</div>
</template>

<script>
import Vue from 'vue'

import 'perfect-scrollbar/css/perfect-scrollbar.css'
import PerfectScrollbar from 'perfect-scrollbar'

import statusicon from '@/components/statusicon'
import contact from '@/components/contact'
import process from '@/components/process'

import agreementMixin from '@/mixins/agreement'

import ReconnectingWebSocket from 'reconnectingwebsocket'

var debounce;
var ps;

export default {
    mixins: [agreementMixin],
    props: [ 'project' ], 
    components: { 
        statusicon, contact, process,
    },
    data () {
        return {
            instances: null,
            order: 'create_date', //default (new > old)
            show: null, //null == all
            
            selected: null,

            query: "",
            apps: null, //keyed by _id
            ws: null, //websocket

            config: Vue.config,
        }
    },

    computed: {
        sorted_and_filtered_instances: function() {
            //apply filter and query
            let filtered = this.instances.filter(i=>{
                //apply filter first
                if(this.query && !i.desc.toLowerCase().includes(this.query.toLowerCase())) return false; //filtered by query..

                if(!this.show) return true; //show all
                //if(this.selected == i) return true; //always show selected one
                if(i.status == this.show) return true;
                return false;
            });

            //then sort
            let order = 1;
            let field = this.order;
            if(field[0] == "-") {
                order = -1;
                field = field.substring(1); 
            } 
            return filtered.sort((a,b)=>{
                switch(field) {
                case "desc":
                    a = a.desc?a.desc.toUpperCase():"";
                    b = b.desc?b.desc.toUpperCase():"";
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

        instance_counts: function() {
            let counts = {};
            this.instances.forEach(i=>{
                //convert odd status into "others"
                let status = i.status;
                switch(status) {
                case "requested":
                case "running":
                case "finished":
                case "failed":
                    break;
                default:
                    status = "others";
                }
                if(!counts[status]) counts[status] = 1;
                else counts[status]+=1;
            });
            return counts;
        },

        instance_filter_label: function() {
            if(!this.show) return "All ("+this.instances.length+")";
            return this.capitalize(this.show)+" ("+(this.instance_counts[this.show]||0)+")";
        },

    },

    mounted: function() {
        this.load();
    },

    destroyed() {
        if(this.ws) {
            console.log("disconnecting from ws - processes");
            this.ws.close();
        }
    },

    watch: {
        project: function() {
            this.load();
        },

        order: function() {
            let group_id = this.project.group_id;
            window.localStorage.setItem("processes.order."+group_id, this.order);
        },
        
        show: function() {
            let group_id = this.project.group_id;
            if(this.show) window.localStorage.setItem("processes.show."+group_id, this.show);
            else window.localStorage.removeItem("processes.show."+group_id);
            this.$refs["instances-list"].scrollTop = 0;
        },

        '$route': function() {
            var subid = this.$route.params.subid;
            if(subid && this.instances) {
                var selected = this.instances.find(it=>it._id == subid);
                if(this.selected && this.selected._id != subid) {
                    //update
                    console.log("need to open different process", subid);
                    this.toggle_instance(selected);
                } else {
                    if(!this.selected) this.toggle_instance(selected);

                    //newly opened via router.. scroll to it
                    //TODO - I want to scroll to the instance that user open via router change, but since 
                    //route change happens whenever user clicks on the instance (not when it get redirected..) 
                    //so we can't handle it here..
                }
            } else {
                if(this.selected) {
                    //close
                    console.log("need to close opened instance");
                    this.toggle_instance(this.selected); //close it
                }
            }
        },
    },

    methods: {
        updatedesc(desc) {
            this.selected.desc = desc;
            clearTimeout(debounce);
            debounce = setTimeout(()=>{
                this.$http.put(Vue.config.wf_api+'/instance/'+this.selected._id, this.selected).then(res=>{
                    this.$notify({ text: 'Updated description', type: 'success' });
                });
            }, 500);
        },

        load() {
            this.check_agreements(this.project, ()=>{
                let group_id = this.project.group_id;
                this.order = window.localStorage.getItem("processes.order."+group_id)||"create_date";
                this.show = window.localStorage.getItem("processes.show."+group_id)||null;
                
                if(!this.$route.params.subid) {
                    let previous_instance = window.localStorage.getItem("processes.previous_instance."+group_id);
                    console.log("replacing to " + previous_instance);
                    if(previous_instance) {
                        this.$router.replace("./process/"+previous_instance);
                    }
                }

                this.load_instances(err=>{
                    if(err) return this.notify_error(err);
                    this.subscribe_instance_update(err=>{
                        if(err) return this.notify_error(err);
                    });
                });
            });
        },

        change_query() {
            this.$refs["instances-list"].scrollTop = 0;
        },

        capitalize(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },

        state2variant(state) {
            switch(state) {
            case "requested": return "outline-info";
            case "failed": return "outline-danger";
            case "finished": return "outline-success";
            case "running": return "outline-primary";
            case "others": return "outline-secondary";
            default: return "outline-warning";
            }
        },

        notify_error(err) {
            console.error(err);
            this.$notify({type: 'error', text: JSON.stringify(err)});
        },

        scrollto(instance) {
            var elem = document.getElementById(instance._id);
            var top = elem.offsetTop;
            if (this.$refs["instances-list"]) {
                this.$refs["instances-list"].scrollTop = top;
            }
        },

        toggle_instance(instance) {
            if(this.selected != instance) {
                //if jumping to instance below currently selected, I should adjust current scroll position
                this.$router.push("/project/"+this.project._id+"/process/"+instance._id);
                this.selected = instance;
                /*
                this.$nextTick(()=>{
                    this.scrollto(instance);
                });
                */
            } else {
                //close!
                this.$router.push("/project/"+this.project._id+"/process");
                /*
                this.$nextTick(()=>{
                    //if process header is outside or view, scroll back to it
                    var elem = document.getElementById(instance._id);
                    if(elem) { //could go missing
                        var top = elem.offsetTop;
                        var area = this.$refs["instances-list"];
                        if(elem.offsetTop < area.scrollTop) area.scrollTop = top;
                    }
                });
                */
                this.selected = null;
            }

            //reset previous_instance id
            if(this.selected) {
                window.localStorage.setItem("processes.previous_instance."+this.project.group_id, this.selected._id);
            } else {
                window.localStorage.removeItem("processes.previous_instance."+this.project.group_id);
            }
        },

        select_task(instance, summary) {
            if(this.selected != instance) {
                //not selected.. so let's open it first
                this.toggle_instance(instance);
            }
            this.$nextTick(()=>{
                this.$root.$emit('showtask', summary.task_id);
            });
        },

        newinstance() {
            var desc = prompt("Please enter process description");
            if(!desc) return;
            this.$http.post(Vue.config.wf_api+'/instance', {
                desc,
                config: {
                    brainlife: true,
                    //type: "v2", //deprecated..
                },
                group_id: this.project.group_id,
            }).then(res=>{
                let instance = res.data;
                this.instances.unshift(instance);
                this.toggle_instance(instance);
            }).catch(this.notify_error);
        },

        instance_class(instance) {
            let a = ["instance-header"];
            a.push("instance-"+instance.status);
            if(instance == this.selected) a.push("instance-active");
            return a;
        },

        load_instances(cb) {
            this.instances = null; 
            if(!this.project.group_id) {
                this.instances = [];
                return; //can't load for non-group project..
            }
            //console.log("loading instances for group", this.project.group_id);
            this.$http.get(Vue.config.wf_api+'/instance', {params: {
                find: JSON.stringify({
                    "config.brainlife": true,
                    status: {$ne: "removed"},
                    group_id: this.project.group_id,
                    "config.removing": {$exists: false},
                }),
                limit: 3000,
            }}).then(res=>{
                //debug.. 
                this.instances = res.data.instances;
                this.$nextTick(()=>{
                    ps = new PerfectScrollbar(this.$refs["instances-list"]);
                });

                this.selected = this.instances.find(it=>it._id == this.$route.params.subid);
                if(this.selected) {
                    this.$nextTick(()=>{
                        this.scrollto(this.selected);
                    });
                }
                if(cb) cb();
            }).catch(cb);
        },
        
        subscribe_instance_update(cb) {
            if(this.ws) this.ws.close();
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {/*debug: Vue.config.debug,*/ reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "wf.instance",
                        key: this.project.group_id+".#", 
                    }
                }));
                if(cb) cb();
            }
            this.ws.onmessage = (json)=>{
                var event = JSON.parse(json.data);
                if(event.dinfo && event.dinfo.exchange == "wf.instance") {
                    var idx = this.instances.findIndex(i=>i._id == event.msg._id);
                    if(~idx) {
                        if(event.msg.status == "removed") {
                            //removed!
                            this.instances.splice(idx, 1);
                        } else {
                            //must be normal update
                            for(var k in event.msg) this.instances[idx][k] = event.msg[k];
                        }
                    } else {
                        //new instance created by other user?
                        this.instances.unshift(event.msg);
                    }
                } 
                if(event.error) {   
                    console.error("failed to subscribe to instance event:", event.error);
                    this.notify_error(event.error);
                }
            }
        },

        summary_class(summary) {
            return ["summary", "summary-"+summary.status];
        },
        unique_user_ids(instance) {
            if(!instance.config) return [];
            if(!instance.config.summary) return [];

            let ids = [];
            instance.config.summary.forEach(summary=>{
                var id = summary.user_id;
                if(id && !ids.includes(id)) ids.push(id);
            });
            return ids;
    
        },
    },
}

</script>

<style scoped>
.loading {
margin: 40px;
opacity: 0.5;
font-size: 170%;
}
.instances {
position: fixed;
bottom: 0px;
top: 95px;
left: 200px;
right: 0px;
background-color: #bbb;
}
.instances-header {
padding: 10px;
position: fixed;
height: 110px;
top: 95px;
left: 200px;
width: 500px;
background-color: #f6f6f6;
z-index: 1; /*for dropdown menu to go on top*/
}
.instances-list {
position: fixed;
bottom: 0px;
top: 205px;
left: 200px;
width: 500px;
background-color: white;
}

.process {
position: fixed;
top: 95px;
bottom: 0px;
left: 700px;
right: 0px;
background-color: #eee;
overflow: auto;
}

.instance-header {
border-bottom: 1px solid rgba(0,0,0,0.1);
padding: 4px 15px;
color: #333;
/*transition: background-color 0.2s, color 0.2s;*/
}

.instance-info {
display:inline-block;
vertical-align:middle;
}
.instance-header:hover {
cursor: pointer;
background-color: #eee;
}
.instance-header.instance-active {
color: white;
background-color: #007bff;
/*box-shadow: 0 0 5px #aaa;*/
}
.instance-desc {
font-size: 90%;
padding-left: 3px;
margin-left: 25px;
}

.button-fixed {
left: 600px;
}

.table-header th {
padding: 8px 0px;
}

.process-action {
display: none;
opacity: 0;
transition: opacity 0.5s;
}

.instance-status {
width: 16px;
height: 16px;
text-align: center;
border-radius: 8px;
display: inline-block;
background-color: gray;
margin-right: 10px;
color: white;
}

.instance-finished .instance-status {
background-color: #28a745;
}

.instance-failed .instance-status {
background-color: #dc3545;
}

.instance-warning .instance-status {
background-color: #ffc107;
}

.instance-removed .instance-status {
background-color: #868e96;
}

.instance-undefined .instance-status {
background-color: #464a4e;
}

.instance-requested .instance-status {
background-color: #50bfff;
}

.instance-running .instance-status {
background-color: #007bff;
}

.status-toggler {
display: inline-block;
}
.summary {
color: white;
background-color: gray;
padding: 2px 3px;
text-align: center;
position: relative;
margin-right: 2px;
font-size: 65%;
top: -2px;
display: inline-block;
transition: background-color 0.3s;
border-radius: 10%;
}
.summary:hover {
background-color: white;
color: black;
}
.summary-running {
background-color: #007bff;
}
.summary-failed {
background-color: #dc3545;
}
.summary-stopped {
background-color: #999;
}
.summary-waiting,
.summary-requested {
background-color: #50bfff;
}
.summary-finished {
background-color: #28a745;
}

.date {
float: right;
width: 110px;
text-align: right;
font-size: 88%;
margin-right: 10px;
opacity: 0.7;
}
#scrolled-area {
overflow-x: hidden;
}
.process-count {
margin-top: 5px; 
margin-left: 10px; 
display: inline-block;
}
@media (max-width: 1000px) {
    .process-count {
        display: none;
    }
}
.filter.filter-active {
background-color: #2693ff40;
}
.nosel-note {
position: fixed;
top: 95px;
bottom: 0px;
left: 700px;
right: 0px;
overflow: auto;
padding: 30px;
font-size: 125%;
}

</style>
