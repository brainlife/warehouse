<template>
<div>
    <div v-if="task.finish_date">
        <b style="opacity: 0.5;">{{task.service}}<small>:{{task.service_branch}}</small></b>
        <span v-if="task.product && task.product.errors.length == 0 && task.product.warnings.length == 0">
            <icon name="check" scale="0.8"/> Found no issues
        </span>
        <small>({{task._id}})</small>
        <div v-if="task.product" style="margin-bottom: 5px;">
            <b-alert show v-for="(error, idx) in task.product.errors" :key="idx" variant="danger"><b>Error</b> {{error}}</b-alert>
            <b-alert show v-for="(warning, idx) in task.product.warnings" :key="idx" variant="secondary"><b>Warning</b> {{warning}}</b-alert>
            <product :product="task.product"/>
        </div>
        <secondary :task="task" :output="output" :product="product"/>
    </div>
    <div v-else>
        <task :task="task"/>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import product from '@/components/product'
import secondary from '@/components/secondary'
import task from '@/components/task'

import axios from 'axios'

export default {
    props: ['task', 'output', 'product'],
    components: {
        secondary,
        product,
        task,
    }
}
</script>

<style scoped>
</style>

