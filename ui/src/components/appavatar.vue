<template>
<div class="appavatar" :style="{width: width+'px', height: height+'px'}">
    <img v-lazy="app.avatar || '//robohash.org/'+app._id+'.png'" width="100%" height="100%"/>
</div>
</template>

<script>
export default {
    props: {
        app: { type: Object },
        width: { type: Number, default: 120 },
        height: { type: Number, default: 120 },
    }
}
</script>

<style scoped>
.appavatar {
display: inline-block;
background-color: #eee;
}
</style>
