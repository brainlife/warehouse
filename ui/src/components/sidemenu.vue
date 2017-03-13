<template>
	<div class="ui left fixed inverted vertical menu">
		<div class="item title">
				Brain Life
		</div>

		<a href="#/" class="item" v-bind:class="{active: active == 'dashboard'}">
				<i class="browser icon"></i> Dashboard</a>
		<a href="#/datasets" class="item" v-bind:class="{active: active == 'datasets'}">
				<i class="cubes icon"></i> Data</a>
		<a href="#/processes" class="item" v-bind:class="{active: active == 'processes'}">
				<i class="object group icon"></i> Processes</a>
		<a href="#/apps" class="item" v-bind:class="{active: active == 'apps'}">
				<i class="grid layout icon"></i> Apps</a>
		<a href="#/projects" class="item" v-bind:class="{active: active == 'projects'}">
				<i class="protect icon"></i> Projects</a>
		<a href="#/test" class="item" v-bind:class="{active: active == 'test'}">
				<i class="warning sign icon"></i> Test</a>
		<a href="#/settings" class="item" v-bind:class="{active: active == 'settings'}"
      v-bind:style="{bottom: '0px', position: 'fixed', width: '15em'}">
				<i class="setting icon"></i> Settings
		</a>
	</div>
</template>

<script>

import sidemenu from '@/components/sidemenu'

export default {
  name: 'hello',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },
	props: { active: String }
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
