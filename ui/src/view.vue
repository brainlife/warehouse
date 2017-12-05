<template>
<div style="height: 100%; margin: 0px; padding: 0px;">
    <div v-if="task && task.status == 'finished'" style="height: 100%;">
        <!--I might conver this into freesurfer post processing output view
        <freesurfer v-else-if="type == 'neuro.freesurfer'" :task="task" :subdir="subdir"></freesurfer>-->

        <dtiinit v-if="type == 't1pdd'" :task="task" :subdir="subdir"></dtiinit>
        <wmc v-else-if="type == 'tractview'" :task="task" :subdir="subdir"></wmc>
        <lifeview v-else-if="type == 'lifeview'" :task="task" :subdir="subdir"></lifeview>
        <life v-else-if="type == 'lifestats'" :task="task" :subdir="subdir"></life>
        <evaluator v-else-if="type == 'conneval'" :task="task" :subdir="subdir"></evaluator>
        <images v-else-if="type == 'images'" :task="task" :subdir="subdir"></images>
        <volumeviewer v-else-if="type == 'volumeviewer'" :task="task" :subdir="subdir"></volumeviewer>
        <div v-else-if="type == 'raw'" style="padding: 15px; background-color: white; height: 100%; overflow: auto;">
            <filebrowser :task="task" :path="task.instance_id+'/'+task._id+'/'+(subdir||'')"></filebrowser>
        </div>
    </div>
    <div v-else style="padding: 20px; height: 100%; overflow: auto;">
        <h3>Staging Data</h3>
        <task :task="task"/>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

// datatype UIs
import dtiinit from '@/datauis/dtiinit'
import freesurfer from '@/datauis/freesurfer'
import wmc from '@/datauis/wmc'
import lifeview from '@/datauis/lifeview'
import life from '@/datauis/life'
import evaluator from '@/datauis/evaluator'
import images from '@/datauis/images'
import volumeviewer from '@/datauis/volumeviewer'

import filebrowser from '@/components/filebrowser'
import task from '@/components/task'
import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    props: [ 'instanceid', 'taskid', 'type', 'subdir' ],
    components: { 
        dtiinit, freesurfer, wmc, 
        life, evaluator, images, 
        volumeviewer, filebrowser, task,
        lifeview,
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
        this.wait();
    },

    methods: {
        go: function(path) {
            this.$router.push(path);
        },

        //wait for the data task to finish
        wait: function(cb) {
            if(!cb) cb = ()=>{};

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
            .then(res => {
                console.dir(res); 
            })
            .catch(err => {
                console.error(err); 
            });
        },
    }
}
</script>
