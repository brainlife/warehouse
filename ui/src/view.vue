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
        <!--still staging-->
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
import life from '@/datauis/life'
import evaluator from '@/datauis/evaluator'
import images from '@/datauis/images'
import volumeviewer from '@/datauis/volumeviewer'

import filebrowser from '@/components/filebrowser'
import task from '@/components/task'
import ReconnectingWebSocket from 'reconnectingwebsocket'

import wait from '@/mixins/wait'

export default {
    mixins: [ wait ],
    props: [ /*'instanceid',*/ 'taskid', 'type', 'datatype64', 'subdir' ],
    components: { 
        dtiinit, freesurfer, tractview, 
        life, evaluator, images, 
        volumeviewer, filebrowser, task,
        surfaces,
    },

    data() {
        return {
            //task: null, //input task
        }
    },

    watch: {
        taskid: function() {
            console.log("taskid modified.. what should I do");
        }
    },

    mounted() {
        console.log("view mounted", this.taskid);
        console.log("taskid", this.taskid);
        if(!this.taskid) return;
        this.wait(this.taskid, task=>{
            console.log("done waiting");
            //this.task = task;
        });
        
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

        //poll task status until it becomes finished
        /*
        wait() {
            this.$http.get(Vue.config.wf_api+'/task', {params: {
                find: JSON.stringify({ _id: this.taskid, })
            }})
            .then(res=>{
                this.task = res.body.tasks[0];
                if(this.task.status == 'finished') return; //ready to show!
                if(this.task.status == 'removed') {
                    console.debug("rerunning");
                    this.rerun();
                }

                console.debug("polling task status.."+this.taskid);
                setTimeout(()=>{this.wait()}, 300);
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
        */
    }
}
</script>
