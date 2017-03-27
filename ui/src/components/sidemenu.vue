<template>
<div class="ui left fixed inverted vertical menu">
  <div class="item title">
    Brain Life <i class="smile icon"></i>
  </div>

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
		//$(this.$el).find('.ui.sidebar').sidebar('show');
	},
}
</script>

<style scoped>
.ui.menu .item.title {
background-color: #489fdf;
margin-bottom: 5px;
font-weight: bold;
}
.ui.inverted.menu .item.active:hover,
.ui.inverted.menu .item.active {
background-color: #f0f0f0;
color: black !important;
}
</style>
