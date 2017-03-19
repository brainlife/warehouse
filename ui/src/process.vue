<template>
<div>
	<sidemenu active="processes"></sidemenu>
    <div class="ui pusher">
        <div class="margin20">
            <message v-for="(msg, idx) in messages" key="idx" :msg="msg"></message>
            <button class="ui button primary right floated"
                v-if="!instance.config.dataset_id && instance.status == 'finished'" @click="archive()"> 
                Archive
            </button>
            <button class="ui button right floated"
                v-if="instance.config.dataset_id" @click="go('/dataset/'+instance.config.dataset_id)">
                <i class="check icon"></i> Archived
            </button>
            <button class="ui button right floated" @click="remove()">
                <i class="trash icon"></i> Remove
            </button>

            <h1>{{instance.name}}</h1>
            <p>{{instance.desc}}</p>

            <div class="ui segment" v-if="app && instance.status == 'finished'">
                <div class="ui top attached label">Outputs</div>
                <div v-for="output in app.outputs">
                    <h3>{{output.datatype.name}}</h3>
                    <div class="ui segment" v-for="file in output.datatype.files">{{file}}</div>
                </div>
            </div>

            <div class="ui segments">
                <div class="ui top attached label">Task Statuses</div>
                <task v-for="task in tasks" key="task._id" :task="task"></task>
            </div>

            <h2>Debug</h2>
            <div class="ui segments">
                <div class="ui segment" v-if="instance">
                    <h3>instance</h3>
                    <pre v-highlightjs><code class="json hljs">{{instance}}</code></pre>
                </div>
                <div class="ui segment" v-if="tasks">
                    <h3>tasks</h3>
                    <pre v-highlightjs v-for="task in tasks"><code class="json hljs">{{task}}</code></pre>
                </div>
                <div class="ui segment" v-if="app">
                    <h3>app</h3>
                    <pre v-highlightjs><code class="json hljs">{{app}}</code></pre>
                </div>
            </div>
        </div>
    </div>
</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import contact from '@/components/contact'
import message from '@/components/message'
import task from '@/components/task'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    data () {
        return {
            instance: null,
            tasks: null,
            messages: [],
            app: null,
        }
    },

    mixins: [
        //require("vue-toaster")
    ],

    mounted: function() {
        //load instance first
        this.$http.get(Vue.config.wf_api+'/instance', {params: {
            find: JSON.stringify({_id: this.$route.params.id})
        }})
        .then(res=>{
          this.instance = res.body.instances[0];

          //load tasks
          return this.$http.get(Vue.config.wf_api+'/task', {params: {
              find: JSON.stringify({instance_id: this.instance._id})
          }})
        })
        .then(res=>{
          this.tasks = res.body.tasks;
          console.log("tasks loaded")
          console.dir(this.tasks);

          //load app
          return this.$http.get('app', {params: {
              find: JSON.stringify({_id: this.instance.config.app})
          }})
        })
        .then(res=>{
            this.app = res.body.apps[0];
            console.log("loaded app");
            console.dir(this.app);

            //subscribe to the instance events
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            var ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
            ws.onopen = (e)=>{
                console.log("websocket opened", this.instance._id);
                ws.send(JSON.stringify({
                    bind: {
                        ex: "wf.task",
                        key: Vue.config.user.sub+"."+this.instance._id+".#",
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
            }
        }).catch((err)=>{
            console.error(res);
        });
    },
    methods: {
        go: function(path) {
            this.$router.push(path);
        },
        archive: function() {
            //finally, make a request to finalize the task directory
            //currently only deals with outputs[0]
            var params = {
                instance_id: this.instance._id,
                name: "data from "+this.instance.name,
                desc: "Data archived from "+this.instance.name,
                tags: ['xyz123', 'test', 'dev'], //TODO - let use set this?
                project: this.instance.config.project,
                task_id: this.instance.config.main_task_id,
                datatype: this.app.outputs[0].datatype,
                datatype_tags: this.app.outputs[0].datatype_tags,
            }
            this.$http.post('dataset', params).then(res=>{
                this.messages.push({msg: "Archiving Request Sent!", cls: {info: true}});

                //update instance to store dataset_id
                this.instance.config.dataset_id = res.body._id;
                //console.dir(res.body);
                this.$http.put(Vue.config.wf_api+'/instance/'+this.instance._id, {
                    config: this.instance.config,
                }).then(res=>{
                    console.log("done updating instance");
                });
            }, res=>{
                console.error(res);
            });
        },
        remove: function() {
            //this.messages.push({msg: "Removed", cls: {info: true}});
            this.$http.delete(Vue.config.wf_api+'/instance/'+this.instance._id).then(res=>{
                this.$router.push('/processes');
            });
        },
    },
    components: { sidemenu, contact, task, message },
}
</script>

<style scoped>
</style>
