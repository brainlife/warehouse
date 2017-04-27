<template>
<div style="display: inline-block;">
    <el-tag v-if="access == 'public'" type="success">Public</el-tag>
    <el-tag v-if="access == 'private'" type="danger">Private</el-tag>
</div>
</template>

<script>
import Vue from 'vue'
export default {
    props: ['access'],
}
</script>
