<template>
<div>
    <sidemenu active="/datasets"></sidemenu>
    <div class="ui pusher">
        <div class="margin20" v-if="dataset">
            <button class="ui primary right floated button" @click="download()">
                <i class="download icon"></i> Download (.tar.gz)</button>
            <button class="ui right floated button" @click="remove()">
                <i class="trash icon"></i> Remove</button>

            <h1><i class="cube icon"></i> {{dataset.name}}</h1>
            <p>{{dataset.desc}}</p>

            <table class="ui definition table">
            <tbody>
                <tr>
                    <td>Create Date</td>
                    <td>{{dataset.create_date|date}}</td>
                </tr>
                <tr>
                    <td>Owner</td>
                    <td><contact :id="dataset.user_id"></contact></td>
                </tr>
                <tr>
                    <td class="two wide column">Storage</td>
                    <td>This dataset is currently stored on <b>{{dataset.storage}}</b></td>
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
                <tr class="top aligned">
                    <td>Data Type</td>
                    <td>
                        <datatype :datatype="dataset.datatype" :datatype_tags="dataset.datatype_tags"></datatype>
                    </td>
                </tr>
                <tr class="top aligned">
                    <td>Metadata</td>
                    <td>
                        <!--
                        <div class="ui image label" v-for="(v, k) in dataset.meta">
                            {{k}} <div class="detail">{{v}}</div>
                        </div>
                        -->
                        <metadata :metadata="dataset.meta"></metadata>
                    </td>
                </tr>
                <tr class="top aligned">
                    <td>Project</td>
                    <td>
                        <p>This dataset belongs to following project.</p>
                        <project :project="dataset.project"></project>
                    </td>
                </tr>
                <tr class="top aligned">
                    <td>Provenance</td>
                    <td v-if="dataset.prov.app">
                        <pre v-highlightjs><code class="json hljs">{{dataset.prov}}</code></pre>
                    </td>
                    <td v-else="dataset.prov">
                        <p>Uploaded by user.</p>
                    </td>
                </tr>
                <tr class="top aligned">
                    <td>Derivatives</td>
                    <td>
                        <div v-if="derivatives">
                            <p v-if="derivatives.length > 0">This dataset is used to produce following datasets.</p>
                            <p v-else="derivatives.length > 0">No derivatives</p>
                            <div class="ui segment clickable-record" 
                                v-for="deri in derivatives" @click="go(deri._id)">
                                <i class="cube icon"></i>
                                <b>{{deri.name}}</b> {{deri.desc}}
                            </div>
                        </div>
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

            <h2>Debug</h2>
            <div class="ui segments">
                <div class="ui segment" v-if="dataset">
                    <h3>dataset</h3>
                    <pre v-highlightjs><code class="json hljs">{{dataset}}</code></pre>
                </div>
                <div class="ui segment" v-if="derivatives">
                    <h3>derivatives</h3>
                    <pre v-highlightjs><code class="json hljs">{{derivatives}}</code></pre>
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
import project from '@/components/project'
import tags from '@/components/tags'
import app from '@/components/app'
import datatype from '@/components/datatype'
import metadata from '@/components/metadata'

const lib = require('./lib');

export default {
    components: { sidemenu, contact, project, app, tags, datatype, metadata },
    data () {
        return {
            dataset: null,
            apps: null,
            derivatives: null,
        }
    },

    watch: {
        '$route' (to, from) {
            //console.log(to, from);
            this.load(this.$route.params.id);
        }
    },

    mounted: function() {
        this.load(this.$route.params.id);
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
        },
        remove: function() {
            this.$http.delete('dataset/'+this.dataset._id)
            .then(res=>{
                this.go('/datasets');        
            });
        },
        load: function(id) {
            console.log("looking for ", id);
            this.$http.get('dataset', {params: {
                find: JSON.stringify({_id: id}),
                populate: "project datatype prov.app",
            }})
            .then(res=>{
                if(res.body.count == 0) {
                    console.error("can't find dataset");
                    return;
                }
                this.dataset = res.body.datasets[0];

                console.log("looking for derivatives", this.dataset);
                this.$http.get('dataset', {params: {
                    find: JSON.stringify({"prov.deps.dataset": id}),
                }}).then(res=>{
                    this.derivatives = res.body.datasets;
                }); 

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
                if(!res) return;
                this.apps = lib.filter_apps(this.dataset, res.body.apps);
            }).catch(err=>{
                console.error(res);
            });
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
