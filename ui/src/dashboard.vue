<template>
<div>
  <sidemenu active="dashboard"></sidemenu>
	<div class="page page-with-sidemenu">
		<div class="margin20">
      <h1>TODO</h1>
      <p>Show list of all data processing that user is run or has run recently</p>
      <p>For each project that user is member of.. * inter project communication</p>
    </div>
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
