<template>
<div>
  <div class="ui segment">
    <div class="ui green top attached label">
      {{task.service}}
      <div class="detail">{{task.status}}</div>
    </div>
    <h3>{{task.name}}</h3>
    <p>{{task.desc}}</p>
    <p>{{task.status_msg}}</p>
    <!--<pre>{{task.config}}</pre>-->
    <pre>{{task.products}}</pre>
  </div>

  <!--
  <pre>{{task}}</pre>
  -->

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
