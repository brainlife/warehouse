<template>
<div v-if="tasks">
    <dtiinit v-if="type == 'neuro.dtiinit_output'" :task="tasks[0]" :subdir="subdir"></dtiinit>
    <freesurfer v-else-if="type == 'neuro.freesurfer'" :task="tasks[0]" :subdir="subdir"></freesurfer>
    <afq v-else-if="type == 'neuro.afq_output'" :task="tasks[0]" :subdir="subdir"></afq>
    <life v-else-if="type == 'neuro.life_output'" :task="tasks[0]" :subdir="subdir"></life>
    <evaluator v-else-if="type == 'neuro.conneval_output'" :task="tasks[0]" :subdir="subdir"></evaluator>

    <!--assume novnc staging..-->
    {{status}}
    <pre>{{novnc_task}}</pre>
</div>
</template>

<script>
import Vue from 'vue'

//for html5 viewers
import dtiinit from '@/components/appuis/dtiinit'
import freesurfer from '@/components/appuis/freesurfer'
import afq from '@/components/appuis/afq'
import life from '@/components/appuis/life'
import evaluator from '@/components/appuis/evaluator'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    props: [ 'instanceid', 'taskid', 'type', 'subdir' ],
    components: { 
        dtiinit, freesurfer, afq, life, evaluator,
    },

    data () {
        return {
            instance: null,
            error: null,

            //for novnc view
            tasks: null,
            novnc_task: null,

            status: null,
        }
    },

    mounted: function() {
        //TODO - need a better way to know which is which?
        switch(this.type) {
        case "neuro.dtiinit_output":
        case "neuro.freesurfer":
        case "neuro.afq_output":
        case "neuro.life_output":
        case "neuro.conneval_output":
            //load task that contains the data
            this.$http.get(Vue.config.wf_api+'/task', {params: {
                find: JSON.stringify({ _id: this.taskid, })
            }})
            .then(res=>{
                this.tasks = res.body.tasks;
            });
            break;
        default:
            //assume it's abcd-novnc app
            this.open_novnc();
        }
    },

    computed: {
    },

    methods: {
        go: function(path) {
            this.$router.push(path);
        },

        open_novnc: function() {
            this.get_instance_singleton("novnc").then((instance)=>{
                console.log("using instance", instance);
                var task_name = "brainlife.novnc";
                //look for novnc task running for specified instance/task
                this.$http.get(Vue.config.wf_api+'/task', {params: {
                    find: JSON.stringify({
                        instance_id: instance._id,
                        name: task_name,
                        "config.input_instance_id": this.instanceid,
                        "config.input_task_id": this.taskid,
                        "config.type": this.type,
                    })
                }})
                .then(res=>{
                    console.log("query result", res.body.tasks);
                    if(res.body.tasks.length == 0) {
                        //submit novnc service for the first time!
                        this.$http.post(Vue.config.wf_api+'/task', {
                            instance_id: instance._id,
                            name: task_name,
                            service: "soichih/abcd-novnc",
                            max_runtime: 3600*1000, //1 hour should be enough?
                            config: {
                                "input_instance_id": this.instanceid,
                                "input_task_id": this.taskid,
                                "type": this.type,
                            },
                            deps: [ this.taskid ], 
                        })
                        .then(res=>{
                            this.novnc_task = res.body.task;
                            this.subscribe_ws();
                        });
                    } else {
                        //already submitted..
                        this.novnc_task = res.body.tasks[0];
                        this.subscribe_ws();
                        this.check_status();

                        //if stopped or removed, rerun
                        if( this.novnc_task.status == "stopped" || 
                            this.novnc_task.status == "stop_requested" || 
                            this.novnc_task.status == "failed" ||  //also retry if it failed before.
                            this.novnc_task.status == "removed") {
                            console.log("rerunning task");
                            this.$http.put(Vue.config.wf_api+'/task/rerun/'+this.novnc_task._id);
                        }
                    }
                });
            });
        },
 
        check_status: function() {
            //console.dir(this.novnc_task);
            this.status = "unknown";
            switch(this.novnc_task.status) {
            case "running": 
                this.status = this.novnc_task.status_msg.trim();
                if(this.status == "running") {
                    //load url.txt
                    var path = this.novnc_task.instance_id+'/'+this.novnc_task._id+'/url.txt'
                    var url = Vue.config.wf_api+'/resource/download'+
                        '?r='+this.novnc_task.resource_id+
                        '&p='+encodeURIComponent(path)+
                        '&at='+Vue.config.jwt;
                    this.$http.get(url).then(function(res) {
                        document.location = res.body;
                    }, function(err) {
                        console.error(err);
                    });
                }
            case "finished":
                this.status = "finished";
                console.log("TODO novnc finished! -- need to restart?");
                break;
            default:
                this.status = this.novnc_task.status;
            }
        },

        get_instance_singleton: function() {
            return new Promise((resolve, reject) => {
                //console.log("querying instance");
                this.$http.get(Vue.config.wf_api+'/instance', {params: {
                    find: JSON.stringify({
                        name: "brainlife.novnc",
                    })
                }})
                .then(res=>{
                    //console.log(res);
                    if(res.body.instances.length == 0) {
                        //need to submit new instance
                        this.$http.post(Vue.config.wf_api+'/instance', {
                            name: "brainlife.novnc",
                        })
                        .then(res=>{
                            console.log("created instance", res.body);
                            resolve(res.body);
                        });
                    } else {
                        resolve(res.body.instances[0]);
                    }
                }).catch(reject); 
            });
        },

        subscribe_ws: function() {
            var instanceid = this.novnc_task.instance_id;
            var taskid = this.novnc_task._id;

            //subscribe to the instance events
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            var ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
            ws.onopen = (e)=>{
                var key = Vue.config.user.sub+"."+instanceid+"."+taskid;
                console.log("websocket opened: binding to ", key);
                ws.send(JSON.stringify({
                    bind: { ex: "wf.task", key }
                }));
            }
              
            ws.onmessage = (json)=>{
                var event = JSON.parse(json.data);
                if(event.error) {
                    console.error(event.error);
                    return;
                }
                var msg = event.msg;
                if(!msg || !msg._id) return; //odd..
                if(~msg.name.indexOf("brainlife.novnc")) {
                    console.log("novnc_task updated", msg);
                    this.novnc_task = msg;
                    this.check_status();
                }
            }
        }
    },
}
</script>

<style>
body {
margin: 0px;
padding: 0px;
}
</style>
