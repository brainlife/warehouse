<template>
    <div v-if="doi" style="display: inline-block">
        <b-badge v-if="doi" @click="show()" pill class="bigpill" :class="{clickable: jump}" :title="doi">
            <b style="opacity: 0.5">doi</b>&nbsp;&nbsp;{{doi}}
        </b-badge>
    </div>
</template>

<script>
//<img v-if="doi" @click="show()" :src="'https://img.shields.io/badge/DOI-'+doi.replace('/', '\/')+'-lightgrey.svg?style=flat-square'"> <!--?style=flat-square-->
import Vue from 'vue'

export default {
    components: { },
    props: ['doi', 'jump'],
    methods: {
        show: function() {
            if(this.jump) window.open("https://doi.org/"+this.doi, this.doi);
            else prompt("DOI URL", "https://doi.org/"+this.doi);
        },
    },
}
</script>

<style scoped>
img {
    cursor: pointer;
}
.bigpill {
    line-height: 150%;
}
</style>
