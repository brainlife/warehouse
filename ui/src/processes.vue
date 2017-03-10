<template>
<div>
  <sidemenu active="processes"></sidemenu>
  <div class="page page-with-sidemenu">
		<div class="margin20">
      <h1>TODO</h1>
      <p>Show list of processes that users are running or has run recently</p>
    </div>
  </div>
</div>
</template>

<script>
import sidemenu from '@/components/sidemenu'

export default {
  name: 'processes',
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
