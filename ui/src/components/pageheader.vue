<template>
<div class="pageheader">
    <p class="title" @click="gohome()">Brain Life</p>
    <svg class="cloud" viewBox="140 40 80 70" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <path fill="white" d=" M 79.72 49.60 C 86.00 37.29 98.57 29.01 111.96 26.42 C 124.27 24.11 137.53 26.15 148.18 32.90 C 158.08 38.78 165.39 48.87 167.65 60.20 C 176.20 57.90 185.14 56.01 194.00 57.73 C 206.08 59.59 217.92 66.01 224.37 76.66 C 227.51 81.54 228.85 87.33 229.23 93.06 C 237.59 93.33 246.22 95.10 253.04 100.19 C 256.69 103.13 259.87 107.67 258.91 112.59 C 257.95 118.43 252.78 122.38 247.78 124.82 C 235.27 130.43 220.23 130.09 207.98 123.93 C 199.33 127.88 189.76 129.43 180.30 128.57 C 173.70 139.92 161.70 147.65 148.86 149.93 C 133.10 153.26 116.06 148.15 104.42 137.08 C 92.98 143.04 78.96 143.87 66.97 139.04 C 57.75 135.41 49.70 128.00 46.60 118.43 C 43.87 109.95 45.81 100.29 51.30 93.32 C 57.38 85.18 67.10 80.44 76.99 78.89 C 74.38 69.20 74.87 58.52 79.72 49.60 Z"/>
    </svg>

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
                <p><span class="text-muted">Fullname</span><br>{{user.profile.fullname||'(Not Set)'}}</p>
                <p><span class="text-muted">Email</span><br>{{user.profile.email||'(Not Set)'}}</p>
                <p>
                    <span class="text-muted">Gravatar</span><br>
                    <img :src="'//www.gravatar.com/avatar/'+md5(user.profile.email)+'?=50'"><br>
                    <el-button size="small" @click="gotog(user.profile.email)">Update at Gravatar</el-button>
                </p>
            </div>
        </el-dropdown-menu>
    </el-dropdown>
</div>
</template>

<script>
import Vue from 'vue'
import md5 from 'md5'

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
        },
        gohome() {
            document.location = "/";
        },
        gotog(email) {
            document.location = "https://gravatar.com/"+md5(email);
        },
        md5, 
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

svg.cloud {
    width: 200px;
    height: 50px;
    position: absolute;
    z-index: -1;
    top: 0px;
    left: 0px;
    opacity: 0.3;
}

.title {
    position: fixed;
    font-size: 18pt;
    position: relative;
    top: 9px;
    margin: 0px;
    margin-left: 5px;
    left: 8px;
    font-weight: 700;
    text-shadow: 1px 1px 1px #888;
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
