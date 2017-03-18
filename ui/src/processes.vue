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
						<th style="min-width: 180px">Create Date</th>
						<th style="min-width: 200px">Name</th>
						<th style="min-width: 200px">Description</th>
						<th style="min-width: 120px">Status</th>
						<th style="min-width: 120px">Archived</th>
						<th>config</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="instance in instances" class="instance" @click="go('/process/'+instance._id)">
						<td>
							{{instance.create_date | date}}
						</td>
						<td> {{instance.name}} </td>
						<td> {{instance.desc}} </td>
						<td>
              <div class="ui label yellow" v-if="instance.status == 'removed'">
                <i class="ui icon remove"></i> Removed</div>
              <div class="ui label green" v-if="instance.status == 'finished'">
                <i class="ui icon check"></i> Finished</div>
              <div class="ui label green" v-if="instance.status == 'running'">
                <i class="notched circle loading icon"></i> Running</div>
              <div class="ui label red" v-if="instance.status == 'failed'">
                <i class="ui warning icon"></i> Failed</div>
              <div class="ui label" v-if="instance.status == 'unknown'">
                <i class="ui help icon "></i> Failed</div>
            </td>

            <td>
              <div class="ui label" v-if="instance.config.dataset_id">
                <i class="check icon"></i> Archived</div>
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

