<template>
<div v-if="instances" class="processes">
    <div class="page-header with-menu header">
        <div style="margin-top: 5px; margin-left: 10px; display: inline-block;">
            <b>{{instances.length}}</b> Processes
        </div>

        <div v-if="instances.length > 1" style="float: right;"> 
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
    <div class="page-content with-menu content" id="scrolled-area" ref="scrolled_area">
        <div class="text-muted margin20" v-if="instances.length == 0">
            <p>Here, you can submit series of apps with shared input and output datasets.</p>
            <p>Output datasets will be removed within 25 days. Please archive any output dataset you'd like to keep.</p>
            <p>To learn about how to submit processes, please refer to our <a href="https://brain-life.github.io/docs/user/process/" target="doc">Documentation</a>.</p>
        </div>

        <div v-if="instances.length > 0" style="clear: both;">
            <!--header-->
            <div style="margin-right: 20px; padding: 5px 15px; opacity: 0.8; line-height: 200%;">
                <div class="date">
                    <small>Update Date</small>
                </div>
                <div class="date">
                    <small>Create Date</small>
                </div>
            </div>
            <div v-for="instance in sorted_and_filtered_instances" :key="instance._id" :id="instance._id" v-if="instance.config && !instance.config.removing" class="instance-item">
                <div class="instance-header" :class="instance_class(instance)" @click="toggle_instance(instance)" :id="instance._id+'-header'">
                    <div class="instance-status" :class="'instance-status-'+instance.status" style="float: left;">
                        <statusicon :status="instance.status"/>
                    </div>

                    <timeago :since="instance.update_date" :auto-update="10" class="date"/>
                    <timeago :since="instance.create_date" :auto-update="10" class="date"/>
                    <div style="float: right; text-align: right;" v-if="instance.config && instance.config.summary">
                        <contact v-for="id in unique_user_ids(instance)" :key="id" :id="id" size="tiny"/>
                    </div>
                    <div class="process-action instance-info" style="float: right; position: relative; top: -3px; margin-right: 5px;">
                        <div @click.stop="editdesc(instance)" class="button">
                            <icon name="edit"/>
                        </div>
                        <div @click.stop="remove(instance)" class="button">
                            <icon name="trash"/>
                        </div>
                    </div>
                    <div class="instance-desc">
                        {{instance.desc}}
                        <span v-if="!instance.desc" style="opacity: 0.4;">No Description ({{instance._id}})</span>
                        &nbsp;
                        <div v-if="instance.config && instance.config.summary" style="display: contents; opacity: 0.8;">
                            <span v-for="summary in instance.config.summary" 
                                v-if="summary.service != 'soichih/sca-product-raw' && summary.name" 
                                :class="summary_class(summary)" :title="summary.name">
                                {{summary.name.substring(0,4).trim()}}
                            </span>
                        </div>
                    </div>
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
        load() {
            this.check_agreements(this.project, ()=>{
                let group_id = this.project.group_id;
                this.order = window.localStorage.getItem("processes.order."+group_id)||"create_date";
                this.show = window.localStorage.getItem("processes.show."+group_id)||null;
                this.load_instances(err=>{
                    if(err) return this.notify_error(err);
                    this.subscribe_instance_update(err=>{
                        if(err) return this.notify_error(err);
                    });
                });
            });
        },

        capitalize(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },

        state2variant(state) {
            switch(state) {
            case "failed": return "outline-danger";
            case "finished": return "outline-success";
            case "running": return "outline-primary";
            case "others": return "outline-secondary";
            default: return "outline-warning";
            }
        },

        notify_error(err) {
            console.error(err);
            this.$notify({type: 'error', text: err.body.message});
        },

        scrollto(instance) {
            var elem = document.getElementById(instance._id);
            var top = elem.offsetTop;
            if (this.$refs.scrolled_area) {
                this.$refs.scrolled_area.scrollTop = top;
            }
        },

        toggle_instance(instance) {
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

        editdesc(instance) {
            //Vue.set(instance, 'edit', true);
            var desc = prompt("Please enter description", instance.desc);
            if(desc != null) {
                Vue.set(instance, 'desc',  desc);
                this.$http.put(Vue.config.wf_api+'/instance/'+instance._id, instance).then(res=>{
                    this.$notify({ text: 'Updated description', type: 'success' });
                });
            }
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
                let instance = res.body;
                this.instances.unshift(instance);
                this.toggle_instance(instance);
            }).catch(err=>{
                console.error(err);
                this.$notify({type: 'error', text: err.body.message});
            });
        },

        remove(instance) {
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

        instance_class(instance) {
            let a = ["instance-header"];
            a.push("instance-"+instance.status);
            if(instance == this.selected) a.push("instance-active");
            return a;
        },

        load_instances(cb) {
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
margin: 50px;
opacity: 0.5;
font-size: 170%;
}

.header {
top: 100px;
padding: 6px 10px;
color: #999;
z-index: 1; /*needed to make sort order dropdown box to show up on top of page-content*/
height: 45px;
}
.content {
top: 95px;
margin-top: 50px;
}

.header, 
.content {
min-width: 700px;
}

.instance-header {
padding: 5px 15px;
background-color: white;
box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
margin-left: 20px;
margin-right: 20px;
min-height: 35px;
z-index: 1; /*app desc/github name shows up on top without it*/
transition: margin 0.3s, background-color 0.3s;
}

.instance-info {
display:inline-block;
vertical-align:middle;
}
.instance-header:hover {
cursor: pointer;
background-color: #eee;
}
.instance-active {
margin: 0px;
padding: 15px;
position: sticky; top: 0px; 
box-shadow: none;
white-space: inherit;
background-color: #f0f0f0;
}
.instance-item {
clear: both;
}
.instance-item:not(:first-child) .instance-active {
margin-top: 20px;
}
.instance-desc {
font-size: 95%;
white-space: nowrap; 
overflow: hidden; 
text-overflow: ellipsis;
margin-top: 3px;
padding-left: 3px;
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
display: none;
opacity: 0;
transition: opacity 0.5s;
}
.instance-active .process-action,
.instance-header:hover .process-action {
display: block;
opacity: 1;
}

.instance-status {
width: 24px;
height: 24px;
text-align: center;
border-radius: 15px;
display: inline-block;
margin-right: 10px;
background-color: gray;
color: white;
line-height: 150%;
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
padding: 2px;
text-align: center;
position: relative;
margin-right: 2px;
font-size: 65%;
top: -2px;
border-radius: 2px;
display: inline-block;
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
line-height: 200%;
}
</style>

<style>
.processes .status-toggler .btn {
border: none;
margin-left: 5px;
}
</style>
