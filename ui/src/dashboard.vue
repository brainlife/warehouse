<template>
<div>
    <div class="page-content">
        <div class="card">
            <div class="card-title">
                <h5>My Recent Tasks</h5>
                <small>Status of the recently submitted jobs that you have access to.</small>
            </div>
            <div class="card-body">
                <table class="table table-sm table-hover">
                    <thead style="opacity: 0.6; background-color: #f0f0f0;">
                        <tr>
                            <th style="padding-left: 10px;"><icon name="shield-alt"/> Project</th>
                            <th>Service/branch</th>
                            <th>Status</th>
                            <th>Submitter</th>
                            <th>Resource</th>
                            <th width="150px">Date</th>
                        </tr>
                    </thead>
                    <tbody v-if="!recent_tasks">
                        <span class="loading">Loading...</span>
                    </tbody>
                    <tbody v-if="recent_tasks">
                    <tr v-for="task in recent_tasks" :key="task._id" @click="opentask(task)">
                        <td style="padding-left: 10px;">
                            <span style="font-size: 80%" v-if="projects[task._group_id]">{{projects[task._group_id].name}}</span>
                            <span v-else>(unknown project)</span>
                            <small>{{task._group_id}}</small>
                        </td>
                        <td>
                            {{task.service}}
                            <b-badge variant="light">{{task.service_branch}}</b-badge>
                        </td>
                        <td>
                            <span class="status-color" :class="task.status" style="padding: 3px" :title="task.status">
                                <statusicon :status="task.status" />
                            </span>
                            <small style="word-break: break-all;">{{task.status_msg}}</small>
                            <small style="font-size: 70%">{{task._id}}</small>
                        </td>
                        <td>
                            <contact :id="task.user_id" size="tiny"/>
                        </td>
                        <td>
                            <span v-if="task._resource">{{task._resource.name}}</span>
                        </td>
                        <td>
                            <small v-if="task.status == 'requested'"><time>Requested <timeago :datetime="task.request_date" :auto-update="1"/></time></small>
                            <small v-else-if="task.status == 'running'"><time>Started <timeago :datetime="task.start_date" :auto-update="1"/></time></small>
                            <small v-else-if="task.status == 'finished'"><time>Finished <timeago :datetime="task.finish_date" :auto-update="1"/></time></small>
                            <small v-else-if="task.status == 'failed'"><time>Failed <timeago :datetime="task.fail_date" :auto-update="1"/></time></small>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import pageheader from '@/components/pageheader'
import statusicon from '@/components/statusicon'
import contact from '@/components/contact'

import authprofilecache from '@/mixins/authprofilecache'
import resource_cache from '@/mixins/resource_cache'

const lib = require('@/lib')

export default {
    mixins: [authprofilecache, resource_cache],
    components: { 
        pageheader, 
        statusicon,
        contact,
    },

    data () {
        return {
            recent_users: null,
            recent_tasks: null,
    
            projects: {},
            reloader: null,

            config: Vue.config,
        }
    },

    destroyed() {
        clearInterval(this.reloader); 
    },

    mounted() {
        setInterval(this.reload, 1000 * 30);
        this.reload();
    },

    methods: {
        avatar_url: lib.avatar_url,

        opentask(task) {
            let project = this.projects[task._group_id];
            this.$router.push("/project/"+project._id+"/process/"+task.instance_id+"#"+task._id)
        },

        reload() {
            let find = JSON.stringify({
                status: {$nin: ["removed", "stopped"]}, 
                service: {$nin: ["brainlife/app-stage"]},
                "config._tid": {$exists: true},
            });
            let select = "user_id status status_msg _group_id service service_branch instance_id start_date finish_date fail_date update_date request_date remove_date config._tid resource_id";
            this.$http.get(Vue.config.amaretti_api+"/task", {params: {find, select, limit: 25, sort: '-create_date'}}).then(res=>{
                let recent_tasks = res.data.tasks;

                //resolve project name/id for _group_id
                let gids = recent_tasks.map(task=>task._group_id);
                let project_find = JSON.stringify({
                    group_id: {$in: gids},
                });
                this.$http.get("/project", {params: {find: project_find, select: 'name group_id'}}).then(res=>{
                    this.projects = {};
                    res.data.projects.forEach(project=>{
                        this.projects[project.group_id] = project;
                    });
                    this.recent_tasks = recent_tasks;
                });

                //lookup resource name
                recent_tasks.forEach(task=>{
                    task._resource = {name: "N/A"};
                    if(task.resource_id) this.resource_cache(task.resource_id, (err, resource)=>{
                        task._resource = resource;
                    });
                });    
            });
        },
    },
}
</script>

<style scoped>
.page-content {
padding: 10px;
top: 0px;
}
.email {
opacity: 0.8;
}
.recent_user {
border-top: 1px solid #eee; 
margin: 3px; 
padding: 3px;
margin-bottom: 10px;
}
.card {
border: none;
margin: 10px;
border-radius: 5px;
box-shadow: 1px 1px 2px #0002;
}
small {
    opacity: 0.5;
}
.card-title {
    padding: 15px;
    border-bottom: 1px solid #eee;
    margin-bottom: 0;
}
.card-title h5 {
    font-size: 12pt;
    opacity: 0.5;
    text-transform: uppercase;
}
.card-body {
    padding: 0;
}
.loading {
display: inline-block;
margin: 20px;
opacity: 0.5;
font-size: 150%;
}
</style>
