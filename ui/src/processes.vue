<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/processes"></sidemenu>
    <div class="page-top" v-if="selected">
        <div style="margin: 10px; float: right;">
            <b-button v-if="!selected.config.removing" @click="remove()"><icon name="trash"/> Remove</b-button>
        </div>
        <div class="process-list-toggler" @click="show_process_list = !show_process_list"> <icon scale="1.5" name="bars"/> </div>
        <statusicon :status="selected.status" :scale="1.75" style="float: left; margin: 15px;opacity: 0.8;"/>
        <div class="description">
            <b-form-textarea placeholder="Please enter process description" @keyup.native="changedesc()" v-model="selected.desc" :rows="2"/>
        </div>
    </div>

    <div v-if="instances" id="process-list" :class="{'process-list-show': show_process_list}">
        <div class="process-list-header">
            <div class="process-list-hider" @click="show_process_list = false;"><icon name="bars"/></div> Processes
        </div>
        <ul>
            <li v-for="instance in instances" :id="instance._id" :key="instance._id" @click="click(instance)" :class="{selected: selected == instance}">
                <div style="float: left">
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

    <div class="page-content" id="scrolled-area">
        <h3 class="text-muted" v-if="instances && !selected" style="padding-left: 30px;">Please select or create a new process</h3>
        <div v-else>
            <simpleprocess @view="view" v-if="selected && selected.config.type == 'simple'" :instance="selected"></simpleprocess>
            <process @view="view" v-if="selected && selected.config.type == 'v1'" :instance="selected"></process>
            <process2 @view="view" v-if="selected && selected.config.type == 'v2'" :instance="selected"></process2>
        </div>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import statusicon from '@/components/statusicon'

import simpleprocess from '@/simpleprocess'
import process from '@/process'
import process2 from '@/process2'

import ReconnectingWebSocket from 'reconnectingwebsocket'

var debounce = null;

export default {
    components: { 
        sidemenu, pageheader, statusicon,
        simpleprocess, process, process2,
    },
    data () {
        return {
            instances: null,
            selected : null, //selected instance to show
            query: "",
            apps: null, //keyed by _id
            ws: null, //websocket
            show_process_list: false,

            config: Vue.config,
        }
    },
    mounted: function() {
        console.log("loading app, instances");

        //load application details
        this.$http.get('app', {params: {
            find: JSON.stringify({ removed: false }),
        }})
        .then(res=>{
            this.apps = {};
            res.body.apps.forEach((a)=>{
                this.apps[a._id] = a;
            });

            //then load instances (processes)
            return this.$http.get(Vue.config.wf_api+'/instance', {params: {
                find: JSON.stringify({
                    "config.brainlife": true,
                    status: {$ne: "removed"},
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
                var area = document.getElementById("process-list");
                if(area.clientHeight < elem.offsetTop) {
                    area.scrollTop = elem.offsetTop - area.clientHeight/2;
                }
            });

            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                console.log("binding to instance updates");
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "wf.instance",
                        key: Vue.config.user.sub+".#",
                    }
                }));

            }
            this.ws.onmessage = (json)=>{
                var event = JSON.parse(json.data);
                switch(event.dinfo.exchange) {
                case "wf.instance":
                    console.log("instance update");
                    console.dir(event);
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
                //name: "brainlife.process",
                config: {
                    brainlife: true,
                    type: "v2",
                },
                desc: "",
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
        },
        view: function(opt) {
            var view = opt.view.split('/').join('.'); //replace all / with .
            var path = "#/view/"+opt.instanceid+"/"+opt.taskid+'/'+view;
            if(opt.subdir) path += '/'+opt.subdir;
            window.open(path, "", "width=1200,height=800,resizable=no,menubar=no"); 
        }
    },
    watch: {
        '$route': function() {
            console.log("route changed");
            var selected_id = this.$route.params.id;
            this.selected = this.instances.find(i=>i._id == selected_id);
        },
    }
}

</script>

<style scoped>
h3 {
font-size: 18px;
font-weight: bold;
margin-bottom: 9px;
}
.page-top {
height: 60px;
box-shadow: 0px 1px 1px rgba(0,0,0,0.2);
position: fixed;
top: 50px;
right: 0px;
left:390px;
z-index: 1;
background-color: #eee;
overflow: hidden;
transition: left 0.5s;
}
.page-content {
position: fixed;
left: 390px;
right: 300px;
top: 110px;
bottom: 0px;
overflow: auto;
transition: left 0.5s;
}
.process-list-header {
padding: 5px 10px;
color: #999;
text-transform: uppercase;
margin-bottom: 0px;
font-size: 18px;
font-weight: bold;
}

#process-list {
background-color: #444;
overflow-y: auto;
overflow-x: hidden;
width: 300px;
z-index: 4;

position: fixed;
top: 50px;
bottom: 0px;
left: 90px;

transition: left 0.5s;
}
.description {
margin-left: 60px;
margin-right: 300px;
}
.button-fixed {
left: 290px;
right: inherit;
}
.process-list-toggler {
    display: none;
    padding: 18px 15px;
    opacity: 0.7;
    cursor: pointer;
    background-color: #e7e7e7;
}
.process-list-toggler:hover {
    opacity: 1;
}
.process-list-hider {
    cursor: pointer;
    padding: 5px 10px;
    margin: 0px;
    display: none;
}
.process-list-hider:hover {
    background-color: #666;
    color: white;
}

@media screen and (max-width: 1300px) {
    #process-list {
        left: -215px;
        box-shadow: 5px 0px 5px rgba(0,0,0,0.5);
    }
    #process-list.process-list-show {
        left: 90px;
    }
    .process-list-hider {
        display: inline-block;
    }

    .page-top {
        left: 90px;
    }
    .page-content {
        left: 90px;
    }
    .description {
        margin-left: 120px;
        margin-right: 150px;
    }
    .button-fixed {
        left: 0px;
    }
    .process-list-show .button-fixed {
        left: 290px;
    }
    .process-list-toggler {
        display: inline-block;
        float: left;
    }
}

#process-list ul {
list-style: none;
margin: 0;
padding: 0;
}
#process-list li {
padding: 5px 10px;
font-size: 90%;
line-height: 150%;
color: #bbb;
transition: color, background-color 0.3s;
}
#process-list li time {
float: right;
opacity: 0.4;
}
#process-list li .type {
background-color: #333;
color: #999;
font-size: 80%;
padding: 0px 3px;
}
#process-list li:hover {
background-color: #000;
cursor: pointer;
color: white;
}
#process-list li.selected {
background-color: #2693ff;
color: white;
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

