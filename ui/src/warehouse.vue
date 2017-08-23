<template>
    <div id="warehouse">
        <!--
        <transition :name="'fade'">
            <router-view></router-view>
        </transition>
        -->
        <router-view></router-view>
        <notifications position="bottom right"/>
    </div>
</template>

<script>
export default {
  name: 'warehouse'
}
</script>

<!--scoped styles-->
<style scoped>
.fade-enter-active, .fade-leave-active {
  transition-property: opacity;
  transition-duration: .25s;
}

.fade-enter-active {
  transition-delay: .25s;
}

.fade-enter, .fade-leave-active {
  opacity: 0
}
</style>

<!--global styles-->
<style>
body {
background-color: #f0f0f0;
color: #444;
height:100%;
overflow: hidden;
}
body, textarea, input, table {
font-family: 'Roboto', sans-serif;
font-size: 14px;
}
.margin20 {
margin: 20px;
}
.page-content {
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
/*
pre.file-content {
margin: 0px;
padding: 0px;
overflow: auto;
font-family: 'monospace';
}
*/
.clickable:hover,
.clickable-record:hover {
cursor: pointer;
background-color: #ddd;
}
.clickable-row {
cursor: pointer;
}
code.hljs {
font-size: 80%;
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
border-spacing: 1px;
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

/*
.navigation {
color: #999;
margin-bottom: 15px;
}
.el-dropdown__icon {
font-size: 14px; //not sure, but something is setting font-size to 12px.
}
*/
</style>

