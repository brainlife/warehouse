<template>
<b-modal :no-close-on-backdrop="true" title="Group Analysis Archiver" ref="modal" size="lg">
    <div>
        <p>
            <small>
                Please select the group analysis session and jupyter notebook that you'd like to archive and 
                make it part of this publication.
            </small>
        </p>
        <div v-if="!nbtask">
            <b-form-group horizontal label="Session">
                <!--
                <small>Select a group Analysis session to archive for your publication</small>
                -->
                <b-form-select v-model="selected" :options="sessions" required></b-form-select>
                <small>Select the group analysis session that you'd like to archive and publish as part of this release. Then entire directory under /notebook will be made public (please be sure to remove or move sensitive data outside of /notebook directory if you don't want it to be part of the publication.</small>
            </b-form-group>
            <b-form-group horizontal label="notebook name" v-if="selected">
                <b-input type="text" v-model="notebook" required/>
                <small>The notebook to showcase on the publication/release page</small>
            </b-form-group>
        </div>
        
        <!--
        <div v-for="task in sessions" :key="task._id" class="session">
            <b-row>
                <b-col cols="4">
                    <small>{{task.name}}</small>
                    {{task.desc}}
                </b-col>
                <b-col cols="3">
                    <pre>{{task.status_msg}}</pre>
                </b-col>
                <b-col cols="2">
                    Created on <b>{{new Date(task.create_date).toLocaleDateString()}}</b>
                </b-col>
            </b-row>
            <pre>{{task}}</pre>
        </div>
        -->
        <!--
        <b-row>
           <b-col class="text-muted" cols="3">ezBIDS Session ID</b-col>
            <b-col>
                <b-form-input v-model="sessionId" readonly></b-form-input>
                <br>
            </b-col>
        </b-row>
        -->

        <!--
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
                    <projectselecter canwrite="true" v-model="project" :required="true"/> 
                    <small class="text-muted">Select a project where you want to import this dataset to</small>
                </div>
                <br>
            </b-col>
        </b-row>

        <b-row>
            <b-col class="text-muted" cols="3">Dataset Description</b-col>
            <b-col>
                <div v-if="ezBIDS" style="max-height: 250px; font-size:80%"><pre>{{ezBIDS.datasetDescription}}</pre></div>
                <small v-else><icon name="cog" scale="1.25" spin/>  Loading ezBIDS info ...</small>
                <br>
            </b-col>
        </b-row>
        -->

    </div>

    <div v-if="nbtask">
        <task :task="nbtask"/>
        <br>
    </div>
    <div v-if="sectask">
        <task :task="sectask"/>
        <br>
    </div>

    <div v-if="config.debug">
        archiveStatus: {{archiveStatus}}

        dataset:
        <pre>
            {{dataset}}
        </pre>
    </div>

    <div slot="modal-footer">
        <b-form-group>
            <b-button @click="close">Cancel</b-button>
            <b-button variant="primary" @click="archive" v-if="!nbtask">Archive</b-button>
            <!--
            <b-button variant="primary" @click="done" v-if="sectask && sectask.status == 'finished'">Done!</b-button>
            -->
        </b-form-group>
    </div>
</b-modal>
</template>

<script>

import Vue from 'vue'
import ReconnectingWebSocket from 'reconnectingwebsocket'
import task from '@/components/task'

import gainstance from '@/mixins/gainstance'

export default {
    mixins: [
        gainstance,
    ],
    components: { 
        task,
    },
    data() {
        return {
            project: null, 
            release: null,
            cb: null, //callback function to call after it's done

            instance: null,

            sessions: [], //list of session (ga tasks) that user can select
            selected: null, //task id of selected session
            notebook: "main.ipynb", //name of the notebook to archive

            nbtask: null, //nbconvert task submitted to convert the notebook
            sectask: null, //secondary archive task for nbconvert

            archiveStatus: null,
            dataset: null, //archived object from nbtask / notebook

            ws: null, //websocket to receive all event for this instance

            config: Vue.config,
        }
    },

    mounted() {
        this.$root.$on("gaarchiver.open", opt=>{
            if(!this.$refs.modal) return console.log("this.$refs.modal not yet initialized");

            //initialize
            this.project = opt.project;
            this.release = opt.release;
            this.cb = opt.cb;

            this.selected = null;
            this.nbtask = null;
            this.sectask = null;
            this.dataset = null;
            this.archiveStatus = null;

            this.createOrFindGAInstance(this.project, (err, instance)=>{
                this.instance = instance;
                this.subscribeInstance(instance);

                //load existings sessions
                this.$http.get(Vue.config.amaretti_api+'/task', {
                    params: {
                        find: JSON.stringify({
                            status: {$ne: "removed"},
                            instance_id: instance._id,
                            "config.container": {$exists: true}, //we only want to pull ga container
                        }),
                        sort: "-create_date",
                    }
                }).then(res=>{
                    this.sessions = res.data.tasks.map(task=>{
                        return {
                            value: task._id,
                            text: task.name+" "+task.desc+" "+task.status_msg,
                        }
                    });

                    //select the last one
                    this.selected = this.sessions[0].value;
                });
            });
 
            /*
            //load existing task if it's already imported
            this.$http.get(Vue.config.amaretti_api+'/task', {
                params: {
                    find: JSON.stringify({
                        name: "bids-import."+this.sessionId,
                        service: "brainlife/app-bids-import",
                    })
                },
            }).then(res=>{
                if(res.data.tasks.length != 0) {
                    console.log("importer already submitted!");
                    this.task = res.data.tasks[res.data.tasks.length-1];
                    this.subscribeTask(this.task);
                }
            }).catch(err=>{
                console.error(err);
                this.$notify({type: 'error', text: err.body.message});
            });
            */

            //find group analysis sessions
            //TODO..

            this.$refs.modal.show();
        });
    },

    methods: {
        close() {
            //if(this.nbtask) this.cancelNBTask();
            if(this.ws) this.ws.close();
            this.$refs.modal.hide();
        },

        archive() {
            this.$notify({text: "Creating Group Analysis Archive"});
            const params = {
                instance_id: this.instance._id,
                name: "Converting notebook to html",
                service: "brainlife/app-nbconvert",
                //deps_config: //we can't set deps_config as this.selected might be still running 
                config: {
                    _public: true,

                    //notebook to convert to html/index.html
                    notebook: "../"+this.selected+"/notebook/"+this.notebook,

                    _outputs: [
                        {
                            id: "html", //needed by archive-secondary
                            datatype: "5e56dc330f7fa604cc3cc291", //report/html
                        },
                        {
                            id: "notebook",
                            //datatype: "59c3eae633fc1cf9ead71679", //raw
                            datatype: "6079f960f1481a4d788fba3e", //jupyter/notebook
                            subdir: "notebook", 
                            meta: {
                                subject: "groupanalysis", //TODO - does this work?
                            },
                            archive: {
                                project: this.project._id,
                                desc: "for notebook publication: "+this.notebook,
                            },
                        },
                    ],
                }
            }
            this.$http.post(Vue.config.amaretti_api+'/task', params).then(res=>{
                this.nbtask = res.data.task;
            }).catch(err=>{
                console.error(err);
                this.$notify({type: 'error', text: err.body.message});
            });

        },

        subscribeInstance(instance) {
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            this.ws = new ReconnectingWebSocket(url, null, {debug: Vue.config.debug, reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                this.ws.send(JSON.stringify({
                  bind: {
                    ex: "wf.task",
                    key: instance._id+".*",
                  }
                }));
            }
            this.ws.onmessage = json=>{
                var event = JSON.parse(json.data);
                if(event.error) return;
                var task = event.msg;
                if(!task) return;

                //nbconvert update?
                if(this.nbtask && task._id == this.nbtask._id) {
                    Object.assign(this.nbtask, task);

                    //when it finishes, then submit archive request
                    if(this.archiveStatus == null && this.nbtask.status == "finished") {
                        console.log("making request to archive nbtask output");
                        this.archiveStatus = "requested";
                        this.$http.post('dataset', {
                            project: this.project._id,
                            task_id: this.nbtask._id,
                            output_id: "notebook",
                            desc: "group analysis notebook (published)",
                        }).then(res=>{
                            this.dataset = res.data;
                            this.checkState();
                        }).catch(err=>{
                            console.error(err);
                            this.$notify({type: 'error', text: err.body.message});
                        });
                    }
                }

                //secondary archive update?
                if(task.service == "brainlife/app-archive-secondary" 
                    && task.deps_config[0].task == this.nbtask._id) {
                    this.sectask = task; 
                }
                this.checkState();

                /*
                if(this.sectask && this.sectask.status == "finished" &&
                    this.atask && this.atask.status == "finished") {
                    const session = this.sessions.find(s=>s.value == this.selected);
                    this.cb(null, {
                        sectask_id: this.sectask._id,
                        atask_id: this.sectask._id,
                        name: session.text,
                        notebook : this.notebook,
                    });
                    this.close();
                }
                */
            }
        },

        checkState() {
            if(this.sectask && this.sectask.status == "finished" && this.dataset) {
                const session = this.sessions.find(s=>s.value == this.selected);
                this.cb(null, {
                    dataset_id: this.dataset._id,
                    sectask_id: this.sectask._id,
                    name: session.text,
                    notebook : this.notebook,
                });
                this.close();
            }
        },

        /*
        //not really necessary?
        cancelNBTask() {
            this.$http.put(Vue.config.wf_api+'/task/stop/'+this.nbtask._id)
            .then(res=>{
                this.$notify({ text: res.data.message, type: 'success'});
                this.close();
            })
            .catch(err=>{
                console.error(err); 
            });
        },
        */

    },
}
</script>

<style scoped>

</style>
