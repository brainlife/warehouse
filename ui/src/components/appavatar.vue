<template>
<div class="appavatar">
    <img :src="'https://robohash.org/'+app._id+'.png'" width="80"></img>
</div>
</template>

<script>
export default {
    props: [ 'app' ],
}
</script>

<style scope>
.appavatar {
background-color: #ddd;
box-shadow: inset 0px 0px 10px #aaa;
height: 80px;
width: 80px;
}
</style>
