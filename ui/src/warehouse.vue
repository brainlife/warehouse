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
color: #444;
}
body, textarea, input {
/*font-family: 'Lato', sans-serif;*/
font-family: 'Roboto', sans-serif;
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
.clickable-row {
    cursor: pointer;
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
h1,h2,h3,h4,h5,h6 {
line-height: 100%;
margin-top: 0px;
}
h1 {
font-size: 26px;
font-weight: bold;
margin-bottom: 13px;
}
h2 {
font-size: 22px;
font-weight: bold;
margin-bottom: 11px;
}
h3 {
font-size: 18px;
font-weight: bold;
margin-bottom: 9px;
}
h4 {
font-size: 15px;
font-weight: bold;
margin-bottom: 7px;
}
h5 {
font-size: 13px;
font-weight: bold;
margin-bottom: 6px;
}

table.info {
    width: 100%;
    font-size: 13px;
}
table.info tr {
    background-color: white;
}
table.info th {
    color: #777; 
    text-align: left;
    vertical-align: top;
    padding: 10px;
    margin: 0px;
    font-weight: 600;
}
table.info td {
    padding: 10px;
    line-height: 140%;
}
.el-table__header-wrapper thead div {
color: gray !important;
}
p {
margin-top: 0px;
}
.el-card {
border-radius: 0px !important;
margin-bottom: 10px !important;
}
.navigation {
    color: #999;
    margin-bottom: 15px;
}
time {
opacity: 0.8;
}
</style>

