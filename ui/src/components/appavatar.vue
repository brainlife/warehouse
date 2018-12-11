<template>
<div class="appavatar">
    <img :style="imgstyle" v-lazy="app.avatar || '//robohash.org/'+app._id+'.png'" :width="width" :height="height"></img>
</div>
</template>

<script>
export default {
    computed: {
        imgstyle: function() {
            let styles = {};
            if(this.width>100) {
                //styles.border = "3px solid white";
                //styles.boxShadow = "1px 1px 5px rgba(0,0,0,0.4)";
            }
            return styles;
        }
    },

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
