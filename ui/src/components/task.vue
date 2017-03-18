<template>
<div class="ui segment">

  <!--status-->
  <div class="ui icon message">
    <i class="notched circle loading icon blue" v-if="task.status == 'running'"></i>
    <i class="check icon green" v-if="task.status == 'finished'"></i>
    <i class="wait icon" v-if="task.status == 'requested'"></i>
    <i class="warning icon red" v-if="task.status == 'failed'"></i>
    <div class="content">
      <div class="header"> {{task.name}} <span class="ui label small">{{task.service}}</span> </div>
      <p>{{task.status_msg}}</p>
    </div>
  </div>

  <div class="description">
    <p>{{task.desc}}</p>
    <!--<pre>{{task.config}}</pre>-->
    <h3>Config</h3>
    <pre>{{task.config}}</pre>
    <h3>Products</h3>
    <pre>{{task.products}}</pre>
  </div>
</div>
</template>

<script>
import Vue from 'vue'

export default {
  name: "contact",
  data () {
    return {
    }
  },
  computed: {
  },
  mounted: function() {
  },
  methods: {
  },
  props: ['task'],
}
</script>
