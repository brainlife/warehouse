<template>
<div>
  <!-- main view -->
	<sidemenu active="warehouse"></sidemenu>
	<div class="page page-with-sidemenu">
		<div class="margin20">

			<button class="ui right floated primary button" @click="go('/data/upload')">
				<i class="ui icon add"></i> Upload
			</button>

			<div class="ui fluid category search">
				<div class="ui icon input">
					<input class="prompt" type="text" placeholder="Search data...">
					<i class="search icon"></i>
				</div>
				<div class="results"></div>
			</div>

			<!--
			<div class="ui menu">
				<div class="ui category search item">
					<div class="ui transparent icon input">
						<input class="prompt" type="text" placeholder="Search data...">
						<i class="search link icon"></i>
					</div>
					<div class="results"></div>
				</div>
			</div>
			-->

			<table class="ui table">
				<thead>
					<tr>
						<th>Project</th>
						<th>Name</th>
						<th>DataType</th>
						<th>Description</th>
						<th>Files</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="dataset in datasets" class="dataset" @click="go('/data/'+dataset._id)">
						<td>
							<div class="ui green horizontal label" v-if="dataset.project_id.access == 'public'">Public</div>
							<div class="ui red horizontal label" v-if="dataset.project_id.access == 'private'">Private</div>
							{{dataset.project_id.name}}
						</td>
						<td>{{dataset.name}}</td>
						<td>
							{{dataset.datatype_id.desc}}
						</td>
						<td>{{dataset.desc}}</td>
						<td>
							<div v-for="(file,id) in dataset.product.files" style="display: inline">
                <div class="ui mini label">{{id}}</div> {{file.filename}}
              </div>
						</td>
						<!--
            <td>
							<div class="ui text menu">
								<div class="ui right dropdown item">
									Action
									<i class="dropdown icon"></i>
									<div class="menu">
										<div class="item">Download</div>
										<div class="item">Something</div>
										<div class="item">Another Thing</div>
									</div>
								</div>
							</div>
            </td>
						-->
					</tr>
				</tbody>
			</table>

			<table class="ui celled structured table">
				<thead>
					<tr>
						<th rowspan="2">Name</th>
						<th rowspan="2">Type</th>
						<th rowspan="2">Files</th>
						<th colspan="3">Derivatives</th>
					</tr>
					<tr>
						<th>Ruby</th>
						<th>JavaScript</th>
						<th>Python</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Alpha Team</td>
						<td>Project 1</td>
						<td class="right aligned">2</td>
						<td class="center aligned">
							<i class="large green checkmark icon"></i>
						</td>
						<td></td>
						<td></td>
					</tr>
					<tr>
						<td rowspan="3">Beta Team</td>
						<td>Project 1</td>
						<td class="right aligned">52</td>
						<td class="center aligned">
							<i class="large green checkmark icon"></i>
						</td>
						<td></td>
						<td></td>
					</tr>
					<tr>
						<td>Project 2</td>
						<td class="right aligned">12</td>
						<td></td>
						<td class="center aligned">
							<i class="large green checkmark icon"></i>
						</td>
						<td></td>
					</tr>
					<tr>
						<td>Project 3</td>
						<td class="right aligned">21</td>
						<td class="center aligned">
							<i class="large green checkmark icon"></i>
						</td>
						<td></td>
						<td></td>
					</tr>
				</tbody>
			</table>

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
      datasets: [],
    }
  },

  mounted: function() {
    this.$http.get('dataset', {params: {
        //service: "_upload",
    }})
    .then(res=>{
      this.datasets = res.body.datasets;
      Vue.nextTick(()=>{
        console.log("shown dataset");
        $(this.$el).find('.ui.dropdown').dropdown()
      });
    }, res=>{
      console.error(res);
    });

  },
  methods: {
		opendataset: function(dataset) {
			console.dir(dataset);
		},
    go: function(path) {
      this.$router.push(path);
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
.ui.text.menu {
	margin: 0;
}
.dataset:hover {
	cursor: pointer;
	background-color: #ddd;
}
</style>
