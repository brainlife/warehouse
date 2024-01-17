<template>
<b-modal :no-close-on-backdrop='true' title="Copy Data-objects" ref="modal" size="lg" @ok="submit">
    <p class="text-muted">Please select a project where you want to copy selected data-objects to</p>
    <br>
    <b-row>
        <b-col :cols="3">Project</b-col>
        <b-col>
            <projectselector v-if="shown" canwrite="true" v-model="project" :required="true"/>
            <!--<small>Project to run a new process</small>-->
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
            //instance: null, 
            //desc: "",

            //options
            projects: {},
            //instances: [],

            //createnew: true, //for toggle button
        }
    },

    destroyed() {
        this.$root.$off("copytarget.open");
    },

    watch: {
        project: function() {
            /*
            //refresh instance list
            this.instances = [];
            if(!this.project) return;
            if(!this.projects) return;
            var project = this.projects[this.project];
            if(!project) {
                console.error("can't find", this.project, "in project list", this.projects);
                return;
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
            });
            */
        },
    },

    mounted() {
        this.$root.$on("copytarget.open", cb=>{
            this.submit_cb = cb;
            this.$refs.modal.show()
            this.shown = true;
            //this.instance = null;
            //this.desc = "";
        });

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
                //group_id: this.projects[this.project].group_id,
                //instance: (this.createnew?null:this.instance),
                //desc: this.desc.trim(),
            });
            this.$refs.modal.hide()
            this.shown = false;
        },
        cancel: function() {
            this.$refs.modal.hide();
            this.shown = false;
        },
    },
} 
</script>
