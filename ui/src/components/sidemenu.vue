<template>
<div class="ui left fixed inverted vertical menu">

    <div class="item title">
        Brain Life <i class="smile icon"></i>
    </div>
    <el-menu router="true" :default-active="active" theme="dark">
        <el-menu-item index="/"><icon name="tachometer"></icon>Dashboard</el-menu-item>
        <el-menu-item index="/datasets"><icon name="cubes"></icon>Dataset</el-menu-item>
        <el-menu-item index="/processes"><icon name="paper-plane"></icon>Process</el-menu-item>
        <el-menu-item index="/apps"><icon name="th-large"></icon>Apps</el-menu-item>
        <el-menu-item index="/projects"><icon name="shield"></icon>Projects</el-menu-item>
        <el-submenu index="999">
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
        <el-menu-item index="/settings"><icon name="cog"></icon>Settings</el-menu-item>
    </el-menu>

    <!--
  <a href="#/" class="item" v-bind:class="{active: active == 'dashboard'}">
      <i class="browser icon"></i> Dashboard</a>
  <a href="#/datasets" class="item" v-bind:class="{active: active == 'datasets'}">
      <i class="cubes icon"></i> Data</a>
  <a href="#/processes" class="item" v-bind:class="{active: active == 'processes'}">
      <i class="send icon"></i> Processes</a>
  <a href="#/apps" class="item" v-bind:class="{active: active == 'apps'}">
      <i class="grid layout icon"></i> Apps</a>
  <a href="#/projects" class="item" v-bind:class="{active: active == 'projects'}">
      <i class="protect icon"></i> Projects</a>

  <div class="ui dropdown item" v-bind:class="{active: active == 'test'}">
    Test <i class="dropdown icon" style="font-size: 100%;"></i>
    <div class="menu">
      <div class="item">
        <i class="mail icon"></i>Categories
        <div class="menu">
          <div class="item active">Unread</div>
          <div class="item">Promotions</div>
          <div class="item">Updates</div>
        </div>
      </div>
      <div class="item"><i class="book icon"></i>Archive</div>
    </div>
  </div>

  <a href="#/settings" class="item" v-bind:class="{active: active == 'settings'}"
    v-bind:style="{bottom: '0px', position: 'fixed', width: '15em'}">
      <i class="setting icon"></i> Settings
  </a>
    -->
</div>
</template>

<script>

export default {
    name: 'sidemenu',
    data () {
        return {
            msg: 'Welcome to Your Vue.js App'
        }
    },
	props: { active: String },
	mounted: function() {
		$(this.$el).find('.ui.dropdown').dropdown();
	},
    methods: {
        get_active: function() {
            return "1";
        }
    }
}
</script>

<style scoped>
.ui.menu .item.title {
background-color: #489fdf;
font-weight: bold;
padding: 20px;
}
.ui.inverted.menu .item.active:hover,
.ui.inverted.menu .item.active {
background-color: #f0f0f0;
color: black !important;
}
.el-menu svg {
margin-right: 10px;
position: relative;
top: 3px;
}
.el-menu {
background-color: inherit;
}
</style>
