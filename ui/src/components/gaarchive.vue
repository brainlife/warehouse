<template>
<div>
    <icon name="folder"/>
    {{gaarchive.name}}<br>
    <pre>{{gaarchive.notebook}}</pre> <small v-if="config.debug"><pre>{{gaarchive}}</pre></small>
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
