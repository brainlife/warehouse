<template>
<div class="page-content">
    <div class="page-header">
        <h4>Administration</h4>
    </div>

    <b-tabs class="brainlife-tab" v-model="tab">
        <b-tab title="Task"> 
            <br>
            <b-form inline style="margin: 0 15px;">
                <b-input-group prepent="Task ID">
                    <b-form-input v-model="task_id" placeholder="Task ID" style="width: 300px;"/>
                </b-input-group>
                &nbsp;
                <b-btn @click="loadTask()">Open</b-btn>
            </b-form>
            <br>

            <div style="padding: 20px;" v-if="depTasks.length">
                <span class="form-header">Dep Tasks</span>
                <p v-for="task in depTasks" :key="task._id">
                    <!--<b>{{task._id}}</b>-->
                    <task :task="task"/>
                </p>
            </div>

            <task v-if="task" :task="task"/>

            <div style="padding: 20px;" v-if="nextTasks.length">
                <span class="form-header">Next Tasks</span>
                <p v-for="task in nextTasks" :key="task._id">
                    <!--<b>{{task._id}}</b>-->
                    <task :task="task"/>
                </p>
            </div>
            
            <hr>
            <div style="padding: 20px" v-if="task">
                <b>Task Dump</b>
                <pre>{{task}}</pre>
            </div>

        </b-tab>
        <b-tab title="Switch User"> 
            <br>
            <div style="margin: 0 15px">
                <p>
                    <v-select 
                        @search="get_sulist" 
                        @input="su" 
                        :debounce="250" 
                        :options="su_options" placeholder="search user to become" label="fullname"/>
                </p>

                <p>
                    <b-button @click="refresh">Update Token</b-button>
                </p>
            </div>
        </b-tab>
        <b-tab title="Analytics">
            <br>
            <div style="margin: 0 15px" v-if="posCountData">
                <span class="form-header">User Categories</span>
                <small>This plot show groups of user private profile position for each users.</small>
                <ExportablePlotly :data="posCountData" :layout="posCountLayout"/>
            </div>
            <div style="margin: 0 15px" v-if="appItems">
                <span class="form-header">App Usage</span>
                <small>Most Used Apps</small>
                <b-table :small="true" :items="appItems" :fields="appFields"></b-table>
            </div>
        </b-tab>
    </b-tabs>
</div>
</template>

<script>
import Vue from 'vue'


import task from '@/components/task'

import ReconnectingWebSocket from 'reconnectingwebsocket'
//import { Plotly } from 'vue-plotly'

const numeral = require('numeral');

export default {
    components: { 
        task,
        ExportablePlotly: ()=>import('@/components/ExportablePlotly')
    },
    data () {
        return {
            //service_running: [],
            su_options: [],
            config: Vue.config,

            task_id: "",
            task: null,
            depTasks: [],
            nextTasks: [],

            ws: null,

            tab: 0,

            posCountData: null, 
            posCountLayout : {
                //"title" : "User Categories"
            },

            appItems: null,
            appFields: [
                { key: "name", label: "App Name", sortable: true },
                { key: "doi", label: "DOI", sortable: true },
                { key: "requested", label: "Execution Count", sortable: true },
                { key: "runtimeMean", label: "Avg. Walltime (min)", sortable: true },
                { key: "successRate", label: "Success Rate(%)", sortable: true },
                { key: "users", label: "Users", sortable: true },
                { key: "resourcesCount", label: "Resources", sortable: true },
            ],
        }
    },

    mounted() {
    },

    watch: {
        tab(v) {
            //analytics tab
            if(v == 2) { 
                if(!this.posCountData) this.loadAnalytics();
            }
        }
    },

    methods: {
        loadAnalytics() {
            console.log("loading analytics info");

            this.$http.get(Vue.config.auth_api+'/profile/poscount').then(res=>{
                let trace = {
                    values: Object.values(res.data), 
                    labels: Object.keys(res.data),  
                    type: "pie"
                };
                this.posCountData = [trace];
            });

            this.$http.get('/app', {
                params: {
                    //find: JSON.stringify({removed: false}),
                    select: 'name stats removed doi',
                }
            }).then(res=>{
                this.appItems = [];
                res.data.apps.forEach(app=>{
                    if(!app.stats) return;
                    if(!app.stats.resources) app.stats.resources = [];
                    this.appItems.push({
                       name: app.name+(app.removed?' (removed)':''),
                       doi: app.doi,
                       requested: app.stats.requested,
                       runtimeMean: numeral(app.stats.runtime_mean/(1000*60)).format('0,0'),
                       successRate: numeral(app.stats.success_rate).format('00.0'),
                       users: app.stats.users,
                       resourcesCount: app.stats.resources.length,
                    });
                });
            });
        },

        get_sulist(search, loading) {
            loading(true);
            this.$http.get(Vue.config.auth_api+'/users', { params: {
                where: JSON.stringify({
                    $or: [
                        //need to use iLike with postgres..
                        {fullname: {$regex: search, $options : 'i'}}, 
                        {email: {$regex: search, $options : 'i'}},
                    ],
                }),
                limit: 0,
            }}).then(res=>{
                this.su_options = res.data;
                loading(false);
            });
        },

        su(person) {
            if(!person) return;
            this.$http.get(Vue.config.auth_api+'/jwt/'+person.sub).then(res=>{
                localStorage.setItem("jwt", res.data.jwt);
                document.location = "/project/";
            });
        },

        refresh() {
            this.$http.post(Vue.config.auth_api+'/refresh').then(res=>{
                localStorage.setItem("jwt", res.data.jwt);
                this.$notify("refreshed");
            });
        },

        loadTask() {
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            if(this.ws) this.ws.close();
            this.ws = new ReconnectingWebSocket(url, null, {/*debug: Vue.config.debug,*/ reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                console.log("connection opened");

                // load task detail
                this.$http.get(Vue.config.amaretti_api+'/task/'+this.task_id).then(res=>{
                    this.task = res.data;

                    //also subscribe to updates
                    this.ws.send(JSON.stringify({bind: {
                        ex: "wf.task",
                        key: this.task.instance_id+"."+this.task._id,
                    }}));

                    //load deps
                    const depIds = this.task.deps_config.map(config=>config.task);
                    this.$http.get(Vue.config.amaretti_api+'/task', { params: {
                        find: JSON.stringify({
                            //follow_task_id: this.task_id
                            "_id": {$in: [depIds]},
                        }),
                    }}).then(res=>{
                        this.depTasks = res.data.tasks;
                    }).catch(console.error);

                }).catch(err=>{
                    alert(err);
                });

                //load tasks that follows it
                this.$http.get(Vue.config.amaretti_api+'/task', { params: {
                    find: JSON.stringify({
                        //follow_task_id: this.task_id
                        "deps_config.task": this.task_id
                    }),
                }}).then(res=>{
                    this.nextTasks = res.data.tasks;
                }).catch(console.error);

                this.ws.onmessage = (json)=>{
                    let event = JSON.parse(json.data);
                    console.log("task updated!", event);
                    Object.assign(this.task, event.msg);
                }
            }
        },
    },
}
</script>

<style scoped>
.page-header {
height: 50px;
padding: 10px;
}
.brainlife-tab {
padding-top: 0;
overflow: auto;
}
.tab-content {
position: fixed;
top: 50px;
bottom: 0;
}
.tab-content > .tab-pane {
overflow: auto;
position: absolute;
top: 40px;
left: 0px;
right: 0;
bottom: 0;
}
</style>
