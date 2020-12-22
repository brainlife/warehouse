<template>
<div>
    <div v-if="selected">
        <div class="selected-controller">
            <div class="button" @click="selected = null" style="padding: 1px 10px; margin-top: 3px;"><icon name="times"/> Close</div>
        </div>
        <iframe :src="host+'/ipython/'+selected.port+'/lab?token='+selected.token" frameBorder="0"/>
    </div>
    <div v-else-if="ready" class="page-content">
        <div class="list" style="background-color: white;">
            <p>
                Once you complete your subject level processing, you can run group analysis on the derived data.
            </p>
            <p>
                To launch a group analysis, select a group analysis App from the list of available group analysis Apps below,
                TODO..
            </p>

            <h4>Existing Analysis</h4>
            <div>
                <div style="display: inline-block; width: 300px; margin-right: 10px; margin-bottom: 10px;" 
                    v-for="task in tasks.filter(task=>task.status != 'removed')" :key="task._id">
                    <div class="card ga-card">
                        <div class="card-body">
                            <h5 class="card-title" style="min-height: 50px;"><icon name="flask"/> {{task.name}}</h5>
                            <p class="card-text" style="min-height: 80px;">{{task.desc}}<br> 
                                <small>{{task.config.container}}</small>
                            </p>
                            <b-button variant="primary" size="sm" @click="open(task)" :disabled="task._id == openWhenReady">
                                <span v-if="task._id == openWhenReady"><icon name="cog" spin/> Opening..</span>
                                <span v-else><icon name="play"/> Open</span>
                            </b-button>
                            <div class="button" style="float: right;" variant="secondary" size="sm" @click="remove(task)"><icon name="trash"/></div>
                        </div>
                        <div class="card-footer">
                            <!--<small class="text-muted"><statustag :status="task.status"/></small><br>-->
                            <small style="font-size: 70%">{{task.status_msg}} {{task._id}}</small><br>
                        </div>
                    </div>
                </div>
            </div>

            <br>
        </div>

        <div class="list">
            <h4>New Analysis</h4>
            <div>
                <div style="display: inline-block; width: 200px; margin-right: 10px; margin-bottom: 10px;" v-for="(app, idx) in apps" :key="idx">
                    <div class="card ga-card">
                        <!--<img class="card-img-top" :src="app.img">-->
                        <div class="card-body">
                            <b-card-text style="min-height: 60px; font-size: 90%">{{app.desc}}</b-card-text>
                            <p>
                                <b-button variant="success" size="sm" @click="launch(app)"><icon name="play"/> Launch</b-button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
    <div v-else class="page-content">
        <p style="padding: 20px">Loading...</p>
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

            instance: null,

            ws: null, //websocket

            //will come from db someday
            apps: [
                {
                    name: "Brainlife dipy Jupyter Notebook", 
                    //img: "https://kanoki.org/wp-content/uploads/2017/07/Screen-Shot-2017-07-15-at-04.59.36.png",
                    desc: "Jupyter Datascience Notebook (lab-2.1.1) with Dipy and Fury",
                    container: "brainlife/ga-dipy",
                    tag: "1.0",
                },
                {
                    name: "Brainlife Octave(matlab) Jupyter Notebook", 
                    //img: "https://kanoki.org/wp-content/uploads/2017/07/Screen-Shot-2017-07-15-at-04.59.36.png",
                    desc: "Jupyter Datascience Notebook (lab-2.1.1) with Octave",
                    container: "brainlife/ga-octave",
                    tag: "1.0",
                },
                {
                    name: "Jupyter Datascience Lab", 
                    //img: "https://kanoki.org/wp-content/uploads/2017/07/Screen-Shot-2017-07-15-at-04.59.36.png",
                    desc: "Jupyter Datascience Notebook (lab-2.1.1)",
                    container: "jupyter/datascience-notebook", 
                    tag: "lab-2.1.1", 
                },
                {
                    name: "Jupyter Scipy Notebook", 
                    //img: "https://kanoki.org/wp-content/uploads/2017/07/Screen-Shot-2017-07-15-at-04.59.36.png",
                    //img: "https://www.dataquest.io/wp-content/uploads/2019/01/interface-screenshot.png",
                    desc: "Jupyter Notebook Scientific Python Stack",
                    container: "jupyter/scipy-notebook", 
                    tag: "latest",
                },   
                {
                    name: "Jupyter Tensorflow Notebook", 
                    //img: "https://i.imgur.com/n0PmXQn.gif",
                    //img: "https://kanoki.org/wp-content/uploads/2017/07/Screen-Shot-2017-07-15-at-04.59.36.png",
                    desc: "Jupyter Notebook Scientific Python Stack w/ Tensorflow",
                    container: "jupyter/tensorflow-notebook", 
                    tag: "latest",
                },
            ],

            ready: false,
            config: Vue.config,
        }
    },

    destroyed() {
        if(this.ws) {
            console.log("disconnecting from ws - process");
            this.ws.close();
        }
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

        launch(app) {
            this.check_agreements(this.project, err=>{
                if(err) return this.cb(err);
                this.$http.post('secondary/launchga', {
                    instance_id: this.instance._id,

                    container: app.container,
                    tag: app.tag,

                    name: app.name, 
                    desc: app.desc, //TODO..
                    //config: {},
                }).then(res=>{
                    let task = res.data;
                    this.$notify("Creating Analysis..");
                    this.openWhenReady = task._id;
                }).catch(console.error);
            });
        },

        remove(task) {
            this.$http.delete(Vue.config.amaretti_api+"/task/"+task._id).then(res=>{
                if(res.status == 200) {
                    this.$notify("Removal request submitted");
                }
            });
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
.list h4 {
opacity: 0.4;
text-transform: uppercase;
font-size: 13pt;
font-weight: bold;
margin-bottom: 20px;
}
.welcome {
    margin: 20px;
}
.list {
    padding: 20px;
}
.new {
    padding: 20px;
    background-color: white;
}
iframe {
    position: fixed;
    left: 40px;
    top: 95x;
    width: calc(100% - 40px);
    height: calc(100% - 95px);
    transition: left 0.2s;
}
.sidewide iframe {
    left: 180px;
    width: calc(100% - 180px);
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
.ga-container {
    padding: 5px;
    background-color: white;
    margin-bottom: 1px;
}
.ga-container.header {
    background-color: inherit;
    opacity: 0.5;
    text-transform: uppercase;
    font-weight: bold;
}
.ga-card {
border-radius: 5px;
margin-bottom: 10px;
box-shadow: 2px 2px 4px #0001;
}
.ga-card .card-body {
padding: 10px;
}
</style>

