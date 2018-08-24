<template>
<div class="sidemenu">
    <ul class="items">
        <!-- currently being developped -->
        <li v-if="config.debug" 
            @click="go('/dashboard')"
            :class="{active: active == '/dashboard'}" v-b-popover.hover="'Your homepage for Brainlife'" title="Dashboard">
            <icon name="home" scale="1.3"/>
        </li>
        <li v-if="config.debug" class="divider"></li>

        <!-- for everyone -->
        <li @click="go('/apps')"
            :class="{active: active == '/apps'}" v-b-popover.hover="'A list of registered Apps that you can execute.'" title="Apps">
            <icon name="th-large" scale="1.3"/>
        </li>
        <li @click="go('/pubs');"
            :class="{active: active == '/pubs'}" v-b-popover.hover="'A list of registered publications with links to datasets, apps, and DOI.'" title="Publications">
            <icon name="brands/leanpub" scale="1.3"/>
        </li>

        <!-- only for authenticated users -->
        <li v-if="config.user" @click="go('/project')"
            :class="{active: active == '/projects'}" v-b-popover.hover="'Project is where you can upload / archive your dataset and run Apps.'" title="Projects">
            <icon name="shield-alt" scale="1.3"/>
        </li>
        <li v-if="config.user && config.debug" @click="go('/datatypes')"
            :class="{active: active == '/datatypes'}" v-b-popover.hover="'A list of registered datatypes that you can use as input/output for your Apps.'" title="Datatypes">
            <icon name="cube" scale="1.3"/>
        </li>
        
        <li v-if="config.user" @click="setting" v-b-popover.hover="'Open Brainlife documentation'" title="Documentation">
            <icon name="cog" scale="1.3"/>
        </li>
    </ul>

    <!--admin items-->
    <ul class="items" v-if="is_admin">
        <li class="divider"></li>
        <li @click="go('/admin')"
            :class="{active: active == '/admin'}" v-b-popover.hover="'Admin Only'" title="Administration">
            <icon name="wrench" scale="1.3"/>
        </li>
    </ul>

    <!--bottom-->
    <ul class="items items-bottom">
        <li @click="doc" v-b-popover.hover="'Open Brainlife documentation'" title="Documentation">
            <icon name="book" scale="1.3"/>
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
            window.open("https://brain-life.github.io/docs/", "brainlife doc");
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
}
.items {
    list-style: none;
    margin: 0px;
    padding: 5px 0px;
}
.items li {
    text-align: center;
    margin: 0px;
    padding: 10px 0px;
    transition: background-color 0.2s, color 0.2s;
    padding-left: 3px;
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
    padding-left: 0px;
}
.items li.divider {
    border-bottom: 1px solid #444;
    padding: 0px;
    margin: 0px;
    padding-top: 5px;
    margin-bottom: 5px;
}
.items-bottom {
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 50px;
}
</style>
