<template>
<div v-if="instances">
    <div class="page-header">
        <div style="margin-top: 2px; margin-left: 10px;">
            <b>{{instances.length}}</b> Processes
        </div>
    </div>
    <div class="instances" id="scrolled-area">
        <br>
        <div v-if="instances.length > 0">
            <div v-for="instance in instances" :key="instance._id" :id="instance._id" v-if="instance.config && !instance.config.removing" class="instance-item">
                <div :class="instance_class(instance)" @click="toggle_instance(instance)">
                    <div style="float: left;" class="instance-status" :class="'instance-status-'+instance.status">
                        <statusicon :status="instance.status"/>
                    </div>
                    <div style="float: right; width: 130px; text-align: right;" class="text-muted">
                        <timeago :since="instance.create_date" :auto-update="10"/>
                    </div>
                    <div style="float: right;">
                        <contact :id="instance.user_id" short="true"/>
                    </div>
                    <div class="process-action" style="float: right; margin-right: 20px; position: relative; top: -4px">
                        <div @click.stop="editdesc(instance)" class="button">
                            <icon name="pencil"/>
                        </div>
                        <div @click.stop="remove(instance)" class="button">
                            <icon name="trash"/>
                        </div>
                    </div>
                    <div class="instance-desc" style="margin-left: 40px; margin-right: 300px;">
                        {{instance.desc}}
                        <span v-if="!instance.desc" style="opacity: 0.5;">No Description ({{instance._id}})</span>
                    </div>
                </div>
                <process v-if="instance == selected" :project="project" :instance="instance" class="process"/>
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

import ReconnectingWebSocket from 'reconnectingwebsocket'

var debounce = null;

export default {
    props: [ 'project' ], 
    components: { 
        statusicon, contact, process,
    },
    data () {
        return {
            instances: null,

            selected: null,

            query: "",
            apps: null, //keyed by _id
            ws: null, //websocket

            config: Vue.config,
        }
    },

    mounted: function() {
        console.log("processed mounted", this.$route.params);
        this.load();
    },

    watch: {
        project: function() {
            console.log("project changed.. need to reload");
            this.load();
        },
        '$route': function() {
            var subid = this.$route.params.subid;
            if(subid) {
                if(this.selected && this.selected._id != subid) {
                    //update
                    console.log("need to open process", subid);
                    var selected = this.instances.find(it=>it._id == subid);
                    this.toggle_instance(selected);
                } else {
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
            this.instances = null; 
            this.load_instances(err=>{
                if(err) return this.notify_error(err);
                this.subscribe_instance_update(err=>{
                    if(err) return this.notify_error(err);
                });
            });
        },

        notify_error: function(err) {
            console.error(err);
            this.$notify({type: 'error', text: err.body.message});
        },

        /*
        scrollto: function(id) {
            var elem = document.getElementById(id);
            var top = elem.offsetTop;
            console.dir(elem);
            document.getElementById("scrolled-area").scrollTop = top;
        },
        */

        toggle_instance: function(instance) {
            //if(instance.edit) return;
            if(this.selected != instance) {

                //if jumping to instance below currently selected, I should adjust current scroll position
                if(this.selected) {
                    //var elem = document.getElementsByClassName("process")[0];
                    var olditem = document.getElementById(this.selected._id);
                    var newitem = document.getElementById(instance._id);
                    if(olditem.offsetTop < newitem.offsetTop) {
                        //console.log("click below .. need to adjust scroll position", olditem.clientHeight);
                        document.getElementById("scrolled-area").scrollTop -= olditem.clientHeight;
                    }
                }

                this.$router.push("/project/"+this.project._id+"/process/"+instance._id);
                this.selected = instance;
            } else {
                this.$router.push("/project/"+this.project._id+"/process");
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
            if(!this.project.group_id) return; //can't load for non-group project..

            console.log("loading instances for group", this.project.group_id);
            this.$http.get(Vue.config.wf_api+'/instance', {params: {
                find: JSON.stringify({
                    "config.brainlife": true,
                    status: {$ne: "removed"},
                    //group_id: {$exists: false},
                    group_id: this.project.group_id,
                    "config.removing": {$exists: false},
                }),
                limit: 2000,
                sort: '-create_date',
            }}).then(res=>{
                this.instances = res.body.instances;
                this.selected = this.instances.find(it=>it._id == this.$route.params.subid);
                if(cb) cb();
            }).catch(cb);
        },
        
        subscribe_instance_update: function(cb) {
            if(this.ws) this.ws.close();

            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                console.log("binding to all instance updates");
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
                //console.log("instance update----------------", event);
                if(event.dinfo && event.dinfo.exchange == "wf.instance") {
                    var instance = this.instances.find(i=>i._id == event.msg._id);
                    if(instance) {
                        for(var k in event.msg) instance[k] = event.msg[k];
                    } else {
                        //new instance created by other user?
                        this.instances.unshift(event.msg);
                    }
                } 
            }
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
width: 300px;
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

/*adjusting these requires sticky to be adjusted also*/
/*padding-bottom: 50px;*/
}

.instance-header {
padding: 5px 15px;
background-color: white;
box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
/*transition: background-color 0.5s, margin 0.5s;*/
margin-left: 20px;
margin-right: 20px;
min-height: 35px;
z-index: 1; /*app desc/github name shows up on top without it*/
transition: margin 0.3s, background-color 0.3s;
}

.instance-header:hover {
cursor: pointer;
}
.instance-active {
padding: 15px;
margin: 0px;
position: sticky; top: 0px; 
box-shadow: none;
background-color: #f0f0f0;
}
.instance-item:not(:first-child) .instance-active {
margin-top: 20px;
}
.instance-desc {
font-size: 95%;
white-space: nowrap;
margin-top: 3px;
overflow: hidden;
text-overflow: ellipsis;
}
.instance-active .instance-desc {
white-space: inherit;
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
/*
background-color: #ddd;
*/
}
</style>
