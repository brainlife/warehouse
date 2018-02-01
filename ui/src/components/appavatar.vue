<template>
<div class="appavatar">
    <img :src="app.avatar || '//robohash.org/'+app._id+'.png'" :width="width" :height="height"></img>
</div>
</template>

<script>
export default {
    props: {
        app: { type: Object },
        width: { type: Number, default: 80 },
        height: { type: Number, default: 80 },
    }
}
</script>

<style scoped>
.appavatar {
display: inline-block;
background-color: #eee;
}
</style>
