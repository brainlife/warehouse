<template>
<div>
    <sidemenu active="/processes"></sidemenu>
    <div class="ui pusher">
        <div class="margin20">
            <div class="ui fluid category search">
                <div class="ui icon input">
                    <input class="prompt" type="text" placeholder="Search processes...">
                    <i class="search icon"></i>
                </div>
                <div class="results"></div>
            </div>

            <h3 v-if="!instances"> <i class="el-icon-loading"></i> Loading..  </h3>

            <table class="ui table" v-if="instances">
                <thead>
                    <tr>
                        <th style="min-width: 180px">Create Date</th>
                        <th style="min-width: 200px">Project</th>
                        <th style="min-width: 200px">Application</th>
                        <th style="min-width: 200px">Description</th>
                        <th style="min-width: 120px">Status</th>
                        <th style="min-width: 120px">Archived</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="instance in instances" class="clickable-record" @click="go('/process/'+instance._id)">
                        <td> {{instance.create_date | date}} </td>
                        <td> 
                            <div class="ui green horizontal label" v-if="projects[instance.config.project].access == 'public'">Public</div>
                            <div class="ui red horizontal label" v-if="projects[instance.config.project].access == 'private'">Private</div>
                            {{projects[instance.config.project].name}} 
                        </td>
                        <!--<td> {{instance.name}} </td>-->
                        <td> {{apps[instance.config.prov.app].name}} </td>
                        <td> {{instance.desc}} </td>
                        <td>
                          <div class="ui label yellow" v-if="instance.status == 'removed'">
                            <i class="icon remove"></i> Removed</div>
                          <div class="ui label blue" v-if="instance.status == 'finished'">
                            <i class="icon check"></i> Finished!</div>
                          <div class="ui label green" v-if="instance.status == 'running'">
                            <i class="notched circle loading icon"></i> Running</div>
                          <div class="ui label green" v-if="instance.status == 'requested'">
                            <i class="wait icon"></i> Requested</div>
                          <div class="ui label red" v-if="instance.status == 'failed'">
                            <i class="warning icon"></i> Failed</div>
                          <div class="ui label" v-if="instance.status == 'unknown'">
                            <i class="help icon "></i> Failed</div>
                        </td>

                        <td>
                          <div class="ui label" v-if="instance.config.dataset_id">
                            <i class="check icon"></i> Archived</div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="ui segment" v-if="config.debug">
                <div class="ui top attached label">Debug</div>
                <br>
                <br>
                <pre v-if="instances" v-highlightjs="JSON.stringify(instances, null, 4)"><code class="json hljs"></code></pre>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'

export default {
    components: { sidemenu },
    name: 'processes',
    data () {
        return {
            instances: null,
            
            //cache
            projects: null, //keyed by _id
            apps: null, //keyed by _id

            config: Vue.config,
        }
    },
    mounted: function() {
        //first load projects
        this.$http.get('project', {params: {
            //service: "_upload",
        }})
        .then(res=>{
            this.projects = {};
            res.body.projects.forEach((p)=>{
                this.projects[p._id] = p;
            });

            //then load application details
            return this.$http.get('app', {params: {
                /*
                find: JSON.stringify({
                    _id: this.$route.params.id,
                    "config.brainlife": true,
                    status: {$ne: "removed"},
                    "config.removing": {$exists: false},
                })
                */
            }});
        })
        .then(res=>{
            this.apps = {};
            res.body.apps.forEach((a)=>{
                this.apps[a._id] = a;
            });

            //then load instances (processes)
            return this.$http.get(Vue.config.wf_api+'/instance', {params: {
                find: JSON.stringify({
                    _id: this.$route.params.id,
                    "config.brainlife": true,
                    status: {$ne: "removed"},
                    "config.removing": {$exists: false},
                })
            }});
        })
        .then(res=>{
            this.instances = res.body.instances;
        }).catch(res=>{
          console.error(res);
        });

    },

    methods: {
        go: function(path) {
            this.$router.push(path);
        },
    },

}

</script>

<style scoped>
</style>

