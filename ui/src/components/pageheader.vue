<template>
<div class="pageheader">
    <el-dropdown style="float: right; cursor: pointer;">
      <h4 style="padding-top: 4px;">
        {{user.profile.fullname||user.profile.username}} <small><i class="el-icon-caret-bottom el-icon--right text-muted"></i></small>
      </h4>
      <el-dropdown-menu slot="dropdown" style="width: 250px;">
        <el-dropdown-item>Signout</el-dropdown-item>
        <!--
        <el-dropdown-item>Action 2</el-dropdown-item>
        <el-dropdown-item>Action 3</el-dropdown-item>
        <el-dropdown-item disabled>Action 4</el-dropdown-item>
        <el-dropdown-item divided>Action 5</el-dropdown-item>
        -->
      </el-dropdown-menu>
    </el-dropdown>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    data () {
        return {
            msg: 'Welcome to Your Vue.js App',
            config: Vue.config,
        }
    },
	props: ['user'],
	mounted: function() {
	},
    methods: {
    }
}
</script>

<style scoped>
.pageheader {
    background-color: white;
    padding: 10px;
    height: 50px;
    box-shadow: 0px 2px 3px #999;
    position: relative;
    z-index: 100;
}
</style>
