<template>
<b-modal :no-close-on-backdrop='true' title="Stage Data-Objects" ref="modal" size="lg" @ok="submit">
    <p class="text-muted">Please select project / process where you want to stage selected data-objects to</p>
    <br>
    <b-row>
        <b-col :cols="3">Project</b-col>
        <b-col>
            <projectselector v-if="shown" canwrite="true" v-model="project" :required="true"/>
            <small>Project to run a new process</small>
        </b-col>
    </b-row>
    <br>
    <b-row>
        <b-col :cols="3">Process</b-col>
        <b-col>
            <b-form-radio-group v-model="createnew" style="margin-bottom: 5px;">
                <b-form-radio :value="true">Create New Process</b-form-radio>
                <b-form-radio :value="false" v-if="instances.length > 0">Use Existing Process</b-form-radio>
            </b-form-radio-group>
            <b-form-input v-if="createnew" type="text" v-model="desc" placeholder="Enter Description for New Process"/>
            <v-select v-if="!createnew" v-model="instance" :options="instances" label="_label" required placeholder="(Choose Process)"/>
        </b-col>
    </b-row>
    <br>
    <div slot="modal-footer">
        <b-button variant="primary" v-if="isvalid()" @click="submit">Submit</b-button>
    </div>
</b-modal>
</template>

<script>
import Vue from 'vue'

import projectselector from '@/components/projectselector'

export default {
    components: { projectselector },

    data() {
        return {
            submit_cb: null, 
            shown: false,
            project: null, 
            instance: null, 
            desc: "",
            projects: {},
            instances: [],

            createnew: true, //for toggle button
        }
    },

    destroyed() {
        this.$root.$off("instanceselecter.open");
    },

    watch: {
        project: function() {
            this.load_instances();
        },
    },

    mounted() {
        this.$root.$on("instanceselecter.open", async cb=>{
            this.submit_cb = cb;
            this.$refs.modal.show()
            this.shown = true;
            this.instance = null;
            this.desc = "";

            await this.load_projects();
            await this.load_instances();
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
                instance: (this.createnew?null:this.instance),
                desc: this.desc.trim(),
            });
            this.$refs.modal.hide()
            this.shown = false;
        },
        cancel: function() {
            this.$refs.modal.hide();
            this.shown = false;
        },

        load_projects: function() {
            return new Promise((resolve, reject)=>{
                this.$http.get('project', {params: {
                    find: JSON.stringify({ 
                        $or: [
                          {members: Vue.config.user.sub},
                          {admins: Vue.config.user.sub},
                        ],
                        removed: false,
                    }),
                    limit: 500,
                    select: 'group_id',
                }})
                .then(res=>{
                    this.projects = {};
                    res.data.projects.forEach((p)=>{
                        this.projects[p._id] = p;
                    });
                    resolve();
                }).catch(reject);
            });
        }, 
        
        load_instances: function() { 
            return new Promise((resolve, reject)=>{
                this.instances = [];
                if(!this.project) return reject();
                if(!this.projects) return reject();
                var project = this.projects[this.project];
                if(!project) {
                    console.error("can't find", this.project, "in project list", this.projects);
                    return reject();
                }
                this.$http.get(Vue.config.amaretti_api+'/instance', {params: {
                    find: JSON.stringify({
                        "config.brainlife": true,
                        status: {$ne: "removed"},
                        group_id: project.group_id,
                        "config.removing": {$exists: false},
                    }),
                    limit: 1000,
                    sort: '-create_date',
                }}).then(res=>{
                    res.data.instances.forEach(instance=>{
                        instance._label = instance.desc||'('+instance._id+')';
                        this.instances.push(instance);
                    });
                    this.instance = this.instances[0];//might be empty
                    resolve();
                }).catch(reject);
            });
        },
    },
} 
</script>
