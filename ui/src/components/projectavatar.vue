<template>
<!--<img v-lazy="project.avatar || '//eightbitavatar.herokuapp.com/?id='+project._id+'@3&s=male&size='+width" :width="width" :height="height"></img>-->
<!--<img v-lazy="project.avatar || '//www.gravatar.com/avatar/'+project._id+'?d=wavatar&s='+width" :width="width" :height="height"></img>-->
<img :style="imgstyle" v-lazy="project.avatar || 'https://api.adorable.io/avatars/'+width+'/'+project._id+'.png'" :width="width" :height="height"></img>
</template>

<script>
export default {
    computed: {
        imgstyle: function() {
            let styles = {};
            /*
            if(this.width>100) {
                styles.border = "3px solid white";
                styles.boxShadow = "1px 1px 5px rgba(0,0,0,0.4)";
            }
            */
            return styles;
        }
    },
        
    props: {
        project: { type: Object },
        width: { type: Number, default: 120 },
        height: { type: Number, default: 120 },
    }
}
</script>
