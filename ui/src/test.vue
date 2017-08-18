<template>
<div style="width: 100%; background-color: red;height; 300px;">
yo
<el-dropdown>
  <el-button type="primary">
    Dropdown List
  </el-button>
  <el-dropdown-menu slot="dropdown">
    <el-dropdown-item>Action 1</el-dropdown-item>
    <el-dropdown-item>Action 2</el-dropdown-item>
    <el-dropdown-item>Action 3</el-dropdown-item>
    <el-dropdown-item>Action 4</el-dropdown-item>
    <el-dropdown-item>Action 5</el-dropdown-item>
  </el-dropdown-menu>
</el-dropdown>

<el-dropdown split-button type="primary" @click="handleClick">
  Dropdown List
  <el-dropdown-menu slot="dropdown">
    <el-dropdown-item>Action 1</el-dropdown-item>
    <el-dropdown-item>Action 2</el-dropdown-item>
    <el-dropdown-item>Action 3</el-dropdown-item>
    <el-dropdown-item>Action 4</el-dropdown-item>
    <el-dropdown-item>Action 5</el-dropdown-item>
  </el-dropdown-menu>
</el-dropdown>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    methods: {
        handleClick: function() {
            alert("yp");
        }
    }
}
</script>
