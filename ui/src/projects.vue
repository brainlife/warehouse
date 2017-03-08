<template>
<div>
	<!-- projects ---------------------------------------------------------------->

	<sidemenu active="projects"></sidemenu>
	<div class="page page-with-sidemenu">
		<div class="margin20">

			<br>
			<button class="ui right floated primary button" @click="newproject()">
					<i class="icon add"></i>
					Add Project
			</button>
			<br>
			<br>

			<div class="ui relaxed divided items">
				<div class="item" v-for="(project, index) in projects">
					<div class="content">
						<div class="meta right floated">
							<a>{{project.create_date}}</a>
						</div>
						<a class="header">{{project.name}}</a>
						<div v-if="project.access == 'public'" class="ui blue horizontal label">Public</div>
						<div v-if="project.access == 'private'" class="ui red horizontal label">Private</div>
						<div class="description">{{project.desc||'No description provided'}}</div>
						<label>Admins</label>
            <div><contact v-for="id in project.admins" key="id" :id="id"></contact></div>
						<label>Members</label>
            <div><contact v-for="id in project.members" key="id" :id="id"></contact></div>
					</div>
					<!--{{project}}-->
				</div><!--item-->
			</div><!--items-->

		</div><!--margin-->
	</div><!--page-->

	<!-- project dialog ---------------------------------------------------------------->
	<div class="ui modal projectdialog">
		<i class="close icon"></i>
		<div class="header" v-if="editproject._id">
      Editing {{editproject.name}}
		</div>
    <div class="header" v-else>
      New Project
		</div>
		<div class="image content">
			<div class="ui medium image">
				<img src="./assets/some.png">
			</div>

      <div class="description">
        <form class="ui form">
          <div class="ui header">We've auto-chosen a profile image for you.</div>
          <div class="field">
            <label>Project Name</label>
            <input type="text" :value="editproject.name" placeholder="Please enter name for this project">
          </div>
          <div class="field">
            <label>Description</label>
            <textarea :value="editproject.desc" placeholder="Details about this project"></textarea>
          </div>
          <div class="field">
            <label>Admins</label>
            <!--
						<div class="ui pointing label">
							People who can update configuration for this project
						</div>
            -->
            <contactlist :uids="editproject.admins" v-on:changed="changed('admins', $event)"></contactlist>
          </div>
          <div class="field">
            <label>Members</label>
            <!--
						<div class="ui pointing label">
							People can read/write data and application for this project
						</div>
            -->
            <contactlist :uids="editproject.members" v-on:changed="changed('members', $event)"></contactlist>
          </div>

          <p>We've grabbed the following image from the <a href="https://www.gravatar.com" target="_blank">gravatar</a> image associated with your registered e-mail address.</p>
          <p>Is it okay to use this photo?</p>
        </form>
      </div>

		</div>
		<div class="actions">
			<div class="ui black deny button">
        Cancel
			</div>
			<div class="ui positive right labeled icon button">
			  Save <i class="checkmark icon"></i>
			</div>
		</div>
	</div>

</div>
</template>

<script>

import Vue from 'vue'
import Router from 'vue-router'

import sidemenu from '@/components/sidemenu'
import contactlist from '@/components/contactlist'
import contact from '@/components/contact'

/*
var projectdialog = {
  name: "project-dialog",
  template: `
  `,
  methods: {
  },
	events: {
    'show-newproject-dialog': function() {
			console.log("dialog");
      $(this.$el).modal('show');
    }
  }
}
*/

export default {
  name: "projects-ui",

  data () {
    return {
      msg: 'Welcome to Your Vue.js App',
      projects: [],
      count: 0, //total counts of projects (not paged)

      editproject: {
        _id: null, //set if editing
        name: "Untitled",
        desc: "",
        access: "public",

        admins: [],
        members: [],
      }
    }
  },

  mounted: function() {
    this.projectdialog = $(this.$el).find('.projectdialog');
    this.projectdialog.modal({
        onApprove: function() {
          console.log("projectdialog submitted");
        }
    });
  },

  methods: {
    changed: function(list, uids) {
      this.editproject[list] = uids;
    },
    newproject: function() {
      //initialize
      this.editproject = {
        name: "Untitled",
        access: "Public",
        admins: [Vue.config.user.sub.toString()],
        members: [Vue.config.user.sub.toString()],
      }
      //console.dir(this.editproject.admins);
      Vue.nextTick(()=>{
        this.projectdialog.modal('show');
      });
    }
  },

  created: function() {
    this.$http.get('project').then(res=>{
      this.projects = res.body.projects;
      this.count = res.body.count;
    }, res=>{
      console.error(res);
    });
  },

  components: { sidemenu, contact, contactlist },
}
</script>

<style scoped>
.margin20 {
	margin: 20px;
}
</style>
