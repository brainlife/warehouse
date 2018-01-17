<template>
<div>
    <div class="instances" v-if="instances">
        <!--TODO..
        <div>
            <b-tabs class="brainlife-tab-dark" v-model="process_filter_tab">
                <b-tab v-for="tabinfo in process_filter_tabs" :key="tabinfo.id" :title="tabinfo.label"/>
            </b-tabs>
        </div>
        -->
        <ul>
            <li v-for="instance in instances" :id="instance._id" :key="instance._id" @click="click(instance)" :class="{selected: selected == instance}" v-if="process_filter_tabs[process_filter_tab].id == 'all' || process_filter_tabs[process_filter_tab].id == instance.status">
                <div style="float: left; margin-top: 3px;">
                    <span class="status status-running" v-if="instance.status == 'running'"><icon name="cog" :spin="true"/></span>
                    <span class="status status-requested" v-else-if="instance.status == 'requested'"><icon name="hourglass-o"/></span>
                    <span class="status status-failed" v-else-if="instance.status == 'failed'"><icon name="exclamation-circle"/></span>
                    <span class="status status-finished" v-else-if="instance.status == 'finished'" style="font-size: 140%;"><icon name="check"/></span>
                    <span class="status status-unknown" v-else><icon name="question"/></span>
                </div>
                <div style="margin-left: 25px;">
                    <time v-if="instance._old">{{new Date(instance.create_date).toLocaleDateString()}}</time>
                    <time v-else>{{new Date(instance.create_date).toLocaleTimeString()}}</time>

                    <div class="type" v-if="instance.config.type != 'v2'" style="display: inline-block;">
                        <span v-if="instance.config.type == 'simple'">
                            {{apps[instance.config.prov.app].name}}
                        </span> 
                        <span v-else>{{instance.config.type}}</span>
                    </div>
                    {{instance.desc||'no description'}}
                </div>
            </li>
        </ul>
        <b-button class="button-fixed" @click="newprocess()" title="Create New Process"><icon name="plus" scale="2"/></b-button>
    </div>

    <div class="main">
        <div v-if="!selected">
            <h3 class="text-muted" style="padding-top: 30px; padding-left: 30px;">Please select or create a new process</h3>
        </div>

        <div class="process-list-toggler" @click="show_process_list = !show_process_list"> <icon scale="1.5" name="bars"/> </div>

        <div v-if="selected">
            <statusicon :status="selected.status" :scale="1.75" style="float: left; margin: 15px;opacity: 0.8;"/>
            <div style="margin: 10px; float: right;">
                <div v-if="!selected.config.removing" class="button" @click="remove()" title="Remove Process"><icon name="trash" scale="1.25"/></div>
            </div>
            <div class="description">
                <b-form-textarea placeholder="Please enter process description" @keyup.native="changedesc()" v-model="selected.desc" :rows="2"/>
            </div>
        </div>

        <process2 v-if="selected && selected.config.type == 'v2'" :instance="selected"></process2>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

import statusicon from '@/components/statusicon'
import process2 from '@/process2'

import ReconnectingWebSocket from 'reconnectingwebsocket'

var debounce = null;

export default {
    components: { 
        statusicon, process2,
    },
    data () {
        return {
            instances: null,
            selected : null, //selected instance to show
            query: "",
            apps: null, //keyed by _id
            ws: null, //websocket
            show_process_list: false,
            
            process_filter_tab: 0,
            process_filter_tabs: [ 
                {id: "all", label: "All"},
                {id: "running", label: "Running"},
                {id: "finished", label: "Finished"},
            ],

            config: Vue.config,
        }
    },

    mounted: function() {
        //load (all!) application details (TODO figure out a better way)
        console.log("loading apps");
        this.$http.get('app', {params: {
            find: JSON.stringify({ removed: false }),
        }})
        .then(res=>{
            this.apps = {};
            res.body.apps.forEach((a)=>{
                this.apps[a._id] = a;
            });

            //then load instances (processes)
            console.log("loading instatnces");
            return this.$http.get(Vue.config.wf_api+'/instance', {params: {
                find: JSON.stringify({
                    "config.brainlife": true,
                    status: {$ne: "removed"},
                    group_id: {$exists: false},
                    "config.removing": {$exists: false},
                }),
                limit: 2000,
                sort: '-create_date',
            }});
        })
        .then(res=>{
            var old = new Date();
            old.setHours(0,0,0,0);
            res.body.instances.forEach(instance=>{
                instance.create_date = new Date(instance.create_date);
                if(instance.create_date < old) instance._old = true;
            });
            this.instances = res.body.instances;
            console.log("done loading instatnces");

            //preselect
            var selected_id = this.$route.params.id;
            if(!selected_id) {
                //instace id not specified! let's open the latest one
                this.$router.replace("/processes/"+this.instances[0]._id);
                return;
            }
            this.selected = this.instances.find(i=>i._id == selected_id);

            //scroll to elem if it's outside the scrolling window
            Vue.nextTick(()=>{
                var elem = document.getElementById(selected_id);
                var processlist = document.getElementById("process-list");
                if(!processlist) {
                    console.log("no processlist.. navigated away?");
                    return;
                }
                if(processlist.clientHeight < elem.offsetTop) {
                    processlist.scrollTop = elem.offsetTop - processlist.clientHeight/2;
                }
            });

            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                console.log("binding to all instance updates");
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "wf.instance",
                        //key: Vue.config.user.sub+".#",
                        key: "na.#", //any instance under "na" group (instances that doen't belong to any group)
                    }
                }));
            }
            this.ws.onmessage = (json)=>{
                var event = JSON.parse(json.data);
                console.log("instance update----------------", event);
                if(event.dinfo && event.dinfo.exchange == "wf.instance") {
                    var instance = this.instances.find(i=>i._id == event.msg._id);
                    if(instance) {
                        for(var k in event.msg) instance[k] = event.msg[k];
                    }
                } 
            }

        }).catch(console.error);
    },

    methods: {
        click: function(instance) {
            this.$router.replace("/processes/"+instance._id);
            this.show_process_list = false;
        },
        changedesc: function() {
            clearTimeout(debounce);
            debounce = setTimeout(()=>{
                this.$http.put(Vue.config.wf_api+'/instance/'+this.selected._id, this.selected).then(res=>{
                    this.$notify({ text: 'Updated description', type: 'success' });
                });
            }, 1000);        
        },
        newprocess: function() {
            this.show_process_list = false;
            this.$http.post(Vue.config.wf_api+'/instance', {
                config: {
                    brainlife: true,
                    type: "v2",
                },
                //desc: "",
            }).then(res=>{
                this.instances.unshift(res.body);
                this.$router.replace("/processes/"+res.body._id);
            });
        },
        remove: function() {
            if(confirm("Do you really want to remove this process and all tasks?")) {
                //TODO - I wonder if I should set selected to null before making delete request to avoid
                //receiving a flood of events.. but if delete fails for some reason, user won't know..
                this.$http.delete(Vue.config.wf_api+'/instance/'+this.selected._id).then(res=>{
                    var idx = this.instances.indexOf(this.selected);
                    this.instances.splice(idx, 1);
                    this.selected = null;
                    this.$notify({type: "success", text: "Removed the process"});
                });
            }
        }
    },
    watch: {
        '$route': function() {
            console.log("route changed");
            var selected_id = this.$route.params.id;
            this.selected = this.instances.find(i=>i._id == selected_id);
        }
    }
}

</script>

<style scoped>

.instances {
position: fixed;
left: 350px;
top: 100px;
width: 300px;
bottom: 0px;
background-color: red;
overflow: auto;
}
.main {
position: fixed;
left: 650px;
top: 100px;
right: 0px;
bottom: 0px;
background-color: blue;
overflow: auto;
}

.button-fixed {
left: 550px;
right: inherit;
}
.status {
display: inline-block;
width: 20px;
text-align: center;
position: relative;
left: -2px;
}
.status-finished {
color: green;
}
.status-failed {
color: #c00;
}
.status-running {
color: #2693ff;
}
#process-list li.selected .status {
color: white;
}
.page-top textarea {
background-color: inherit;
border: none;
}
.page-top textarea:focus {
background-color: white;
}
</style>

