<template>
<div>
  <sidemenu active="settings"></sidemenu>
	<div class="page page-with-sidemenu">
		<div class="margin20">
      <h1>TODO</h1>
      <p>Show settings.. obviously</p>
    </div>
  </div>
</div>
</template>

<script>

import sidemenu from '@/components/sidemenu'

export default {
  name: 'settings',
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
