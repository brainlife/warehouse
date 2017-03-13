<template>
<div>
  <!-- main view -->
	<sidemenu active="apps"></sidemenu>
	<div class="page page-with-sidemenu">
		<div class="margin20">
			<div class="ui cards">
				<div class="card" v-for="app in apps">
					<div class="content">
						<img class="right floated mini ui image" :src="app.avatar">
						<div class="header">
              {{app.name}}
						</div>
						<div class="">
              <!--{{app.create_date}}-->
						  <contact :id="app.user_id" class="contact mini"></contact>
						</div>
						<div class="description">
              {{app.desc}}
						</div>
					</div>
					<div class="extra content">
						<div class="ui two buttons">
							<div class="ui basic green button" @click="go('/app/'+app._id)">Start</div>
              <!--<div class="ui basic red button">Info</div>-->
						</div>
					</div>
				</div>
      </div><!--v-for-->
		</div>
	</div>

</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import contact from '@/components/contact'

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
  components: { sidemenu, contact },
}
</script>

<style scoped>
</style>
