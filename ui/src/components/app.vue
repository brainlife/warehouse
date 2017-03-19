<template>
<div class="card" v-if="app">
  <div class="content">
    <img class="right floated mini ui image" :src="app.avatar">
    <div class="header">
      {{app.name}}
    </div>
    <div class="">
      <!--{{app.create_date}}-->
      <contact :id="app.user_id" class="contact mini"></contact>
    </div>
    <div class="description">
      {{app.desc}}
    </div>
  </div>
  <div class="extra content">
    <div class="ui two buttons">
      <div class="ui basic green button" @click="go('/app/'+app._id)">Detail</div>
      <!--<div class="ui basic red button">Info</div>-->
    </div>
  </div>
</div>
</template>

<script>
import Vue from 'vue'

import contact from '@/components/contact'

export default {
  name: "app",
  data () {
    return {
    }
  },
  methods: {
    go: function(path) {
      this.$router.push(path);
    }
  },
  props: ['app'],
  components: { contact },
}
</script>
