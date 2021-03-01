<template>
<div style="height: 100%; overflow: auto;">
    <div v-if="task && task.status == 'finished'" style="padding: 20px;">
        <!--<h4>Staging Data</h4>-->
        <task :task="task"/>
        <br>
        <!--<h4>Starting Viewer</h4>-->
        <task :task="novnc_task"/>
    </div>
    <div v-else style="padding: 20px;">
        <!--<h4>Staging Data</h4>-->
        <task :task="task"/>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

import task from '@/components/task'
import ReconnectingWebSocket from 'reconnectingwebsocket'
import wait from '@/mixins/wait'

const novnc_task_name="brainlife.novnc";

export default {
    mixins: [ wait ],
    //props: [ 'taskid', 'type', 'subdir' ], //deprecatd - use uiconfig
    components: { 
        task
    },

    data () {
        return {
            instance: null,
            error: null,
            novnc_task: null, //novnc task for novnc based views

            //set from uiconfig
            taskid: null,
            type: null,
            subdir: null,
            files: null, //for deprecated output structure
        }
    },

    mounted: function() {
        //parse uiconfig
        let uiconfig = JSON.parse(atob(window.location.hash.substring(1)));
        this.taskid = uiconfig.task_id;
        this.type = uiconfig.type;
        this.subdir = uiconfig.subdir;
        this.files = uiconfig.files;

        this.wait(this.taskid, ()=>{

            //we use this to just show the task info
            if(!this.type) return;

            this.open_novnc();
        });
    },

    methods: {

        open_novnc() {
            this.get_instance_singleton("novnc").then((instance)=>{
                //look for novnc task running for specified instance/task
                this.$http.get(Vue.config.wf_api+'/task', {params: {
                    find: JSON.stringify({
                        instance_id: instance._id,
                        name: novnc_task_name,
                        "config.input_instance_id": this.task.instance_id,
                        "config.input_task_id": this.taskid,
                        "config.type": this.type,
                        "config.subdir": this.subdir,
                    })
                }})
                .then(res=>{
                    console.log("query result", res.data.tasks);
                    if(res.data.tasks.length == 0) {

                        //compose window title (same code in view.vue)
                        let title = "brainlife";
                        let output = this.task.config._outputs.find(output=>output.subdir == this.subdir);
                        if(output) {
                            title = output.meta.subject;
                            if(output.datatype_tags) title += " "+output.datatype_tags.join(" ");
                        }

                        let remove_date = new Date();
                        remove_date.setHours(remove_date.getHours()+3); 

                        let dep_config = { task: this.taskid };
                        if(this.subdir) dep_config.subdirs = [ this.subdir ];

                        //submit novnc service for the first time!
                        this.$http.post(Vue.config.wf_api+'/task', {
                            instance_id: instance._id,
                            name: novnc_task_name,
                            service: "brainlife/abcd-novnc",
                            max_runtime: 3600*1000, //1 hour should be enough?
                            remove_date, //should remove in a few hours if it gets stuck in requested state..
                            config: {
                                _tid: -1,
                                input_instance_id: this.task.instance_id,
                                input_task_id: this.taskid,
                                type: this.type,
                                subdir: this.subdir, //might be null for legacy output mode
                                files: this.files,
                                title,
                            },
                            deps_config: [ dep_config ],
                        })
                        .then(res => {
                            this.novnc_task = res.data.task;
                            this.subscribe_ws();
                        });
                    } else {
                        //already submitted..
                        this.novnc_task = res.data.tasks[0];
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
            console.log("checking status "+this.novnc_task.status);
            if(this.novnc_task.status == "running") {
                //load url.txt
                var url = Vue.config.wf_api+'/task/download/'+this.novnc_task._id+'/url.txt?at='+Vue.config.jwt;
                this.$http.get(url).then(function(res) {
                    //load novnc!
                    document.location = res.data;
                }, function(err) {
                    //still waiting for url.txt
                    console.error(err);
                });
            }
        },

        get_instance_singleton(name) {
            return new Promise((resolve, reject) => {
                //console.log("querying instance");
                this.$http.get(Vue.config.wf_api+'/instance', {params: {
                    find: JSON.stringify({
                        name,
                    })
                }})
                .then(res=>{
                    //console.log(res);
                    if(res.data.instances.length == 0) {
                        //need to submit new instance
                        this.$http.post(Vue.config.wf_api+'/instance', {
                            name,
                        })
                        .then(res=>{
                            console.log("created instance", res.data);
                            resolve(res.data);
                        });
                    } else {
                        resolve(res.data.instances[0]);
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
                console.log("novnc_task updated", msg);
                this.novnc_task = msg;
                this.check_status();
            }
        }
    }
}
</script>

