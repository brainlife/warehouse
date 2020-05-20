<template>
<div>
    <small>mid slices of bold.nii.gz (volume 0)</small>
    <b-row>
        <b-col>
            <b>x</b><br>
            <img :src="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/x.png?at='+config.jwt"/>
        </b-col>
        <b-col>
            <b>y</b><br>
            <img :src="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/y.png?at='+config.jwt"/>
        </b-col>
        <b-col>
            <b>z</b><br>
            <img :src="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/z.png?at='+config.jwt"/>
        </b-col>
    </b-row>
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

