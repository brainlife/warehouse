<template>
<div>
    <span v-if="file.filename">
        <icon name="file-o"></icon> 
        {{file.filename}}
    </span>
    <span v-if="file.dirname">
        <icon name="folder"></icon> 
        {{file.dirname}}
    </span>
    <span v-if="!file.required">(optional)</span>
</div>
</template>

<script>

export default {
    components: { },
    props: ['file'],
    data() {
        return {
        }
    }
}
</script>

<style scoped>
.file {
margin-bottom: 10px;
}
</style>
