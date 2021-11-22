<template>
<div class="ga">
    <div style="opacity: 0.5; position: absolute; top: 5px; right: 10px; font-size: 90%;"> 
        <icon name="sticky-note" scale="0.8"/> Notebook
    </div>
    <b class="title"><icon name="brands/docker"/> {{gaarchive.container}}</b><br>
    <p class="serif"><small>{{gaarchive.name}}</small></p>
</div>
</template>
<script>

import Vue from 'vue'

export default {
    props: {
        gaarchive: {type: Object},
    },
    data() {
        return {
            config: Vue.config,
        }
    },
}
</script>

<style scoped>
.ga {
    padding: 5px 10px;
    position: relative;
}
.title {
    opacity: 0.8;
    font-size: 90%;
}
</style>
