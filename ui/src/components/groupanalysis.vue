<template>
<div>
    <div v-if="selected">
        <div class="selected-controller">
            <div class="button" @click="selected = null" style="padding: 1px 10px; margin-top: 3px;"><icon name="times"/> Close</div>
        </div>
        <iframe :src="host+'/ipython/'+selected.port+'/lab?token='+selected.token" frameBorder="0"/>
    </div>

    <div v-if="!selected && !ready" class="page-content">
        <p style="padding: 20px">Loading...</p>
    </div>

    <div v-if="!selected && ready" class="page-content">
        <!-- instructions -->
        <p>
            <b-alert :show="true" variant="secondary">
                Once you complete your subject level processing, you can run group analysis on jupyter notebook hosted on brainlife.io.
            </b-alert>
        </p>

        <div style="padding: 0 20px">
            <h4>Sessions</h4>
            <small v-if="sessions.length == 0">Please launch a new session.</small>
            <div v-for="task in sessions" :key="task._id" class="session">
                <b-row>
                    <b-col cols="4">
                        <small>{{task.name}}</small>
                        {{task.desc}}
                        <!--{{task.desc}}<br> -->
                    </b-col>
                    <b-col cols="3">
                        <statusicon :status="task.status"/> <small>{{task._id}}</small><br>
                        <pre>{{task.status_msg}}</pre>
                    </b-col>
                    <b-col cols="2">
                        Created on <b>{{new Date(task.create_date).toLocaleDateString()}}</b>
                    </b-col>
                    <b-col cols="3">
                        <b-button variant="primary" size="sm" @click="open(task)" :disabled="task._id == openWhenReady">
                            <span v-if="task._id == openWhenReady"><icon name="cog" spin/> Opening..</span>
                            <span v-else><!--<icon name="play"/>-->Open</span>
                        </b-button>
                        <b-button variant="secondary" size="sm" @click="remove(task)"><!--<icon name="trash"/>-->Remove</b-button>
                    </b-col>
                </b-row>
            </div>
            <br>
        </div>

        <div class="new">
            <h4>Launch New Session</h4>
            <b-form-select v-model="selectedNewApp" @change="selectNewApp" :options="apps" placeholder="Please select a class to launch"/>
            <!--
            <div style="display: inline-block; width: 200px; margin-right: 10px; margin-bottom: 10px;" v-for="(app, idx) in apps" :key="idx">
                <div class="card ga-card">
                    <div class="card-body">
                        <b-card-text style="min-height: 60px; font-size: 90%">{{app.desc}}</b-card-text>
                        <p>
                            <b-button variant="success" size="sm" @click="launch(app)"><icon name="play"/> Launch</b-button>
                        </p>
                    </div>
                </div>
            </div>
            -->
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

    </div>
</div>
</template>

<script>
import Vue from 'vue'

import axios from 'axios'

import agreementMixin from '@/mixins/agreement'
import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    mixins: [agreementMixin],
    components: {
        'contact': ()=> import('@/components/contact'),
        'statustag': ()=> import('@/components/statustag'),
        'statusicon': ()=> import('@/components/statusicon'),
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
                        desc: "Jupyter Datascience Notebook (lab-2.1.1) with Dipy and Fury",
                        container: "brainlife/ga-dipy",
                        tag: "1.0",
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
            ],

            ready: false,
            config: Vue.config,
        }
    },

    destroyed() {
        if(this.ws) this.ws.close();
    },

    mounted() {
        if(Vue.config.debug) {
            this.host = "https://dev1.soichi.us";
        }

        this.find_or_create_instance((err, instance)=>{
            if(err) return console.error(err); //TODO notify?
            this.instance = instance;

            //subscribe to task update
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null);
            this.ws.onopen = (e)=>{
                console.log("subscribing to group analysis instance");
                //wf.task will be deprecated by ex:amaretti
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
                        let existing_task = this.tasks.find(t=>t._id == task._id);
                        if(existing_task) {
                            for(let k in task) existing_task[k] = task[k];
                        } else this.tasks.push(task); //new task

                        if(this.openWhenReady == task._id && task.status == "running" && task.status_msg == "running") {
                            this.openWhenReady = null;
                            this.jump(task); 
                        }
                    }
                }
            }

            //load initial list of tasks
            this.$http.get(Vue.config.amaretti_api+'/task', {
                params: {
                    find: JSON.stringify({
                        status: {$ne: "removed"},
                        instance_id: this.instance._id,
                    }),
                }
            }).then(res=>{
                this.tasks = res.data.tasks;
                this.ready = true;
            });
        });
    },

    computed: {
        sessions() {
            return this.tasks.filter(task=>task.status != 'removed');
        }   
    },

    methods: {

        find_or_create_instance(cb) {
            //find or create an instance to host all ga tasks
            let key = {
                group_id: this.project.group_id,
                name: "ga-launchers",
            }
            this.$http.get(Vue.config.amaretti_api+'/instance', {
                params: {
                    find: JSON.stringify(key),
                },
            }).then(res=>{
                if(res.data.instances.length == 1) return cb(null, res.data.instances[0]);
                //create new instance
                this.$http.post(Vue.config.amaretti_api+'/instance', key).then(res=>{
                    cb(null, res.data);
                }).catch(cb);
            }).catch(cb);
        },

        selectNewApp(app) {
            this.newApp = Object.assign({}, this.newApp, {
                desc: app.desc,
                container: app.container,
                tag: app.tag,
            });
        },

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
                }).catch(console.error);
            });
        },

        remove(task) {
            if(confirm("Do you really want to remove this session?")) {
                this.$http.delete(Vue.config.amaretti_api+"/task/"+task._id).then(res=>{
                    if(res.status == 200) {
                        this.$notify("Removal request submitted");
                    }
                });
            }
        },

        open(task) {
            switch(task.status) {
            case "requested":
                this.openWhenReady = task._id;
                break;
            case "stop_requested":
            case "stopped":
            case "failed":
                //rerun
                this.$http.put(Vue.config.amaretti_api+"/task/rerun/"+task._id).then(res=>{
                    if(res.status == 200) {
                        this.$notify("Rerun request submitted");
                        this.openWhenReady = task._id;
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
            this.$http.get(Vue.config.amaretti_api+"/task/download/"+task._id+'/container.json').then(res=>{
                if(res.status == 200) {
                    //let wait for proxy to go through
                    let url = this.host+'/ipython/'+(res.data.port)+'/';
                    this.waitProxy(url, ()=>{
                        console.log("commencing open");
                        this.selected = res.data; 
                    });
                } else {
                    this.$notify("failed to load container.json");
                }
            });
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
iframe {
    position: fixed;
    left: 40px;
    top: 95x;
    width: calc(100% - 40px);
    height: calc(100% - 95px);
    transition: left 0.2s;
}

.selected-controller {
    position: fixed;
    text-align: right;
    padding-right: 10px;
    width: 100px;
    right: 0;
    height: 25px;
    top: 95px;
    z-index: 1;
}

.session {
    box-shadow: 1px 1px 2px #0002;
    padding: 10px;    
    background-color: white;
}

.sidewide iframe {
    left: 180px;
    width: calc(100% - 180px);
}
.new {
    background-color: white;
    padding: 20px;
    box-shadow: 1px 1px 2px #0002;
}

</style>

