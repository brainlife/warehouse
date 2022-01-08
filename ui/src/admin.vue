<template>
<div class="page-content">
    <div class="header">
        <b-container>
            <b-tabs class="brainlife-tab" v-model="tab">
                <b-tab title="Task"/>
                <b-tab title="Switch User"/>
                <b-tab title="Analytics"/>
                <b-tab title="Projects"/>
                <b-tab title="Users"/>
                <b-tab title="Groups"/>
            </b-tabs>
        </b-container>
    </div>

    <b-container>
        <!--switch user-->
        <div v-if="tab == 0">
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

            <div v-if="prov">
                <provgraph :prov="prov" :taskid="task._id" style="height: 500px;" :showFull="true"/>
            </div>

            <hr>
            <div style="padding: 20px" v-if="task">
                <b>Task Dump</b>
                <pre>{{task}}</pre>
            </div>
        </div> <!--end task tab-->

        <!--switch user-->
        <div v-if="tab == 1">
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

        <!--analytics-->
        <div v-if="tab == 2">
            <div style="margin: 0 15px" v-if="posCountData">
                <span class="form-header">User Categories</span>
                <small>This plot show groups of user private profile position for each users.</small>
                <ExportablePlotly :data="posCountData" :layout="posCountLayout"/>
            </div>

            <br>
            <div style="margin: 0 15px" v-if="appItems">
                <span class="form-header">App Stats</span>
                <small>{{appItems.length}} apps</small>
                <b-table
                    :small="true" :items="appItems" :fields="appFields" selectable @row-selected="appSelected">
                    <template #cell(name)="data">
                        {{data.item.name}}
                        <b-badge v-if="data.item.removed" variant="danger">Removed</b-badge>
                        <b-badge v-if="data.item.deprecated" variant="secondary">Deprecated</b-badge>
                        <b-badge v-if="data.item.private" variant="warning">Private</b-badge>
                    </template>
                </b-table>
            </div>
        </div>

        <!--projects-->
        <div v-if="tab == 3">
            <div style="background-color: #f8f8f8; padding: 10px">
                <div style="width: 400px">
                    <b-input-group>
                        <b-input-group-prepend is-text>Minimum Project Size</b-input-group-prepend>
                        <b-form-input id="minProjectSize" v-model="minProjectSize" debounce="500">Minimum Project Size (GB)</b-form-input>
                        <b-input-group-append is-text>GB</b-input-group-append>
                    </b-input-group>
                </div>
            </div>
            <b-table sort-by="size" :small="true" :items="projectRecords" :fields="projectFields" selectable @row-selected="projectSelected">
                <template #cell(admins)="data">
                    <contact v-for="c in data.item.admins" size="small" :key="c._id" :id="c"/>
                </template>
                <template #cell(members)="data">
                    <contact v-for="c in data.item.members" size="small" :key="c._id" :id="c"/>
                </template>
                <template #cell(name)="data">
                    <projectaccess :access="data.item.access"/>
                    {{data.item.name}}
                </template>
                <template #cell(create_date)="data">
                    {{data.item.create_date.toLocaleDateString()}}
                </template>
                <template #cell(update_date)="data">
                    {{data.item.update_date.toLocaleDateString()}}
                </template>
                <template #cell(subjects)="data">
                    {{data.item.subjects|formatNumber}}
                </template>
                <template #cell(objects)="data">
                    {{data.item.objects|formatNumber}}
                </template>
                <template #cell(size)="data">
                    <span v-if="data.item.size">{{data.item.size|filesize}}</span>
                </template>
            </b-table>
        </div>

        <adminUsers v-if="tab == 4"/>
        <adminGroups v-if="tab == 5"/>

    </b-container>
</div>
</template>

<script>
import Vue from 'vue'
import task from '@/components/task'
import projectaccess from '@/components/projectaccess'
import contact from '@/components/contact'
import adminUsers from '@/components/admin/users'
import adminGroups from '@/components/admin/groups'
import ReconnectingWebSocket from 'reconnectingwebsocket'

const numeral = require('numeral');

export default {
    components: {
        task,
        projectaccess,
        contact,
        adminUsers,
        adminGroups,
        ExportablePlotly: ()=>import('@/components/ExportablePlotly'),
        provgraph: ()=>import('@/components/provgraph'),
    },
    data () {
        return {
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
                { key: "github", label: "Github", sortable: true },
                { key: "doi", label: "DOI", sortable: true },
                { key: "requested", label: "Execution Count", sortable: true },
                { key: "runtimeMean", label: "Avg. Walltime (min)", sortable: true },
                { key: "successRate", label: "Success Rate(%)", sortable: true },
                { key: "users", label: "Users", sortable: true },
                { key: "resourcesCount", label: "Resources", sortable: true },
            ],

            projectRecords: [],
            projectFields: [
                //{ key: "_id", label: "ID", sortable: true },
                { key: "group_id", label: "GID", sortable: true },
                { key: "name", label: "Name", sortable: true },
                { key: "size", label: "size", sortable: true },
                { key: "admins", label: "Admins"},
                { key: "members", label: "Members"},
                { key: "create_date", label: "Create Date", sortable: true },
                { key: "update_date", label: "Update Date", sortable: true },
                { key: "publications", label: "Publications", sortable: true },
                { key: "subjects", label: "Subjects", sortable: true },
                { key: "objects", label: "Objects", sortable: true },
            ],
            minProjectSize: 500,

            prov: null,
            /*add new tab swithching code*/
            // tabIndices : ["Task", "Switch User", "Analytics", "Projects", "Users", "Groups"],
        }
    },

    mounted() {
    },

    watch: {
        tab(v) {
            if(v == 2) this.loadAnalytics();
            if(v == 3) this.loadProjects();
        },
        minProjectSize(v) {
            this.loadProjects();
        },
    },

    methods: {
        appSelected(items) {
            const id = items[0]._id;
            this.$router.push('/app/'+id);
        },
        projectSelected(items) {
            const id = items[0]._id;
            this.$router.push('/project/'+id);
        },

        loadAnalytics() {
            if(this.posCountData) return; //already loaded
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
                    select: 'name github stats removed doi deprecated_by projects',
                    limit: 2000,
                }
            }).then(res=>{
                this.appItems = [];
                res.data.apps.forEach(app=>{
                    if(!app.stats) return;
                    if(!app.stats.resources) app.stats.resources = [];
                    this.appItems.push({
                       _id: app._id,
                       name: app.name,
                       removed: app.removed,
                       deprecated: !!app.deprecated_by,
                       github: app.github,
                       private: !!app.projects.length,
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

        loadProjects() {
            console.log("loading project info", this.minProjectSize);
            this.$http.get('/project', {
                params: {
                    select: 'name admins members access stats.datasets.subject_count stats.datasets.count stats.datasets.size stats.publications create_date update_date group_id',
                    admin: true,
                    find: JSON.stringify({
                        removed: false,
                        "stats.datasets.size": {$gt: this.minProjectSize*1024*1024*1024},
                    }),
                    limit: 10000, // :(
                }
            }).then(res=>{
                this.projectRecords = [];
                res.data.projects.forEach(project=>{
                    this.projectRecords.push({
                        _id: project._id,
                        group_id: project.group_id,
                        name: project.name,
                        admins: project.admins,
                        members: project.members,
                        access: project.access,
                       //removed: app.removed,
                        create_date: new Date(project.create_date),
                        update_date: new Date(project.update_date),
                        publications: project.stats.publications,
                        subjects: project.stats.datasets.subject_count,
                        objects: project.stats.datasets.count,
                        size: project.stats.datasets.size,
                        /*
                       deprecated: !!app.deprecated_by,
                       github: app.github,
                       private: !!app.projects.length,
                       doi: app.doi,
                       requested: app.stats.requested,
                       runtimeMean: numeral(app.stats.runtime_mean/(1000*60)).format('0,0'),
                       successRate: numeral(app.stats.success_rate).format('00.0'),
                       users: app.stats.users,
                       resourcesCount: app.stats.resources.length,
                        */
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
                this.su_options = res.data.users;
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
                            "_id": {$in: depIds},
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

                //load task provenance
                this.$http.get('/app/taskprov/'+this.task_id).then(res=>{
                    this.prov = res.data;
                });
            }
        },
    },
}
</script>

<style scoped>
.page-content {
    top: 0px;
    background-color: #f9f9f9;
}
.header {
    padding-top: 5px;
    padding-bottom: 0px;
    margin-bottom: 20px;
    background-color: white;
    border-bottom: 1px solid #eee;
    position: sticky;
    top: 0;
    z-index: 4;
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
