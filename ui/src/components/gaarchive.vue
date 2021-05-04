<template>
<div class="ga">
    <div style="opacity: 0.3; position: absolute; top: 5px; right: 10px;"> <icon name="sticky-note" title="Group Analysis notebook"/> Notebook</div>
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
