<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/datasets"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
        <div class="margin20" v-if="instance && tasks">

            <!--
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/datasets' }">Datasets</el-breadcrumb-item>
                <el-breadcrumb-item>Download {{instance._id}}</el-breadcrumb-item>
            </el-breadcrumb>
            <br>
            -->

            <h1><icon name="download" scale="2"></icon> Download</h1>
            <el-card>
                <div slot="header" style="padding: 15px;">
                    <p style="float: right;"><span class="text-muted">Requested at</span> <b><time>{{instance.create_date|date}}</time></b></p>
                    <el-steps :space="200" :active="active">
                        <el-step title="Stage" description="Staging data out of Brain-Life warehouse"></el-step>
                        <el-step title="Organize" description="Organizing data in BIDS format"></el-step>
                        <el-step title="Download" description="Ready to download to your computer"></el-step>
                    </el-steps>
                    
                    <br>
                    <el-alert v-if="error" type="error" title="Failed" 
                        :description="error" show-icon :closable="false"></el-alert>

                    <div v-if="active == 3">
                        <el-button type="primary" class="animated bounceIn" size="large" @click="download()" icon="document">Download (bids.tar.gz)</el-button>    
                    </div>
                </div>

                <h3>Task Status</h3>
                <task v-for="task in tasks" key="task._id" :task="task"></task>

            </el-card>

            <br>
            <el-card v-if="config.debug">
                <div slot="header">Debug</div>
                <div v-if="instance">
                    <h3>instance</h3>
                    <pre v-highlightjs="JSON.stringify(instance, null, 4)"><code class="json hljs"></code></pre>
                </div>
                <div v-if="tasks">
                    <h3>tasks</h3>
                    <div v-for="task in tasks">
                        <pre v-highlightjs="JSON.stringify(task, null, 4)"><code class="json hljs"></code></pre>
                    </div>
                </div>
            </el-card>

        </div><!--margin20-->
        </div><!--page-content-->
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
import pageheader from '@/components/pageheader'

import ReconnectingWebSocket from 'reconnectingwebsocket'

export default {
    components: { sidemenu, contact, task, file, tags, metadata, pageheader },

    data () {
        return {
            instance: null,
            tasks: null,
            task_bids: null,
            task_stage: null,

            error: null,
            status: "loading",

            config: Vue.config,
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
                console.log("websocket opened", this.instance._id, "binding to", Vue.config.user.sub+"."+this.instance._id+".#");
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
                if(event.error) {
                    console.error(event.error);
                    return;
                }
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

        }).catch(err=>{
            console.error(err);
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
