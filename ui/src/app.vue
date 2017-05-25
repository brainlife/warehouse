<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/apps"></sidemenu>
    <div class="header" v-if="app">
        <el-button-group style="float: right;">
            <el-button @click="go('/app/'+app._id+'/edit')" v-if="app._canedit" icon="edit">Edit</el-button>
            <el-button type="primary" v-if="resource && !resource.nomatch" @click="go('/app/'+app._id+'/submit')"icon="caret-right">Submit</el-button>
        </el-button-group>
        <appavatar :app="app" style="float: left; margin-right: 20px; margin-top: 20px; border: 4px solid white; box-shadow: 3px 3px 3px rgba(0,0,0,0.3);"></appavatar>
        <br>
        <br>
        <h1>{{app.name}}</h1>
    </div> 
    <div class="page-content" v-if="app" style="margin-top: 90px; padding-top: 60px;">
        <table class="info">
        <tr>
            <th width="180px;">Description</th>
            <td>{{app.desc}}</td>
        </tr>
        <tr v-if="app.avatar">
            <th>Avatar</th>
            <td>{{app.avatar}}</td>
        </tr>
        <tr>
            <th>DOI (todo)</th>
            <td><pre>10.1006/br.a.{{app._id}}</pre></td>
        </tr>
        <tr>
            <th>Developers</th>
            <td>
                <contact v-for="c in app.admins" key="c._id" :id="c"></contact>
            </td>
        </tr>
        <tr>
            <th>Source Code</th>
            <td>
                <div v-if="app.github">
                    Github
                    <a :href="'http://github.com/'+app.github">{{app.github}}</a>
                </div>
                <div v-if="app.dockerhub">
                    Dockerhub
                    <a :href="'http://hub.docker.com/'+app.dockerhub">{{app.dockerhub}}</a>
                </div>
            </td>
        </tr>
        <tr v-if="resource">
            <th>Computing Resource</th>
            <td>
                <el-alert :closable="false" title="" type="error" v-if="!resource.detail">
                    There is no computing resource to run this currently.
                </el-alert>
                <p v-if="resource.detail">
                    This service can currently run on 
                    <el-tag> {{resource.detail.name}} </el-tag>
                </p> 
            </td>
        </tr>
        <tr>
            <th>Configuration Template</th>
            <td>
                <pre v-highlightjs><code class="json hljs">{{app.config}}</code></pre>
            </td>
        </tr>
        <tr>
            <th>Input Datatypes</th>
            <td>
                <p class="text-muted">You need following input datasets to run this application</p>
                <div class="item" v-for="input in app.inputs">
                    <!--<b>{{input.id}}</b>-->
                    <datatype :id="input.id" :datatype="input.datatype" :datatype_tags="input.datatype_tags" style="margin-bottom: 10px;"></datatype>
                </div>
            </td>
        </tr>
        <tr>
            <th>Output Datatypes</th>
            <td>
                <p class="text-muted">This application produces following output datasets</p>
                <div class="item" v-for="output in app.outputs">
                    <datatype :id="output.id" :datatype="output.datatype" :datatype_tags="output.datatype_tags"></datatype>
                </div>
            </td>
        </tr>
        </table>

        <br>
        <el-card v-if="config.debug">
            <div slot="header">Debug</div>
            <h3>App</h3>
            <pre v-highlightjs="JSON.stringify(app, null, 4)"><code class="json hljs"></code></pre>
            <h3>Resource</h3>
            <pre v-highlightjs="JSON.stringify(resource, null, 4)"><code class="json hljs"></code></pre>
        </el-card>
    </div><!--page-content-->
</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import contact from '@/components/contact'
import project from '@/components/project'
import tags from '@/components/tags'
import datatype from '@/components/datatype'
import appavatar from '@/components/appavatar'

export default {
    components: { sidemenu, pageheader, contact, project, tags, datatype, appavatar },

    data () {
        return {
            app: null,
            resource: null,

            //project_id: "", //to be selected by the user

            //cache
            //projects: [],

            config: Vue.config,
        }
    },

    mounted: function() {
        this.$on('editor-update', c=>{
            console.log("update", c);
        });

        this.$http.get('app', {params: {
            find: JSON.stringify({_id: this.$route.params.id}),
            populate: 'inputs.datatype outputs.datatype',
        }})
        .then(res=>{
            this.app = res.body.apps[0];
            if(this.app.github) this.findbest(this.app.github);
        }).catch(err=>{
            console.error(err);
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

        /*
        request_notifications: function(instance, main_task) {
            var url = document.location.origin+document.location.pathname+"#/process/"+instance._id;

            //for success
            return this.$http.post(Vue.config.event_api+"/notification", {
                event: "wf.task.finished",
                handler: "email",
                config: {
                        task_id: main_task._id,
                        subject: "[brain-life.org] Process Completed",
                        message: "Hello!\n\nI'd like to inform you that your process has completed successfully.\n\nPlease visit "+url+" to view your result.\n\nBrain-life.org Administrator"
                },
            });
        }
        */
    },
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
.header {
background: #666;
padding: 20px;
padding-bottom: 30px;
margin-top: 42px;
height: 40px;
position: fixed;
right: 0px;
left: 90px;
color: #666;
z-index: 1;
border-bottom: 1px solid #666;
}
.header h1 {
color: #eee;
}
.header-bottom {
height: 50px;
background-color: white;
position: fixed;
top: 140px;
right: 0px;
left: 90px;
border-bottom: 1px solid #ddd;
}
.appdesc {
margin: 20px 30px 30px 138px;
color: gray;
}
</style>
