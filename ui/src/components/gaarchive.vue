<template>
<div class="ga">
    <div style="opacity: 0.5; position: absolute; top: 5px; right: 10px; font-size: 90%;"> 
        <icon name="sticky-note" scale="0.8"/> Notebook
    </div>
    <small><icon name="brands/docker"/> {{gaarchive.container}}</small><br>
    {{gaarchive.name}}
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
    border: 1px solid #e0e0e0;
    border-radius: 5px;
}
</style>
