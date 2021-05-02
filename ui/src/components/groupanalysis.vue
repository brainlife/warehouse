<template>
<div>
    <div v-if="selected">
        <div class="selected-controller onRight">
            <div class="button" @click="close" style="padding: 1px 10px; margin-top: 3px;"><icon name="times"/> Close</div>
        </div>
        <div class="frame onRight">
            <iframe :src="host+'/ipython/'+selected.port+'/lab?token='+selected.token" frameBorder="0"/>
        </div>
    </div>

    <div v-if="!selected && !ready" class="page-content">
        <p style="padding: 20px">Loading...</p>
    </div>

    <div v-if="!selected && ready" class="page-content">
        <div style="padding: 20px; opacity: 0.5;" v-if="!visibleSessions.length">No Sessions</div>
        <div v-if="visibleSessions.length">
            <br>
            <h4 style="padding-left: 20px">Sessions</h4>
            <div v-for="task in visibleSessions" :key="task._id">
                <div class="session">
                    <b-row>
                        <b-col>
                            <b-button variant="primary" size="sm" @click="open(task)" v-if="!openWhenReady" style="float: right;">
                                Open
                            </b-button>
                            <span v-if="task._id == openWhenReady"><icon name="cog" spin/> Opening..</span>
                            <small>{{task.name}}</small><br>
                            {{task.desc}}
                            <!--{{task.desc}}<br> -->
                        </b-col>
                        <b-col>
                            <statustag :status="task.status"/> {{task.status_msg}}<br>
                            <small>{{task._id}}</small><br>
                        </b-col>
                        <b-col>
                            <b-badge pill class="bigpill">
                                <icon name="calendar" style="opacity: 0.4;"/>&nbsp;&nbsp;&nbsp;<small>Created</small>&nbsp;&nbsp;<time>{{new Date(task.create_date).toLocaleDateString()}}</time>
                            </b-badge>
                            <b-button variant="secondary" size="sm" @click="remove(task)" style="float: right">
                                <icon name="trash"/>
                            </b-button>
                        </b-col>
                    </b-row>
                </div>
            </div>
            <br>
        </div>

        <!--
        <div class="new">
            <h4>Launch New Session</h4>
            <b-form-select v-model="selectedNewApp" @change="selectNewApp" :options="apps" placeholder="Please select a class to launch"/>
            <div v-if="newApp">
                <p>
                    <small>{{newApp.container}}:{{newApp.tag}}</small>
                </p>
                <p>
                    <b>Description</b>
                    <b-form-textarea v-model="newApp.desc"/>
                </p>
                <b-button variant="success" size="sm" @click="launchNewApp" style="float: right;"><icon name="play"/> Launch</b-button>
                <br clear="right">
            </div>
        </div>
        -->
    </div>
    <b-button class="button-fixed" @click="newsession">New Session</b-button>
</div>
</template>

<script>
import Vue from 'vue'

import axios from 'axios'
import ReconnectingWebSocket from 'reconnectingwebsocket'

import agreementMixin from '@/mixins/agreement'
import gainstance from '@/mixins/gainstance'

export default {
    mixins: [
        agreementMixin,
        gainstance,
    ],
    components: {
        contact: ()=> import('@/components/contact'),
        statustag: ()=> import('@/components/statustag'),
        //statusicon: ()=> import('@/components/statusicon'),
        statustag: ()=> import('@/components/statustag'),
    },

    props: {
        project: { type: Object },
    },

    data() {
        return {
            //currently opened group analysis container
            tasks: [],
            selected: null,
            host: "",

            openWhenReady: null,

            selectedNewApp: null, //not really used by needed to show the placeholder
            newApp: null,

            instance: null,

            ws: null, //websocket

            //will come from db someday
            apps: [
                {
                    text: "Please select a class to start",
                    value: null,
                },
                {
                    text: "python/dipy", 
                    //img: "https://kanoki.org/wp-content/uploads/2017/07/Screen-Shot-2017-07-15-at-04.59.36.png",
                    value: {
                        desc: "Jupyter Datascience Notebook (lab-2.1.1) with Dipy(1.3.0) and Fury",
                        container: "brainlife/ga-dipy",
                        tag: "lab211-dipy130",
                    },
                },
                {
                    text: "Octave(matlab)", 
                    //img: "https://kanoki.org/wp-content/uploads/2017/07/Screen-Shot-2017-07-15-at-04.59.36.png",
                    value: {
                        desc: "Jupyter Datascience Notebook (lab-2.1.1) with Octave",
                        container: "brainlife/ga-octave",
                        tag: "1.0",
                    }
                },
                /*
                {
                    text: "jupyter/datascience-notebook", 
                    //img: "https://kanoki.org/wp-content/uploads/2017/07/Screen-Shot-2017-07-15-at-04.59.36.png",
                    value: {
                        desc: "Jupyter Datascience Notebook (lab-2.1.1)",
                        container: "jupyter/datascience-notebook", 
                        tag: "lab-2.1.1", 
                    }
                },
                {
                    text: "jupyter/scipy-notebook", 
                    //img: "https://kanoki.org/wp-content/uploads/2017/07/Screen-Shot-2017-07-15-at-04.59.36.png",
                    //img: "https://www.dataquest.io/wp-content/uploads/2019/01/interface-screenshot.png",
                    value: {
                        desc: "Jupyter Notebook Scientific Python Stack",
                        container: "jupyter/scipy-notebook", 
                        tag: "latest",
                    }
                },   
                {
                    text: "python/tensorflow", 
                    //img: "https://i.imgur.com/n0PmXQn.gif",
                    //img: "https://kanoki.org/wp-content/uploads/2017/07/Screen-Shot-2017-07-15-at-04.59.36.png",
                    value: {
                        desc: "Jupyter Notebook Scientific Python Stack w/ Tensorflow",
                        container: "jupyter/tensorflow-notebook", 
                        tag: "latest",
                    }
                },
                */
            ],

            ready: false,
            config: Vue.config,
        }
    },

    destroyed() {
        if(this.ws) this.ws.close();
    },

    updated() {
        let taskid = document.location.hash.split("#")[1];
        if(taskid) {
            console.log("task id specified in hash.. opening");

            history.replaceState("", document.title, window.location.pathname+window.location.search); //clear hash
            this.openWhenReady = taskid;
        }
    },

    mounted() {
        if(Vue.config.debug) {
            this.host = "https://dev1.soichi.us";
        }

        this.createOrFindGAInstance(this.project.group_id, (err, instance)=>{
            if(err) return console.error(err); //TODO notify?
            this.instance = instance;

            //subscribe to task update
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null);
            this.ws.onopen = (e)=>{
                //wf.task will be deprecated by ex:amaretti
                console.log("listening to", this.instance._id);
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "wf.task",
                        key: this.instance._id+".#",
                    }
                }));
                this.ws.onmessage = (json)=>{
                    let event = JSON.parse(json.data);
                    switch(event.dinfo.exchange) {
                    case "wf.task":
                        let task = event.msg;
                        console.log("received event", task._id, task.service, task.status);
                        if(task.service != "brainlife/ga-launcher") return; //don't care.
                        let existing_task = this.sessions.find(t=>t._id == task._id);
                        if(existing_task) {
                            for(let k in task) existing_task[k] = task[k];
                        } else {
                            console.log("got new task", task);
                            this.sessions.push(task); //new task
                        }
                        this.$forceUpdate();

                        console.log("checking for openWhenReady");
                        console.log(this.openWhenReady, task._id, task.status);
                        if(this.openWhenReady == task._id && task.status == "running" && task.status_msg == "running") {
                            this.openWhenReady = null;
                            this.$root.$emit("loading", {show: false, message: "Staging notebook and launching new analysis session.."});
                            this.jump(task); 

                        }
                    }
                }
            }

            //load initial list of sessions
            this.$http.get(Vue.config.amaretti_api+'/task', {
                params: {
                    find: JSON.stringify({
                        status: {$ne: "removed"},
                        instance_id: this.instance._id,
                        //"config.container": {$exists: true}, //we only want to pull ga container
                        service: "brainlife/ga-launcher",
                    }),
                }
            }).then(res=>{
                this.sessions = res.data.tasks;
                this.ready = true;
            });
        });
    },

    computed: {
        /*
        sessions() {
            return this.tasks.filter(task=>task.status != 'removed');
        }   
        */
        visibleSessions() {
            return this.sessions.filter(it=>['running', 'requested'].includes(it.status));
        }
    },

    methods: {

        //deprecated by newsession?
        selectNewApp(app) {
            this.newApp = Object.assign({}, this.newApp, {
                desc: app.desc,
                container: app.container,
                tag: app.tag,
            });
        },

        //deprecated by newsession
        launchNewApp() {
            this.check_agreements(this.project, err=>{
                if(err) return this.cb(err);
                this.$http.post('secondary/launchga', {
                    instance_id: this.instance._id,

                    container: this.newApp.container,
                    name: this.newApp.container+":"+this.newApp.tag,
                    app: "soichih/ga-test", //TODO
                    tag: this.newApp.tag,

                    desc: this.newApp.desc, 

                    //config: {},
                }).then(res=>{
                    let task = res.data;
                    this.$notify("Creating Analysis..");
                    this.openWhenReady = task._id;
                    this.$root.$emit("loading", {show: true});
                }).catch(err=>{
                    console.error(err);
                    this.$notify({type: 'error', text: err.response.data.message});
                });
            });
        },

        remove(task) {
            if(confirm("Do you really want to remove this session?")) {
                this.$http.delete(Vue.config.amaretti_api+"/task/"+task._id).then(res=>{
                    if(res.status == 200) {
                        this.sessions.splice(this.sessions.find(s=>s._id == task._id), 1);
                        this.$forceUpdate();

                        this.$notify("Removal request submitted");
                    }
                });
            }
        },

        open(task) {
            switch(task.status) {
            case "requested":
                this.openWhenReady = task._id;
                this.$root.$emit("loading", {show: true});
                break;
            case "stop_requested":
            case "stopped":
            case "failed":
                //rerun
                this.$http.put(Vue.config.amaretti_api+"/task/rerun/"+task._id).then(res=>{
                    if(res.status == 200) {
                        this.$notify("Rerun request submitted");
                        this.openWhenReady = task._id;
                        this.$root.$emit("loading", {show: true});
                    }
                });
                break;
            case "running":
                this.jump(task);
                break;
            default:
                console.error("unknown task state:"+task.status);
                console.error(task.status); 
            } 
        },

        jump(task) {
            console.log("jump called", task);
            this.$http.get(Vue.config.amaretti_api+"/task/download/"+task._id+'/container.json').then(res=>{
                if(res.status == 200) {
                    //let wait for proxy to go through
                    let url = this.host+'/ipython/'+(res.data.port)+'/';
                    this.waitProxy(url, ()=>{
                        console.log("commencing open", task);
                        this.selected = res.data; 

                        //without this it causes infinite loop
                        //window.location.href = window.location.href.split('#')[0];
                    });
                } else {
                    this.$notify("failed to load container.json");
                }
            });
        },

        close() {
            this.selected = null;
            //history.replaceState("", document.title, window.location.pathname+window.location.search); //clear hash
        },

        waitProxy(url, cb) {
            fetch(url).then(res=>{
                cb();
            }).catch(err=>{
                //TODO - should I give up eventually?
                console.log("page not opened yet.. waiting?");
                console.error(err);
                setTimeout(()=>{
                    this.waitProxy(url, cb);
                }, 1500);
            });
        },

        newsession() {
            const me = this;
            this.$root.$emit("galauncher.open", {
                project: this.project._id, //default project to submit ga to
                cb(err, info) {
                    if(err) throw err;
                    me.openWhenReady = info.task._id;
                },
            });
        },
    }
}
</script>

<style scoped>
.page-content {
    top: 95px;
    overflow: auto;
}
h4 {
    opacity: 0.4;
    text-transform: uppercase;
    font-size: 13pt;
    font-weight: bold;
}
.frame {
    position: fixed;
    top: 95px;
    bottom: 0;
    left: 40px;
    display: flex;
}
iframe {
    width: 100%;
}

.selected-controller {
    position: fixed;
    text-align: right;
    padding-right: 10px;
    width: 100px;
    height: 25px;
    top: 95px;
    z-index: 1;
}

.session {
    box-shadow: 1px 1px 2px #0002;
    padding: 20px;    
    background-color: white;
}

.sidewide .frame {
    left: 180px;
}

.new {
    background-color: white;
    padding: 20px;
    box-shadow: 1px 1px 2px #0002;
}

</style>

