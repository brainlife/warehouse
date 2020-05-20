<template>
<div>
    <p>
        <small>
            The following images show the difference between volumes at and orthogonal to specified bvecs.
            On dwi, the high voxel intensity means the movement of the water molecules is more restricted.
            This results in seeing more features that are orthogonal to the direction of bvecs. 
            If the bvecs and dwi images are correctly oriented (no flipping of bvecs, incorrect voxel layout, etc..)
            then those oppositing dwi should show features (in red) that are orthogonal to the bvecs direction. 
            For example, the top left image with bvecs direction of (1,1,0) should have more features (in red) that are
            pointing toward top right corner of the image, as bvec of (1,1,0) points toward top left corner of the image.
            The high quality dwi image should have more discernible features, and inconclusive flip evidences suggests 
            image quality issue.
        </small>
    </p>
    <b-row>
        <b-col>
            <b>(-1,1,0)</b> <small>should see features parallel to \ (toward top left) direction</small><br>
            <img :src="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/xy2.png?at='+config.jwt"/>
        </b-col>
        <b-col>
            <b>(0,1,1)</b> <small>should see features parallel to \ (toward top left) direction</small><br>
            <img :src="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/yz1.png?at='+config.jwt"/>
        </b-col>
        <b-col>
            <b>(1,0,1)</b> <small>should see features parallel to \ (toward top left) direction</small><br>
            <img :src="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/xz1.png?at='+config.jwt"/>
        </b-col>
    </b-row>
    <b-row>
        <b-col>
            <b>(1,1,0) </b> <small>should see features parallel to / (toward top right) direction</small><br>
            <img :src="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/xy1.png?at='+config.jwt"/>
        </b-col>
        <b-col>
            <b>(0,-1,1)</b> <small>should see features parallel to / (toward top right) direction</small><br>
            <img :src="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/yz2.png?at='+config.jwt"/>
        </b-col>
        <b-col>
            <b>(1,0,-1)</b> <small>should see features parallel to / (toward top right) direction</small><br>
            <img :src="config.api+'/secondary/'+task._id+'/'+output.id+'/secondary/xz2.png?at='+config.jwt"/>
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

