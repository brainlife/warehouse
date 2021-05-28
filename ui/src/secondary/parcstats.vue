<template>
<div>
    <!-- no secondary output for wmc yet.. -->

    <!-- metadata can be accessed via product.meta-->
    <!--
    {{product.meta}}
    -->
    parc tsta
    {{cortex}}
</div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'

import { parseCSV } from '@/lib'

export default {
    props: [
        'task', 
        'output', 
        'product'
    ],
    components: {},
    data() {
        return {
            config: Vue.config,
            cortex: null,
        }
    },
    async mounted() {
        console.log("loading cortex.csv");
        const res = await this.$http.get('secondary/'+this.task._id+'/'+this.output.id+'/parc-stats/cortex.csv');
        this.cortex = parseCSV(res.data);           
    },
}
</script>

<style scoped>
</style>

