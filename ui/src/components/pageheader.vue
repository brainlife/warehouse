<template>
<div class="pageheader">
    <b-nav class="nav">
        <b-nav-item-dropdown text="Support">
            <b-dropdown-item @click="doc">Documentation</b-dropdown-item>
            <b-dropdown-item @click="reportbug">Report Issues</b-dropdown-item>
        </b-nav-item-dropdown>
        <b-nav-item-dropdown v-if="config.user" text="New">
            <b-dropdown-item @click="go('/app/_/edit')">Register App</b-dropdown-item>
            <b-dropdown-item @click="go('/upload')">Upload Dataset</b-dropdown-item>
            <b-dropdown-item @click="go('/project/_/edit')">New Project</b-dropdown-item>
        </b-nav-item-dropdown>
        <b-nav-item-dropdown v-if="config.user">
            <span slot="button-content">
                <img :src="gurl">
                &nbsp;{{config.user.profile.fullname||config.user.profile.username}}
            </span>
            <b-dropdown-item @click="goaccount">Settings</b-dropdown-item>
            <b-dropdown-divider></b-dropdown-divider>
            <b-dropdown-item @click="signout">Signout</b-dropdown-item>
        </b-nav-item-dropdown>
        <b-nav-item v-if="!config.user" @click="login">Login</b-nav-item>
        <b-nav-item v-if="!config.user" @click="signup">Sign Up</b-nav-item>
    </b-nav>

    <span class="title" @click="gohome">Brain Life</span>
    <div class="slot"><slot/></div>
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
	//props: ['user'],
    computed: {
        gurl: function() {
            if(!this.config.user.profile.email) return null;
            return "//www.gravatar.com/avatar/"+md5(this.config.user.profile.email)+"?s=22";
        }
    },
    methods: {
        goaccount() {
            document.location = "/auth#!/settings/account";
        },
        signout() {
            document.location = "/auth#!/signout";
        },
        doc() {
            window.open("http://www.brain-life.org/warehouse", "brain-life doc");
        },
        reportbug() {
            window.open("https://github.com/brain-life/warehouse/issues", "github");
        },
        go(path) {
            this.$router.push(path);
        },
        gohome() {
            document.location = "/";
        },
        login() {
            document.location = "/auth";
        },
        signup() {
            document.location = "/auth/#!/signup";
        },
        /*
        newprocess() {
            this.$http.post(Vue.config.wf_api+'/instance', {
                config: {
                    brainlife: true,
                    type: "v2",
                },
                //desc: "",
            }).then(res=>{
                this.$router.push("/processes/"+res.body._id);
            });

        },
        */
        /*
        gotog(email) {
            document.location = "https://gravatar.com/"+md5(email);
        },
        */
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
    font-size: 20pt;
    position: relative;
    top: 4px;
    margin-left: 15px;
    margin-right: 20px;
    font-weight: bold;
}
.nav {
    float: right;
    margin-top: 6px;
}

.slot {
    /*margin-left: 155px;*/
    margin-top: 7px;
    display: inline-block;
}
@media screen and (max-width: 850px) {
    .slot {
        display: none;
    }
}
@media screen and (max-width: 600px) {
     .nav {
        display: none;
    }
}
</style>

<style>
.pageheader .nav .nav-link {
    font-weight: bold;
    color: white;
}
</style>
