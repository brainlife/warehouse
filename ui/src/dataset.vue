<template>
<div>
    <sidemenu active="datasets"></sidemenu>
    <div class="ui pusher">
        <div class="margin20" v-if="dataset">

        <!--
        <div class="ui small basic icon buttons right floated">
            <button class="ui button" @click=""><i class="file icon"></i></button>
            <button class="ui button"><i class="download icon"></i> Downalod</button>
        </div>
        -->
        <button class="ui primary right floated button" @click="download()"><i class="download icon"></i> Download (.tar.gz)</button>

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
                <td>User Tags</td>
                <td>
                    <tags :tags="dataset.tags"></tags>
                </td>
            </tr>
            <tr>
                <td>Owner</td>
                <td><contact :id="dataset.user_id"></contact></td>
            </tr>
            <tr class="top aligned">
                <td>Data Type</td>
                <td>
                    <p>{{dataset.datatype.desc}}</p>
                    <tags :tags="dataset.datatype_tags"></tags>
                    <div class="ui segment" v-for="file in dataset.datatype.files">
                        <i class="file icon" v-if="file.filename"></i>
                        <i class="folder icon" v-if="file.dirname"></i>
                        {{file.filename||file.dirname}}
                    </div>
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

        <div v-if="apps && apps.length > 0">
            <h4 class="ui horizontal divider header">Applications</h4>
            <p v-if="apps.length > 0">You can use this data as input for following applications.</p>
            <div class="ui cards">
                <app v-for="app in apps" key="app._id" :app="app"></app>
            </div>
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
import tags from '@/components/tags'
import app from '@/components/app'

const lib = require('./lib');

export default {
    components: { sidemenu, contact, project, app, tags },
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
            return this.$http.get('app', {params: {
                "find": JSON.stringify({
                //look for apps that uses my datatype as input
                "inputs.datatype": this.dataset.datatype._id
                })
            }})
        })
        .then(res=>{
            //should I do this via computed?
            this.apps = lib.filter_apps(this.dataset, res.body.apps);
        }).catch(err=>{
            console.error(res);
        });
    },
    methods: {
        opendataset: function(dataset) {
            console.dir(dataset);
        },
        go: function(path) {
            this.$router.push(path);
        },
        download: function() {
            let url = Vue.config.api+'/dataset/download/'+this.dataset._id+'?at='+Vue.config.jwt;
            document.location = url;
        }
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
</style>
