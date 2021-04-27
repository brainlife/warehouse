<template>
<span>
    <icon name="sticky-note" title="Group Analysis notebook"/> {{gaarchive.name}} <small>{{gaarchive.container}}</small>
    <!--
    <pre>{{gaarchive.notebook}}</pre> <small v-if="config.debug"><pre>{{gaarchive}}</pre></small>
    -->
</span>
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
