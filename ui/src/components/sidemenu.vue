<template>
<div class="sidemenu" v-if="showmenu">
    <div class="logo">
        <div class="toggle" @click="$root.toggleSideMenu">
            <icon name="chevron-left" scale="1.2"/>
        </div>
        <h3 class="title" @click="clickTitle">b<span class="titlefollow">rainlife</span>
            <icon name="cloud" class="titlecloud" scale="4"/>
        </h3>
    </div>

    <ul class="items">
        <li v-if="config.user && config.debug" 
            @click="go('/dashboard')" :class="{active: active == 'dashboard'}">
            <icon name="home" scale="1.2"/> 
            <h4>Dashboard</h4>
        </li>
        <li v-if="config.user && config.debug" class="divider"></li>

        <li @click="go('/datasets')" :class="{active: active == 'dataset'}" style="position: relative;">
            <icon name="cloud-download-alt" scale="1.2"/>
            <h4>Datasets</h4>
        </li>
        
        <li class="divider"></li>

        <!--
        <li @click="go('/ezbids')" :class="{active: active == 'ezbids'}" style="position: relative;">
            <icon name="cloud-download-alt" scale="1.2"/>
            <h4>ezBIDS</h4>
        </li>
        -->

        <li @click="go('/projects')" :class="{active: active == 'project'}">
            <icon name="shield-alt" scale="1.2"/>
            <h4>Projects</h4>
        </li>

        <li @click="go('/apps')" :class="{active: active == 'app'}">
            <icon name="th-large" scale="1.2"/>
            <h4>Apps</h4>
        </li>

        <li @click="go('/pubs')" :class="{active: active == 'pub'}">
            <icon name="newspaper" scale="1.2"/>
            <h4>Publications</h4>
        </li>

        <li class="divider"></li>
        
        <li @click="go('/datatypes')" :class="{active: active == 'datatype'}">
            <icon name="cubes" scale="1.2"/>
            <h4>Datatypes</h4>
        </li>

        <li v-if="config.user" 
            @click="go('/resources')" :class="{active: active == 'resource'}">
            <icon name="server" scale="1.2"/>
            <h4>Resources</h4>
        </li>
        <li class="divider"></li>
    </ul>

    <ul class="items">
        <li v-if="config.user" @click="go('/settings')" :class="{active: active == 'setting'}">
            <icon name="cog" scale="1.2"/>
            <span v-if="!config.user.profile.aup" style="position: absolute; top: -15px; left: 20px; font-size: 350%;" class="text-danger">&bull;</span>
            <h4>Settings</h4>
        </li>    
        <li v-if="config.hasRole('admin')" @click="go('/admin')" :class="{active: active == 'admin'}">
            <icon name="wrench" scale="1.2"/>
            <h4>Administration</h4>
        </li>
    </ul>

    <!--bottom-->
    <ul class="items items-bottom">
        <li v-if="config.user" id="user-popover">
            <img :src="avatar_url(config.user.profile, 22)" width="18px" class="avatar"/>
            <h5>{{config.user.profile.fullname}}</h5>
            <b-popover target="user-popover" triggers="hover" placement="top">
                 <template v-slot:title>
                    {{config.user.profile.username}}&nbsp;
                    <span style="float: right; opacity: 0.8; font-size: 80%;">{{config.user.sub}}</span>
                 </template>
                <p>
                    {{config.user.profile.fullname}} &lt;{{config.user.profile.email}}&gt;
                </p>
                <b-button size="sm" variant="secondary" @click="signout"> <icon name="sign-out-alt" scale="1.2"/>&nbsp; Signout </b-button>
            </b-popover>
        </li>

        <li v-if="!config.user" @click="login">
            <icon name="sign-in-alt" scale="1.2"/>
            <h4>Login</h4>
        </li>
        <li v-if="!config.user" @click="signup">
            <icon name="file-signature" scale="1.2"/>
            <h4>Sign Up</h4>
        </li>

        <li @click="slack" class="secondary secondary-first">
            <icon name="brands/slack" scale="1.2"/>
            <h4>slack / chat</h4>
        </li>
        <li @click="reportbug" class="secondary">
            <icon name="brands/github" scale="1.2"/>
            <h4>Report Issues</h4>
        </li>
        <li @click="doc" class="secondary">
            <icon name="book" scale="1.2"/>
            <h4>Documentation</h4>
        </li>
    </ul>
</div>
</template>

<script>

import Vue from 'vue'
import md5 from 'md5'

import tags from '@/components/tags'

const lib = require('@/lib'); //for avatar_url

export default {
    components: { tags },
    data () {
        return {
            showmenu: true,
            showpanel: false,
            active: null,
            config: Vue.config,
        }
    },
	//props: { active: String },
	mounted: function() {
        this.setactive();
    },
    watch:{
        $route (to, from){
            this.setactive();
        }
    },

    computed: {
        styles: function() {
            switch(window.location.hostname) {
            case "localhost-dis":
                return {
                    "backgroundImage": "inherit",
                    "backgroundColor": "orange",
                }
            case "test.brainlife.io":
                return {
                    "backgroundImage": "inherit",
                    "backgroundColor": "purple",
                }
            default: 
                return {};
            }
        }
    },
    methods: {
        avatar_url: lib.avatar_url,
        setactive() {
            //if no sidemenu config is specified, don't show it
            if(!this.$router.currentRoute.meta || !this.$router.currentRoute.meta.sidemenu) {
                this.showmenu = false;
                return;
            }
            this.showmenu = true;
            this.active = this.$router.currentRoute.meta.sidemenu;
        },

        setting_old() {
            window.open("/auth/#!/settings/account", "_blank");
        },
        go(page) {
            this.$router.push(page);
        },
        doc() {
            window.open("https://brainlife.io/docs/", "brainlife doc");
        },
        clickTitle() {
            if(this.$root.sidemenuWide) document.location = "https://brainlife.io";
            else this.$root.toggleSideMenu();
        },
        signout() {
            sessionStorage.setItem('auth_redirect', window.location); //TODO - un-tested.. as to if this gets back here
            document.location = Vue.config.auth_signout;
        },
        reportbug() {
            window.open("https://github.com/brainlife/brainlife/issues", "github");
        },
        login() {
            sessionStorage.setItem('auth_redirect', window.location); //TODO - un-tested.. as to if this gets back here
            document.location = Vue.config.auth_signin;
        },
        signup() {
            document.location = "/auth/#!/signup";
        },
        slack() {
            window.open("https://brainlife.slack.com", "slack");
        },
        md5, 
        open_usersettings() {
            this.$refs.usersettings.$emit('popoever');
        },

    }
}
</script>

<style scoped>

.sidemenu {
    position: fixed;
    top: 0px;
    left: 0px;
    width: 40px;
    bottom: 0px;
    color:  rgba(255,255,255,200);
    font-size: 8pt;
    background-image: linear-gradient(0deg, #159957, #2693ff);
    /*background-image: url('~@/assets/images/christmastree.jpg'); - show up as just white image*/

    z-index: 2;
    box-shadow: inset -3px 0 2px rgba(33,33,33,0.1);
    transition: width 0.2s;
}
.sidewide .sidemenu {
width: 180px;
}

.title {
font-family: "Open Sans";
font-weight: bold;
padding: 8px 2px;
margin-left: 8px;
color: rgba(255,255,255,0.6);
}
.titlefollow {
opacity: 0;
transition: opacity 0.2s;
overflow: hidden;
}
.titlecloud {
position: relative;
float: right;
opacity: 0;
left: 20px;
}
.sidewide .titlecloud {
opacity: 0.3;
}
.sidewide .titlefollow {
opacity: 1;
}

.items {
list-style: none;
padding: 0px;
margin: 0px;
}

.items li {
text-align: left;
padding: 10px;
padding-top: 11px;
width: 40px;
height: 40px;
white-space: nowrap;
overflow: hidden;
cursor: pointer;
position: relative;
transition: background-color 0.2s;
transition: width 0.2s;
}
.items li svg {
    height: 20px;
}
.items li:hover {
width: 180px;
}
.sidewide .items li {
width: 180px;
}

.items li h4 {
position: relative;
line-height: 100%;
font-size: 9pt;
display: inline-block;
margin-left: 15px;
text-transform: uppercase;
color: white;
}

.avatar {
    position: absolute;
    top: 11px;
    left: 10px;
}
.items li h5 {
position: relative;
font-size: 10pt;
display: inline-block;
margin-top: 2px;
margin-left: 35px;
color: white;
overflow: hidden;
text-overflow: ellipsis;
width: 130px;
}

.items li:not(.divider):hover {
background-color: #fff;
box-shadow: 2px 1px 4px rgba(0, 0, 0, 0.1);
z-index: 3;
color: #666;
}
.items li:not(.divider):hover h4,
.items li:not(.divider):hover h5 {
color: #666;
}

.items li.active {
color: white;
background-color: rgba(0,0,0,0.2);
box-shadow: inset 1px 1px 3px rgba(0,0,0,0.1);
}

.items li.divider {
border-bottom: 1px solid rgba(255,255,255, 0.2);
padding: 0px;
margin: 0px;
margin-bottom: 5px;
height: 5px;
cursor: pointer;
}

.items-bottom {
position: absolute;
bottom: 0px;
}

li.secondary {
	background-color: rgba(0,0,0,0.2);
}

li.secondary-first {
box-shadow: inset 0px 2px 2px rgba(0,0,0,0.05);
}

.logo {
    cursor: pointer;
    background-color: rgba(255,255,255,0.3);
    box-shadow: 0 0 5px rgba(0,0,0,0.2);
    height: 50px;
    margin-bottom: 10px;
    position: relative;
    overflow: hidden;
}
.logo h3 {
    padding: 8px 4px;
    color: #fff;
    font-size: 20pt;
    display: inline-block;
}
.toggle {
    position: absolute;
    top: 0px;
    padding: 17px;
    right: 0px;
    opacity: 0;
    cursor: pointer;
    z-index: 1;
    transition: opacity 0.5s;
    display: none;
}
.sidewide .toggle {
    opacity: 0.5;
}
.toggle:hover {
    opacity: 1;
}
.sidewide .toggle {
    display: inherit;
}
</style>


