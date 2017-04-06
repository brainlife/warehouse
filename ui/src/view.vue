<template>
<div>
    {{status}}
    <pre>{{novnc_task}}</pre>
</div>
</template>

<script>
import Vue from 'vue'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    components: { },

    data () {
        return {
            instance: null,
            tasks: null,
            error: null,

            novnc_task: null,

            status: null,
        }
    },

    mounted: function() {
        this.get_instance_singleton("novnc").then((instance)=>{
            console.log("using instance", instance);
            this.subscribe_ws(instance._id);

            var task_name = "brainlife.novnc."+this.$route.params.instanceid+"."+this.$route.params.taskid;
            //look for novnc task running for specified instance/task
            this.$http.get(Vue.config.wf_api+'/task', {params: {
                find: JSON.stringify({
                    instance_id: instance._id,
                    name: task_name,
                })
            }})
            .then(res=>{
                if(res.body.tasks.length == 0) {
                    //submit novnc service for the first time!
                    this.$http.post(Vue.config.wf_api+'/task', {
                        instance_id: instance._id,
                        name: task_name,
                        service: "soichih/abcd-novnc",
                        config: {
                            "input_instance_id": this.$route.params.instanceid,
                            "input_task_id": this.$route.params.taskid,
                            "container": "soichih/vncserver-fsl"
                        },
                        deps: [ this.$route.params.taskid ], //just in case..
                    })
                    .then(res=>{
                        this.novnc_task = res.body.task;
                    });
                } else {
                    //already submitted..
                    this.novnc_task = res.body.tasks[0];
                    this.check_status();
                }
            });
        });

    },

    computed: {
    },

    methods: {
        go: function(path) {
            this.$router.push(path);
        },
        
        check_status: function() {
            this.status = "unknown";
            switch(this.novnc_task.status) {
            case "running": 
                //TODO .. relying on status_msg is ugly.. come up with a better way
                if(this.novnc_task.status_msg == "starting") {
                    this.status = "starting"; //special token set by status.sh
                } else if(this.novnc_task.status_msg.trim().indexOf("http") === 0) {
                    this.status = "running";
                    console.log("jump to ", this.novnc_task.status_msg);
                    document.location = this.novnc_task.status_msg;
                } 
                break;
            case "finished":
                this.status = "finished";
                console.log("TODO novnc finished! -- need to restart?");
                break;
            }
        },

        get_instance_singleton: function() {
            return new Promise((resolve, reject) => {
                console.log("querying instance");
                this.$http.get(Vue.config.wf_api+'/instance', {params: {
                    find: JSON.stringify({
                        name: "brainlife.novnc",
                    })
                }})
                .then(res=>{
                    console.log(res);
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

        subscribe_ws: function(instanceid) {
            //subscribe to the instance events
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            var ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
            ws.onopen = (e)=>{
                console.log("websocket opened", instanceid);
                ws.send(JSON.stringify({
                    bind: {
                        ex: "wf.task",
                        key: Vue.config.user.sub+"."+instanceid+".#",
                    }
                }));
                ws.send(JSON.stringify({
                    bind: {
                        ex: "wf.instance",
                        key: Vue.config.user.sub+"."+instanceid,
                    }
                }));
            }
              
            ws.onmessage = (json)=>{
                var event = JSON.parse(json.data);
                var msg = event.msg;
                if(!msg || !msg._id) return; //odd..
                switch(event.dinfo.exchange) {
                case "wf.task":
                    if(~msg.name.indexOf("brainlife.novnc")) {
                        this.novnc_task = msg;
                        this.check_status();
                    }
                    break;
                case "wf.instance":
                    //this.instance = msg;    
                    break;
                default:
                    console.error("unknown exchange", event.dinfo.exchange);
                }
            }
        }
    },
}
</script>

<style scoped>
</style>
