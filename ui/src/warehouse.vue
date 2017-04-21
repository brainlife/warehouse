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
body, textarea, input {
font-family: 'Lato', sans-serif;
font-size: 14px;
}
.margin20 {
	margin: 20px;
}
.ui.pusher {
  margin-left: 200px;
}
.page-content {
    /*transition: margin-right 0.5s;*/
    position: fixed;
    left: 90px;
    right: 0px;
    top: 50px;
    bottom: 0px;
    overflow: auto;
}

.fade-enter-active {
  transition: opacity 1s
}
.fade-enter, .fade-leave-to {
  opacity: 0
}
pre {
    margin: 0px;
    overflow: auto;
    font-family: 'monospace';
}
.clickable:hover,
.clickable-record:hover {
    cursor: pointer;
    background-color: #ddd;
}
.text-muted {
    opacity: 0.6;
}
code.hljs {
    font-size: 80%;
}
.off-sidemenu {
    margin-left: 150px;
}
svg.fa-icon {
position: relative;
zoom: 78%;
}
b{
font-weight: 700;
}
h1 {
line-height: 100%;
font-size: 26px;
font-weight: bold;
margin-bottom: 13px;
}
h2 {
line-height: 100%;
font-size: 22px;
font-weight: bold;
margin-bottom: 11px;
}
h3 {
line-height: 100%;
font-size: 18px;
font-weight: bold;
margin-bottom: 9px;
}
h4 {
line-height: 100%;
font-size: 15px;
font-weight: bold;
margin-bottom: 7px;
}
h5 {
line-height: 100%;
font-size: 13px;
font-weight: bold;
margin-bottom: 6px;
}
small {
font-size: 80%;
}

table.info {
    width: 100%;
}
table.info tr {
    border-bottom: 1px solid #eee;
    background-color: white;
}
table.info th {
    color: #777; 
    text-align: left;
    font-size: 14px;
    padding: 10px;
    font-weight: 700;
}
table.info td {
    padding: 10px;
}
</style>
