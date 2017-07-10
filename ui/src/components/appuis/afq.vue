<template>
<div>
    <iframe v-if="testurl" :href="testurl">tractview</iframe>
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
    
    this.testurl = '/ui/tractview'+
                   '?afq='+this.task._id+
                   subdir_string;
  }
}
</script>

<style scoped>
iframe {
  border:none;
  width:100%;
  height:calc(width);
}
</style>