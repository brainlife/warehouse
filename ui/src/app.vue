<template>
<div>
	<sidemenu active="apps"></sidemenu>
	<div class="page page-with-sidemenu">
		<div class="margin20">
      <h1>{{app.name}}</h1>
      <p>{{app.desc}}</p>

			<table class="ui definition table">
				<tbody>
					<tr>
						<td>DOI</td>
						<td>10.1006/br.a.{{app._id}} </td>
					</tr>
					<tr>
						<td>Owner</td>
						<td><contact :id="app.user_id"></contact></td>
					</tr>
					<tr>
						<td>Administrators</td>
						<td><contact v-for="c in app.admins" key="c._id" :id="c"></contact></td>
					</tr>
					<tr v-if="app.github">
						<td>gitrepo</td>
            <td>
              <p>
                <a :href="'http://github.com/'+app.github">{{app.github}}</a>
              </p>
            </td>
          <tr>
            <td>Computing Resource</td>
            <td>
              <p>
                This service can currently run on <a class="ui label"> {{this.resource.detail.name}} </a>
              </p>
            </td>
					</tr>
					<tr v-if="app.dockerhub">
						<td>dockerhub</td>
            <td><a :href="'http://hub.docker.com/'+app.dockerhub">{{app.dockerhub}}</a></td>
					</tr>
				</tbody>
			</table>

      <div class="ui segment">
        <div class="ui top attached label">Run</div>
        <form class="ui form">
          <div class="field">
            <label>T1</label>
            <select class="ui fluid dropdown" v-model="inputs['t1'].dataset_id">
              <option value="">(Select T1 dataset)</option>
              <option v-for="dataset in datasets['t1']" :value="dataset._id">{{dataset.name}}</option>
              <!--
              <optgroup label="dataset">
                <option v-for="dataset in datasets['t1']" :value="dataset._id">{{dataset.name}}</option>
              </optgroup>
              <optgroup label="collection">
              </optgroup>
              -->
            </select>
          </div>
          <div class="ui primary button" @click="submitapp()">Submit</div>
        </form>
      </div>

      <div class="ui segment">
        <div class="ui top attached label">Debug</div>
        <br>
        <br>
        <pre>{{inputs}}</pre>
				<pre>{{app}}</pre>
				<pre>{{resource}}</pre>
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
      app: {},
      resource: {},

      //TODO need to load from app
      inputs: {
        t1: {
          dataset_id: "",
        }
      },

      datasets: {t1: []}, //for searching
    }
  },

  mounted: function() {
    //console.log("looking for ", this.$route.params.id);
    this.$http.get('app', {params: {
        find: JSON.stringify({_id: this.$route.params.id})
    }})
    .then(res=>{
      this.app = res.body.apps[0];
      /*
      Vue.nextTick(()=>{
        console.log("shown dataset");
        $(this.$el).find('.ui.dropdown').dropdown()
      });
      */
      if(this.app.github) this.findbest(this.app.github);

      //find datasets
      this.$http.get('dataset', {params: {
          find: JSON.stringify({datatype_id: "58c33bcee13a50849b25879a"}) //t1
      }})
      .then(res=>{
        this.datasets['t1'] = res.body.datasets;
      }, res=>{
        console.error(res);
      });

    }, res=>{
      console.error(res);
    });
  },
  methods: {
    go: function(path) {
      this.$router.push(path);
    },

    findbest: function(service) {
      //find resource where we can run this app
      this.$http.get(Vue.config.wf_api+'/resource/best/', {params: {
          service: service,
      }})
      .then(res=>{
        this.resource = res.body;
      }, res=>{
        console.error(res);
      })
    },

    submitapp: function() {
      //first create an instance to run everything
      this.$http.post(Vue.config.wf_api+'/instance', {
        name: "brainlife.a."+this.app._id,
        desc: this.app.name,
        config: {
          brainlife: true
        }
      }).then(res=>{
        var instance = res.body;
        //console.dir(instance);

        //create config to download all input data from archive
        var download = [];
        var untar = [];
        for(var k in this.inputs) {
          var input = this.inputs[k];
          download.push({
            dir: "inputs/"+k,
            url: Vue.config.api+"/dataset/download/"+input.dataset_id+"?at="+Vue.config.jwt
          });
          //after downloading the data, I have to untar it
          //TODO - it will be nice if sca-product-raw can just download and untar in a single shot
          untar.push({
            src: "inputs/"+k+"/"+input.dataset_id+".tar.gz",
            dest: "inputs/"+k,
          });
        }

        //now submit task to download data from archive
        this.$http.post(Vue.config.wf_api+'/task', {
          instance_id: instance._id,
          name: "stage input",
          service: "soichih/sca-product-raw",
          config: { download, untar },
        }).then(res=>{
          //console.log("submitted download task");
          var download_task = res.body.task;
          //console.dir(download_task);

          //TODO - now submit tasks necessary to prep the input data so that we can run requested app

          //now submit the app (TODO - generate config automatically)
          this.$http.post(Vue.config.wf_api+'/task', {
            instance_id: instance._id,
            name: this.app.name,
            service: this.app.github,
            config: {
							"coords": [ [ 0, 0, 0 ], [ 0, -16, 0 ], [ 0, -8, 40 ] ],
							"t1": "../"+download_task._id+"/inputs/t1/t1.nii.gz"
            },
            deps: [ download_task._id ],
          }).then(res=>{
            var app_task = res.body.task;
            console.dir(app_task);
            this.go('/process/'+instance._id);
          }, res=>{
            console.error(res);
          });

        }, res=>{
          console.error(res);
        });

      }, res=>{
        console.error(res);
      });
    },
  },
  components: { sidemenu, contact, project },
}
</script>

<style scoped>
.ui.text.menu {
	margin: 0;
}
.dataset:hover {
	cursor: pointer;
	background-color: #ddd;
}
</style>
