<template>
<img @click="show()" :src="'https://img.shields.io/badge/DOI-'+doi.replace('/', '\/')+'-lightgray.svg?style=flat-square'">
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
