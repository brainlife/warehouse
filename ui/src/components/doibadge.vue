<template>
    <div v-if="doi" style="display: inline-block">
        <b-badge v-if="doi" @click="show()" pill class="bigpill bigpill-left" title="Registration Date">
            doi
        </b-badge><b-badge v-if="doi" @click="show()" pill class="bigpill bigpill-right" title="Registration Date">
            {{doi}}
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
.doi-header {
background-color: white;
color: white;
padding: 8px 10px;
display: inline-block;
margin: -5px 0;
margin-left: -15px;
border-top-left-radius: 25%;
border-bottom-left-radius: 25%;
}
.bigpill-left, .bigpill-right {
padding: 8px;
height: 26px;
}
.bigpill-left {
border-top-right-radius: 0;
border-bottom-right-radius: 0;
border-right: none;
background-color: #eee;
color: #999;
}
.bigpill-right {
border-top-left-radius: 0;
border-bottom-left-radius: 0;
border-left: none;
font-size: 75%;
}
</style>
