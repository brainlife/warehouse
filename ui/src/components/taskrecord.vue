<template>
<tbody>
    <tr v-for="task in tasks" :key="task._id" @click="click(task)" :class="{clickable: config.is_admin}">
        <td v-if="cols.includes('branch')">
            <b-badge>{{task.service_branch}}</b-badge>
        </td>
        <td v-if="cols.includes('project')">
            <span v-if="task._project">{{task._project.name}}</span>
            <span v-else style="opacity: 0.7;">
                <small><icon name="lock"/> {{task._group_id}}</small>
            </span>
        </td>
        <td v-if="cols.includes('status')">
            <span class="status-color" :class="task.status" style="padding: 3px;" :title="task.status">
                <statusicon :status="task.status" /> 
            </span>
            <!--
            <small style="font-size: 50%">{{task._id}}</small>
            -->
            <small style="word-break: break-word;">{{task.status_msg}}</small>
        </td>
        <td v-if="cols.includes('service')">
            {{task.service}} <b-badge>{{task.service_branch}}</b-badge><br>
            <!--<small style="font-size: 50%">{{task._id}}</small>-->
        </td>
        <td v-if="cols.includes('resource')">
            <span v-if="task._resource">{{task._resource.name}}</span>
            <span v-else style="opacity: 0.7;">(Private)</span>
        </td>
        <td v-if="cols.includes('submitter')">
            <contact :id="task.user_id" size="small"/>
        </td>
        <td v-if="cols.includes('request_date')">
            <small>
                <time>Requested <timeago :datetime="task.request_date" :auto-update="1"/></time>
            </small>
        </td>
        <td v-if="cols.includes('dates')">
            <small v-if="task.status == 'requested'">
                <time v-if="task.start_date">Started <timeago :datetime="task.start_date" :auto-update="1"/></time>
            </small>
            <small v-else-if="task.status == 'running'"><time>Started <timeago :datetime="task.start_date" :auto-update="1"/></time></small>
            <small v-else-if="task.status == 'running_sync'"><time>Started <timeago :datetime="task.start_date" :auto-update="1"/></time></small>
            <small v-else-if="task.status == 'finished'"><time>Finished <timeago :datetime="task.finish_date" :auto-update="1"/></time></small>
            <small v-else-if="task.status == 'failed'"><time>Failed <timeago :datetime="task.fail_date" :auto-update="1"/></time></small>
        </td>
    </tr>
</tbody>
</template>

<script>
import Vue from 'vue'
import statusicon from '@/components/statusicon'
import contact from '@/components/contact'
import task from '@/components/task'

export default {
    components: { 
        statusicon, 
        contact, 
        task,
    },
    props: {
        tasks: {
            type: Array,
        },

        //branch, status, project, resource, submitter, dates
        cols: {
            type: Array,
        },
    },

    data () {
        return {
            config: Vue.config,
        }
    },

    created: function() {
        //resolve project names
        let gids = [...new Set(this.tasks.map(task=>task._group_id))];
        let project_find = JSON.stringify({
            group_id: {$in: gids},
        });
        console.log("taskrecord loading project names", gids);
        this.$http.get("/project", {params: {find: project_find, select: 'name group_id'}}).then(res=>{
            let projects = {};
            res.data.projects.forEach(project=>{
                projects[project.group_id] = project;
            });
            this.tasks.forEach(task=>{
                task._project = projects[task._group_id];
            });
        });
    },

    methods: {
        click(task) {
            if(Vue.config.is_admin) {
                console.log("loading task detail", task._id);
                /*
                this.$http.get(Vue.config.wf_api+'/task/'+task._id)
                .then(res=>{
                    Vue.set(task, '_task', res.data);
                });
                */
                window.open("/novnc/#"+btoa(JSON.stringify({
                    task_id: task._id,
                    //type: null,
                    //datatype: this.opt.datatype.name,
                    //subdir: this.opt.subdir,
                    //files: this.opt.files,
                })), task._id, "width=1200,height=800")
            }
        },
    }
}
</script>

<style scoped>
tr.clickable:hover {
    background-color: #eee;
}
</style>
