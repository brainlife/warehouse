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
        waitSecondaryArchive(task, cb) {
            this.saWaited++;
            if(this.saWaited > 30) {
                return cb("waited too long for secondary archive.");
            }
            
            console.log("checking to see if secondary archive task has finished", task._id);
            //look for finished secondary archive task
            this.$http.get(Vue.config.amaretti_api+'/task', {params: {
                find: JSON.stringify({
                    instance_id: task.instance_id,
                    'deps_config.task': task._id,
                    //finish_date: {$exists: true},
                }),
                populate: 'finish_date status',
                limit: 1,
            }})
            .then(res=>{
                if(res.data.tasks.length == 0) {
                    //console.log("secondary archiver hasn't been submitted yet.. waiting");
                    this.tm = setTimeout(()=>{
                        this.waitSecondaryArchive(task, cb);
                    }, 3000);
                } else if(res.data.tasks.length == 1) {
                    let _task = res.data.tasks[0];
                    if(_task.finish_date) {
                        //console.log("secondary archiver exists and it's finished");
                        cb(null, _task);
                    } else {
                        if(_task.status == "requested" || _task.status == "running") {
                            //console.log("secondary task archiver still running.. waiting");
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


