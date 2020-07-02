<template>
<div>
    <!--no instance contents-->
    <p v-if="!instances" class="page-content loading"><icon name="cog" spin scale="1.5"/> Loading...</p>
    <div v-else>
        <!--instances list-->
        <div class="instances-header" :style="{width: listWidth+'px'}">
            <div style="padding-top: 10px;">
                <div style="float: right;">
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
                    <icon name="search" style="position: absolute; top: 7px; left: 10px; color: #0004;"/>
                    <b-form-input class="filter" 
                        @input="change_query"
                        :class="{'filter-active': query != ''}" 
                        size="sm" v-model="query" style="padding-left: 30px;">
                    </b-form-input>
                </div>
            </div>

            <div style="position: absolute; right: 8px; bottom: 4px;">
                <div class="date">
                    <small>Update Date</small>
                </div>
                <div class="date">
                    <small>Create Date</small>
                </div>
            </div>

            <div class="status-picker" v-if="instance_counts[null] > 0">
                <div v-for="state in [null, 'requested', 'running', 'finished', 'failed']" :key="state"
                     :class="status_picker_class(state)" @click="show = state">
                    {{state||'All'}} <span class="count">{{instance_counts[state]||0}}</span>
                </div>
            </div>

        </div>

        <div class="page-content instances-list scroll-shadow" ref="instances-list" :style="{width: listWidth+'px'}">
            <!--no instances show help doc-->
            <div v-if="instances.length == 0" style="margin: 20px; opacity: 0.7">
                <p>Here, you can submit a series of Apps to analyze dataset one subject at a time.</p>
                <p>Output datasets will be removed within 25 days unless archived.</p>
                <p>To learn about how to submit processes, please refer to our <a href="https://brainlife.io/docs/user/process/" target="doc">Documentation</a>.</p>
                <iframe width="360" height="225"
                    src="https://www.youtube.com/embed/u9Qlh0-iaAk" frameborder="0" 
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>

            <!--show list-->
            <div v-if="instances.length > 0">
                <div v-for="instance in sorted_and_filtered_instances" :key="instance._id" :id="instance._id" v-if="instance.config && !instance.config.removing">
                    <div class="instance-header" :class="instance_class(instance)" @click="toggle_instance(instance)" :id="instance._id+'-header'">

                        <timeago :datetime="instance.update_date" :auto-update="10" class="date"/>
                        <timeago :datetime="instance.create_date" :auto-update="10" class="date"/>
                        <div class="instance-desc">
                            <icon name="robot" v-if="instance.config.rule_subject" style="opacity: 0.5"/>
                            {{instance.desc}}
                            <span v-if="!instance.desc" style="opacity: 0.3; font-size: 75%;">{{instance._id}}</span>
                            &nbsp;
                            <div v-if="instance.config && instance.config.summary" style="display: inline-block;">
                                <span v-for="summary in get_nonstaging_summary(instance)" 
                                    :class="summary_class(summary)" :title="summary.name+' (t.'+summary.tid+')'" 
                                    @click.stop="select_task(instance, summary)" :key="summary.task_id">
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

        <b-button class="button-fixed" @click="newinstance" v-b-tooltip.hover title="Create New Process" :style="{left: listWidth-60+'px'}"><icon name="plus" scale="2"/></b-button>     
    </div>
    <div class="splitter" ref="splitter" :style="{left: splitter_pos+'px'}"/>
    <transition name="fade">
        <process transition="slide" 
                :project="project" 
                :instance="selected" 
                v-if="selected"
                @updatedesc="updatedesc" 
                @remove="toggle_instance(selected)"
                :splitter_pos="splitter_pos+10"
                :style="{left: splitter_pos+10+'px'}"/>
    </transition>
</div>
</template>

<script>
import Vue from 'vue'

import PerfectScrollbar from 'perfect-scrollbar'
import statusicon from '@/components/statusicon'
import contact from '@/components/contact'
import process from '@/components/process'
import ReconnectingWebSocket from 'reconnectingwebsocket'

import agreementMixin from '@/mixins/agreement'
import pagesplitter from '@/mixins/pagesplitter'

var debounce;
var ps;

export default {
    mixins: [agreementMixin, pagesplitter],
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
        listWidth() {
            if(this.$root.sidemenuWide) return this.splitter_pos-200;
            else return this.splitter_pos-40;
        },
        sorted_and_filtered_instances: function() {
            //apply filter and query
            let filtered = this.instances.filter(i=>{
                //apply query filter
                if(!i.desc) i.desc = "";
                if(this.query && !i.desc.toLowerCase().includes(this.query.toLowerCase())) return false; //filtered by query..
                
                //apply state filter
                /*
                if(!this.show) return true; //show all
                if(i.config && i.config.counts) {
                    if(i.config.counts[this.show] > 0) return true;
                } else {
                   //for old instances (not using counts)
                   if(i.status == this.show) return true; 
                   //f(this.show == "all finished" && i.status == "all finished") return true;
                }
                */
                if(!this.show) return true; //show all
                let summary = this.get_nonstaging_summary(i);
                let match = false;
                summary.forEach(summary=>{
                    if(summary.status == this.show) match = true;
                });
                return match;
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

        instance_counts() {
            let counts = {null: this.instances.length};

            this.instances.forEach(i=>{
                let summary = this.get_nonstaging_summary(i);
                summary.forEach(summary=>{
                    if(!counts[summary.status]) counts[summary.status] = 1;
                    else counts[summary.status]+=1;                  
                });
            });
            return counts;
        },

        instance_filter_label() {
            if(!this.show) return "All ("+this.instances.length+")";
            return this.capitalize(this.show)+" ("+(this.instance_counts[this.show]||0)+")";
        },

    },//computed

    mounted() {
        this.check_agreements(this.project, ()=>{
            let group_id = this.project.group_id;
            this.order = window.localStorage.getItem("processes.order."+group_id)||"create_date";
            this.show = window.localStorage.getItem("processes.show."+group_id)||null;
            
            if(!this.$route.params.subid) {
                let previous_instance = window.localStorage.getItem("processes.previous_instance."+group_id);
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

    destroyed() {
        if(this.ws) {
            console.log("disconnecting from ws - processes");
            this.ws.close();
        }
    },

    watch: {
        order: function() {
            let group_id = this.project.group_id;
            window.localStorage.setItem("processes.order."+group_id, this.order);
        },
        
        show: function() {
            let group_id = this.project.group_id;
            if(this.show) window.localStorage.setItem("processes.show."+group_id, this.show);
            else window.localStorage.removeItem("processes.show."+group_id);
            if (this.$refs["instances-list"]) this.$refs["instances-list"].scrollTop = 0;
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
            }, 1000);
        },


        change_query() {
            this.$refs["instances-list"].scrollTop = 0;
        },

        capitalize(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },

        notify_error(err) {
            console.error(err);
            this.$notify({type: 'error', text: JSON.stringify(err)});
        },

        scrollto(instance) {
            var elem = document.getElementById(instance._id);
            if(!elem) return; //sometime user might be selecting instance that's not listed in the list due to filtering
            var top = elem.offsetTop;
            if (this.$refs["instances-list"]) this.$refs["instances-list"].scrollTop = top;
        },

        toggle_instance(instance, task) {
            console.log("toggle_instance");
            let url = "/project/"+this.project._id+"/process";
            if(this.selected != instance) {
                this.selected = instance;
                //if jumping to instance below currently selected, I should adjust current scroll position
                url += "/"+instance._id;
                if(task) url += "#"+task;
                this.$router.replace(url, ()=>{
                    //console.log("emit show task", task);
                    /*
                    this.$nextTick(()=>{
                        this.$root.$emit('showtask', task);   
                    });  
                    */
                    
                });
            } else {
                //close!
                this.$router.replace(url);
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
                this.toggle_instance(instance, summary.task_id);
            } else {
                //this.$nextTick(()=>{
                    this.$root.$emit('showtask', summary.task_id);
                //});
            }
        },

        newinstance() {
            var desc = prompt("Please enter process description");
            if(!desc) return;
            this.$http.post(Vue.config.wf_api+'/instance', {
                desc,
                config: {
                    brainlife: true,
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
                this.instances = res.data.instances;
                this.$nextTick(()=>{
                    ps = new PerfectScrollbar(this.$refs["instances-list"]);
                    this.init_splitter();
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

        get_nonstaging_summary(instance) {
            if(!instance.config || !instance.config.summary) return [];
            return instance.config.summary.filter(summary=>{
                if(summary.service!='soichih/sca-product-raw' && summary.service!='brainlife/app-stage' && summary.name) return true;
                return false;
            });
        },

        status_picker_class(state) {
            let cs = ["status", "status-"+state];
            if(state == this.show) cs.push("status-pressed");
            return cs;
        },

    }, //methods
}

</script>

<style scoped>
.loading {
margin-top: 95px;
opacity: 0.5;
font-size: 170%;
padding-left: 20px;
}

.instances-header {
position: relative;
padding: 10px;
padding-top: 0;
height: 80px;
background-color: #f6f6f6;
border-bottom: 1px solid #ddd;
z-index: 1; /*for dropdown menu to go on top*/
margin-left: 0;
transition: margin-left 0.2s;
}
.instances-header .btn {
padding: .15rem .3rem;
}
.instances-list {
top: 175px;
width: 400px;
}

.instance-header {
border-bottom: 1px solid rgba(0,0,0,0.1);
padding: 4px 8px;
color: #333;
}

.instance-info {
display:inline-block;
vertical-align:middle;
}

.instance-header:hover {
cursor: pointer;
background-color: #9993;
}

.instance-header.instance-active {
color: white;
background-color: #2693ff;
}

.instance-desc {
font-size: 90%;
padding-left: 3px;
margin-left: 0px;
}

.button-fixed {
transition: background-color 0.3s, transform 0.5s, box-shadow 0.5s, opacity 0.5s;
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
width: 80px;
text-align: right;
font-size: 75%;
margin-top: 1px;
margin-right: 7px;
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
    border-color: #80bdff;
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
}
.status-picker {
    white-space: nowrap;
    overflow: hidden;
    /* text-overflow: ellipsis; */
    box-sizing: border-box;
    width: 100%;
    padding-top: 10px;
    position: relative;
}
.status-picker .status {
    font-size: 8pt;
    text-transform: uppercase;
    display: inline-block;
    padding: 5px;
    cursor: pointer;
    transition: background-color 0.3s, color 0.3s, border-bottom 0.3s, opacity 0.3s;
    border-top: 2px solid #0000;
    position: relative;
    padding-top: 5px;
    font-weight: bold;
    opacity: 0.7;
    background-color: #f6f6f6;
}
.status-picker .status:hover {
    background-color: white;
    opacity: 1;
}
.status-picker .status-pressed {
    background-color: white;
    color: white;
    opacity: 1;
}
.status-picker .count {
    font-size: 90%;
    opacity: 0.9;
    font-weight: normal;
}

.status-picker .status-null {
    color: #666;
}
.status-picker .status-pressed.status-null {
    border-top: 2px solid #666;
}

.status-picker .status-requested {
    color: #50bfff;
}
.status-picker .status-pressed.status-requested {
    border-top: 2px solid #50bfff;
}

.status-picker .status-running {
    color: #007bff;
}
.status-picker .status-pressed.status-running {
    border-top: 2px solid #007bff;
}

.status-picker .status-finished {
    color: #28a745;
}
.status-picker .status-pressed.status-finished {
    border-top: 2px solid #28a745;
}

.status-picker .status-failed {
    color: #dc3545;
}
.status-picker .status-pressed.status-failed {
    border-top: 2px solid #dc3545;
}
.splitter {
top: 95px;
}
</style>
