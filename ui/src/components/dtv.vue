<template>
<div>
    <div v-if="task.status == 'finished'">
        <b style="opacity: 0.5;">Validator</b>
        <small>({{task.service}} / {{task._id}})</small>
        <span v-if="task.product && task.product.errors.length == 0 && task.product.warnings.length == 0">
            <icon name="check" scale="0.8"/> Found no issues
        </span>

        <div v-if="task.product">
            <b-alert show v-for="(error, idx) in task.product.errors" :key="idx" variant="danger"><b>Error</b> {{error}}</b-alert>
            <b-alert show v-for="(warning, idx) in task.product.warnings" :key="idx" variant="warning"><b>Warning</b> {{warning}}</b-alert>
            <product :product="task.product"/>
        </div>
    </div>
    <div v-else>
        <task :task="task"/>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import statusicon from '@/components/statusicon'
import product from '@/components/product'
import task from '@/components/task'

export default {
    props: ['task'],
    components: {
        statusicon, 
        product,
        task,
    }
}
</script>

<style scoped>
.subtitle {
color: #aaa;
font-weight: bold;
font-size: 95%;
}

</style>

