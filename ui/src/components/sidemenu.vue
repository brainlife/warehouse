<template>

<div class="sidemenu">
    <div class="header" :style="styles">
        <span class="title" @click="gohome">brainlife</span>
    </div>
    <svg height="0" width="0">
        <defs>
            <clipPath id="header-clip">
                <!--
                <circle cx="120" cy="-30" r="100" />
                <circle cx="25" cy="30" r="40" />
                <circle cx="195" cy="10" r="40" />
                <circle cx="60" cy="55" r="10" />
                -->
                <rect width="200" height="50"/>
            </clipPath>
        </defs>
    </svg>
    <ul class="items" style="margin-top: -30px;">
        <li v-if="config.user && config.debug" 
            @click="go('/dashboard')"
            :class="{active: active == '/dashboard'}">
            <icon name="home" scale="1.3"/> 
            <h4>Dashboard</h4>
        </li>
        <!--<li v-if="config.debug" class="divider"></li>-->

        <!-- for everyone -->
        <li @click="go('/apps')"
            :class="{active: active == '/apps'}">
            <icon name="th-large" scale="1.3"/>
            <h4>Apps</h4>
        </li>
        <li @click="go('/projects')"
            :class="{active: active == '/projects'}">
            <icon name="shield-alt" scale="1.3"/>
            <h4>Projects</h4>
        </li>

        <!-- only for authenticated users -->

        <li @click="go('/pubs');"
            :class="{active: active == '/pubs'}">
            <icon name="newspaper" scale="1.3"/>
            <h4>Publications</h4>
        </li>
        
        <li @click="go('/datatypes')" :class="{active: active == '/datatypes'}">
            <icon name="cubes" scale="1.3"/>
            <h4>Datatypes</h4>
        </li>

        <li v-if="config.debug" @click="go('/datalad')" :class="{active: active == '/datalad'}">
            <icon name="database" scale="1.3"/>
            <h4>Datalad</h4>
        </li>

        <li v-if="config.user" @click="go('/resources')" :class="{active: active == '/resources'}">
            <icon name="server" scale="1.3"/>
            <h4>Resources</h4>
        </li>
         
        <li v-if="config.user" @click="setting_old">
            <icon name="cog" scale="1.3"/>
            <h4>Settings</h4>
        </li>
        <li v-if="config.user && config.debug" @click="go('/settings')" :class="{active: active == '/settings'}">
            <icon name="cog" scale="1.3"/>
            <h4>Settings (new)</h4>
        </li>    
    </ul>

    <!--admin items-->
    <ul class="items" v-if="config.is_admin">
        <li class="divider"></li>
        <li @click="go('/admin')"
            :class="{active: active == '/admin'}">
            <icon name="wrench" scale="1.3"/>
            <h4>Administration</h4>
        </li>
    </ul>

    <!--bottom-->
    <ul class="items items-bottom">
        <li v-if="config.user" @click="open_usersettings" id="user" style="white-space: nowrap">
            <icon name="caret-right" style="float: right; margin-right: 10px; margin-top: 2px;" scale="1.25"/>
            <img :src="avatar_url(config.user.profile, 22)" width="18px" class="avatar"/>
            <h4>{{config.user.profile.fullname||config.user.profile.username}}</h4>
        </li>
        <b-popover ref="usersettings" target="user">
            <b-list-group>
                <b-list-group-item href="#" @click="signout">
                    <icon name="sign-out-alt" scale="1.3"/>&nbsp;
                    Signout                 
                </b-list-group-item>
            </b-list-group>
        </b-popover>

        <li v-if="!config.user" @click="login">
            <icon name="sign-in-alt" scale="1.3"/>
            <h4>Login</h4>
        </li>
        <li v-if="!config.user" @click="signup">
            <icon name="file-signature" scale="1.3"/>
            <h4>Sign Up</h4>
        </li>

        <li @click="slack" class="secondary secondary-first">
            <icon name="brands/slack" scale="1.3"/>
            <h4>Contact us (slack)</h4>
        </li>
        <li @click="doc" class="secondary">
            <icon name="book" scale="1.3"/>
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
            config: Vue.config,
        }
    },
	props: { active: String },
	mounted: function() {
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
        gohome() {
            document.location = "/";
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
    /*width: 50px;*/
    width: 200px;
    bottom: 0px;
    background-color: #333;
    color: #888;
    font-size: 8pt;
    transition: width 0.3s;
    /*z-index: 2; 1 would conflict with some page headers*/
    overflow: hidden;
    box-shadow: inset -3px 0px 3px rgba(0,0,0,0.2);
}
.header {
    height: 50px;
    color: white;
    background-image: linear-gradient(90deg, #2693ff, #159957);
    text-align: center;
    margin-bottom: 25px;
}
/*
.header img {
}
*/
.title {
    font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 24pt;
    font-weight: bold;
    cursor: pointer;
}

/*
.sidemenu:hover {
    transition-delay:0.5s;
    width: 200px;
}
*/
.items {
    list-style: none;
    padding: 0px;
    margin: 0px;
    width: 200px;
}
.items li {
    text-align: left;
    margin: 0px;
    padding: 8px 0px;
    transition: background-color 0.2s, color 0.2s;
    padding-left: 15px;
}
.items li h4 {
    display: inline-block;
    font-size: 13px;
    margin-left: 12px;
    position: relative;
    top: 2px;
}
.items li:not(.divider):hover {
    background-color: #1c1c1c;
    color: white;
    cursor: pointer;
}
.items li.active {
    color: white;
    background-color: #222;
}
.items li.divider {
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding: 0px;
    margin: 0px;
    padding-top: 5px;
    margin-bottom: 5px;
}
.items svg {
    width: 22px;
}

.items-bottom {
    position: absolute;
    bottom: 0px;
}

li.secondary {
    background-color: #2c2c2c;
    color: #666;
}
li.secondary-first {
    box-shadow: inset 0px 2px 2px rgba(0,0,0,0.1);
}
</style>
