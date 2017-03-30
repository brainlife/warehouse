<template>
<div>
    <sidemenu active="processes"></sidemenu>
    <div class="ui pusher">
        <div class="margin20" v-if="instance && tasks">
            <message v-for="(msg, idx) in messages" key="idx" :msg="msg"></message>
            <button class="ui button primary right floated"
                v-if="!instance.config.dataset_id && instance.status == 'finished'" @click="archive()"> 
                <i class="archive icon"></i> Archive Output
            </button>
            <button class="ui button right floated"
                v-if="instance.config.dataset_id" @click="go('/dataset/'+instance.config.dataset_id)">
                <i class="archive icon"></i> See Archived
            </button>
            <button class="ui button right floated" @click="remove()">
                <i class="trash icon"></i> Remove
            </button>

            <h1><i class="send icon"></i> {{instance.name}}</h1>
            <p>{{instance.desc}}</p>

            <div class="ui segment" v-if="app && instance.status == 'finished'">
                <div class="ui top attached label">Outputs</div>
                <div v-for="output in app.outputs">
                    <h3>{{output.datatype.name}}</h3>
                    <p>{{output.datatype.desc}}</p>
                    <file v-for="file in output.datatype.files" key="file.filename" :file="file" :task="main_task"></file>
                </div>
            </div>

            <div class="ui segment">
                <div class="ui top attached label">Task Statuses</div>
                <task v-for="task in tasks" key="task._id" :task="task"></task>
            </div>

            <div class="ui segment">
                <div class="ui top attached label">Inputs</div>
                <br>
                <div class="ui segments" v-for="dep in instance.config.prov.deps">
                    {{dep}}
                    <h5 class="ui top attached header">
                        <h5>{{dep.input_id}}</h5>
                    </h5>
                    <div class="ui attached segment" v-if="dep._dataset">
                        <tags :tags="dep._dataset.datatype_tags"></tags>
                        <small>{{dep._dataset.desc}}</small>
                        <metadata :metadata="dep._dataset.meta"></metadata>
                    </div>
                </div>
            </div>

            <div class="ui segment">
                <div class="ui top attached label">Configuration</div>
                <br>
                <pre v-highlightjs><code class="json hljs">{{instance.config.prov.config}}</code></pre>
            </div>

            <h2>Debug</h2>
            <div class="ui segments">
                <div class="ui segment" v-if="instance">
                    <h3>instance</h3>
                    <pre v-highlightjs="JSON.stringify(instance, null, 4)"><code class="json hljs"></code></pre>
                </div>
                <div class="ui segment" v-if="tasks">
                    <h3>tasks</h3>
                    <div v-for="task in tasks">
                        <pre v-highlightjs="JSON.stringify(task, null, 4)"><code class="json hljs"></code></pre>
                    </div>
                </div>
                <div class="ui segment" v-if="app">
                    <h3>app</h3>
                    <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
                </div>
                <!--
                <div class="ui segment" v-if="datasets">
                    <h3>datasets</h3>
                    <pre v-highlightjs="JSON.stringify(datasets, null, 4)"><code class="json hljs"></code></pre>
                </div>
                -->
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
import file from '@/components/file'
import tags from '@/components/tags'
import metadata from '@/components/metadata'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    mixins: [
        //require("vue-toaster")
    ],
    components: { sidemenu, contact, task, message, file, tags, metadata },

    data () {
        return {
            instance: null,
            tasks: null,
            messages: [],
            app: null,
        }
    },

    mounted: function() {
        //load instance first
        this.$http.get(Vue.config.wf_api+'/instance', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
            //populate: 'config.project datatype instance.config.prov.deps.dataset',
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

          //load app
          return this.$http.get('app', {params: {
              find: JSON.stringify({_id: this.instance.config.prov.app})
          }})
        })
        .then(res=>{
            this.app = res.body.apps[0];

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
                ws.send(JSON.stringify({
                    bind: {
                        ex: "wf.instance",
                        key: Vue.config.user.sub+"."+this.instance._id,
                    }
                }));
            }
              
            ws.onmessage = (json)=>{
                var event = JSON.parse(json.data);
                var msg = event.msg;
                if(!msg || !msg._id) return; //odd..
                switch(event.dinfo.exchange) {
                case "wf.task":
                    //look for the task to update
                    this.tasks.forEach(function(t) {
                      if(t._id == msg._id) {
                          for(var k in msg) t[k] = msg[k];
                      }
                    });
                    break;
                case "wf.instance":
                    this.instance = msg;    
                    break;
                default:
                    console.error("unknown exchange", event.dinfo.exchange);
                }
            }

            //load datasets used for input
            var dataset_ids = this.instance.config.prov.deps.map(dep=>dep.dataset);
            this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: dataset_ids}),
                populate: ' ',
            }})
            .then(res=>{
                //this.datasets = res.body.datasets;
                res.body.datasets.forEach((dataset)=>{
                    this.instance.config.prov.deps.forEach(dep=>{
                        if(dep.dataset == dataset._id) {
                            dep._dataset = dataset;
                            console.log("found match", dataset);
                        }
                    });
                });
            });

        }).catch((err)=>{
            console.error(res);
        });
    },

    computed: {
        main_task: function() {
            var it = null;
            this.tasks.forEach((task)=>{
                if(task._id == this.instance.config.main_task_id) it = task;
            })
            if(!it) console.error("failed to find main_task");
            return it;
        }
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
                //name: "data from "+this.instance.name,
                name: this.app.name+" output", 
                desc: "Data archived from "+this.instance.name,
                tags: ['xyz123', 'test', 'dev'], //TODO - let use set this?
                project: this.instance.config.project,
                task_id: this.instance.config.main_task_id,
                prov: this.instance.config.prov, 
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
}
</script>

<style scoped>
</style>
