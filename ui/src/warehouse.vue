<template>
<div>
  <!-- main view -->
	<sidemenu active="warehouse"></sidemenu>
	<div class="page page-with-sidemenu">
		<div class="margin20">
			<p>TODO - Allow user to search within warehouse</p>
			<button class="ui right floated primary button" @click="openupload()">
				<i class="ui icon add"></i> Upload
			</button>
		</div>
	</div>

  <!--dialogs-->
  <uploader id="uploader"></uploader>

</div><!--root-->
</template>

<script>
import Vue from 'vue'
//import Router from 'vue-router'

import sidemenu from '@/components/sidemenu'
import uploader from '@/components/uploader'

export default {
  name: 'warehouse',
  data () {
    return {
      nothing: true,
    }
  },

  mounted: function() {
    this.upload_dialog = $(this.$el).find('#uploader');
    this.upload_dialog.modal({
      onApprove: ()=> {
				console.log("TODO - finalize upload");
				/*
				this.$http.post('project', this.edit).then(res=>{
					console.log("created", res.body);
					this.projects.push(res.body);
				}, res=>{
					console.error(res);
				});
				*/
      }
    });
  },
  methods: {
    openupload: function() {
			this.$http.post(Vue.config.wf_api+'/instance', {
			}).then(res=>{
				console.log("created new instance", res.body);
				this.upload.instance_id = res.body._id;
				Vue.nextTick(()=>{
					this.upload_dialog.modal('show');
				});
			}, res=>{
				console.error(res);
				//debug - ignore error and go ahead and open the dialog
				//(so that I can test this without api server..)
				Vue.nextTick(()=>{
					this.upload_dialog.modal('show');
				});
			});
    },
  },
  components: { sidemenu, uploader },
}
</script>

<style scoped>
.margin20 {
	margin: 20px;
}
</style>
