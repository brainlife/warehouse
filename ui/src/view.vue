<template>
<div style="height: 100%; margin: 0px; padding: 0px;">
    <div v-if="task && task.status == 'finished'" style="height: 100%;">
        <dtiinit v-if="type == 't1pdd'" :task="task" :subdir="subdir" :datatype="datatype"/>
        <tractview v-else-if="type == 'tractview'" :task="task" :subdir="subdir" :datatype="datatype"/>
        <surfaces v-else-if="type == 'surfaces'" :task="task" :subdir="subdir" :datatype="datatype"/>
        <lifeview v-else-if="type == 'lifeview'" :task="task" :subdir="subdir" :datatype="datatype"/>
        <lifestats v-else-if="type == 'lifestats'" :task="task" :subdir="subdir" :datatype="datatype"/>
        <evaluator v-else-if="type == 'conneval'" :task="task" :subdir="subdir" :datatype="datatype"/>
        <images v-else-if="type == 'images'" :task="task" :subdir="subdir" :datatype="datatype"/>
        <volumeviewer v-else-if="type == 'volumeviewer'" :uiconfig="uiconfig"/>
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

// datatype UIs
import dtiinit from '@/datauis/dtiinit'
import freesurfer from '@/datauis/freesurfer'
import tractview from '@/datauis/tractview'
import surfaces from '@/datauis/surfaces'
import lifestats from '@/datauis/lifestats'
import lifeview from '@/datauis/lifeview'
import evaluator from '@/datauis/evaluator'
import images from '@/datauis/images'
import volumeviewer from '@/datauis/volumeviewer'
import nnview from '@/datauis/nnview'
import prfview from '@/datauis/prfview'

import filebrowser from '@/components/filebrowser'
import task from '@/components/task'
import ReconnectingWebSocket from 'reconnectingwebsocket'

import wait from '@/mixins/wait'

export default {
    mixins: [ wait ],
    props: [ 'taskid', 'type', 'datatype64', 'subdir' ], //deprecated - use uiconfig
    components: { 
        dtiinit, freesurfer, tractview, lifestats, lifeview, evaluator, images, volumeviewer, filebrowser, task, surfaces, nnview, prfview
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
