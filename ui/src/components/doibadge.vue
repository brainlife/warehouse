<template>
<a v-if="doi" :href="'https://doi.org/'+doi">
    <img :src="'https://zenodo.org/badge/doi/'+doi+'.svg'">
</a>
</template>

<script>
import Vue from 'vue'

export default {
    components: { },
    props: ['doi'],
}
</script>

<style scoped>
</style>
