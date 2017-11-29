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
            <icon name="th-large" scale="2" ></icon><br>Apps
        </li>
        <li @click="goraw('/pubs');"
            :class="{active: active == '/pubs'}">
            <icon name="book" scale="2"></icon><br>Publications

        <!-- only for authenticated users -->
        <li v-if="config.user" @click="go('/datasets')"
            :class="{active: active == '/datasets'}">
            <icon name="cubes" scale="2"></icon><br>Datasets
        </li>
        <li v-if="config.user" @click="go('/processes')"
            :class="{active: active == '/processes'}">
            <icon name="paper-plane" scale="2"></icon><br>Process
        </li>
        <li v-if="config.user" @click="go('/projects')"
            :class="{active: active == '/projects'}">
            <icon name="shield" scale="2"></icon><br>Projects
        </li>
        <li v-if="config.user && config.debug" @click="go('/datatypes')"
            :class="{active: active == '/datatypes'}">
            <icon name="cube" scale="2"></icon><br>Datatypes
        </li>
        
        <li v-if="config.user" @click="setting">
            <icon name="cog" scale="2"></icon><br>Settings
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
    methods: {
        setting: function() {
            window.open("/auth/#!/settings/account", "_blank");
        },
        go: function(page) {
            this.$router.push(page);
        },
        goraw: function(url) {
            document.location = url;
        },
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
    padding-left: 3px;
}
ul.items li.active {
    padding-left: 0px;
    border-left: 3px solid #2693ff;
    color: white;
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
