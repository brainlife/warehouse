<template>
<div class="page-content">
    <iframe src="https://brainlife.io/ezbids" frameBorder="0"/> 
</div>
</template>

<script>
import Vue from 'vue'

export default {
    data() {
        return {
        }
    },

    mounted: function() {
        //TODO -- we need to integrate ezBIDS into brainlife more..
        //for example, after finalize step, we just want user to select project to upload the data to.
        //franco also wants user to be authenticated using brainlife's auth service
    },
    methods: {
        handleClick: function() {
        }
    }
}
</script>
<style scoped>
.page-content {
    top: 0;
    overflow: hidden;
}
iframe {
    width: 100%;
    height: 100%;
}
</style>
