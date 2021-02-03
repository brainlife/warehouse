import Vue from 'vue'

export default {
    data() {
        return {
            saWaited: 0, //number of retry made ..
            tm: null, 
        }
    },

    destroyed() { 
        clearTimeout(this.tm);
    },

    methods: {
        //task - dataset.prov.task (should be dtv)
        waitSecondaryArchive(task, cb) {
            this.saWaited++;
            if(this.saWaited > 30) {
                return cb("waited too long for secondary archive.");
            }
            
            //look for finished secondary archive task
            this.$http.get(Vue.config.amaretti_api+'/task', {params: {
                find: JSON.stringify({
                    //instance_id: task.instance_id,
                    'deps_config.task': task._id, //should be dtv._id (task.follow_task_id will be the actual app task id) - unless directly archived
                }),
                populate: 'finish_date status',
                limit: 1,
            }})
            .then(res=>{
                if(res.data.tasks.length == 0) {
                    this.tm = setTimeout(()=>{
                        this.waitSecondaryArchive(task, cb);
                    }, 3000);
                } else if(res.data.tasks.length == 1) {
                    let _task = res.data.tasks[0];
                    if(_task.finish_date) {
                        cb(null, _task);
                    } else {
                        if(_task.status == "requested" || _task.status == "running") {
                            //secondary data not yet archived? pull again later
                            this.tm = setTimeout(()=>{
                                this.waitSecondaryArchive(task, cb);
                            }, 3000);
                        } else {
                            cb("secondary task failed?");
                        }
                    }
                }
            });
        },
    }
}


