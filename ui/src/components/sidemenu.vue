<template>
<div class="sidemenu">
    <ul class="items">
        <!-- currently being developped -->
        <li v-if="config.debug" 
            @click="go('/dashboard')"
            :class="{active: active == '/dashboard'}">
            <icon name="tachometer" scale="2"></icon><br>Dashboard
        </li>
        <li v-if="config.debug" class="divider"></li>

        <!-- for everyone -->
        <li @click="go('/apps')"
            :class="{active: active == '/apps'}" >
            <icon name="th-large" scale="2" ></icon><br>App
        </li>
        <li @click="go('/pubs');"
            :class="{active: active == '/pubs'}">
            <icon name="book" scale="2"></icon><br>Publication

        <!-- only for authenticated users -->
        <li v-if="config.user" @click="go('/project')"
            :class="{active: active == '/projects'}">
            <icon name="shield" scale="2"></icon><br>Project
        </li>
        <!--
        <li v-if="config.user" @click="go('/datasets')"
            :class="{active: active == '/datasets'}">
            <icon name="cubes" scale="2"></icon><br>Dataset
        </li>
        -->
        <!--deprecated
        <li v-if="config.user" @click="go('/processes')"
            :class="{active: active == '/processes'}">
            <icon name="paper-plane" scale="2"></icon><br>Process
        </li>
        -->
        <li v-if="config.user && config.debug" @click="go('/datatypes')"
            :class="{active: active == '/datatypes'}">
            <icon name="cube" scale="2"></icon><br>Datatype
        </li>
        
        <li v-if="config.user" @click="setting">
            <icon name="cog" scale="2"></icon><br>Setting
        </li>
    </ul>

    <!--admin items-->
    <ul class="items" v-if="is_admin">
        <li class="divider"></li>
        <li @click="go('/admin')"
            :class="{active: active == '/admin'}">
            <icon name="wrench" scale="2"></icon><br>Admin
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
        setting: function() {
            window.open("/auth/#!/settings/account", "_blank");
        },
        go: function(page) {
            this.$router.push(page);
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
li svg {
margin: 0px 10px 0px 10px;
}
.sidemenu {
    position: fixed;
    top: 50px;
    left: 0px;
    width: 90px;
    bottom: 0px;
    background-color: #222;
    color: #888;
    font-size: 9pt;
    z-index: 5;
}
ul.items {
    list-style: none;
    margin: 0px;
    padding: 0px;
}
ul.items li {
    text-align: center;
    margin: 0px;
    padding: 7px 0px;
    transition: background-color 0.2s, color 0.2s;
    padding-left: 4px;
}
ul.items li.active {
    padding-left: 0px;
    color: white;
    border-left: 4px solid #007bff;
    background-color: #1c1c1c;
}
ul.items li:hover {
    background-color: #444;
    color: white;
    cursor: pointer;
}
ul.items li.divider {
    border-bottom: 1px solid #444;
    padding: 0px;
    margin: 0px;
    padding-top: 5px;
    margin-bottom: 5px;
}
</style>
