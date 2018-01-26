<template>
<b-modal title="Select Project / Process" ref="modal" size="lg" @ok="submit">
    <p class="text-muted">Please select project/process wheree you want to stage your datasets</p>
    <br>
    <b-row>
        <b-col :cols="3">Project</b-col>
        <b-col>
            <projectselecter canwrite="true" v-model="project"/>
            <small>Project to run a new process</small>
        </b-col>
    </b-row>
    <br>
    <b-row>
        <b-col :cols="3">Process</b-col>
        <b-col>
            <v-select v-model="instance" :options="instances" label="_label" placeholder="(Create New Process)"></v-select>
        </b-col>
    </b-row>
    <br>
    <b-row v-if="!instance">
        <b-col :cols="3"></b-col>
        <b-col>
            <b-form-textarea v-model="desc" :rows="3" placeholder="Process Description"/>
        </b-col>
    </b-row>
    <br>
    <div slot="modal-footer">
        <b-button variant="primary" v-if="isvalid()" @click="submit">Submit</b-button>
        <b-button @click="cancel">Cancel</b-button>
    </div>
</b-modal>
</template>

<script>
import Vue from 'vue'

import vSelect from 'vue-select'

import projectselecter from '@/components/projectselecter'

export default {
    components: { projectselecter, vSelect },

    data() {
        return {
            submit_cb: null, 

            project: null, 
            instance: null, 
            desc: null,

            projects: {},

            instances: [],
        }
    },

    destroyed() {
        this.$root.$off("instanceselecter.open");
    },

    watch: {
        project: function() {
            //refresh instance list
            this.instances = [];
            if(!this.project) return;
            if(!this.projects) return;
            var project = this.projects[this.project];
            this.$http.get(Vue.config.wf_api+'/instance', {params: {
                find: JSON.stringify({
                    "config.brainlife": true,
                    status: {$ne: "removed"},
                    group_id: project.group_id,
                    "config.removing": {$exists: false},
                }),
                limit: 1000,
                sort: '-create_date',
            }}).then(res=>{
                res.body.instances.forEach(instance=>{
                    instance._label = instance.desc||'('+instance._id+')';
                    this.instances.push(instance);
                });
            });
        },
    },

    mounted() {
        console.log("listening to newtask.open");
        this.$root.$on("instanceselecter.open", cb=>{
            this.submit_cb = cb;
            this.$refs.modal.show()

            this.instance = null;
            this.desc = null;
        });

        console.log("loading projects that user can write to");
        this.$http.get('project', {params: {
            find: JSON.stringify({ 
                members: Vue.config.user.sub,
                removed: false,
            }),
            select: 'group_id',
        }})
        .then(res=>{
            this.projects = {};
            res.body.projects.forEach((p)=>{
                this.projects[p._id] = p;
            });
            //console.dir(this.projects);
        });
    },

    methods: {
        isvalid: function() {
            if(!this.project) return false;
            return true;
        },

        submit: function() {
            this.submit_cb({
                project_id: this.project,
                group_id: this.projects[this.project].group_id,
                instance: this.instance,
                desc: this.desc,
            });
            this.$refs.modal.hide()
        },
        cancel: function() {
            this.$refs.modal.hide();
        },
    },
} 
</script>
<style scoped>
</style>
