<template>
<div>
    <div v-if="task && task.status == 'finished'">
        <dtiinit v-if="type == 'neuro.dtiinit_output'" :task="task" :subdir="subdir"></dtiinit>
        <freesurfer v-else-if="type == 'neuro.freesurfer'" :task="task" :subdir="subdir"></freesurfer>
        <afq v-else-if="type == 'neuro.afq_output'" :task="task" :subdir="subdir"></afq>
        <life v-else-if="type == 'neuro.life_output'" :task="task" :subdir="subdir"></life>
        <evaluator v-else-if="type == 'neuro.conneval_output'" :task="task" :subdir="subdir"></evaluator>
        <images v-else-if="type == 'generic.images'" :task="task" :subdir="subdir"></images>
        <volumeviewer v-else-if="type == 'neuro.anat.t1w'" :task="task" :subdir="subdir"></volumeviewer>
        <div v-else style="margin: 20px;">
            <h2>Staging Data</h2>
            <task :task="task"/>
            <br>
            <h2>Starting Viewer</h2>
            <task :task="novnc_task"/>
        </div>
    </div>
    <div v-else style="margin: 20px;">
        <h2>Staging Data</h2>
        <task :task="task"/>
    </div>
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
import images from '@/components/appuis/images'
import volumeviewer from '@/components/appuis/volumeviewer'

import task from '@/components/task'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    props: [ 'instanceid', 'taskid', 'type', 'subdir' ],
    components: { 
        dtiinit, freesurfer, afq, life, evaluator, images, volumeviewer,
        task
    },

    data () {
        return {
            instance: null,
            error: null,

            task: null, //input task
            novnc_task: null, //novnc task for novnc based views
        }
    },

    mounted: function() {
        this.wait(()=>{
            //need to submit novnc task for novnc views //TODO - need a better way to know which is which?
            if(!~this.type.indexOf(".")) {
                this.open_novnc();
            }
        });
    },

    methods: {
        go: function(path) {
            this.$router.push(path);
        },

        //wait for the data task to finish
        wait: function(cb) {
            this.$http.get(Vue.config.wf_api+'/task', {params: {
                find: JSON.stringify({ _id: this.taskid, })
            }})
            .then(res=>{
                this.task = res.body.tasks[0];
                console.log("polling", this.task.status, this.task.status_msg);
                if(this.task.status == 'finished') cb();
                else if(this.task.status == 'removed') {
                    this.rerun();
                    setTimeout(()=>{this.wait(cb)}, 5000);
                } else setTimeout(()=>{this.wait(cb)}, 1000);
            });
        },

        rerun() {
            this.$http.put(Vue.config.wf_api+'/task/rerun/'+this.taskid)
            .then(res=>{
                console.dir(res); 
            })
            .catch(err=>{
                console.error(err); 
            });
        },

        open_novnc() {
            this.get_instance_singleton("novnc").then((instance)=>{
                //console.log("using instance", instance);
                var task_name = "brainlife.novnc";
                //look for novnc task running for specified instance/task
                this.$http.get(Vue.config.wf_api+'/task', {params: {
                    find: JSON.stringify({
                        instance_id: instance._id,
                        name: task_name,
                        "config.input_instance_id": this.instanceid,
                        "config.input_task_id": this.taskid,
                        "config.type": this.type,
                        //"create_date": { $gte: hourago },
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
                                "subdir": this.subdir,
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
 
        check_status() {
            if(this.novnc_task.status == "running") {
                var msgpart = this.novnc_task.status_msg.trim();
                if(msgpart == "running") {
                    //load url.txt
                    var path = this.novnc_task.instance_id+'/'+this.novnc_task._id+'/url.txt'
                    var url = Vue.config.wf_api+'/resource/download'+
                        '?r='+this.novnc_task.resource_id+
                        '&p='+encodeURIComponent(path)+
                        '&at='+Vue.config.jwt;
                    this.$http.get(url).then(function(res) {
                        //load novnc!
                        document.location = res.body;
                    }, function(err) {
                        console.error(err);
                    });
                }
            }
            /*
            case "finished":
                console.error("TODO novnc finished! -- need to restart?");
                break;
            }
            */
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
overflow: inherit;
}
</style>
