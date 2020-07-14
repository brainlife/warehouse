<template>
<div>
    <b-row>
        <b-col v-for="(image, idx) in images" :key="idx">
            <b>{{image.name}}</b><br>
            <a download :href="image.url">
                <img :src="image.url" width="100%;"/>
            </a>
        </b-col>
    </b-row>
    <small>Showing up to 50k streamlines</small>
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
            images: [],
            config: Vue.config,
        }
    },
    mounted() {
        const base = Vue.config.api+'/secondary/'+this.task._id+'/'+this.output.id+'/secondary/';
        this.images.push({
            name: "Sagittal (Left)",
            url: base+'sagittal_left.jpg?at='+Vue.config.jwt,
        });
        this.images.push({
            name: "Sagittal (Right)",
            url: base+'sagittal_right.jpg?at='+Vue.config.jwt,
        });
        this.images.push({
            name: "Axial",
            url: base+'axial.jpg?at='+Vue.config.jwt,
        });
        this.images.push({
            name: "Coronal",
            url: base+'coronal.jpg?at='+Vue.config.jwt,
        });
    },
}
</script>

<style scoped>
</style>

