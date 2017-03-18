<template>
<transition name="fade">
  <div class="ui message" :class="msg.cls" v-if="!closed">
    <i class="close icon" @click="close()"></i>
    <div class="header" v-if="msg.header !== null">
      {{msg.header}}
    </div>
    <p>{{msg.msg}}</p>
  </div>
</transition>
</template>

<script>
import Vue from 'vue'

export default {
  name: "message",
  data () {
    return {
      /*
      msg: {
        message: "hi",
        header: "header",
        cls: {info: true},
      },
      */
      closed: false,
    }
  },
  mounted: function() {
  },
  methods: {
    close: function() {
      this.closed = true;
    }
  },
  props: ['msg'],
}
</script>
<style>
</style>
