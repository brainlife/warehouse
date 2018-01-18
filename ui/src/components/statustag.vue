<template>
<span>
    <p class="text-muted" v-if="status == 'removed'">
        <statusicon :status="status" :scale="scale"></statusicon>Removed
    </p>
    <p class="text-muted" v-else-if="status == 'stopped'">
        <statusicon :status="status" :scale="scale"></statusicon>Stopped
    </p>
    <p class="text-muted" v-else-if="status == 'stop_requested'">
        <statusicon :status="status" :scale="scale"></statusicon>Stop Requested
    </p>
    <p class="text-success" v-else-if="status == 'finished'">
        <statusicon :status="status" :scale="scale"></statusicon>Finished
    </p>
    <p class="text-primary" v-else-if="status == 'running'">
        <statusicon :status="status" :scale="scale"></statusicon>Processing
    </p>
    <p class="text-info" v-else-if="status == 'waiting'">
        <statusicon :status="status" :scale="scale"></statusicon>Waiting
    </p>
    <p class="text-info" v-else-if="status == 'requested'">
        <statusicon :status="status" :scale="scale"></statusicon>Requested
    </p>
    <p class="text-danger" v-else-if="status == 'failed'">
        <statusicon :status="status" :scale="scale"></statusicon>Failed
    </p>


    <!--this is for resource status-->
    <p class="text-success" v-else-if="status == 'ok'">
        <statusicon :status="status" :scale="scale"></statusicon>OK
    </p>

    <p class="text-warning" v-else>
        <statusicon :status="status" :scale="scale"></statusicon>Unknown
    </p>

</span>
</template>

<script>

import statusicon from '@/components/statusicon'

export default {
    components: { statusicon },
    props: [ 'status', 'scale' ],
    /*
    mounted: function() {
        if(!this.scale) this.scale = 0.4;
    }
    */
}
</script>

<style scoped>
p {
margin-bottom: 0px;
white-space: nowrap;
text-transform: uppercase;
font-weight: bold;
display: inline-block;
}
</style>
