<template>
<div class="sidemenu">
    <ul class="items">
        <!-- currently being developped -->
        <li v-if="config.debug" 
            @click="go('/dashboard')"
            :class="{active: active == '/dashboard'}">
            <icon name="home" scale="1.3"/> <h4>Dashboard</h4>
        </li>
        <li v-if="config.debug" class="divider"></li>

        <!-- for everyone -->
        <li @click="go('/apps')"
            :class="{active: active == '/apps'}">
            <icon name="th-large" scale="1.3"/>
            <h4>Apps</h4>
        </li>
        <li @click="go('/pubs');"
            :class="{active: active == '/pubs'}">
            <icon name="brands/leanpub" scale="1.3"/>
            <h4>Publications</h4>
        </li>

        <!-- only for authenticated users -->
        <li v-if="config.user" @click="go('/project')"
            :class="{active: active == '/projects'}">
            <icon name="shield-alt" scale="1.3"/>
            <h4>Projects</h4>
        </li>
        <li v-if="config.user && config.debug" @click="go('/datatypes')"
            :class="{active: active == '/datatypes'}">
            <icon name="cube" scale="1.3"/>
            <h4>Datatypes</h4>
        </li>
        
        <li v-if="config.user" @click="setting">
            <icon name="cog" scale="1.3"/>
            <h4>Settings</h4>
        </li>
    </ul>

    <!--admin items-->
    <ul class="items" v-if="is_admin">
        <li class="divider"></li>
        <li @click="go('/admin')"
            :class="{active: active == '/admin'}">
            <icon name="wrench" scale="1.3"/>
            <h4>Administration</h4>
        </li>
    </ul>

    <!--bottom-->
    <ul class="items items-bottom">
        <li @click="doc">
            <icon name="book" scale="1.3"/>
            <h4>Documentation</h4>
        </li>
    </ul>
</div>
</template>

<script>
import Vue from 'vue'
import projectmenu from '@/components/projectmenu'

export default {
    components: { projectmenu },
    data () {
        return {
            config: Vue.config,
        }
    },
	props: { active: String },
	mounted: function() {
	},
    computed: {
        is_admin: function() {
            if( Vue.config.user && 
                Vue.config.user.scopes.warehouse && 
                ~Vue.config.user.scopes.warehouse.indexOf('admin') &&
                Vue.config.user.scopes.amaretti && 
                ~Vue.config.user.scopes.amaretti.indexOf('admin')) return true;
            return false;
        }
    },
    methods: {
        setting() {
            window.open("/auth/#!/settings/account", "_blank");
        },
        go(page) {
            this.$router.push(page);
        },
        doc() {
            window.open("https://brainlife.github.io/docs/", "brainlife doc");
        },
        /*
        goraw: function(url) {
            document.location = url;
        },
        */
    }
}
</script>

<style scoped>
.sidemenu {
    position: fixed;
    top: 50px;
    left: 0px;
    width: 50px;
    bottom: 0px;
    background-color: #222;
    color: #888;
    font-size: 8pt;
    transition: width 0.3s;
    z-index: 1;
    overflow: hidden;
}
.sidemenu:hover {
    transition-delay:0.5s;
    width: 200px;
}
.items {
    list-style: none;
    margin: 0px;
    padding: 5px 0px;
    width: 200px;
}
.items li {
    text-align: left;
    margin: 0px;
    padding: 10px 0px;
    transition: background-color 0.2s, color 0.2s;
    padding-left: 16px;
}
.items li h4 {
    display: inline-block;
    font-size: 15px;
    margin-left: 12px;
    position: relative;
    top: 2px;
}
.items li:hover {
    background-color: #1c1c1c;
    color: white;
    cursor: pointer;
}
.items li.active {
    color: white;
    background-color: #222;
    border-left: 3px solid #007bff;
    padding-left: 12px;
}
.items li.divider {
    border-bottom: 1px solid #444;
    padding: 0px;
    margin: 0px;
    padding-top: 5px;
    margin-bottom: 5px;
}
.items-bottom {
    position: absolute;
    bottom: 0px;
}
</style>
