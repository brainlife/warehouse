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
pre {
    margin: 0px;
}
.clickable-record:hover {
    cursor: pointer;
    background-color: #ddd;
}
.panel {
    background-color: white;
    width: 100%;
    padding: 20px;
    box-shadow: 2px 2px 3px #ccc;
    border-radius: 2px;
}
.text-muted {
    opacity: 0.6;
}
code.hljs {
    font-size: 80%;
}
.off-sidemenu {
    margin-left: 210px;
}
</style>
