<template>
<div>
  <!-- main view -->
	<sidemenu active="apps"></sidemenu>
	<div class="page page-with-sidemenu">
		<div class="margin20">
			<div class="ui cards">
        <app v-for="app in apps" key="app._id" :app="app"></app>
      </div><!--v-for-->
		</div>
	</div>

</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import app from '@/components/app'

export default {
  name: 'apps',
  data () {
    return {
      apps: [],
    }
  },

  mounted: function() {
    this.$http.get('app', {params: {
        //service: "_upload",
    }})
    .then(res=>{
      this.apps = res.body.apps;
      /*
      Vue.nextTick(()=>{
        console.log("shown dataset");
        $(this.$el).find('.ui.dropdown').dropdown()
      });
      */
    }, res=>{
      console.error(res);
    });

  },
  methods: {
    go: function(path) {
      this.$router.push(path);
    }
  },
  components: { sidemenu, app },
}
</script>

<style scoped>
</style>
