<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/datasets"></sidemenu>
    <div class="page-content">
    <div class="margin20">

        <div v-if="page == 'select_app' && apps">
            <h2 class="text-muted">Please select application you'd like to submit with selected datasets</h2>
            <br>
            <div v-for="app in apps" :key="app._id" @click="selectapp(app)" class="clickable">
                <app :app="app" :compact="true" :clickable="false"/>
            </div>
        </div>
        <div v-if="page == 'config'">
            <h2 class="text-muted">Submit {{app.name}}</h2>
            <h3>Please select / configure tasks to submit.</h3>
            <el-form label-width="150px">
                <el-card v-for="(task, idx) in tasks" :class="{disabled: !task.enable}" :key="idx">
                    <p>
                        <el-checkbox v-model="task.enable" @change="revalidate()">Submit</el-checkbox>
                    </p>

                    <!--input-->
                    <el-form-item v-for="input in task.inputs" :label="input.id" :key="input.id" ref="form">
                        <el-select @change="revalidate()" v-model="input.dataset" placeholder="Please select input dataset" style="width: 100%;">
                            <el-option v-for="dataset in datasets[input.id]" :key="dataset._id" 
                                :value="dataset._id" :label="dataset.meta.subject+' '+dataset.name">
                                {{dataset.meta.subject}} | {{dataset.name}} | {{dataset.create_date|date}}
                            </el-option>
                        </el-select>
                        <el-alert v-if="input.error" :title="input.error" type="error"/>
                    </el-form-item>

                    <!--config-->
                    <el-form-item v-for="(v,k) in task.config" :label="k" :key="k">
                        <el-input v-model="task.config[k]"></el-input>
                    </el-form-item>

                    <!--<pre>{{task}}</pre>-->
                </el-card>
                <el-card class="submit">
                    <el-form-item label="Description">
                        <el-input type="textarea" v-model="desc"></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button @click="page = 'select_app'">Back</el-button>
                        <el-button type="primary" @click="submit()"><icon name="play"/> Submit</el-button>
                    </el-form-item>
                </el-card>
            </el-form> 
        </div>

        <br>
        <el-card v-if="config.debug">
            <div slot="header">Debug</div>
            <div v-if="tasks">
                <h3>tasks</h3>
                <pre v-highlightjs="JSON.stringify(tasks, null, 4)"><code class="json hljs"></code></pre>
            </div>
        </el-card>
    </div><!--margin20-->
    </div><!--page-content-->
</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import appavatar from '@/components/appavatar'
import app from '@/components/app'

const async = require('async');
const lib = require('./lib');

function generate_default(app) {
    var config = {};
    for(var k in app.config) {
        var v = app.config[k];
        if(v.type && v.default) config[k] = v.default;
    }
    return config;
}

export default {
    components: { sidemenu, pageheader, appavatar, app },

    data () {
        return {
            page: "select_app",
            desc: "", //instance desc
            apps: null, //application user can run with selected data

            tasks: [], //tasks to configure / submit

            selected: JSON.parse(localStorage.getItem('datasets.selected')) || {},

            datasets: {}, //possible datasets that user can choose from for each input type

            validated: false,
            config: Vue.config,
        }
    },

    computed: {
    },

    mounted: function() {
        var datatype_ids = [];
        for(var did in this.selected) {
            var select = this.selected[did];
            datatype_ids.push(select.datatype);
        }
        
        this.$http.get('app', {params: {
            find: JSON.stringify({
                "inputs.datatype": {$in: datatype_ids},
                removed: false,
            }),
            populate: 'inputs.datatype',// outputs.datatype',
        }})
        .then(res=>{
            //filter apps for each dataset selected.. to create list of apps that user can really submit
            this.apps = [];
            for(var did in this.selected) {
                var apps = lib.filter_apps(this.selected[did], res.body.apps); 
                apps.forEach(app=>{
                    if(!~this.apps.indexOf(app)) this.apps.push(app);
                });
            }
        }).catch(err=>{
            console.error(err);
        });
    },

    methods: {
        go: function(path) {
            this.$router.push(path);
        },

        //select dataset with specified subject
        select: function(input, subject) {
            var datasets = this.datasets[input.id].filter(dataset=>dataset.meta.subject == subject);

            //TODO if there are more than 1 dataset, select the best one
            if(datasets.length > 0) input.dataset = datasets[0]._id;
        },

        selectapp: function(app) {
            this.app = app;
            this.page = "config";

            //load datasets with applicable datatypes (will filter later)
            var datatype_ids = this.app.inputs.map(input=>input.datatype._id);
            this.$http.get('dataset', {params: {
                find: JSON.stringify({
                    datatype: {$in: datatype_ids},
                    removed: false,
                })
            }}).then(res=>{
                this.app.inputs.forEach(input=>{
                    Vue.set(this.datasets, input.id, lib.filter_datasets(res.body.datasets, input));
                });

                //for each dataset selected.. create task entry
                this.tasks = [];
                for(var did in this.selected) {
                    var selected_dataset = this.selected[did];

                    var task = {
                        enable: false,
                        name: 'task submission for dataset:'+did,
                        config: generate_default(this.app),
                        inputs: {},
                    };

                    //set inputs
                    var subject = null;
                    this.app.inputs.forEach((input)=>{
                        task.inputs[input.id] = Object.assign({}, input);

                        //preselect datasets selected by user
                        task.inputs[input.id].dataset = null;
                        if(this.datasets[input.id]) this.datasets[input.id].forEach(dataset=>{
                            if(dataset._id == did) {
                                task.inputs[input.id].dataset = did;
                                task.enable = true;

                                subject = dataset.meta.subject;
                            }
                        }); 
                    });

                    //preselect other input using with the same subject
                    for(var iid in task.inputs) {
                        if(task.inputs[iid].dataset) continue;
                        this.select(task.inputs[iid], subject); 
                    } 

                    if(task.enable) this.tasks.push(task); 
                }
            });
        },

        revalidate: function() {
            if(this.validated) this.validate();
        },

        validate: function() {
            var valid = true;
            this.tasks.forEach(task=>{
                //make sure all inputs are selected
                for(var iid in task.inputs) {
                    var input = task.inputs[iid];
                    Vue.set(input, 'error', null);
                    if(task.enable && !input.dataset) {
                        valid = false;
                        input.error = "Please select input";
                    }
                }
            }); 
            this.validated = true;
            return valid;
        },

        submit: function() {
            if(!this.validate()) {
                this.$notify.error({ title: 'Error', message: 'Validation failed' });
            } else {
                this.submit_instance().then(instance=>{
                    console.log("submitted instance", instance);
                    this.submit_download_tasks(instance, err=>{
                        if(err) console.error("failed to submit download tasks");
                        else this.submit_apps(instance, err=>{
                            if(err) console.error("failed to submit app tasks");
                            this.submit_orgout(instance, err=>{
                                if(err) console.error("failed to submit org-output tasks");
                                this.update_instance(instance, err=>{
                                    if(err) console.error("failed to update instance");
                                    this.request_notification(instance, err=>{
                                        if(err) console.error("failed to request instance notification");
                                        this.go('/process/'+instance._id);
                                    });
                                });
                            });
                        }); 
                    });
                });
            }
        },

        submit_instance() {
            //first create an instance to host all tasks 
            var instance = null;
            var inst_config = {
                brainlife: true,
                prov: {
                    app: this.app._id,
                    //deps: [], 
                }
            }
            /* TODO - not sure how to set prov.deps for bulk submission
            for(var input_id in this.form.inputs) {
                inst_config.prov.deps.push({input_id, dataset: this.form.inputs[input_id]});
            }
            */
            return this.$http.post(Vue.config.wf_api+'/instance', {
                name: "brainlife bulk process for app:"+this.app._id,
                desc: this.desc,
                config: inst_config,
            }).then(res=>res.body);
        },

        //submit data staging tasks
        submit_download_tasks(instance, cb) {
            async.eachSeries(this.tasks, (task, next_task)=>{
                if(!task.enable) return next_task();

                //create config to download all input data from archive
                var download = [];
                for(var input_id in task.inputs) {
                    download.push({
                        url: Vue.config.api+"/dataset/download/"+task.inputs[input_id].dataset+"?at="+Vue.config.jwt,
                        untar: "auto",
                        dir: "inputs/"+input_id,
                    });
                }
                //now submit task to download data from archive
                //console.log("submitting download task", download);
                this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: "brainlife.stage_input",
                    desc: "Stage Input for "+task.name,
                    service: "soichih/sca-product-raw",
                    config: { download, inputs: task.inputs },
                }).then(res=>{
                    //Vue.set(task, 'download_task',  res.body.task);
                    task.download_task = res.body.task;
                    console.log("submitted download", task);
                    next_task();
                });//.catch(next_task);
            }, cb);
        },

        submit_apps(instance, cb) {
            async.eachSeries(this.tasks, (task, next_task)=>{
                if(!task.enable) return next_task();
                this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: "brainlife.process",
                    desc: this.app.name,
                    service: this.app.github, //TODO what if it's docker?
                    config: Object.assign(task.config, lib.generate_config(this.app, task.download_task._id)),
                    deps: [ task.download_task._id ],
                    retry: this.app.retry,
                }).then(res=>{
                    task.main_task = res.body.task;
                    console.log("submitted main task", task);
                    next_task();
                });
            }, cb);
        },

        submit_orgout(instance, cb) {
            async.eachSeries(this.tasks, (task, next_task)=>{
                if(!task.enable) return next_task();

                var symlink = [];
                this.app.outputs.forEach(output=>{
                    if(output.files) {
                        for(var file_id in output.files) {
                            //find datatype file id
                            output.datatype.files.forEach(datatype_file=>{
                                if(datatype_file.id == file_id) {
                                    var name = datatype_file.filename||datatype_file.dirname;
                                    symlink.push({ 
                                        "src": "../"+task.main_task._id+"/"+output.files[file_id], 
                                        "dest": output.id+"/"+name 
                                    });
                                }
                            });
                        }
                    } else {
                        //copy everything..
                        symlink.push({"src": "../"+task.main_task._id, "dest": output.id});
                    }
                });
                this.$http.post(Vue.config.wf_api+'/task', {
                    instance_id: instance._id,
                    name: "brainlife.stage_output",
                    desc: "Organize Output", 
                    service: "soichih/sca-product-raw",
                    config: { symlink },
                    deps: [ task.main_task._id ],
                }).then(res=>{
                    task.org_task = res.body.task;
                    console.log("submitted org output task", task);
                    next_task();
                });
            }, cb);
        },

        update_instance(instance, cb) {
            //instance.config.prov.tasks = this.tasks; //TODO.. not sure what I really need out of tasks...
            this.$http.put(Vue.config.wf_api+'/instance/'+instance._id, {
                config: instance.config,
            }).then(res=>{
                console.log("updated instance config");
                cb();
            }, cb);
        },

        request_notification: function(instance, cb) {
            var url = document.location.origin+document.location.pathname+"#/process/"+instance._id;
            this.$http.post(Vue.config.event_api+"/notification", {
                event: "wf.instance.finished",
                handler: "email",
                config: {
                    instance_id: instance._id,
                    subject: "[brain-life.org] Process Completed",
                    message: "Hello!\n\nI'd like to inform you that your process has completed successfully.\n\nPlease downoad / archive output files at "+url+"\n\nBrain-life.org Administrator"
                },
            }).then(res=>{
                console.log("requested instance notification", res.body);
                cb();
            }, cb);
        },
    },
}
</script>

<style scoped>
.disabled {
background-color: #ddd;
}
.submit {
background-color: #eee;
}
</style>


