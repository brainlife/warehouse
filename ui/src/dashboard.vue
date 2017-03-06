<template>
  <div>
    <sidemenu active="dashboard"></sidemenu>
    <div class="page">
      <h1>Dashboard</h1>
    </div>
  </div>
</template>

<script>

import sidemenu from '@/components/sidemenu'
export default {
  name: 'hello',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },
  components: { sidemenu },
}
</script>

<style scoped>
</style>
