<template>
<span>
    <el-tag v-if="status == 'removed'">
        <statusicon :status="status" :scale="scale"></statusicon> Removed
    </el-tag>
    <el-tag v-else-if="status == 'stop_requested'">
        <statusicon :status="status" :scale="scale"></statusicon> Stopped
    </el-tag>
    <el-tag v-else-if="status == 'stop_requested'">
        <statusicon :status="status" :scale="scale"></statusicon> Stop Requested
    </el-tag>
    <el-tag type="success" v-else-if="status == 'finished'">
        <statusicon :status="status" :scale="scale"></statusicon> Finished
    </el-tag>
    <el-tag type="primary" v-else-if="status == 'running'">
        <statusicon :status="status" :scale="scale"></statusicon> Processing
    </el-tag>
    <el-tag type="primary" v-else-if="status == 'requested'">
        <statusicon :status="status" :scale="scale"></statusicon> Requested
    </el-tag>
    <el-tag type="danger" v-else-if="status == 'failed'">
        <statusicon :status="status" :scale="scale"></statusicon> Failed
    </el-tag>
    <el-tag type="success" v-else-if="status == 'ok'">
        <statusicon :status="status" :scale="scale"></statusicon> OK
    </el-tag>
    <el-tag type="warning" v-else>
        <statusicon :status="status" :scale="scale"></statusicon> Unknown
    </el-tag>

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

<style>
span.el-tag {
border-radius: 0px;
}
</style>
