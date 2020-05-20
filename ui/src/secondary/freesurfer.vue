<template>
<div>
    <b-row>
        <b-col>
            <a :href="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/aparc+aseg.nii.gz?at='+config.jwt">
                aparc+aseg.nii.gz
            </a>
            <a :href="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/aparc.a2009s+aseg.nii.gz?at='+config.jwt">
                aparc.a2009s+aseg.nii.gz
            </a>
            <a :href="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/aparc.DKTatlas+aseg.nii.gz?at='+config.jwt">
                aparc.DKTatlas+aseg.nii.gz
            </a>
        </b-col>
    </b-row>

    <!-- metadata can be accessed via product.meta-->
    <!--
    {{product.meta}}
    -->
</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'

export default {
    props: ['task', 'output', 'product'],
    components: {
    },
    data() {
        return {
            config: Vue.config,
        }
    },
    mounted() {
    },
}
</script>

<style scoped>
</style>

