<template>
<div>
    <div v-if="!secondary">
        <small v-if="secondary_na">Secondary output not archived</small>
        <small v-else>Pending secondary output..</small>
    </div>
    <div v-if="secondary">
        <anat v-if="datatype_id == '58c33bcee13a50849b25879a'" 
            :task="task" :output_id="output_id" :product="product"/>
        <anat v-else-if="datatype_id == '594c0325fa1d2e5a1f0beda5'" 
            :task="task" :output_id="output_id" :product="product"/>
        <anat v-else-if="datatype_id == '5d9cf81c0eed545f51bf75df'" 
            :task="task" :output_id="output_id" :product="product"/>
        <dwi v-else-if="datatype_id == '58c33c5fe13a50849b25879b'" 
            :task="task" :output_id="output_id" :product="product"/>
        <func v-else-if="datatype_id == '59b685a08e5d38b0b331ddc5'" 
            :task="task" :output_id="output_id" :product="product"/>
        <tck v-else-if="datatype_id == '5907d922436ee50ffde9c549'" 
            :task="task" :output_id="output_id" :product="product"/>
        <tck v-else-if="datatype_id == '5b956f6cd7b3f1e24e9121ce'" 
            :task="task" :output_id="output_id" :product="product"/>
        <rois v-else-if="datatype_id == '5be9ea0315a8683a39a1ebd9'" 
            :task="task" :output_id="output_id" :product="product"/>
        <wmc v-else-if="datatype_id == '5cc1d64c44947d8aea6b2d8b'" 
            :task="task" :output_id="output_id" :product="product"/>
        <freesurfer v-else-if="datatype_id == '58cb22c8e13a50849b25882e'" 
            :task="task" :output_id="output_id" :product="product"/>
        <tractprofile v-else-if="datatype_id == '5965467cb09297d8d81bdbcd'" 
            :task="task" :output_id="output_id" :product="product"/>
        <ashs v-else-if="datatype_id == '5e4c47041eafffca2efa3545'" 
            :task="task" :output_id="output_id" :product="product"/>
        <tractmeasures v-else-if="datatype_id == '599f305ad1f46fec1759f363'" 
            :task="task" :output_id="output_id" :datatype_tags="datatype_tags" :product="product"/>
        <parcstats v-else-if="datatype_id == '5edd3b77c5972b8c47b3a2c3'" 
            :task="task" :output_id="output_id" :product="product"/>
        <microperimetry v-else-if="datatype_id == '604976b3ebfe45c4633ae3d2'" 
            :task="task" :output_id="output_id" :product="product"/>
        <small v-else>no secondary UI for this datatype ({{datatype_id}})</small>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'

export default {
    props: [
        'task',  //dtv task
        'datatype_id', 
        'output_id',
        'datatype_tags',
        'product', 
        'secondary', 
    ],
    data() {
        return {
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
        'microperimetry': ()=> import('@/secondary/microperimetry'),
    },
}
</script>

<style scoped>
</style>

