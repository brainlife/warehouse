<template>
<!--deprecated-->
<div class="pageheader" :style="styles" v-if="false">
</div>
</template>

<script>
import Vue from 'vue'
import md5 from 'md5'

export default {
    components: { },
    data () {
        return {
            msg: 'Welcome to Your Vue.js App',
            config: Vue.config,
        }
    },
    computed: {
        styles: function() {
            let styles = {
                right: this.$root.rightMargin,
            };
            switch(window.location.hostname) {
            case "localhost":
                Object.assign(styles, {
                    "backgroundImage": "inherit",
                    "backgroundColor": "orange",
                });
                break;
            case "test.brainlife.io":
                Object.assign(styles, {
                    "backgroundImage": "inherit",
                    "backgroundColor": "purple",
                });
                break;
            }
            return styles;
        }
    },
    methods: {
        goaccount() {
            document.location = "/auth#!/settings/account";
        },
        signout() {
            document.location = "/auth#!/signout";
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
        slack() {
            document.location = "https://brainlife-inviter.herokuapp.com/";
        },
        md5, 
    }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Open+Sans:700');

.pageheader {
    position: fixed;
    background-color: white;
    height: 50px;
    top: 0px;
    left: 0px;
    right: 0px;
    box-shadow: 0px 1px 1px rgba(0,0,0,0.3);
    background-image: linear-gradient(90deg, #2693ff, #159957);
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
    position: fixed;
    top: 4px;
    margin-left: 15px;
    margin-right: 20px;
    font-weight: bold;
    cursor: pointer;
}
.nav {
    float: right;
    margin-top: 6px;
}

.slot {
    margin-top: 7px;
    display: inline-block;
}
@media screen and (max-width: 750px) {
    .slot {
        display: none;
    }
}
@media screen and (max-width: 400px) {
     .nav {
        display: none;
    }
}
</style>

<style>
/*placing under warehouse.vue doesn't work for some reason*/
.pageheader .nav .nav-link {
font-weight: bold;
color: white;
}

</style>
