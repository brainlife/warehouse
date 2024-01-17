<template>
<transition name="fade">
<div v-if="open" class="brainlife-modal-overlay">
<b-container class="brainlife-modal">
    <div class="brainlife-modal-header">
        <div class="brainlife-modal-header-buttons">
            <div class="button" @click="open = false" style="margin-left: 20px; opacity: 0.8;">
                <icon name="times" scale="1.5"/>
            </div>
        </div>
        <h4 style="margin-top: 5px;">Execute App</h4>
    </div><!--header-->

    <b-form v-if="app" @submit="submit">
    <div class="submit-form">
        <app :app="app" :clickable="false" style="margin: -20px; position: sticky; top: -20px; margin-bottom: 20px; z-index: 4"/>
        <b-alert :show="this.no_resource" variant="secondary" style="margin: -20px; margin-bottom: 10px">
            There are currently no resource available to run this App. 
            If you submit this App, it will be executed after a resource becomes available.
        </b-alert>

        <b-row>
            <b-col class="text-muted" cols="3">Project *</b-col>
            <b-col>
                <projectselector canwrite="true" v-model="projectId" placeholder="Project you'd like to run this process in" :required="true"/> 
                <small>Project where you want to create a new process to execute this App.</small>
            </b-col>
        </b-row>
        <br>

        <b-row>
            <b-col cols="3" class="text-muted">Description</b-col>
            <b-col>
                <b-form-textarea v-model="form.desc"
                     placeholder="Optional description for this processing"
                     :rows="3" :max-rows="6"/>
            </b-col>
        </b-row>

        <hr>

        <b-row v-for="input in app.inputs" :key="input.id" style="margin-bottom: 10px;">
            <b-col cols="3">
                <small style="float: right;" class="text-muted">{{input.id}}</small>
                <datatypetag :datatype="input.datatype" :tags="input.datatype_tags" :clickable="false"/>

                <span v-if="!input.optional">*</span>
                <span class="text-muted" v-else>(optional)</span>

                <span v-if="input.multi">(multi)</span>
            </b-col>
            <b-col>
                <div v-for="(ps, $idx) in form.inputs[input.id]" :key="ps.id" style="margin-bottom: 5px; margin-right: 50px;">
                    <div v-if="input.multi" class="button button-danger" style="float: right;" @click="remove_input(input, ps)" size="sm"><icon name="trash"/></div>
                    <div style="padding-right: 50px">
                        <projectselector 
                            v-model="ps.project" 
                            :datatype="input.datatype"
                            :datatype_tags="input.datatype_tags"
                            :required="true"
                            placeholder="Select Project" 
                            @input="change_project(input, ps)" style="margin-bottom: 5px;"/>
                        <v-select v-if="ps.project" v-model="ps.dataset" :loading="ps.loading" 
                            @search="fetch_datasets(input, ps, $event)" 
                            @input="add_new_input(input)"
                            :options="datasets[input.id]" placeholder="Select/Search Input Dataset">
                            <template slot="option" slot-scope="option">
                                <b>{{option.subject}}</b> <small v-if="option.session">/ {{option.session}}</small>
                                <small v-if="option.datatype_tags"><b>{{option.datatype_tags.toString()}}</b></small>
                                <span v-if="option.tags.length > 0"> | <small>{{option.tags.toString()}}</small></span>
                                <small style="opacity: 0.4; font-size: 80%">
                                    <time>{{new Date(option.create_date).toLocaleString()}}</time>
                                    <!--{{option.id}}-->
                                </small>
                            </template>
                        </v-select>
                    </div>
                    <metadata v-if="ps.dataset" :id="ps.dataset.id"/>
                </div>
                <small v-if="input.desc" style="opacity: 0.8; white-space: pre-wrap;">{{input.desc}}</small>
            </b-col>
        </b-row>

        <configform :spec="app.config" v-model="form.config"/>
        <hr>
        <advanced v-if="this.project" :app='app' v-model='form.advanced' :gids="[1, this.project.group_id]">
            <configform :spec="app.config" v-model="form.config" :advanced="true"/>
        </advanced>
        <br>

    </div><!--submit-form-->
    <div class="form-action">
        <b-button variant="primary" type="submit">Submit</b-button>
    </div>
    </b-form>

</b-container>
</div>
</transition>
</template>

<script>
import Vue from 'vue'

import contact from '@/components/contact'
import tags from '@/components/tags'
import pageheader from '@/components/pageheader'
import appavatar from '@/components/appavatar'
import select2 from '@/components/select2'
import projectselector from '@/components/projectselector'
import datatypetag from '@/components/datatypetag'
import app from '@/components/app'
import configform from '@/components/configform'
import advanced from '@/components/appadvanced'
import metadata from '@/components/metadata'

import agreementMixin from '@/mixins/agreement'

const lib = require("../lib");
const async = require("async");

export default {
    mixins: [agreementMixin],
    components: { 
        contact, 
        tags, pageheader, 
        appavatar, select2, projectselector, 
        app, datatypetag, configform, advanced,
        metadata,
    },

    //props: [ "id" ], //appid

    data () {
        return {
            open: false,

            projectId: null,
            project: null, //loaded by projectId watch
            
            app: null,
            no_resource: false,

            form: {
                desc: "",
                inputs: {}, //input_id as key, and array of {id, project, dataset}
                config: {},
                advanced: {},
            },

            //cache
            datasets: {}, //available datasets grouped by input._id then project_id then array of datasets
            
            config: Vue.config,
        }
    },

    watch: {
        async projectId() {
            this.project = null; //forces rerendering of <advanced>
            const resProjects = await this.$http.get('project', {params: {
                find: JSON.stringify({
                    _id: this.projectId,
                }),
                select: "group_id noPublicResource",
            }});
            this.project = resProjects.data.projects[0];

            //create list of gids we want to use for this project
            const gids = [this.project.group_id];
            if(!this.project.noPublicResource) gids.push(1);

            const resBest = await this.$http.get(Vue.config.amaretti_api + '/resource/best', {params: {
                service: this.app.github,
                gids,
            }});
            if(resBest.data.resource) this.no_resource = !resBest.data.resource;
        }
    },

    created() {
        this.$root.$on("appsubmit.open", _id=>{

            //reset form
            this.form.desc = "";
            this.form.inputs = {};
            this.form.config = {};
            this.form.advanced = {};

            this.$http.get('app', {params: {
                find: JSON.stringify({_id}),
                populate: 'inputs.datatype outputs.datatype',
                limit: 1,
            }})
            .then(res=>{
                this.app = res.data.apps[0];
                this.github_branch = this.app.github_branch || 'master';

                //initialize input datasets array (with null as first item)
                for(var idx in this.app.inputs) {
                    var input = this.app.inputs[idx];
                    Vue.set(this.form.inputs, input.id, [{
                        id: new Date().getTime(), 
                        project: null, 
                        dataset: null, 
                        loading: false,
                        showMeta: false,
                    }]);
                }
                this.open = true;
            })
            .catch(err=>{
                console.error(err);
            });
        });

        //TODO - call removeEventListener in destroy()? Or I should do this every time modal is shown/hidden?
        document.addEventListener("keydown", e => {
            if (e.keyCode == 27) {
                this.open = false;
            }
        });
    },

    destroyed() {
        this.$root.$off("appsubmit.open");
    },

    methods: {
        change_project(input, ps) {
            ps.dataset = null;
            this.fetch_datasets(input, ps, null);
        },

        fetch_datasets(input, ps, search) {
            ps.loading = true;

            // essentially the same code from datasetselecter.vue
            var dropdown_items = [];
            let find_raw = {
                project: ps.project,
                datatype: input.datatype._id,
                storage: {$exists: true}, 
                removed: false,
                status: {$in: ["stored", "archived"]},
            };

            //similar code in modals/datasetselecter
            if(search) find_raw.$or = [
                    { 'meta.subject': {$regex: search, $options: 'i' }}, 
                    { 'meta.session': {$regex: search, $options: 'i' }}, 
                    { 'tags': {$regex: search, $options: 'i' }}, 
                    { 'datatype_tags': {$regex: search, $options: 'i' }}, 
            ];
            this.$http.get('dataset', { params: {
                find: JSON.stringify(find_raw),
                sort: "meta.subject meta.session -create_date",
                populate: "datatype",
                datatype_tags: input.datatype_tags,
                limit: 300, //100 too small for bold500
            }})
            .then(res => {
                res.data.datasets.forEach(dataset => {
                    var subject = "N/A";
                    var session = "";
                    if (dataset.meta) {
                        if(dataset.meta.subject) subject = dataset.meta.subject;
                        if(dataset.meta.session) session = dataset.meta.session;
                    }

                    let label = subject;
                    if(session) label += " / "+session;
                    if(dataset.datatype_tags && dataset.datatype_tags.length > 0) label += ' '+dataset.datatype_tags;
                    if(dataset.tags.length > 0) label +=' | '+dataset.tags; 

                    // add dropdown menu item
                    dropdown_items.push({
                        id: dataset._id,
                        label,

                        subject,
                        session,
                        date: dataset.create_date,
                        datatype: dataset.datatype,
                        datatype_tags: dataset.datatype_tags,
                        tags: dataset.tags,
                        create_date: dataset.create_date,
                    });
                });

                ps.loading = false;
                this.datasets[input.id] = dropdown_items;

            }).catch(err=>{
                console.error(err);
                ps.loading = false;
            });
        },

        generate_config(download_task_id) {
            var config = Object.assign({}, this.app.config);
            var app = this.app;
            var form = this.form;
            function handle_obj(obj) {
                for(var k in obj) { 
                    var node = obj[k];
                    if(!node) return;
                    if(node.isArray) {
                        console.log("todo.. array!");
                    } else if(typeof node === 'object') {
                        if(node.type) {
                            switch(node.type) {
                            case "input":
                                //find the input 
                                app.inputs.forEach(input=>{
                                    if(input.id == node.input_id) {
                                        var pss = form.inputs[input.id];
                                        var allnull = true;
                                        pss.forEach(ps=>{
                                            if(ps.dataset) allnull = false;
                                        });
                                        if(allnull) {
                                            //optional config that's not set?
                                            delete obj[k];
                                            return; 
                                        }
                                        //find the file
                                        input.datatype.files.forEach(file=>{
                                            if(file.id == node.file_id) {
                                                if(input.multi) {
                                                    obj[k] = [];
                                                    pss.forEach(ps=>{
                                                        obj[k].push("../"+download_task_id+"/"+ps.dataset.id+"/"+(file.filename||file.dirname));
                                                    });
                                                } else {
                                                    //single (pick first one)
                                                    obj[k] = "../"+download_task_id+"/"+pss[0].dataset.id+"/"+(file.filename||file.dirname)
                                                }
                                            }
                                        });
                                    } 
                                });
                                break;
                            default:
                                obj[k] = form.config[k];
                            }
                        } else handle_obj(node); //recurse
                    }
                }
            }

            handle_obj(config);
            //console.log("generated config", config);
            return config;
        },

        remove_input(input, ps) {
            let idx = this.form.inputs[input.id].indexOf(ps);
            this.form.inputs[input.id].splice(idx, 1);
            if(this.form.inputs[input.id].length == 0) this.add_new_input(input);
        },

        add_new_input(input) {
            if(!input.multi) return;
            let pss = this.form.inputs[input.id];
            if(!pss.find(ps=>(ps.dataset == null))) {
                pss.push({project: null, dataset: null, id: new Date().getTime(), loading: false});
            }
        },

        validate() {
            var validated = true;
            this.app.inputs.forEach(input=>{
                if(input.optional !== undefined && input.optional) return;
                //count number of non nulls
                if(this.form.inputs[input.id].filter(ps=>ps.dataset!=null).length == 0) {
                    this.$notify({ text: 'Please select an input datasets for '+input.id, type: 'error' });
                    validated = false;
                }
            });
            if(!this.project) {
                this.$notify({ text: 'Please select project', type: 'error' });
                validated = false;
            }
            return validated;
        },

        submit(evt) {
            evt.preventDefault();
            if(!this.validate()) return;

            //prevent double submit
            if(!this.open) return; 
            this.open = false;

            //remove null inputs (for multi)
            this.app.inputs.forEach(input=>{
                this.form.inputs[input.id] = this.form.inputs[input.id].filter(ps=>ps.dataset!=null);
            });

            const subdirs = [];
            var all_dataset_ids = [];
            for(var input_id in this.form.inputs) {
                const inputSpec = this.app.inputs.find(input=>input.id == input_id);
                this.form.inputs[input_id].forEach(ps=>{
                    all_dataset_ids.push(ps.dataset.id);
                    if(inputSpec.includes) {
                        inputSpec.includes.split("\n").forEach(include=>{
                            subdirs.push("include:"+ps.dataset.id+"/"+include);
                        });
                    } else subdirs.push(ps.dataset.id);
                });
            }

            var instance = null;
            var download = [];

            //load project detail for project selected and destination project
            let project_ids = [ this.projectId ]; //destination
            //for project selected for input
            for(let input_id in this.form.inputs) {
                this.form.inputs[input_id].forEach(ps=>{
                    project_ids.push(ps.project);
                });
            }
            this.$http.get('project', {params: {
                find: JSON.stringify({
                   _id: {$in : project_ids}
                }),
                select: 'agreements',
            }}).then(res=>{

                //make sure user has met agreements to all projects used
                return new Promise((resolve, reject)=>{
                    async.eachSeries(res.data.projects, this.check_agreements, err=>{
                        if(err) return reject(err);

                        //create an instance to run everything
                        this.$http.post(Vue.config.amaretti_api+'/instance', {
                            group_id: this.project.group_id,
                            desc: this.form.desc||this.app.name,
                            config: {
                                brainlife: true,
                            },
                        }).then(resolve);
                    });
                }); 
            }).then(res=>{
                instance = res.data;

                //TODO - similar code exists on UI cli/util.js runApp()
                return this.$http.post('dataset/stage', {
                    instance_id: instance._id,
                    dataset_ids: all_dataset_ids,
                });
            }).then(async res=>{
                var download_task = res.data.task;

                //start constructing config
                var config = Object.assign(this.generate_config(download_task._id), {
                    _app: this.app._id,
                    _tid: 2,
                    _inputs: [],
                    _outputs: [],
                });

                for(let input_id in this.form.inputs) {
                    //find config.json key mapped to this input
                    let keys = []; 
                    for(var key in this.app.config) {
                        if(this.app.config[key].input_id == input_id) {
                            keys.push(key); 
                        }
                    }

                    //for each input, find dataset that's staged and use dataset information from it
                    this.form.inputs[input_id].forEach(ps=>{
                        let dataset = download_task.config._outputs.find(output=>output.dataset_id == ps.dataset.id);
                        config._inputs.push(
                            Object.assign({}, dataset, {
                                id: input_id,
                                task_id: download_task._id,
                                keys,
                            })
                        );
                    });
                }

                //copy some hierarchical metadata from input

                //similar code in 
                // ui/modal/newtask.vue
                // ui/modal/appsubmit
                // bin/rule_handler
                // cli
                let meta = config._inputs.reduce((meta, dataset)=>{
                    ["subject", "session", "run"].forEach(k=>{
                        if(!meta[k]) meta[k] = dataset.meta[k]; //use first one
                    });
                    return meta;
                }, {});
                this.app.outputs.forEach(output=>{
                    var output_req = {
                        id: output.id,
                        datatype: output.datatype._id,
                        desc: output.desc||this.app.name,
                        meta,
                    };

                    if(output.output_on_root) {
                        output_req.files = output.files; //optional
                    } else {
                        output_req.subdir = output.id; //TODO - why not output.subdir?
                    }

                    //handle tag passthrough
                    let tags = [];
                    if(output.datatype_tags_pass) {
                        this.form.inputs[output.datatype_tags_pass].forEach(ps=>{
                            let dataset = download_task.config._outputs.find(out=>out.dataset_id == ps.dataset.id);
                            if(dataset.datatype_tags) tags = tags.concat(dataset.datatype_tags);

                            //copy all metadata (let last one win)
                            Object.assign(output_req.meta, dataset.meta);
                        });
                    }
                    //.. and add app specified output tags at the end
                    if(output.datatype_tags) tags = tags.concat(output.datatype_tags); 
                    output_req.datatype_tags = lib.uniq(tags);

                    config._outputs.push(output_req);
                });

                //check to see if we need to include global resource
                const gids = [this.project.group_id];
                if(!this.project.noPublicResource) gids.push(1);
                
                //now submit the main task
                let submissionParams = {
                    instance_id: instance._id,
                    gids,
                    name: this.app.name,
                    service: this.app.github,
                    service_branch: this.app.github_branch,
                    config,
                    deps_config: [ {
                        task: download_task._id,
                        subdirs,
                    } ],
                };
                if (this.form.advanced.resource) submissionParams.preferred_resource_id = this.form.advanced.resource;
                if (this.form.advanced.branch) submissionParams.service_branch = this.form.advanced.branch;

                return this.$http.post(Vue.config.amaretti_api+'/task', submissionParams);
            }).then(res=>{
                this.$router.push("/project/"+this.projectId+"/process/"+instance._id);
            }).catch(err=>{
                console.error(err);
                this.$notify({ text: err, type: 'error' });
            });
        },
    }
}
</script>

<style scoped>
.submit-form {
position: absolute;
left: 0px;
right: 0px;
top: 60px;
padding: 20px;
bottom: 60px;
overflow: auto;
background-color: #f9f9f9;
}
.form-action {
position: absolute;
bottom: 0px;
left: 0px;
right: 0px;
height: 60px;
box-shadow: inset 0px 1px 1px #ddd;
background-color: #eee;
padding: 10px 20px;
text-align: right;
}
</style>
