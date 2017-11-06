<template>
<div style="display: inline-block;">
    <div  v-if="access == 'public'">
        <el-tag type="success">Public</el-tag>
        <span class="text-muted">Datasets are accessible to any users but only project member can update them.</span>
    </div>
    <div v-if="access == 'private'">
        <el-tag type="danger">Private</el-tag>
        <span class="text-muted">Only the members of project can access datasets</span>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
export default {
    props: ['access'],
}
</script>
