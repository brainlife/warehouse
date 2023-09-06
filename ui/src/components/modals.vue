<template>
<div>
    <!--modal that can be called from any view -->
    <dataset/>
    <agreements/>
    <downscript/>

    <!--models only used by project page (TODO - move to project page eventually -->
    <div v-if="config.user">
        <viewselecter/>
        <datasetselecter/>
        <uploader/>
        <instanceselecter/>
        <copytarget/>
        <archiver/>
        <taskinfo/>
        <appsubmit/>
        <participants/>
        <galauncher/>
        <gaarchiver/>
        <rulemodal/>
        <rulelogmodal/>
        <pipelinegroupmodal/>

        <dataladimporter/>
        <ezbidsimporter/>
    </div>
</div>
</template>

<script>

import Vue from 'vue'

export default {
    components: {
        viewselecter: ()=>import('@/modals/viewselecter'),
        dataset: ()=>import('@/modals/dataset'), 
        uploader: ()=>import('@/modals/uploader'),
        datasetselecter: ()=>import('@/modals/datasetselecter'),
        instanceselecter: ()=>import('@/modals/instanceselecter'),
        archiver: ()=>import('@/modals/archiver'),
        agreements: ()=>import('@/modals/agreements'),
        downscript: ()=>import('@/modals/downscript'),
        taskinfo: ()=>import('@/modals/taskinfo'),
        appsubmit: ()=>import('@/modals/appsubmit'),
        copytarget: ()=>import('@/modals/copytarget'),
        participants: ()=>import('@/modals/participants'),
        galauncher: ()=>import('@/modals/galauncher'),
        gaarchiver: ()=>import('@/modals/gaarchiver'),
        dataladimporter: ()=>import('@/modals/dataladimporter'),
        ezbidsimporter: ()=>import('@/modals/ezbidsimporter'),
        rulemodal: ()=>import('@/modals/RuleModal'),
        rulelogmodal: ()=>import('@/modals/rulelog'),
        pipelinegroupmodal: ()=>import('@/modals/pipelinegroup'),
    },
    data() {
        return {
            config: Vue.config,
        }
    },
}

</script>

