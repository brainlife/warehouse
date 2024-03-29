<template>
<b-modal :no-close-on-backdrop="true" title="Analysis Archiver" ref="modal" size="lg">
    <div>
        <p>
            <small>
                Please select the analysis session and jupyter notebook that you'd like to archive and 
                make it part of this publication.
            </small>
        </p>
        <div v-if="!nbtask">
            <b-form-group horizontal label="Session">
                <b-form-select v-model="selected" :options="sessions" required></b-form-select>
                <small>Select the analysis session that you'd like to archive and publish as part of this release. Then entire directory under /notebook will be made public (please be sure to remove or move sensitive data outside of /notebook directory if you don't want it to be part of the publication.</small>
            </b-form-group>
            <b-form-group horizontal label="notebook name" v-if="selected">
                <b-input type="text" v-model="notebook" required/>
                <small>The notebook to showcase on the publication/release page</small>
            </b-form-group>
        </div>
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
        <b>debug</b>
        {{selected}}
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
            if(!this.$refs.modal) return console.error("this.$refs.modal not yet initialized");

            //initialize
            this.project = opt.project;
            this.release = opt.release;
            this.cb = opt.cb;

            this.selected = null;
            this.nbtask = null;
            this.sectask = null;
            this.dataset = null;
            this.archiveStatus = null;

            this.createOrFindGAInstance(this.project.group_id, (err, instance)=>{
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
                    console.log("loaded sessions");
                    this.sessions = res.data.tasks.map(task=>{
                        return {
                            value: task._id,
                            text: task.name+" - "+task.desc, //+" "+task.status_msg,
                            container: task.config.container,
                        }
                    });
                    //console.dir(this.sessions);

                    //select the last one
                    this.selected = this.sessions[0].value;
                });
            });
 
            this.$refs.modal.show();
        });
    },

    methods: {
        close() {
            //if(this.nbtask) this.cancelNBTask();
            if(this.ws) this.ws.close();
            this.$refs.modal.hide();
        },

        async archive() {
            this.$notify({text: "Creating Analysis Archive"});
            /*
            const params = {
                instance_id: this.instance._id,
                name: "Converting notebook to html",
                service: "brainlife/app-nbconvert",
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
                            datatype: "6079f960f1481a4d788fba3e", //jupyter/notebook
                            subdir: "notebook", 
                            meta: {
                                subject: "analysis", //TODO - does this work? (I think we should get object without session working somehow?)
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
            */
            try {
                const res = await this.$http.post('secondary/archive', {
                    instance_id: this.instance._id,
                    session: this.selected,
                    notebook: this.notebook,
                });
                this.nbtask = res.data;
            } catch (err) {
                console.error(err);
                this.$notify({type: 'error', text: err.response.data.message});
            }
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

                //console.dir(task);

                //nbconvert update?
                if(this.nbtask && task._id == this.nbtask._id) {
                    Object.assign(this.nbtask, task);

                    //when it finishes, then submit archive request
                    if(this.archiveStatus == null && this.nbtask.status == "finished") {
                        //console.log("making request to archive nbtask output");
                        this.archiveStatus = "requested";
                        this.$http.post('dataset', {
                            project: this.project._id,
                            task_id: this.nbtask._id,
                            output_id: "notebook",
                            desc: "analysis notebook (published)",
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
                    container: session.container, 
                });
                this.close();
            }
        },
    },
}
</script>

<style scoped>

</style>
