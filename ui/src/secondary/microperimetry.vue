<template>
<div>
    <img v-if="url" :src="url"/>
</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'

export default {
    props: ['task', 'output_id', 'product'],
    components: {
    },
    data() {
        return {
            config: Vue.config,
            url: null,
        }
    },
    mounted() {
        const base = Vue.config.api+'/secondary/'+this.task._id+'/'+this.output_id+'/secondary/';
        this.url = base+'dataLayout.png?at='+Vue.config.jwt;
    },
}
</script>

<style scoped>
</style>

