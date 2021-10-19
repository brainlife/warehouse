<template>
<img :style="imgstyle" v-lazy="project.avatar || 'https://avatars.dicebear.com/api/gridy/'+project._id+'.svg'" :width="width" :height="height"/>
</template>

<script>
export default {
    computed: {
        imgstyle: function() {
            let styles = {};
            if(!this.project.avatar) {
                styles.filter = "saturate(50%) opacity(50%)";
            }
            return styles;
        }
    },
        
    props: {
        project: { type: Object },
        width: { type: Number, default: 150 },
        height: { type: Number, default: 150 },
    }
}
</script>
