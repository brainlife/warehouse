<template>
    <div id="warehouse">
        <router-view></router-view>
        <notifications position="bottom right"/>
    </div>
</template>

<script>
export default {
  name: 'warehouse'
}
</script>

<style scoped>
#warehouse {
height: 100%;
background-color: #f9f9f9;
color: #444;
font-size: 14px;
}
</style>
