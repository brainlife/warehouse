<template>
<!--<img v-lazy="project.avatar || '//eightbitavatar.herokuapp.com/?id='+project._id+'@3&s=male&size='+width" :width="width" :height="height"></img>-->
<img v-lazy="project.avatar || '//www.gravatar.com/avatar/'+project._id+'?d=wavatar&s='+width" :width="width" :height="height"></img>
</template>

<script>
export default {
    props: {
        project: { type: Object },
        width: { type: Number, default: 120 },
        height: { type: Number, default: 120 },
    }
}
</script>
