<template>
<div>
    <!--modal that can be called from any view -->
    <dataset/>
    <datatype/>
    <agreements/>
    <downscript/>

    <!--models only used by project page (TODO - move to project page eventually -->
    <div v-if="config.user">
        <viewselecter/>
        <datasetselecter/>
        <uploader/>
        <instanceselecter/>
        <archiver/>
    </div>
</div>
</template>

<script>

import Vue from 'vue'

import viewselecter from '@/modals/viewselecter'
import dataset from '@/modals/dataset'
import datatype from '@/modals/datatype'
import datasetselecter from '@/modals/datasetselecter'
import uploader from '@/modals/uploader'
import instanceselecter from '@/modals/instanceselecter'
import archiver from '@/modals/archiver'
import agreements from '@/modals/agreements'
import downscript from '@/modals/downscript'

export default {
    components: {
        viewselecter, dataset, datatype, 
        uploader, datasetselecter, instanceselecter, 
        archiver, agreements, downscript,
    },
    data() {
        return {
            config: Vue.config,
        }
    },
}

</script>


