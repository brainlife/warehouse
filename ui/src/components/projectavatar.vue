<template>
<img :style="imgstyle" v-lazy="project.avatar || 'https://api.adorable.io/avatars/'+width+'/'+project._id+'.png'" :width="width" :height="height"></img>
</template>

<script>
export default {
    computed: {
        imgstyle: function() {
            let styles = {};
            /*
            if(this.width>100) {
                //styles.border = "3px solid white";
                //styles.boxShadow = "1px 1px 5px rgba(0,0,0,0.4)";
            }
            */
            return styles;
        }
    },
    watch: {
        /*
        project: {
            handler() {
                console.log("project updated", this.project._id);
                //if(this.project && this.project.avatar) this.avatar = this.project.avatar;
                this.$forceUpdate();
            },
            deep: true
        }
        */
    },
        
    props: {
        project: { type: Object },
        width: { type: Number, default: 150 },
        height: { type: Number, default: 150 },
    }
}
</script>
