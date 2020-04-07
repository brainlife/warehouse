<template>
<div>
    <div>
        <!--
        <span v-if="task.status == 'finished'">
            <statusicon :status="task.status" scale="0.6"/> 
            Validated!
        </span>
        -->
        <span v-if="task.status == 'requested' || task.status == 'running'">
            <statusicon :status="task.status" scale="0.6"/> 
            {{task.status_msg}}
            <small>{{task._id}}</small>
        </span>
        <span v-if="task.status == 'failed'">
            <statusicon :status="task.status" scale="0.6"/> 
            Failed to validate! {{task.status_msg}}
            <small>{{task._id}}</small>
        </span>
    </div>

    <div v-if="task.status == 'finished'">
        <b-alert show v-if="!task.product" variant="danger">No product (all validator should have product.. odd)</b-alert>
        <div v-else>
            <b-alert show v-for="(error, idx) in task.product.errors" :key="idx" variant="danger"><b>Error</b> {{error}}</b-alert>
            <b-alert show v-for="(warning, idx) in task.product.warnings" :key="idx" variant="warning"><b>Warning</b> {{warning}}</b-alert>
            <product :product="task.product"/>
        </div>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import statusicon from '@/components/statusicon'
import product from '@/components/product'

export default {
    props: ['task'],
    components: {
        statusicon, 
        product
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

