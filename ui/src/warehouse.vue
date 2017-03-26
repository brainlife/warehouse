<template>
  <div id="warehouse">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'warehouse'
}
</script>

<!--scoped styles-->
<style scoped>
</style>

<!--global styles-->
<style>
body {
  background-color: #f0f0f0;
}
.margin20 {
	margin: 20px;
}
.ui.pusher {
  margin-left: 210px;
}

.fade-enter-active {
  transition: opacity 1s
}
.fade-enter, .fade-leave-to {
  opacity: 0
}
</style>
