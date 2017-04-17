<template>
<div class="card" v-if="app">
  <div class="content">
    <img class="right floated tiny ui image" :src="app.avatar+'?'+Math.random()">
    <div class="header">
      {{app.name}}
    </div>
    <!--
    <div class="">
      <contact :id="app.user_id" class="contact mini"></contact>.
    </div>
    -->
    <div class="description">
      {{app.desc}}
    </div>
  </div>
    <div class="ui two buttons">
      <div class="ui button" @click="go('/app/'+app._id)"><i class="info circle icon"></i> Detail</div>
      <div class="ui blue button" @click="go('/app/'+app._id+'/submit'+(dataset?'?dataset='+dataset._id:''))"><i class="play icon"></i> Submit</div>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

import contact from '@/components/contact'

export default {
    components: { contact },
    props: ['app', 'dataset'],
    data () {
        return {
        }
    },
    methods: {
        go: function(path) {
            this.$router.push(path);
        }
    },
}
</script>


