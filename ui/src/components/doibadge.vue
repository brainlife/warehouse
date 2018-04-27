<template>
<!--
<a v-if="doi" :href="'https://doi.org/'+doi">
    <img :src="'https://zenodo.org/badge/doi/'+doi+'.svg'">
</a>
-->
<img @click="show()" :src="'https://img.shields.io/badge/DOI-'+doi.replace('/', '\/')+'-lightgray.svg'">
</template>

<script>
import Vue from 'vue'

export default {
    components: { },
    props: ['doi'],
    methods: {
        show: function() {
            prompt("DOI URL", "https://doi.org/"+this.doi);
        },
    },
}
</script>

<style scoped>
img {
cursor: pointer;
}
</style>
