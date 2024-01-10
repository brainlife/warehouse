<template>
<b-modal :no-close-on-backdrop="true" title="Import ezBIDS Dataset" ref="modal" size="lg" @ok="submit">
    <div v-if="!task">
        <b-row>
            <b-col class="text-muted" cols="3">ezBIDS Session ID</b-col>
            <b-col>
                <b-form-input v-model="sessionId" readonly></b-form-input>
                <br>
            </b-col>
        </b-row>

        <b-row>
            <b-col class="text-muted" cols="3">Project</b-col>
            <b-col>
                <b-form-radio-group v-model="createnew" style="margin-bottom: 5px;">
                    <b-form-radio :value="true">Create a new Project</b-form-radio>
                    <b-form-radio :value="false">Import to an existing Project</b-form-radio>
                </b-form-radio-group>
                <div v-if="createnew">
                    <span class="form-header">Project Name</span>
                    <b-form-input type="text" v-model="project_name" placeholder="Enter Name for the new project" required/>
                    <br>
                    <span class="form-header">Project Desc</span>
                    <b-form-textarea rows="3" v-model="project_desc" placeholder="Enter Description for the new project" required/>
                </div>
                <div v-if="!createnew">
                    <projectselector canwrite="true" v-model="project" :required="true"/> 
                    <small class="text-muted">Select a project where you want to import this dataset to</small>
                </div>
                <br>
            </b-col>
        </b-row>

        <b-row>
            <b-col class="text-muted" cols="3">Dataset Description</b-col>
            <b-col>
                <div v-if="ezBIDS" style="max-height: 250px; overflow-y: auto; font-size:80%"><pre>{{ezBIDS.datasetDescription}}</pre></div>
                <small v-else><icon name="cog" scale="1.25" spin/>  Loading ezBIDS info ...</small>
                <br>
            </b-col>
        </b-row>

    </div>
    <div v-if="task">
        <task :task="task"/>
    </div>

    <div slot="modal-footer">
        <b-form-group v-if="!task">
            <b-button @click="close">Cancel</b-button>
            <b-button variant="primary" :disabled="!ezBIDS" @click="submit()">Submit</b-button>
        </b-form-group>
        <b-form-group v-if="task">
            <b-button @click="task = null" variant="warning">Re-submit</b-button>
            <b-button @click="cancelImport" v-if="task.status == 'running' || task.status == 'requested'">Cancel</b-button>
            <b-button @click="openProject" v-if="task.status == 'finished'" variant="primary">Open Project</b-button>
        </b-form-group>
    </div>
</b-modal>
</template>

<script>

import Vue from 'vue'

import projectselector from '@/components/projectselector'
import ReconnectingWebSocket from 'reconnectingwebsocket'
import task from '@/components/task'

export default {
    components: { 
        projectselector, task,
    },
    data() {
        return {
            project: null, //will be set if user wants to import to an existing project
            sessionId: null, //ezBIDS session ID
            pipelineName: null, // optional pipeline to initialize after project creation
            ezBIDS: null, //ezBIDS finalized object

            //for creating new project (most of it should be loaded from ezBIDS.json)
            createnew: true,
            project_name: "",
            project_desc: "",

            ezbids_session_id: null,
            
            //used to keep up with bids import instance/tasks
            task: null,
            ws: null, //websocket to receive all event for this instance

            config: Vue.config,
        }
    },

    mounted() {
        //this.$root.$on("ezbidsimporter.open", this.open);

        if(this.$root.ezbidsSession) {
            this.open(this.$root.ezbidsSession);
            this.$root.ezbidsSession = null;
        }
    },

    methods: {
        open(opt) {
            if(!this.$refs.modal) return console.log("received ezbidsimporter.open but this.$refs.modal not yet initialized");

            //initialize
            this.sessionId = opt.sessionId;
            this.pipelineName = opt.pipelineName;
            this.task = null;
            
            //load finalized ezbids content
            this.$http.get(Vue.config.ezbids_api+"/download/"+this.sessionId+"/token").then((res) => {
                return res.data;
            }).then((token) => {
                return this.$http.get(Vue.config.ezbids_api+"/download/"+this.sessionId+"/finalized.json?token="+token);
            }).then((res) => {
                this.ezBIDS = res.data;
                this.project_name = this.ezBIDS.datasetDescription.Name;
                this.project_desc = this.ezBIDS.readme;
            }).catch((err) => {
                console.error(err);
                this.$notify({type: 'error', text: "Failed to load the specified ezBIDS session. Please contact brainlife.io team"});
                this.close();
            });

            //load existing task if it's already imported
            this.$http.get(Vue.config.amaretti_api+'/task', {
                params: {
                    find: JSON.stringify({
                        name: "bids-import."+this.sessionId,
                        service: "brainlife/app-bids-import",
                    })
                },
            }).then((res) => {
                if(res.data.tasks.length != 0) {
                    this.task = res.data.tasks[res.data.tasks.length-1];
                    this.subscribeTask(this.task);
                }
            }).catch((err) => {
                console.error(err);
                this.$notify({type: 'error', text: err.body.message});
            });

            this.$refs.modal.show();
        },

        close() {
            if(this.ws) this.ws.close();
            this.$refs.modal.hide();
        },

        openProject() {
            this.$router.push("/project/"+this.task.config.project);
            this.close();
        },

        submit() {
            if(!this.createnew) return this.submit_import();

            this.$notify({text: "Creating project"});
            this.$http.post('project', {
                name: this.project_name, 
                desc: this.project_desc,
            }).then((res) => {
                this.project = res.data._id;
                if (this.pipelineName) {
                    console.log('EMIT', this.project, this.pipelineName)
                    this.$root.$emit("create_pipeline", { projectId: this.project, pipelineName: this.pipelineName })
                }
                this.$root.$emit("refresh_jwt", this.submit_import);
            }).catch((err) => {
                console.error(err);
                this.$notify({type: "error", text: err.response.data.message});
            });
        },

        submit_import() {
            this.findOrCreateInstance((err, instance)=>{
                if(err) throw err;

                //submit import request -- let bl bids upload command take care of most of things.. importing participantsColumn, etc.
                const params = {
                    instance_id: instance._id,
                    name: "bids-import."+this.sessionId,
                    service: "brainlife/app-bids-import",
                    config: {
                        project: this.project, //just id
                        sessionid: this.sessionId,
                        jwt: Vue.config.jwt,
                    }
                }
                this.$http.post(Vue.config.amaretti_api+'/task', params).then((res) => {
                    this.task = res.data.task;
                    this.subscribeTask(this.task);
                }).catch((err) => {
                    console.error(err);
                    this.$notify({type: 'error', text: err.body.message});
                });

            });
        },

        findOrCreateInstance(cb) {
            let name = "ezbids."+this.project.group_id;
            this.$http.get(Vue.config.amaretti_api+'/instance?find='+JSON.stringify({ name })).then(res=>{
                if(res.data.instances.length > 0) { 
                    const instance = res.data.instances[0];
                    return cb(null, instance);
                }

                this.$http.post(Vue.config.amaretti_api+'/instance', {
                    name,
                    group_id: this.project.group_id,
                }).then((res) => {
                    const instance = res.data;
                    return cb(null, instance);
                }).catch((err) => {
                    console.error(err);
                });
            });
        },

        subscribeTask(task) {
            //lastly, subscribe to the whole instance task events
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                this.ws.send(JSON.stringify({
                  bind: {
                    ex: "wf.task",
                    key: task.instance_id+"."+task._id,
                  }
                }));
            }
            this.ws.onmessage = (json)=>{
                var event = JSON.parse(json.data);
                if(event.error) return;
                var task = event.msg;
                if(!task) return;
                for(let k in task) Vue.set(this.task, k, task[k]);
                if(task.status == "finished") {
                    console.log("finished!");
                }
            }
        },

        cancelImport() {
            this.$http.put(Vue.config.amaretti_api+'/task/stop/'+this.task._id)
            .then((res) => {
                this.$notify({ text: res.data.message, type: 'success'});
                this.close();
            })
            .catch((err) => {
                console.error(err); 
            });
        },

    },
}
</script>

<style scoped>

</style>
