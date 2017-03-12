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
