<template>
<div>
    <el-tag v-for="(v, k) in metadata" key="k">
        <b>{{k}}</b> {{v}}
    </el-tag>
</div>
</template>

<script>
export default {
    props: [ 'metadata' ],
}
</script>
