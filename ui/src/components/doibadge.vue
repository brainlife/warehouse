<template>
    <img v-if="doi" @click="show()" :src="'https://img.shields.io/badge/DOI-'+doi.replace('/', '\/')+'-blue.svg'"> <!--?style=flat-square-->
</template>

<script>
import Vue from 'vue'

export default {
    components: { },
    props: ['doi', 'jump'],
    methods: {
        show: function() {
            if(this.jump) document.location = "https://doi.org/"+this.doi;
            else prompt("DOI URL", "https://doi.org/"+this.doi);
        },
    },
}
</script>

<style scoped>
img {
cursor: pointer;
}
</style>
