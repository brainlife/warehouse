<template>
<div class="projectavatar">
    <img :src="project.avatar || 'http://eightbitavatar.herokuapp.com/?id='+project._id+'@3&s=male&size='+width" :width="width" :height="height"></img>
</div>
</template>

<script>
export default {
    props: {
        project: { type: Object },
        width: { type: Number, default: 80 },
        height: { type: Number, default: 80 },
    }
}
</script>

<style scope>
.projectavatar {
background-color: #ddd;
box-shadow: inset 0px 0px 10px #aaa;
}
</style>
