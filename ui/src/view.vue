<template>
<div style="height: 100%; margin: 0px; padding: 0px;">
    <div v-if="task && task.status == 'finished'" style="height: 100%;">
        <dtiinit v-if="type == 't1pdd'" :task="task" :subdir="subdir" :datatype="datatype"/>
        <tractview v-else-if="type == 'tractview'" :task="task" :subdir="subdir" :datatype="datatype"/>
        <surfaces v-else-if="type == 'surfaces'" :task="task" :subdir="subdir" :datatype="datatype"/>
        <lifeview v-else-if="type == 'lifeview'" :task="task" :subdir="subdir" :datatype="datatype"/>
        <images v-else-if="type == 'images'" :task="task" :subdir="subdir" :datatype="datatype"/>
        <nifti v-else-if="type == 'volumeviewer'" ui="volumeviewer"  :uiconfig="uiconfig"/>
        <nifti v-else-if="type == 'papaya'" ui="papaya" :uiconfig="uiconfig"/>
        <nnview v-else-if="type == 'nnview'" :task="task" :subdir="subdir" :datatype="datatype"/>
        <prfview v-else-if="type == 'prf'" :task="task" :subdir="subdir" :datatype="datatype"/>
        
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

import ReconnectingWebSocket from 'reconnectingwebsocket'
import wait from '@/mixins/wait'

export default {
    mixins: [ wait ],
    props: [ 'taskid', 'type', 'datatype64', 'subdir' ], 
    components: { 
        dtiinit: () => import('@/datauis/dtiinit'), 
        freesurfer: () => import('@/datauis/freesurfer'), 
        tractview: () => import('@/datauis/tractview'), 
        lifeview: () => import('@/datauis/lifeview'), 
        images: () => import('@/datauis/images'), 
        nifti: () => import('@/datauis/nifti'), 
        surfaces: () => import('@/datauis/surfaces'), 
        nnview: () => import('@/datauis/nnview'), 
        prfview: () => import('@/datauis/prfview'), 

        filebrowser: () => import('@/components/filebrowser'), 
        task:() => import('@/components/task'), 
    },

    data() {
        return {
            uiconfig: null,
        }
    },

    watch: {
        taskid: function() {
            console.log("taskid modified.. what should I do");
        }
    },

    mounted() {
        this.uiconfig = JSON.parse(atob(window.location.hash.substring(1)));

        if(!this.taskid) return; //TODO - why does this happen?
        //this starts the wait loop for specified taskid
        this.wait(this.taskid, task=>{
            //compose window title (same code in novnc.vue)
            let output = this.task.config._outputs.find(output=>output.subdir == this.subdir);
            if(output) {
                document.title = output.meta.subject + " "+output.datatype_tags.join(" ");
            }
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
    }
}
</script>
