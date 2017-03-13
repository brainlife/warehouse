<template>
<div>
	<sidemenu active="projects"></sidemenu>
	<div class="page page-with-sidemenu">
		<div class="margin20">

			<br>
			<button v-if="user" class="ui right floated primary button" @click="newproject()">
					<i class="icon add"></i>
					Add Project
			</button>
			<br>
			<br>

			<div class="ui relaxed divided items">
				<div class="item" v-for="(project, index) in projects">
					<div class="content">
            <project :project="project"></project>
						<div class="meta right floated">
              <button v-if="project._canedit" class="ui right floated button" @click="editproject(project)">
                  <i class="icon edit"></i> Edit
              </button>
						</div>
					</div>
				</div><!--item-->
			</div><!--items-->

		</div><!--margin-->
	</div><!--page-->

	<!-- project dialog ---------------------------------------------------------------->
	<div class="ui modal projectdialog">
		<i class="close icon"></i>
		<div class="header" v-if="edit._id">
      Editing {{edit.name}}
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
          <div class="ui header">Say something nice to make people feel happy</div>
          <div class="field">
            <label>Project Name</label>
            <input type="text" v-model="edit.name" placeholder="Please enter name for this project">
          </div>
          <div class="field">
            <label>Description</label>
            <textarea v-model="edit.desc" placeholder="Details about this project"></textarea>
          </div>
          <div class="field">
            <label>Admins</label>
            <contactlist :uids="edit.init_admins" v-on:changed="changemember('admins', $event)"></contactlist>
          </div>
          <div class="field">
            <label>Members</label>
            <contactlist :uids="edit.init_members" v-on:changed="changemember('members', $event)"></contactlist>
          </div>

					<div class="inline fields">
						<label>Data Access</label>
						<div class="field">
							<div class="ui radio checkbox">
								<input type="radio" value="public" v-model="edit.access">
								<label>Public</label>
							</div>
						</div>
						<div class="field">
							<div class="ui radio checkbox">
								<input type="radio" value="private" v-model="edit.access">
								<label>Private</label>
							</div>
						</div>
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
			<div v-if="edit._id" class="ui positive right labeled icon button">
			  Update <i class="checkmark icon"></i>
			</div>
			<div v-if="!edit._id" class="ui positive right labeled icon button">
			  Create <i class="checkmark icon"></i>
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
import project from '@/components/project'

export default {
  name: "projects-ui",

  data () {
    return {
      msg: 'Welcome to Your Vue.js App',
      projects: [],
      count: 0, //total counts of projects (not paged)

      user: Vue.config.user, //see if user is logged in

      //placeholder for dialog
      edit: {
        _id: null, //set if editing
        name: "",
        desc: "",
        access: "",

        admins: [],
        members: [],
      }
    }
  },

  mounted: function() {
    this.projectdialog = $(this.$el).find('.projectdialog');
    this.projectdialog.modal({
      onApprove: ()=> {
        if(this.edit._id) {
          //update
					this.$http.put('project/'+this.edit._id, this.edit).then(res=>{
            //find project that's updated
            this.projects.forEach((p)=>{
              if(p._id == this.edit._id) {
                for(var k in res.body) p[k] = res.body[k];
              }
            });
					}, res=>{
						console.error(res);
					});
        } else {
          //create
          console.log("creating");
          console.log(JSON.stringify(this.edit, null, 4));
					this.$http.post('project', this.edit).then(res=>{
            console.log("created", res.body);
            this.projects.push(res.body);
					}, res=>{
						console.error(res);
					});
        }
      }
    });
  },

  methods: {
    changemember: function(list, uids) {
      if(!uids) return;
      console.log("set", list, uids);
      this.edit[list] = uids;
    },
    newproject: function() {
      //initialize
      this.edit = {
        name: "",
        desc: "",
        access: "public",
        admins: [Vue.config.user.sub.toString()],
        members: [Vue.config.user.sub.toString()],

        //ugly hack to get contactlist to not feedback list update
        init_admins: [Vue.config.user.sub.toString()],
        init_members: [Vue.config.user.sub.toString()],
      }
      Vue.nextTick(()=>{
        this.projectdialog.modal('show');
      });
    },
    editproject: function(p) {
      this.edit = Object.assign({
        init_admins: p.admins,
        init_members: p.members,
      }, p);
      Vue.nextTick(()=>{
        console.log("showing");
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

  components: { sidemenu, contactlist, project },
}
</script>

<style scoped>
</style>
