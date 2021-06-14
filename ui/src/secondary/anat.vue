<template>
<div>
    <b-row>
        <b-col v-for="(image, idx) in images" :key="idx">
            <small>{{image.name}}</small><br>
            <a target="download" :href="image.url">
                <img :src="image.url"/>
            </a>
        </b-col>
    </b-row>
</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'

export default {
    props: ['task', 'output_id', 'product'],
    components: {
    },
    data() {
        return {
            images: [],
            config: Vue.config,
        }
    },
    mounted() {
        const base = Vue.config.api+'/secondary/'+this.task._id+'/'+this.output_id+'/secondary/';
        this.images.push({
            name: "Sagittal",
            url: base+'x.png?at='+Vue.config.jwt,
        });
        this.images.push({
            name: "Coronal",
            url: base+'y.png?at='+Vue.config.jwt,
        });
        this.images.push({
            name: "Axial",
            url: base+'z.png?at='+Vue.config.jwt,
        });
    },
}
</script>

<style scoped>
</style>

