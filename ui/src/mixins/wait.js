'use strict';

import Vue from 'vue'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    data() {
        return {
            task: null, 
            ws: null,
        }
    },
    destroyed() {
        this.ws.close();
        //clearTimeout(this.ws);
    },
    methods: {
        wait(taskid, cb) {
            console.log("waiting for taskid", taskid);

            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            if(this.ws) this.ws.close();
            this.ws = new ReconnectingWebSocket(url, null, {/*debug: Vue.config.debug,*/ reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                //loading the task for the first time
                this.$http.get(Vue.config.wf_api+'/task', {params: {
                    find: JSON.stringify({ _id: taskid, })
                }}).then(res=>{
                    this.task = res.data.tasks[0];
                    if(!this.task) console.error("no such task", taskid);
                    this.checkState(cb);
                    
                    //wf.task will be deprecated by ex:amaretti
                    this.ws.send(JSON.stringify({
                        bind: {
                            ex: "wf.task",
                            key: this.task.instance_id+"."+taskid,
                        }
                    }));

                    this.ws.onmessage = (json)=>{
                        var event = null;
                        try {
                            event = JSON.parse(json.data);
                        } catch(err) {
                            console.error(err);
                            return;
                        }
                        if(!event) {
                            console.error("can't parse event", json);
                            return;
                        }
                        if(event.error) return console.error(event.error);
                        if(!event.dinfo) {
                            console.error("event.dinfo not set");
                            return;
                        }
                        Object.assign(this.task, event.msg);
                        this.checkState(cb);
                    };
                });
            }
        },  

        checkState(cb) {
            switch(this.task.status) {
            case 'failed':
            case 'stopped':
            case 'finished':
                this.ws.close();
                cb(this.task); 
                break;
            case 'removed':
                console.debug("rerunning");
                this.$http.put(Vue.config.wf_api+'/task/rerun/'+this.taskid).then(res => {
                    console.log("rerunning task");
                    this.ws = setTimeout(()=>{this.wait(taskid, cb)}, 1000);
                });
                break;
            }
        }

    }
}


