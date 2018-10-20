<template>
<div style="height: 100%; margin: 0px; padding: 0px;">
    <div v-if="task && task.status == 'finished'" style="height: 100%;">
        <dtiinit v-if="type == 't1pdd'" :task="task" :subdir="subdir" :datatype="datatype"></dtiinit>
        <tractview v-else-if="type == 'tractview'" :task="task" :subdir="subdir" :datatype="datatype"></tractview>
        <surfaces v-else-if="type == 'surfaces'" :task="task" :subdir="subdir" :datatype="datatype"></surfaces>
        <!--
        <lifeview v-else-if="type == 'lifeview'" :task="task" :subdir="subdir" :datatype="datatype"></lifeview>
        -->
        <life v-else-if="type == 'lifestats'" :task="task" :subdir="subdir" :datatype="datatype"></life>
        <evaluator v-else-if="type == 'conneval'" :task="task" :subdir="subdir" :datatype="datatype"></evaluator>
        <images v-else-if="type == 'images'" :task="task" :subdir="subdir" :datatype="datatype"></images>
        <volumeviewer v-else-if="type == 'volumeviewer'" :task="task" :subdir="subdir" :datatype="datatype"></volumeviewer>
        <div v-else-if="type == 'raw'" style="padding: 10px 0px; background-color: white; height: 100%; overflow: auto;">
            <filebrowser :task="task" :path="(subdir||'')" style="margin-right: 50px;"></filebrowser>
        </div>
    </div>
    <div v-else style="padding: 20px; height: 100%; overflow: auto;">
        <task :task="task"/>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

// datatype UIs
import dtiinit from '@/datauis/dtiinit'
import freesurfer from '@/datauis/freesurfer'
import tractview from '@/datauis/tractview'
import surfaces from '@/datauis/surfaces'
//import lifeview from '@/datauis/lifeview'
import life from '@/datauis/life'
import evaluator from '@/datauis/evaluator'
import images from '@/datauis/images'
import volumeviewer from '@/datauis/volumeviewer'

import filebrowser from '@/components/filebrowser'
import task from '@/components/task'
import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    props: [ 'instanceid', 'taskid', 'type', 'datatype64', 'subdir' ],
    components: { 
        dtiinit, freesurfer, tractview, 
        life, evaluator, images, 
        volumeviewer, filebrowser, task,
        surfaces,
    },

    data() {
        return {
            instance: null,
            error: null,

            task: null, //input task
            novnc_task: null, //novnc task for novnc based views
        }
    },

    mounted() {
        this.wait();
    },
    computed: {
        datatype() {
            return atob(this.datatype64);
        }
    },

    methods: {
        go(path) {
            this.$router.push(path);
        },

        //wait for the staging task to finish
        wait(cb) {
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
                } else setTimeout(()=>{this.wait(cb)}, 500);
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
