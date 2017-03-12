<template>
<div>
	<sidemenu active="warehouse"></sidemenu>
	<div class="page page-with-sidemenu">
		<div class="margin20">
      <h1>{{dataset.name}}</h1>
      <p>{{dataset.desc}}</p>

			<table class="ui definition table">
				<tbody>
					<tr>
						<td class="two wide column">Storage</td>
						<td>{{dataset.storage}}</td>
					</tr>
					<tr>
						<td>doi</td>
						<td>10.1006/br.d.{{dataset._id}} </td>
					</tr>
					<tr>
						<td>Tags</td>
						<td><div class="ui label" v-for="tag in dataset.tags">{{tag}}</div></td>
					</tr>
					<tr>
						<td>Owner</td>
						<td><contact :id="dataset.user_id"></contact></td>
					</tr>
					<tr>
						<td>Data Type</td>
            <td>
              {{dataset.datatype_id.desc}}
            </td>
					</tr>
				</tbody>
			</table>

			<h4 class="ui horizontal divider header">Content</h4>
			{{dataset.product.files}}

			<h4 class="ui horizontal divider header">Project Info</h4>
      <project :project="dataset.project_id"></project>

			<h4 class="ui horizontal divider header">Applications</h4>
      <p>You can use this data as input for following applications.</p>
			<div class="ui cards">
				<div class="card">
					<div class="content">
						<img class="right floated mini ui image" src="//avatars3.githubusercontent.com/u/923896?v=3&s=100">
						<div class="header">
							Elliot Fu
						</div>
						<div class="meta">
							Friends of Veronika
						</div>
						<div class="description">
							Elliot requested permission to view your contact details
						</div>
					</div>
					<div class="extra content">
						<div class="ui two buttons">
							<div class="ui basic green button">Start</div>
							<div class="ui basic red button">Info</div>
						</div>
					</div>
				</div>
				<div class="card">
					<div class="content">
						<img class="right floated mini ui image" src="//avatars3.githubusercontent.com/u/923896?v=3&s=100">
						<div class="header">
							Jenny Hess
						</div>
						<div class="meta">
							New Member
						</div>
						<div class="description">
							Jenny wants to add you to the group <b>best friends</b>
						</div>
					</div>
					<div class="extra content">
						<div class="ui two buttons">
							<div class="ui basic green button">Approve</div>
							<div class="ui basic red button">Decline</div>
						</div>
					</div>
				</div>
			</div>


      <div class="ui segment">
        <div class="ui top attached label">Debug</div>
        <br>
        <br>
				<pre>{{dataset}}</pre>
      </div>

		</div>
	</div>

</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import contact from '@/components/contact'
import project from '@/components/project'

export default {
  data () {
    return {
      dataset: {},
    }
  },

  mounted: function() {
    console.log("looking for ", this.$route.params.id);
    this.$http.get('dataset', {params: {
        find: JSON.stringify({_id: this.$route.params.id})
    }})
    .then(res=>{
      this.dataset = res.body.datasets[0];
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
		opendataset: function(dataset) {
			console.dir(dataset);
		},
    go: function(path) {
      this.$router.push(path);
    }
  },
  components: { sidemenu, contact, project },
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
