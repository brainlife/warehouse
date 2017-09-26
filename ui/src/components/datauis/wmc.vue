<template>
<iframe :src="url">tractview</iframe>
</template>

<script>
import Vue from 'vue'

export default {
    props: ['task', 'subdir'],
    computed: {
        url: function() {
            var subdir_string = '';
            if (this.subdir) subdir_string = '&sdir='+encodeURIComponent(this.subdir);
            return '/ui/tractview?taskid='+this.task._id+subdir_string;
        }
    }
}
</script>

<style scoped>
iframe {
border:none;
width:100%;
height:100%;
}
</style>
