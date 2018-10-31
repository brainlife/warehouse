<template>
<div style="height: 100%; overflow: auto;">
    <div v-if="task && task.status == 'finished'" style="padding: 20px;">
        <h4>Staging Data</h4>
        <task :task="task"/>
        <br>
        <h4>Starting Viewer</h4>
        <task :task="novnc_task"/>
    </div>
    <div v-else style="padding: 20px;">
        <h4>Staging Data</h4>
        <task :task="task"/>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

import task from '@/components/task'
import ReconnectingWebSocket from 'reconnectingwebsocket'
import wait from '@/mixins/wait'

export default {
    mixins: [ wait ],
    props: [ /*'instanceid',*/ 'taskid', 'type', 'subdir' ],
    components: { 
        task
    },

    data () {
        return {
            instance: null,
            error: null,
            novnc_task: null, //novnc task for novnc based views
        }
    },

    mounted: function() {
        this.wait(this.taskid, ()=>{
            this.open_novnc();
        });
    },

    methods: {
        //wait for the staging task to finish
        /*
        wait: function(cb) {
            this.$http.get(Vue.config.wf_api+'/task', {params: {
                find: JSON.stringify({ _id: this.taskid, })
            }})
            .then(res=>{
                this.task = res.body.tasks[0];
                if(this.task.status == 'finished') return cb();
                if(this.task.status == 'removed') this.rerun();
                console.log("polling", this.task.status, this.task.status_msg);
                setTimeout(()=>{this.wait(cb)}, 300);
            });
        },

        rerun() {
            this.$http.put(Vue.config.wf_api+'/task/rerun/'+this.taskid)
            .then(res => {
                console.dir(res); 
            })
            .catch(err => {
                console.error(err); 
            });
        },
        */

        open_novnc() {
            this.get_instance_singleton("novnc").then((instance)=>{
                //console.log("using instance", instance);
                var task_name = "brainlife.novnc";
                //look for novnc task running for specified instance/task
                this.$http.get(Vue.config.wf_api+'/task', {params: {
                    find: JSON.stringify({
                        instance_id: instance._id,
                        name: task_name,
                        //"config.input_instance_id": this.instanceid,
                        "config.input_instance_id": this.task.instance_id,
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
                                _tid: -1,
                                //"input_instance_id": this.instanceid,
                                "input_instance_id": this.task.instance_id,
                                "input_task_id": this.taskid,
                                "type": this.type,
                                "subdir": this.subdir,
                            },
                            deps: [ this.taskid ], 
                        })
                        .then(res => {
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
 
        check_status() {
            if(this.novnc_task.status == "running") {
                //var msgpart = this.novnc_task.status_msg.trim();
                //if(msgpart == "running") {
                    //load url.txt
                    var url = Vue.config.wf_api+'/task/download/'+this.novnc_task._id+
                        '?p='+encodeURIComponent('url.txt')+
                        '&at='+Vue.config.jwt;
                    this.$http.get(url).then(function(res) {
                        //load novnc!
                        document.location = res.body;
                    }, function(err) {
                        //still waiting for url.txt
                        console.error(err);
                    });
                //}
            }
        },

        get_instance_singleton() {
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

        subscribe_ws() {
            var instanceid = this.novnc_task.instance_id;
            var taskid = this.novnc_task._id;

            //subscribe to the instance events
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            var ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
            ws.onopen = (e)=>{
                var key = instanceid+"."+taskid;
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
    }
}
</script>

