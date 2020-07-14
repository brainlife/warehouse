'use strict';

import Vue from 'vue'

export default {
    data() {
        return {
            task: null, 
            ws: null,
        }
    },
    destroyed() {
        clearTimeout(this.ws);
    },
    methods: {
        wait(taskid, cb) {
            console.log("waiting for taskid", taskid);
            this.$http.get(Vue.config.wf_api+'/task', {params: {
                find: JSON.stringify({ _id: taskid, })
            }}).then(res=>{
                this.task = res.data.tasks[0];
                if(!this.task) console.error("no such task", taskid);
                switch(this.task.status) {
                case 'failed':
                    cb(this.task); 
                    break;
                case 'finished':
                    cb(this.task); 
                    break;
                case 'removed':
                    console.debug("rerunning");
                    this.$http.put(Vue.config.wf_api+'/task/rerun/'+this.taskid).then(res => {
                        console.log("rerunning task");
                        this.ws = setTimeout(()=>{this.wait(taskid, cb)}, 1000);
                    });
                    break;
                default:
                    this.ws = setTimeout(()=>{this.wait(taskid, cb)}, 1000);
                }
            });
        },  
    }
}


