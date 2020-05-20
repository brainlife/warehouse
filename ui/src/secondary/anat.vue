<template>
<div>
    <b-row>
        <b-col v-for="(image, idx) in images" :key="idx">
            <b>{{image.name}}</b><br>
            <a target="download" :href="image.url">
                <img :src="image.url"/>
            </a>
        </b-col>
        <!--
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
        -->
    </b-row>
    <!-- metadata can be accessed via product.meta
    {{product}}
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
            images: [],
            config: Vue.config,
        }
    },
    mounted() {
        const base = Vue.config.api+'/secondary/'+this.task._id+'/'+this.output.id+'/secondary/';
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

