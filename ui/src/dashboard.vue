<template>
  <div>
    <sidemenu active="dashboard"></sidemenu>
    <h1>Dashboard</h1>
  </div>
</template>

<script>
console.log("dashbaord");
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
