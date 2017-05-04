<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/datasets"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
        <div class="margin20">

            <div v-if="page == 'select_app' && apps">
                <h2 class="text-muted">Please select application you'd like to submit with selected datasets</h2>
                <br>
                <div v-for="app in apps" :key="app._id" @click="selectapp(app)" class="clickable">
                    <app :app="app" compact="true"/>
                </div>
            </div>
            <div v-if="page == 'config'">
                <h2 class="text-muted">Submit {{app.name}}</h2>
                <h3>Please select / configure tasks to submit.</h3>
                <el-form label-width="150px">
                    <el-card v-for="task in tasks" :class="{disabled: !task.enable}">
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
                    <el-card style="background-color: #5cc18e;">
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

        </div><!--margin20-->
        </div><!--page-content-->
    </div>
</div><!--root-->
</template>

<script>
import Vue from 'vue'

import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import appavatar from '@/components/appavatar'
import app from '@/components/app'

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
            }),
            //populate: 'inputs.datatype',// outputs.datatype',
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
            var datatype_ids = this.app.inputs.map(input=>input.datatype);
            this.$http.get('dataset', {params: {
                find: JSON.stringify({
                    datatype: {$in: datatype_ids},
                    removed: false,
                })
            }}).then(res=>{
                this.app.inputs.forEach(input=>{
                    Vue.set(this.datasets, input.id, lib.filter_datasets(res.body.datasets, input));
                });
                //console.dir(this.datasets);

                //for each dataset selected.. create task entry
                this.tasks = [];
                for(var did in this.selected) {
                    var selected_dataset = this.selected[did];

                    //construct default configuration
                    //var config = lib.generate_config(this.app, "123456");
                    //console.dir(config);

                    var task = {
                        enable: false,
                        service: app.github,
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
            //console.log("set datasets");
            //console.dir(this.app);


            //find datasets that applies 
            //var datasets = this.dataset.filter(lib.filter_apps
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
                alert('good');
            }
        },

        submit_instance(cb) {
            //first create an instance to run everything
            var instance = null;
            var inst_config = {
                brainlife: true,
                prov: {
                    app: this.app._id,
                    //deps: [], 
                }
            }
            /*
            for(var input_id in this.form.inputs) {
                inst_config.prov.deps.push({input_id, dataset: this.form.inputs[input_id]});
            }
            */
            this.$http.post(Vue.config.wf_api+'/instance', {
                name: "brainlife bulk process for app:"+this.app._id,
                desc: this.desc,
                config: inst_config,
            }).then(res=>{
                instance = res.body;
                console.log("instance created", instance);
            })
        },

    },
}
</script>

<style scoped>
.disabled {
background-color: #ddd;
}
</style>


