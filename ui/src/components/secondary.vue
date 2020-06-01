<template>
<div>
    <div v-if="!secondary">
        <small v-if="secondary_na">Secondary output not archived</small>
        <small v-else>Pending secondary output..</small>
    </div>
    <div v-if="secondary">
        <!--t1w-->
        <secondaryAnat v-if="output.datatype == '58c33bcee13a50849b25879a'" 
            :task="task" :output="output" :product="product"/>
        <!--t2w-->
        <secondaryAnat v-else-if="output.datatype == '594c0325fa1d2e5a1f0beda5'" 
            :task="task" :output="output" :product="product"/>
        <!--flair-->
        <secondaryAnat v-else-if="output.datatype == '5d9cf81c0eed545f51bf75df'" 
            :task="task" :output="output" :product="product"/>
        <!--dwi-->
        <secondaryDwi v-else-if="output.datatype == '58c33c5fe13a50849b25879b'" 
            :task="task" :output="output" :product="product"/>
        <!--flair-->
        <secondaryFunc v-else-if="output.datatype == '59b685a08e5d38b0b331ddc5'" 
            :task="task" :output="output" :product="product"/>
        <!--tck-->
        <secondaryTck v-else-if="output.datatype == '5907d922436ee50ffde9c549'" 
            :task="task" :output="output" :product="product"/>
        <!--rois-->
        <secondaryRois v-else-if="output.datatype == '5be9ea0315a8683a39a1ebd9'" 
            :task="task" :output="output" :product="product"/>
        <!--wmc-->
        <secondaryWmc v-else-if="output.datatype == '5cc1d64c44947d8aea6b2d8b'" 
            :task="task" :output="output" :product="product"/>
        <!--freesurfer-->
        <secondaryFreesurfer v-else-if="output.datatype == '58cb22c8e13a50849b25882e'" 
            :task="task" :output="output" :product="product"/>
        <!--tractprofile-->
        <secondaryTractprofile v-else-if="output.datatype == '5965467cb09297d8d81bdbcd'" 
            :task="task" :output="output" :product="product"/>

        <div v-else>
            <b-alert show variant="secondary">
                Unknown Datatype {{output.datatype}}<br>
                <pre>{{output}}</pre>
            </b-alert>
        </div>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'

export default {
    props: [
        'task',  //dtv task
        'output', //output spec
        'product', 
        'secondary', 
    ],
    data() {
        return {
            //secondary: null,
            //secondary_na: false,
            //secondary_t: null,

            config: Vue.config,
        }
    },
    components: {
        'secondaryAnat': ()=> import('@/secondary/anat'),
        'secondaryDwi': ()=> import('@/secondary/dwi'),
        'secondaryFunc': ()=> import('@/secondary/func'),
        'secondaryTck': ()=> import('@/secondary/tck'),
        'secondaryRois': ()=> import('@/secondary/rois'),
        'secondaryWmc': ()=> import('@/secondary/wmc'),
        'secondaryFreesurfer': ()=> import('@/secondary/freesurfer'),
        'secondaryTractprofile': ()=> import('@/secondary/tractprofile'),
    },
    watch: {
        /*
        task() {
            this.loadSecondaryTask();
        }
        */
    },
    destroyed() {
        clearTimeout(this.secondary_t);
    },
    mounted() {
        //this.loadSecondaryTask();
    },
    methods: {
        /*
        loadSecondaryTask() {
            clearTimeout(this.secondary_t);

            if(!this.task) return;
            if(!this.task.finish_date) return;

            //load secondary task submitted for this
            axios({
                method: 'GET',
                url: Vue.config.amaretti_api+'/task', 
                params: {
                    populate: '_id',
                    find: JSON.stringify({
                        'service': 'brainlife/app-archive-secondary',
                        'deps_config.task': this.task._id,
                    })
                }
            }).then(res=>{
                if(res.data.tasks && res.data.tasks.length == 1) {
                    this.secondary = res.data.tasks[0];
                } else {
                    //detect a case where app-archive-secondary is not submitted for some reason.. 
                    //so we don't keep re-loading..
                    const old = new Date();
                    old.setHours(old.getHours()-1);
                    if(new Date(this.task.finish_date) < old) {
                        console.log("looks like app-archive-secondary was not submitted for "+this.task._id);
                        this.secondary_na = true;
                        return; 
                    }

                    console.log("scheduling secondary task reload:"+this.task._id);
                    this.secondary_t = setTimeout(()=>{
                        this.loadSecondaryTask();
                    }, 5000);
                }
            }).catch(err=>{
                console.error(err);
            });
        }   
        */
    },
}
</script>

<style scoped>
</style>

