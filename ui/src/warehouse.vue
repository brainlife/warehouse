<template>
<div>
  <!-- main view -->
	<sidemenu active="warehouse"></sidemenu>
	<div class="page page-with-sidemenu">
		<div class="margin20">
			<p>TODO - Allow user to search within warehouse</p>
			<button class="ui right floated primary button"
				@click="go('/data/upload')">
				<i class="ui icon add"></i> Upload
			</button>
		</div>
	</div>

</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
//import router from './router'

export default {
  name: 'warehouse',
  data () {
    return {
      nothing: true,
      //instance_id: null, //instance that takes care of upload / validation
      //open_uploader: false,
      //init_uploader: false, //set to true once to initialize uploader
    }
  },

  mounted: function() {
    //this.uploader = $(this.$el).find(".uploader");
  },
  methods: {
    go: function(path) {
      this.$router.push('/data/upload');
    }
    /*
    openuploader: function() {
      this.$root.$emit('uploader-show');
    },
    */
  },
  components: { sidemenu },
}
</script>

<style scoped>
.margin20 {
	margin: 20px;
}
</style>
