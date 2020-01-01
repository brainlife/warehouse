<template>

<div class="sidemenu" v-if="showmenu">
    <div @click="showpanel = !showpanel" class="logo">
        <h3 class="title">b</h3>
        <div class="panel-content" v-if="showpanel">
            <h3 class="title">brainlife.io</h3>
            <p>An online platform for reproducible neuroscience.</p>
            <div style="padding: 4px 10px; background-color: #eee;">
                <a href="https://brainlife.io">Home</a> |
                <a href="https://brainlife.io/docs/privacy">Privacy Policy</a> |
                <a href="https://brainlife.io/docs/aup">Acceptable Use Policy</a>
            </div>
            <img src="@/assets/images/logo.png" width="80px" style="position: absolute; bottom: 0px; right: 30px;"/>
        </div>
    </div>

    <ul class="items">
        <li v-if="config.user && config.debug" 
            @click="go('/dashboard')"
            :class="{active: active == 'dashboard'}">
            <icon name="home" scale="1.2"/> 
            <h4>Dashboard</h4>
        </li>

        <!-- for everyone -->
        <li @click="go('/apps')"
            :class="{active: active == 'app'}">
            <icon name="th-large" scale="1.2"/>
            <h4>Apps</h4>
        </li>
        <li @click="go('/projects')"
            :class="{active: active == 'project'}">
            <icon name="shield-alt" scale="1.2"/>
            <h4>Projects</h4>
        </li>

        <li @click="go('/pubs');"
            :class="{active: active == 'pub'}">
            <icon name="newspaper" scale="1.2"/>
            <h4>Publications</h4>
        </li>
        
        <li @click="go('/datatypes')" :class="{active: active == 'datatype'}">
            <icon name="cubes" scale="1.2"/>
            <h4>Datatypes</h4>
        </li>

        <li @click="go('/datasets')" :class="{active: active == 'dataset'}" style="position: relative;">
            <icon name="cloud-download-alt" scale="1.2"/>
            <!--
            <b-badge pill variant="primary" style="opacity: 0.5; position: absolute; top: 20px; right: 5px;">BETA</b-badge>
            -->
            <h4>Datasets</h4>
        </li>

        <li v-if="config.user" @click="go('/resources')" :class="{active: active == 'resource'}">
            <icon name="server" scale="1.2"/>
            <h4>Resources</h4>
        </li>
        <!--
        <li v-if="config.user" @click="setting_old">
            <icon name="cog" scale="1.2"/>
            <h4>Settings</h4>
        </li>
        -->
        <li v-if="config.user" @click="go('/settings')" :class="{active: active == 'setting'}">
            <icon name="cog" scale="1.2"/>
            <h4>Settings</h4>
        </li>    
    </ul>

    <!--admin items-->
    <ul class="items" v-if="config.is_admin">
        <li class="divider"></li>
        <li @click="go('/admin')" :class="{active: active == 'admin'}">
            <icon name="wrench" scale="1.2"/>
            <h4>Administration</h4>
        </li>
    </ul>

    <!--bottom-->
    <ul class="items items-bottom">
        <li v-if="config.user" id="user-popover">
            <img :src="avatar_url(config.user.profile, 22)" width="18px" class="avatar"/>
        </li>
        <b-popover target="user-popover" triggers="hover" placement="right">
             <template v-slot:title>
                {{config.user.profile.fullname||config.user.profile.username}}
             </template>
            <b-button size="sm" variant="light" @click="signout"> <icon name="sign-out-alt" scale="1.2"/>&nbsp; Signout                 </b-button>
        </b-popover>

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

const lib = require('@/lib'); //for avatar_url

export default {
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
        /*
        gurl: function() {
            if(!this.config.user.profile.email) return null;
            return "//www.gravatar.com/avatar/"+md5(this.config.user.profile.email)+"?s=22";
        },
        */
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
        signout() {
            sessionStorage.setItem('auth_redirect', window.location); //TODO - un-tested.. as to if this gets back here
            document.location = Vue.config.auth_signout;
        },
        reportbug() {
            window.open("https://github.com/brain-life/warehouse/issues", "github");
        },
        login() {
            sessionStorage.setItem('auth_redirect', window.location); //TODO - un-tested.. as to if this gets back here
            document.location = Vue.config.auth_signin;
        },
        signup() {
            document.location = "/auth/#!/signup";
        },
        slack() {
            //document.location = "https://brainlife-inviter.herokuapp.com/";
            document.location = "https://brainlife.slack.com";
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
color:  #fffd;
font-size: 8pt;
background-image: linear-gradient(0deg, #2693ff, #159957);
z-index: 2;
box-shadow: inset -3px 0 2px #3331;
}

.title {
font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
font-size: 24pt;
font-weight: bold;
padding: 8px 2px;
margin-left: 8px;
color: #fff6;
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
transition: background-color 0.5s;
}

.items li:hover:not(#user-popover) {
width: 175px;
}

.items li h4 {
position: relative;
top: 2px;
line-height: 100%;
font-size: 10pt;
display: inline-block;
margin-left: 15px;
transition: color 0.5s;
color: #666;
text-transform: uppercase;
}

.items li:hover h4 {
line-height: 120%;
}

.items li:not(.divider):hover {
color: #666;
background-color: #fff;
box-shadow: 2px 2px 5px #0003;
z-index: 3;
}

.items li.active {
color: #333c;
background-color: #fff;
}

.items li.divider {
border-bottom: 1px solid rgba(255,255,255,0.2);
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
background-color: #0001;
}

li.secondary-first {
box-shadow: inset 0px 2px 2px rgba(0,0,0,0.05);
}

.logo {
cursor: pointer;
}
/*
.logo:hover {
background-color: white;
}
.logo:hover h3 {
color: #999;
}
*/
.panel-content {
position: fixed;
top: 0px;
left: 40px;
width: 500px;
transition: opacity 0.3s;
background-color: #fcfcfc;
z-index: 3;
box-shadow: 0 0 8px #0004;
font-size: 0.9rem;
}
.panel-content .title {
padding-top: 10px;
margin-bottom: 0px;
color: #999;
}
.panel-content p {
color: #bbb;
padding: 0px 10px;
}
.logo .panel-content img {
background-color: #eee;
opacity: 0.8;
border-top-left-radius: 50%;
border-top-right-radius: 50%;
padding: 10px;
padding-bottom: 0px;
}
</style>
