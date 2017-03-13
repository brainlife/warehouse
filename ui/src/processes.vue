<template>
<div>
  <sidemenu active="processes"></sidemenu>
  <div class="page page-with-sidemenu">
		<div class="margin20">
			<div class="ui fluid category search">
				<div class="ui icon input">
					<input class="prompt" type="text" placeholder="Search processes...">
					<i class="search icon"></i>
				</div>
				<div class="results"></div>
			</div>

			<table class="ui table">
				<thead>
					<tr>
						<th>Create Date</th>
						<th>Description</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="instance in instances" class="instance" @click="go('/process/'+instance._id)">
						<td>
							{{instance.create_date}}
						</td>
						<td>
							{{instance.desc}}
						</td>
						<td>
              {{instance.config}}
						</td>
					</tr>
				</tbody>
			</table>

      <div class="ui segment">
        <div class="ui top attached label">Debug</div>
        <br>
        <br>
        <pre>{{instances}}</pre>
      </div>

    </div>
  </div>
</div>
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'

export default {
  name: 'processes',
  data () {
    return {
      instances: []
    }
  },
  mounted: function() {
    //console.log("looking for ", this.$route.params.id);
    this.$http.get(Vue.config.wf_api+'/instance', {params: {
        find: JSON.stringify({
          _id: this.$route.params.id,
          "config.brainlife": true,
        })
    }})
    .then(res=>{
      this.instances = res.body.instances;
    }, res=>{
      console.error(res);
    });
  },
  methods: {
    go: function(path) {
      this.$router.push(path);
    },
  },

  components: { sidemenu },
}
</script>

<style scoped>
.instance:hover {
	cursor: pointer;
	background-color: #ddd;
}
</style>

