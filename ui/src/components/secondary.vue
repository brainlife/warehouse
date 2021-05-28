<template>
<div>
    <div v-if="!secondary">
        <small v-if="secondary_na">Secondary output not archived</small>
        <small v-else>Pending secondary output..</small>
    </div>
    <div v-if="secondary">
        <anat v-if="output.datatype == '58c33bcee13a50849b25879a'" 
            :task="task" :output="output" :product="product"/>
        <anat v-else-if="output.datatype == '594c0325fa1d2e5a1f0beda5'" 
            :task="task" :output="output" :product="product"/>
        <anat v-else-if="output.datatype == '5d9cf81c0eed545f51bf75df'" 
            :task="task" :output="output" :product="product"/>
        <dwi v-else-if="output.datatype == '58c33c5fe13a50849b25879b'" 
            :task="task" :output="output" :product="product"/>
        <func v-else-if="output.datatype == '59b685a08e5d38b0b331ddc5'" 
            :task="task" :output="output" :product="product"/>
        <tck v-else-if="output.datatype == '5907d922436ee50ffde9c549'" 
            :task="task" :output="output" :product="product"/>
        <tck v-else-if="output.datatype == '5b956f6cd7b3f1e24e9121ce'" 
            :task="task" :output="output" :product="product"/>
        <rois v-else-if="output.datatype == '5be9ea0315a8683a39a1ebd9'" 
            :task="task" :output="output" :product="product"/>
        <wmc v-else-if="output.datatype == '5cc1d64c44947d8aea6b2d8b'" 
            :task="task" :output="output" :product="product"/>
        <freesurfer v-else-if="output.datatype == '58cb22c8e13a50849b25882e'" 
            :task="task" :output="output" :product="product"/>
        <tractprofile v-else-if="output.datatype == '5965467cb09297d8d81bdbcd'" 
            :task="task" :output="output" :product="product"/>
        <ashs v-else-if="output.datatype == '5e4c47041eafffca2efa3545'" 
            :task="task" :output="output" :product="product"/>
        <tractmeasures v-else-if="output.datatype == '599f305ad1f46fec1759f363'" 
            :task="task" :output="output" :product="product"/>
        <parcstats v-else-if="output.datatype == '5edd3b77c5972b8c47b3a2c3'" 
            :task="task" :output="output" :product="product"/>

        <!--
        <div v-else>
            <b-alert show variant="secondary">
                No secondary data UI registered for {{output.datatype}}<br>
                <pre>{{output}}</pre>
            </b-alert>
        </div>
        -->
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
        'anat': ()=> import('@/secondary/anat'),
        'dwi': ()=> import('@/secondary/dwi'),
        'func': ()=> import('@/secondary/func'),
        'tck': ()=> import('@/secondary/tck'),
        'rois': ()=> import('@/secondary/rois'),
        'wmc': ()=> import('@/secondary/wmc'),
        'freesurfer': ()=> import('@/secondary/freesurfer'),
        'tractprofile': ()=> import('@/secondary/tractprofile'),
        'ashs': ()=> import('@/secondary/ashs'),
        'tractmeasures': ()=> import('@/secondary/tractmeasures'),
        'parcstats': ()=> import('@/secondary/parcstats'),
    },
    watch: {
    },
    destroyed() {
        clearTimeout(this.secondary_t);
    },
    mounted() {
    },
    methods: {
    },
}
</script>

<style scoped>
</style>

