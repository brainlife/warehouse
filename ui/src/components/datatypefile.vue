<template>
<div style="display: inline-block; margin-right: 5px;">
    <span v-if="file.filename">
        <icon name="file" scale="0.8"></icon> 
        {{file.filename}}
    </span>
    <span v-if="file.dirname">
        <icon name="folder" scale="0.8"></icon> 
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
