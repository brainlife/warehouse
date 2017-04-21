<template>
<div class="pageheader">
    <p class="title">Brain-Life</p>
    <div class="slot"><slot></slot></div>
    <el-dropdown class="menu" @command="handleCommand">
        <h4 style="padding-top: 4px;">
            {{user.profile.fullname||user.profile.username}} <small><i class="el-icon-caret-bottom el-icon--right text-muted"></i></small>
        </h4>
        <el-dropdown-menu slot="dropdown" style="width: 250px;">
            <el-dropdown-item command="signout">Signout</el-dropdown-item>

            <br>
            <div style="margin: 0px 0px; padding: 10px; background-color: #f7f7f7;">
                <h5>Profile</h5>
                <br>
                <p><span class="text-muted">Fullname</span><br>{{user.profile.fullname||'(Not Set)'}}</p>
                <br>
                <p><span class="text-muted">Email</span><br>{{user.profile.email||'(Not Set)'}}</p>
                <br>
            </div>
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
        handleCommand(command) {
            switch(command) {
            case "signout":
                document.location = "/auth#!/signout";
            }
        }
    }
}
</script>

<style scoped>
.pageheader {
    position: fixed;
    background-color: white;
    height: 50px;
    top: 0px;
    left: 0px;
    right: 0px;
    box-shadow: 0px 2px 3px #999;
    background-image: linear-gradient(120deg, #2693ff, #159957);
    color: white;
    z-index: 1;
}

.title {
    position: fixed;
    font-size: 18pt;
    font-weight: bold;
    position: relative;
    margin-left: 5px;
    top: 14px;
    left: 8px;
    text-shadow: 1px 1px 1px #555;
}
.menu {
    position: fixed;
    cursor: pointer; 
    color: white;
    right: 20px;
    top: 11px;
}
.slot {
    position: fixed;
    top: 7px;
    left: 150px;
    right: 250px;
    width: 50%;
}
</style>
