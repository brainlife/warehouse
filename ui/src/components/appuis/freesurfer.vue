<template>
<div>
    <iframe v-if="testurl" :src="testurl">surfaceview</iframe>
</div>
</template>

<script>
import Vue from 'vue'

export default {
  props: ['task', 'subdir'],
  data() {
    return {
        testurl: null,
    }
  },
  mounted() {
    var subdir_string = '&sdir='+encodeURIComponent(this.subdir);
    if (!this.subdir) subdir_string = '';
    
    this.testurl = '/ui/surfaceview'+
                   '?free='+this.task._id+
                   subdir_string;
  }
}
</script>

<style scoped>
iframe {
  border:none;
  margin-top:4px;
  width:100%;
  height:70%;
}
</style>