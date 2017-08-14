<template>
<div>
	<pageheader :user="config.user" />
	<sidemenu active="/datatypes" />
	<div v-bind:class="['header', 'datatypecard', mini ? 'mini' : '']" @click="go(`datatypepage/${encodeURIComponent(id)}`)"><!--
		--><img v-bind:src="imageUrl || ('https://robohash.org/' + encodeURIComponent(name))" class="thumb" /><!--
		--><span class="rest">{{name}}</span><!--
	--></div>
</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'

export default {
	components: { sidemenu, pageheader  },
	props: ['id', 'imageUrl', 'name', 'mini'],
	data () {
		return {
			config: Vue.config,
		}
	},
	methods: {
		go: function(url) {
			this.$router.push(url);
		}
	}
}

</script>

<style scoped>
datatypecard.mini {
	width:200pt;
}
datatypecard.mini .thumb {
	width:10%;
}
datatypecard.mini .rest {
	width:90%;
}
.datatypecard {
	display:inline-block;
	width:350pt;
	height:auto;
	border:1pt solid #ccc;
	background-color:white;
}
.datatypecard:hover {
	cursor:pointer;
	background-color:#ccc;
}
.thumb {
	vertical-align:middle;
	width:20%;
	height:auto;
}
.rest {
	vertical-align:middle;
	display:inline-block;
	width:80%;
	text-align:center;
}
</style>
