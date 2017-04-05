<template>
<div>
    <sidemenu active="/datasets"></sidemenu>
    <div class="ui pusher">
        <div class="margin20" v-if="instance && tasks">
            <!--
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
            -->

            <div class="panel">
                <h1><i class="send icon"></i> Download</h1>
                <p>Requested At <b><time>{{instance.create_date|date}}</time></b></p>

                <el-steps :space="200" :active="active">
                    <el-step title="Stage" description="Staging data out of Brain-Life warehouse"></el-step>
                    <el-step title="Organize" description="Organizing data in BIDS format"></el-step>
                    <el-step title="Download" description="Ready to download your computer"></el-step>
                </el-steps>
                
                <br>
                <el-alert v-if="error" type="error" title="Failed" 
                    :description="error" show-icon :closable="false"></el-alert>

                <div v-if="active == 3">
                    <el-button type="primary" class="animated bounceIn" size="large" @click="download()" icon="document">Download (bids.tar.gz)</el-button>    
                </div>
            </div>

            <!--
            <div class="ui segment" v-if="app && instance.status == 'finished'">
                <div class="ui top attached label">Outputs</div>
                <el-table :data="app.outputs" style="width: 100%">
                    <el-table-column type="expand">
                        <template scope="props">
                            <file v-for="file in props.row.datatype.files" key="file.filename" :file="file" :task="main_task"></file>
                        </template>
                    </el-table-column>
                    <el-table-column prop="id" label="ID" width="180"></el-table-column>
                    <el-table-column prop="datatype.name" label="Name" width="180"></el-table-column>
                    <el-table-column prop="datatype.desc" label="Description"></el-table-column>
                </el-table>
            </div>
            -->

            <div class="ui segment">
                <div class="ui top attached label">Task Statuses</div>
                <task v-for="task in tasks" key="task._id" :task="task"></task>
            </div>
            <!--

            <div class="ui segment">
                <div class="ui top attached label">Inputs</div>
                <br>
                <div class="ui segments" v-for="dep in instance.config.prov.deps">
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
            -->

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
import file from '@/components/file'
import tags from '@/components/tags'
import metadata from '@/components/metadata'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    components: { sidemenu, contact, task, file, tags, metadata },

    data () {
        return {
            instance: null,
            tasks: null,
            task_bids: null,
            task_stage: null,

            error: null,
            status: "loading",
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

        }).catch((err)=>{
            console.error(res);
        });
    },

    computed: {
        active: function() {
            this.tasks.forEach((task)=>{
                if(task.status == "failed") {
                    this.error = task.status_msg;
                }
                if(task.name == "brainlife.download.bids") this.task_bids = task;
                if(task.name == "brainlife.download.stage") this.task_stage = task;
            });
            if(this.task_bids.status == "finished") return 3;
            if(this.task_stage.status == "finished") return 2;
            return 1;
        },
    },
    methods: {
        go: function(path) {
            this.$router.push(path);
        },

        remove: function() {
            this.$http.delete(Vue.config.wf_api+'/instance/'+this.instance._id).then(res=>{
                this.$router.push('/processes');
            });
        },

        download: function() {
            var url = Vue.config.wf_api+'/resource/download'+
                '?r='+this.task_bids.resource_id+
                '&p='+encodeURIComponent(this.task_bids.instance_id+'/'+this.task_bids._id+'/download')+
                '&at='+Vue.config.jwt;            
            console.log(url);
            document.location = url;
        },
    },
}
</script>

<style scoped>
</style>
