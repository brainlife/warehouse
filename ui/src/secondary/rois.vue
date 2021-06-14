<template>
<div>
    <b-row>
        <b-col>
            <b>x</b><br>
            <img :src="config.api+'/secondary/'+task._id+'/'+output_id+'/secondary/x.png?at='+config.jwt"/>
        </b-col>
        <b-col>
            <b>y</b><br>
            <img :src="config.api+'/secondary/'+task._id+'/'+output_id+'/secondary/y.png?at='+config.jwt"/>
        </b-col>
        <b-col>
            <b>z</b><br>
            <img :src="config.api+'/secondary/'+task._id+'/'+output_id+'/secondary/z.png?at='+config.jwt"/>
        </b-col>
    </b-row>
    <!-- metadata can be accessed via product.meta-->
    <!--
    {{product.meta}}
    -->
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
        }
    },
    mounted() {
    },
}
</script>

<style scoped>
</style>

