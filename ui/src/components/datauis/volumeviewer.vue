<template>
<iframe :src="url"></iframe>
</template>

<script>
import Vue from 'vue'

export default {
    props: ['task', 'subdir'],
    computed: {
        url: function() {
            console.log("computing volumeviewer url");
            var subdir_string = '';
            if (this.subdir) subdir_string = '&sdir='+encodeURIComponent(this.subdir);
            return '/ui/volumeviewer'+'?task='+this.task._id+subdir_string;
        }
    },
}
</script>

<style scoped>
iframe {
border:none;
width:100%;
height:100%;
}
</style>
