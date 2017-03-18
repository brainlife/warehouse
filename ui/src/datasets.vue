<template>
<div>
  <!-- main view -->
	<sidemenu active="datasets"></sidemenu>
	<div class="page page-with-sidemenu">
    <div class="margin20" :class="{rightopen: selected.length > 0}">
			<div class="ui fluid category search">
        <button class="ui right floated primary button" @click="go('/data/upload')">
          <i class="ui icon add"></i> Upload
        </button>
				<div class="ui icon input">
					<input class="prompt" type="text" placeholder="Search data...">
					<i class="search icon"></i>
				</div>
				<div class="results"></div>
			</div>

			<table class="ui table">
				<thead>
					<tr>
            <th style="">Select</th>
            <th style=""></th>
						<th>Data Type</th>
						<th style="min-width: 180px;">Create Date</th>
						<th style="min-width: 200px;">Project</th>
						<th>Name/Desc</th>
						<th>Tags</th>
            <!--<th>Files</th>-->
					</tr>
				</thead>
				<tbody>
          <tr v-for="dataset in datasets" :class="{dataset: true, selected: ~selected.indexOf(dataset._id)}">
            <td>
              <div class="ui checkbox">
                <input type="checkbox" :checked="~selected.indexOf(dataset._id)" @click="check(dataset)">
								<label></label>
              </div>
						</td>
						<td>
							<button class="tiny ui button" @click="go('/dataset/'+dataset._id)">
								<i class="browser icon"></i>
							</button>
            </td>
            <td>
              <!--<a class="ui blue ribbon label">{{dataset.datatype.name}}</a>-->
              {{dataset.datatype.name}}
              <div class="ui label" v-for="tag in dataset.datatype_tags">{{tag}}</div>
            </td>
						<td>
							{{dataset.create_date | date}}
						</td>
						<td>
							<div class="ui green horizontal label" v-if="dataset.project.access == 'public'">Public</div>
							<div class="ui red horizontal label" v-if="dataset.project.access == 'private'">Private</div>
							{{dataset.project.name}}
						</td>
						<td>
              <b>{{dataset.name}}</b><br>
              <small>{{dataset.desc}}</small>
            </td>
            <td>
              <div class="ui label" v-for="tag in dataset.tags">{{tag}}</div>
            </td>
					</tr>
				</tbody>
			</table>

      <!--
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
      -->

    </div><!--main area-->

    <div class="rightbar" v-if="selected.length > 0">
      <div class="ui inverted top attached header">
        Selected
      </div>
      <div class="ui inverted attached segment">
        <div class="ui inverted relaxed divided list">
          <div class="item" v-for="id in selected">
            <div class="content">
              <div class="header">{{id}}</div>
              Hello
            </div>
          </div>
        </div>
      </div>
      <div class="ui inverted bottom attached header">
        {{selected.length}} items
      </div>
    </div>
	</div>

</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
//import router from './router'

export default {
  name: 'datasets',
  data () {
    return {
      datasets: [],
      selected: [],
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

    this.selected = JSON.parse(localStorage.getItem('datasets.selected')) || [];
  },
  methods: {
		opendataset: function(dataset) {
			console.dir(dataset);
		},
    go: function(path) {
      this.$router.push(path);
    },
    check: function(dataset) {
      //Vue.set(dataset, 'selected', !dataset.selected);
      var pos = this.selected.indexOf(dataset._id);
      if(~pos) this.selected.splice(pos, 1);
      else this.selected.push(dataset._id);
      localStorage.setItem('datasets.selected', JSON.stringify(this.selected));
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
/*
.dataset:hover {
	cursor: pointer;
	background-color: #ddd;
}
*/
.rightopen {
  margin-right: 300px;
}
.dataset.selected {
	background-color: #e1f7f7;
}
.rightbar {
  position: fixed;
  width: 280px;
  top: 0px;
  bottom: 0px;
  right: 0px;
  padding: 10px;
}
</style>
