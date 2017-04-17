<template>
<div class="sidemenu">
    <ul class="items">
        <li v-if="config.debug" 
            @click="go('/dashboard')"
            :class="{active: active == '/dashboard'}">
            <icon name="tachometer" scale="1.5"></icon><br>Dashboard
        </li>
        <li @click="go('/apps')"
            :class="{active: active == '/apps'}" >
            <icon name="th-large" scale="1.5" ></icon><br>Apps
        </li>
        <li @click="go('/processes')"
            :class="{active: active == '/processes'}">
            <icon name="paper-plane" scale="1.5"></icon><br>Process
        </li>
        <li @click="go('/datasets')"
            :class="{active: active == '/datasets'}">
            <icon name="cubes" scale="1.5"></icon><br>Datasets
        </li>
        <li @click="go('/projects')"
            :class="{active: active == '/projects'}">
            <icon name="shield" scale="1.5"></icon><br>Projects
        </li>
        <li @click="go('/settings')"
            :class="{active: active == '/settings'}">
            <icon name="cog" scale="1.5"></icon><br>Settings
        </li>
    </ul>
    <!--<projectmenu></projectmenu>-->
    <!--
    <el-menu class="menu" :router="true" :default-active="active" theme="dark">
        <el-menu-item index="/" v-if="config.debug"><icon name="tachometer"></icon>Dashboard</el-menu-item>
        <el-menu-item index="/apps"><icon name="th-large"></icon>Apps</el-menu-item>
        <el-menu-item index="/processes"><icon name="paper-plane"></icon>Process</el-menu-item>
        <el-menu-item index="/projects"><icon name="shield"></icon>Projects</el-menu-item>

        <el-submenu index="/datasets"> 
            <template slot="title"><icon name="cubes"></icon>Datasets</template>
            <el-menu-item-group title="Private Projects">
                <el-menu-item :index="'/datasets/'+project_id" 
                    v-for="(project, project_id) in projects" 
                    v-if="project.access == 'public'"
                    key="project_id">{{project.name}}</el-menu-item>
            </el-menu-item-group>
            <el-menu-item-group title="Public Projects">
                <el-menu-item :index="'/datasets/'+project_id" 
                    v-for="(project, project_id) in projects" 
                    v-if="project.access == 'private'"
                    key="project_id">{{project.name}}</el-menu-item>
            </el-menu-item-group>
        </el-submenu>

        <el-submenu v-if="config.debug" index="needed"> 
            <template slot="title"><icon name="flask"></icon>Test</template>
            <el-menu-item-group title="Group One">
                <el-menu-item index="1-1">item one</el-menu-item>
                <el-menu-item index="1-2">item one</el-menu-item>
            </el-menu-item-group>
            <el-menu-item-group title="Group Two">
                <el-menu-item index="1-3">item three</el-menu-item>
            </el-menu-item-group>
            <el-submenu index="1-4">
                <template slot="title">item four</template>
                <el-menu-item index="1-4-1">item one</el-menu-item>
            </el-submenu>
        </el-submenu>
        <el-menu-item index="/settings" @click="open_settings()">
            <icon name="cog"></icon>Settings
        </el-menu-item>
    </el-menu>
    -->
</div>
</template>

<script>
import Vue from 'vue'

import projectmenu from '@/components/projectmenu'

export default {
    components: { projectmenu },
    data () {
        return {
            
            projects: null, 

            config: Vue.config,
        }
    },
	props: { active: String },
	mounted: function() {
		//$(this.$el).find('.ui.dropdown').dropdown();

        this.$http.get('project', {params: {
            //service: "_upload",
        }})
        .then(res=>{
            this.projects = {};
            res.body.projects.forEach((p)=>{
                this.projects[p._id] = p;
            });

        }).catch(err=>{
            console.error(err);
        });
	},
    methods: {
        /*
        get_active: function() {
            return "1";
        },
        */
        go: function(page) {
            //settings is currently served via SCA default
            if(page == "/settings") return window.open("/auth/#!/settings/account", "_blank");

            this.$router.push(page);
        },
        /*
        open_settings: function() {
            window.open("/auth/#!/settings/account", "_blank");
        }
        */
    }
}
</script>

<style scoped>
.sidemenu {
    position: fixed;
    top: 50px;
    left: 0px;
    width: 90px;
    bottom: 0px;
    background-color: #222;
    color: #888;
    font-size: 9pt;
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
    background-color: #555;
    color: white;
    cursor: pointer;
}

/*
.el-menu svg {
margin-right: 10px;
position: relative;
top: 3px;
}
.el-menu {
background-color: inherit;
}
.el-menu-item.is-active {
background-color: #f0f0f0;
}
.menu {
position: fixed;
width: 100px;
top: 50px;
bottom: 0px;
overflow-y: auto;
}
*/
</style>
