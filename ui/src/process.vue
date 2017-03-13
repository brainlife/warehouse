<template>
<div>
	<sidemenu active="processes"></sidemenu>
	<div class="page page-with-sidemenu">
		<div class="margin20">

      <h1>{{instance.name}}</h1>
      <p>{{instance.desc}}</p>

      <task v-for="task in tasks" key="task._id" :task="task"></task>

      <div class="ui segment">
        <div class="ui top attached label">Debug</div>
        <br>
        <br>
        <pre>{{instance}}</pre>
      </div>

		</div>
	</div>

</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import contact from '@/components/contact'
import task from '@/components/task'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
  data () {
    return {
      instance: {},
      tasks: {},
    }
  },

  mounted: function() {
    //console.log("looking for ", this.$route.params.id);
    this.$http.get(Vue.config.wf_api+'/instance', {params: {
        find: JSON.stringify({_id: this.$route.params.id})
    }})
    .then(res=>{
      this.instance = res.body.instances[0];

      //load tasks
      this.$http.get(Vue.config.wf_api+'/task', {params: {
          find: JSON.stringify({instance_id: this.instance._id})
      }})
      .then(res=>{
        this.tasks = res.body.tasks;

        //subscribe to the instance events
        var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
        var ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
        ws.onopen = (e)=>{
          console.log("websocket opened", this.instance_id);
          ws.send(JSON.stringify({
            bind: {
              ex: "wf.task",
              key: Vue.config.user.sub+"."+this.instance_id+".#",
            }
          }));
        }
        ws.onmessage = (json)=>{
          var event = JSON.parse(json.data);
          var task = event.msg;
          if(!task) return;
          if(!task._id) return; //what kind of task is this?

          //look for the task to update
          this.tasks.forEach(function(t) {
            if(t._id == task._id) {
                for(var k in task) t[k] = task[k];
            }
          });
          /*
          if(task._id == this.validation._id) {
            this.validation = task;
          }
          if(task._id == this.copy._id) {
            this.copy = task;
            if(task.status == "finished") {
              this.archive();
            }
          }
          */
        }
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
  },
  components: { sidemenu, contact, task },
}
</script>

<style scoped>
</style>
