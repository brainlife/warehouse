<template>
<div class="pageheader">
    <p class="title" @click="gohome()">Brain Life</p>
    <svg class="cloud" viewBox="140 50 80 70" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <path fill="white" d=" M 79.72 49.60 C 86.00 37.29 98.57 29.01 111.96 26.42 C 124.27 24.11 137.53 26.15 148.18 32.90 C 158.08 38.78 165.39 48.87 167.65 60.20 C 176.20 57.90 185.14 56.01 194.00 57.73 C 206.08 59.59 217.92 66.01 224.37 76.66 C 227.51 81.54 228.85 87.33 229.23 93.06 C 237.59 93.33 246.22 95.10 253.04 100.19 C 256.69 103.13 259.87 107.67 258.91 112.59 C 257.95 118.43 252.78 122.38 247.78 124.82 C 235.27 130.43 220.23 130.09 207.98 123.93 C 199.33 127.88 189.76 129.43 180.30 128.57 C 173.70 139.92 161.70 147.65 148.86 149.93 C 133.10 153.26 116.06 148.15 104.42 137.08 C 92.98 143.04 78.96 143.87 66.97 139.04 C 57.75 135.41 49.70 128.00 46.60 118.43 C 43.87 109.95 45.81 100.29 51.30 93.32 C 57.38 85.18 67.10 80.44 76.99 78.89 C 74.38 69.20 74.87 58.52 79.72 49.60 Z"/>
    </svg>

    <!--this is where the menu goes-->
    <div class="slot"><slot></slot></div>

    <div class="menu" @click="goaccount()">
        {{user.profile.fullname||user.profile.username}}
    </div>
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
        goaccount() {
            document.location = "/auth#!/settings/account";
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
    box-shadow: 0px 2px 3px rgba(0,0,0,0.3);
    background-image: linear-gradient(120deg, #2693ff, #159957);
    color: white;
    z-index: 10;
}

svg.cloud {
    width: 200px;
    height: 50px;
    position: absolute;
    z-index: -1;
    top: 0px;
    left: 0px;
    opacity: 0.1;
}

.title {
    font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
    position: fixed;
    font-size: 20pt;
    position: relative;
    top: 4px;
    left: 13px;
    margin: 0px;
    margin-left: 5px;
    font-weight: bold;
}
.menu {
    position: fixed;
    color: white;
    right: 20px;
    top: 14px;
}
.slot {
    position: fixed;
    top: 7px;
    left: 170px;
    right: 250px;
    width: 50%;
}
</style>



