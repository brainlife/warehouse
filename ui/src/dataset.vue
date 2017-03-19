<template>
<div>
    <sidemenu active="datasets"></sidemenu>
    <div class="ui pusher">
        <div class="margin20" v-if="dataset">

      <div class="ui small basic icon buttons right floated">
        <button class="ui button" @click=""><i class="file icon"></i></button>
        <button class="ui button"><i class="save icon"></i></button>
        <button class="ui button"><i class="upload icon"></i></button>
        <button class="ui button"><i class="download icon"></i></button>
      </div>

      <h1>{{dataset.name}}</h1>
      <p>{{dataset.desc}}</p>

            <table class="ui definition table">
                <tbody>
                    <tr>
            <td>Create Date</td>
                        <td>{{dataset.create_date|date}}</td>
                    </tr>
                    <tr>
                        <td class="two wide column">Storage</td>
                        <td>{{dataset.storage}}</td>
                    </tr>
                    <tr class="top aligned">
                        <td>DOI</td>
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
                    <tr class="top aligned">
                        <td>Data Type</td>
            <td>
              <p>{{dataset.datatype.desc}}</p>
              <div class="ui label" v-for="tag in dataset.datatype_tags">{{tag}}</div>
              <div class="ui segment" v-for="file in dataset.datatype.files">{{file}}</div>
            </td>
                    </tr>
                    <tr class="top aligned">
                        <td>Project</td>
            <td>
              <project :project="dataset.project"></project>
            </td>
                    </tr>
                </tbody>
            </table>

      <!--
            <h4 class="ui horizontal divider header">Content</h4>
            {{dataset.product.files}}
      -->

      <!--
            <h4 class="ui horizontal divider header">Project Info</h4>
      <project :project="dataset.project"></project>
      -->

            <h4 class="ui horizontal divider header">Applications</h4>
      <p>You can use this data as input for following applications.</p>
            <div class="ui cards">
        <app v-for="app in apps" key="app._id" :app="app"></app>
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
import app from '@/components/app'

export default {
  data () {
    return {
      dataset: null,
      apps: null,
    }
  },

  mounted: function() {
    console.log("looking for ", this.$route.params.id);
    this.$http.get('dataset', {params: {
        find: JSON.stringify({_id: this.$route.params.id})
    }})
    .then(res=>{
      this.dataset = res.body.datasets[0];

      console.log("looking for app that uses this data");
      this.$http.get('app', {params: {
        "find": JSON.stringify({
          //look for apps that uses my datatype as input
          "inputs.datatype": this.dataset.datatype._id
        })
      }})
      .then(res=>{
        this.apps = [];

        //TODO - maybe I should move this filtering logic to server
        res.body.apps.forEach((app)=> {
          var has_matching_input = false;

          app.inputs.forEach((input)=> {
            if(input.datatype._id == this.dataset.datatype._id) {
              //make sure the data type meets all application datatype tags
              var reject = false;
              input.datatype_tags.forEach((tag)=> {
                if(tag[0] == '!') {
                  //negative tag (dataset must't have)
                  if(~this.dataset.datatype_tags.indexOf(tag.substring(1))) {
                    reject = true;
                  }
                } else {
                  //normal tag (dataset must have)
                  if(!~this.dataset.datatype_tags.indexOf(tag)) reject = true;
                }
              });
              if(!reject) has_matching_input = true;
            }
          });
          if(has_matching_input) this.apps.push(app);
        });
      }, res=>{
        console.error(res);
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
  },
  components: { sidemenu, contact, project, app },
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
