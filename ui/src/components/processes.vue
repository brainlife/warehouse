<template>
<div v-if="instances" class="processes">
    <div class="page-header">
        <div style="margin-top: 2px; margin-left: 10px; display: inline-block;">
            <b>{{instances.length}}</b> Processes
        </div>

        <div v-if="instances.length > 1" style="float: right; position: relative; top: -3px;"> 
            <div style="display: inline-block; margin-right: 10px;">
                <small>Show</small>
                <div class="status-toggler">
                    <b-button size="sm" variant="outline-secondary" :pressed="show == null" @click="show = null">All ({{instances.length}})</b-button>
                    <b-button size="sm" v-for="state in ['running', 'finished', 'failed']"  :key="state"
                            :pressed="show == state" :variant="state2variant(state)" @click="show = state">
                            {{state}} ({{instance_counts[state]||0}})
                    </b-button>
                </div>
            </div>

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
        </div>
    </div>
    <div class="instances" id="scrolled-area" ref="scrolled_area">
        <div class="text-muted margin20" v-if="instances.length == 0">
            <p>Here, you can submit series of apps with shared input and output datasets.</p>
            <p>Output datasets will be removed within 25 days. Please archive any output dataset you'd like to keep.</p>
            <p>To learn about how to submit processes, please refer to our <a href="https://brain-life.github.io/docs/user/process/" target="doc">Documentation</a>.</p>
            <!--
            <b-alert variant="warning" show>You should avoid mixing datasets from different subject on a process. Create separate process for each subject.</b-alert>
            -->
        </div>

        <br>
        <div v-if="instances.length > 0">
            <div v-for="instance in sorted_and_filtered_instances" :key="instance._id" :id="instance._id" v-if="instance.config && !instance.config.removing" class="instance-item">
                <div class="instance-header" :class="instance_class(instance)" @click="toggle_instance(instance)" :id="instance._id+'-header'">
                    <b-row>
                        <b-col :cols="1">
                            <div class="instance-status instance-info" :class="'instance-status-'+instance.status">
                                <statusicon :status="instance.status"/>
                            </div>
                        </b-col>
                        <b-col :cols="5">
                            <div class="instance-desc">
                                {{instance.desc}}
                                <span v-if="!instance.desc" style="opacity: 0.4;">No Description ({{instance._id}})</span>
                                <div v-if="instance.config && instance.config.summary" style="display: inline-block; margin-left: 10px; opacity: 0.8;">
                                    <span v-for="summary in instance.config.summary" v-if="summary.service != 'soichih/sca-product-raw'" :class="summary_class(summary)"> 
                                        <span v-if="summary.name" :title="summary.name">{{summary.name.substring(0,4).trim()}}</span>
                                    </span>
                                </div>
                            </div>
                        </b-col>
                        <b-col :cols="6" style="text-align:right;">
                            <div class="instance-info">
                                <contact :id="instance.user_id" short="true"/>
                            </div>
                            <div class="process-action instance-info" style="margin-right: 20px; position: relative; top: -4px">
                                <div @click.stop="editdesc(instance)" class="button">
                                    <icon name="edit"/>
                                </div>
                                <div @click.stop="remove(instance)" class="button">
                                    <icon name="trash"/>
                                </div>
                            </div>
                            <div style="width: 130px;" class="text-muted instance-info">
                                <timeago :since="instance.create_date" :auto-update="10"/>
                            </div>
                        </b-col>
                    </b-row>
                </div>
                <process v-if="instance == selected" :project="project" :instance="instance" class="process" ref="process" />
            </div>
        </div>
        <br>
    </div>
    <b-button class="button-fixed" @click="newinstance" title="Create New Process"><icon name="plus" scale="2"/></b-button>
</div>
<p v-else class="loading"><icon name="cog" spin scale="1.5"/> Loading..</p>
</template>

<script>
import Vue from 'vue'

import statusicon from '@/components/statusicon'
import contact from '@/components/contact'
import process from '@/components/process'

import agreementMixin from '@/mixins/agreement'

import ReconnectingWebSocket from 'reconnectingwebsocket'

var debounce = null;

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

            //apply filter
            let filtered = this.instances.filter(i=>{
                if(!this.show) return true; //show all
                if(this.selected == i) return true; //always show selected one
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
            /*
            return this.instances.reduce((count, it)=>{
                if(it.status == status) return count+1;
                return count; 
            });
            */
            let counts = {};
            this.instances.forEach(i=>{
                //convert odd status into "others"
                let status = i.status;
                switch(status) {
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
        },

        '$route': function() {
            var subid = this.$route.params.subid;
            if(subid) {
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
        load: function() {
            this.check_agreements(this.project, ()=>{
                let group_id = this.project.group_id;
                this.order = window.localStorage.getItem("processes.order."+group_id)||"date";
                this.show = window.localStorage.getItem("processes.show."+group_id)||null;
                this.load_instances(err=>{
                    if(err) return this.notify_error(err);
                    this.subscribe_instance_update(err=>{
                        if(err) return this.notify_error(err);
                    });
                });
            });
        },

        capitalize: function(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },

        state2variant: function(state) {
            switch(state) {
            case "failed": return "outline-danger";
            case "finished": return "outline-success";
            case "running": return "outline-primary";
            case "others": return "outline-secondary";
            default: return "outline-warning";
            }
        },

        notify_error: function(err) {
            console.error(err);
            this.$notify({type: 'error', text: err.body.message});
        },

        scrollto: function(instance) {
            var elem = document.getElementById(instance._id);
            var top = elem.offsetTop;
            if (this.$refs.scrolled_area) {
                this.$refs.scrolled_area.scrollTop = top;
            }
        },

        toggle_instance: function(instance) {
            if(this.selected != instance) {
                //if jumping to instance below currently selected, I should adjust current scroll position
                this.$router.push("/project/"+this.project._id+"/process/"+instance._id);
                this.selected = instance;
                this.$nextTick(()=>{
                    this.scrollto(instance);
                });
            } else {
                this.$router.push("/project/"+this.project._id+"/process");
                this.$nextTick(()=>{
                    //if process header is outside or view, scroll back to it
                    var elem = document.getElementById(instance._id);
                    if(elem) { //could go missing
                        var top = elem.offsetTop;
                        var area = this.$refs.scrolled_area;
                        if(elem.offsetTop < area.scrollTop) area.scrollTop = top;
                    }
                });
                this.selected = null;
            }
        },

        editdesc: function(instance) {
            //Vue.set(instance, 'edit', true);
            var desc = prompt("Please enter description", instance.desc);
            if(desc != null) {
                Vue.set(instance, 'desc',  desc);
                this.$http.put(Vue.config.wf_api+'/instance/'+instance._id, instance).then(res=>{
                    this.$notify({ text: 'Updated description', type: 'success' });
                });
            }
        },

        newinstance: function() {
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
                let instance = res.body;
                this.instances.unshift(instance);
                this.toggle_instance(instance);
            }).catch(err=>{
                console.error(err);
                this.$notify({type: 'error', text: err.body.message});
            });
        },

        remove: function(instance) {
            if(confirm("Do you really want to remove this process and all tasks?")) {
                //unselect
                if(this.selected == instance) this.toggle_instance(instance);

                //remove from UI 
                var idx = this.instances.indexOf(instance);
                this.instances.splice(idx, 1);

                //remove for real
                this.$http.delete(Vue.config.wf_api+'/instance/'+instance._id).then(res=>{
                    this.$notify({type: "success", text: "Removed the process"});
                }).catch(err=>{
                    //failed to remove it.. put it back to UI
                    this.instances.push(instance); 
                    console.error(err);
                    this.$notify({type: 'error', text: err.body.message});
                });
            }
        },

        instance_class: function(instance) {
            let a = ["instance-header"];
            a.push("instance-"+instance.status);
            if(instance == this.selected) a.push("instance-active");
            return a;
        },

        load_instances: function(cb) {
            this.instances = null; 
            if(!this.project.group_id) return; //can't load for non-group project..
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
                this.instances = res.body.instances;
                this.selected = this.instances.find(it=>it._id == this.$route.params.subid);
                if(this.selected) {
                    this.$nextTick(()=>{
                        this.scrollto(this.selected);
                    });
                }
                if(cb) cb();
            }).catch(cb);
        },
        
        subscribe_instance_update: function(cb) {
            if(this.ws) this.ws.close();
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
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
                    var instance = this.instances.find(i=>i._id == event.msg._id);
                    if(instance) {
                        for(var k in event.msg) instance[k] = event.msg[k];
                    } else {
                        //new instance created by other user?
                        this.instances.unshift(event.msg);
                    }
                } 
                if(event.error) {   
                    console.error("failed to subscribe to instance event:", event.error);
                    this.$notify({type: 'error', text: event.error});
                }
            }
        },

        summary_class: function(summary) {
            return ["summary", "summary-"+summary.status];
        },
    },
}

</script>

<style scoped>

.loading {
margin: 50px;
opacity: 0.5;
font-size: 170%;
}

.page-header {
position: fixed;
top: 100px;
left: 350px;
padding: 10px;
right: 10px;
height: 45px;
color: #999;
z-index: 1;
}

.instances {
position: fixed;
top: 100px;
left: 350px;
bottom: 0px;
right: 0px;
overflow: auto;
margin-top: 45px;
background-color: white;
}

.instance-header {
padding: 5px 15px;
background-color: white;
box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
/*transition: background-color 0.5s, margin 0.5s;*/
margin-left: 20px;
margin-right: 20px;
min-height: 35px;
white-space:nowrap;
z-index: 1; /*app desc/github name shows up on top without it*/
transition: margin 0.3s, background-color 0.3s;
}

.instance-info {
display:inline-block;
vertical-align:top;
}
.instance-header:hover {
cursor: pointer;
background-color: #eee;
}
.instance-active {
margin: 0px;
position: sticky; top: 0px; 
box-shadow: none;
white-space: inherit;
background-color: #f0f0f0;
}
.instance-item:not(:first-child) .instance-active {
margin-top: 20px;
}
.instance-desc {
font-size: 95%;
overflow: hidden;
text-overflow: ellipsis;
}
.instance-active .instance-desc {
white-space: inherit;
text-overflow: inherit;
}

.process {
padding-bottom: 20px;
margin-bottom: 20px;
/*background-color: #f7f7f7;*/
background-color: #f0f0f0;
border-bottom: 1px solid #e0e0e0;
}

.button-fixed {
right: 30px;
}
.table-header th {
padding: 8px 0px;
}
.process-action {
opacity: 0;
transition: opacity 0.5s;
}
.instance-active .process-action,
.instance-header:hover .process-action {
opacity: 1;
}

.instance-status {
width: 24px;
height: 24px;
padding-top: 4px;
text-align: center;
border-radius: 15px;
display: inline-block;
margin-right: 10px;
background-color: gray;
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
background-olor: #464a4e;
}
.instance-requested .instance-status {
background-color: #50bfff;
}
.instance-running .instance-status {
background-color: #007bff;
}
.instance.instance-active {
}

.status-toggler {
display: inline-block;
}
.summary {
color: white;
background-color: gray;
height: 20px;
padding: 3px;
text-align: center;
position: relative;
margin-right: 4px;
font-size: 60%;
top: -2px;
border-radius: 2px;
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
</style>

<style>
.processes .status-toggler .btn {
border: none;
margin-left: 5px;
}
</style>
