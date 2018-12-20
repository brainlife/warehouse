'use strict';

import Vue from 'vue'

export default {
    data: function() {
        return {
            task: null, 
            ws: null,
        }
    },
    destroyed() {
        console.log("mixin wait destroyed");
    },
    mounted() {
        console.log("mixin mounted");
    },

    methods: {
        wait: function(taskid, cb) {
            console.log("waiting for taskid", taskid);
            this.$http.get(Vue.config.wf_api+'/task', {params: {
                find: JSON.stringify({ _id: taskid, })
            }}).then(res=>{
                this.task = res.body.tasks[0];
                if(!this.task) console.error("no such task", taskid);
                switch(this.task.status) {
                case 'finished':
                    cb(this.task); 
                    break;
                case 'removed':
                    console.debug("rerunning");
                    this.$http.put(Vue.config.wf_api+'/task/rerun/'+this.taskid).then(res => {
                        console.log("rerunning task");
                        setTimeout(()=>{this.wait(taskid, cb)}, 300);
                    });
                    break;
                default:
                    setTimeout(()=>{this.wait(taskid, cb)}, 300);
                }
            });
        },  
    }
}


