<template>
<b-form @submit="submit" v-if="ready">
    <div class="margin20">
        <!--{{rule._id||'new rule'}}-->
        <b-form-group label="Name *" horizontal>
            <b-form-input required v-model="rule.name" type="text" placeholder="Please enter name for this rule (used for output dataset description)"></b-form-input>
        </b-form-group>

        <!--
        <b-form-group horizontal>
            <b-form-checkbox v-model="rule.active">Active</b-form-checkbox>
            <small class="text-muted">Only the active rules are processed by the rule handler</small>
        </b-form-group>
        -->

        <b-form-group label="App *" horizontal>
            <v-select required v-model="rule.app" label="name" :filterable="false" :options="apps" @search="search_app">
                <template slot="no-options">please enter app name / desc to search</template>
                <template slot="option" slot-scope="app">
                    <app :app="app" :compact="true" :clickable="false"/>
                </template>
                <template slot="selected-option" slot-scope="app">
                    {{app.name}}
                </template>
            </v-select>
            <div v-if="rule.app">
                <b-alert :show="!rule.app.github_branch" variant="danger">This App has no branch specified. Code might be modified while processing subjects</b-alert>
                <app :app="rule.app" :compact="true" :clickable="false" style="margin-top: 5px;"/>
            </div>
        </b-form-group>

        <div v-if="rule.app">
            <b-form-group label="Configuration" horizontal>
                <b-card>
                    <configform :spec="rule.app.config" v-model="rule.config"/>
                </b-card>
            </b-form-group>
            <b-form-group label="Inputs" horizontal>
                <p class="text-muted">Look for subjects that has the following input datasets.</p>
                <b-card v-for="input in rule.app.inputs" :key="input._id" class="card">
                    <div slot="header">
                        <small class="text-muted" style="float: right">{{input.id}}</small>
                        <datatypetag :datatype="input.datatype_id" :tags="input.datatype_tags"/>
                        <span class="text-muted" v-if="input.optional">(optional)</span>
                    </div>
                    <b-row v-if="input.optional">
                        <b-col></b-col>
                        <b-col :cols="9">
                            <p>
                                <b-form-checkbox v-model="rule.input_selection[input.id]" value="ignore">Don't use this input</b-form-checkbox>
                                <small class="text-muted">This is an optional field. You can submit without this input</small>
                            </p>
                        </b-col>
                    </b-row> 
                    <div v-if="rule.input_selection[input.id] != 'ignore'">
                        <b-row>
                            <b-col>Dataset Tags</b-col>
                            <b-col :cols="9">
                                <p>
                                    <tageditor v-model="rule.input_tags[input.id]" placeholder="(any tags)" :options="dataset_tags[input.datatype_id]"/>
                                    <small class="text-muted">Look for datasets with specific dataset tags (<b>not datatype tag!</b>)</small>
                                </p>
                            </b-col>
                        </b-row> 
                        <b-row>
                            <b-col>Project</b-col>
                            <b-col :cols="9">
                                <p>
                                <projectselecter v-model="rule.input_project_override[input.id]" placeholder="(from this project)"/>
                                <small class="text-muted">Look for datasets in this project</small>
                                </p>
                            </b-col>
                        </b-row> 
                    </div>
                </b-card>
            </b-form-group>

            <b-form-group label="Outputs" horizontal>
                <p class="text-muted">Submit the app if the following dataset <b>does not</b> exist.</p>
                <b-card v-for="output in rule.app.outputs" :key="output._id" class="card">
                    <div slot="header">
                        <small class="text-muted" style="float: right">{{output.id}}</small>
                        <datatypetag :datatype="output.datatype" :tags="output.datatype_tags"/>
                    </div>
                    <b-row>
                        <b-col>Dataset Tags</b-col>
                        <b-col :cols="9">
                            <tageditor v-model="rule.output_tags[output.id]" placeholder="(any tags)" :options="dataset_tags[output.datatype]"/>
                            <small class="text-muted">Output tags allows you can easily query for specific set of datasets on subsequent rules.</small>
                        </b-col>
                    </b-row>
                </b-card>
            </b-form-group>
        </div>
        <b-form-group label="Subject Filtering" horizontal>
            <p class="text-muted">Only process subjects that match following regex</p>
            <b-form-input v-model="rule.subject_match" type="text" placeholder="regex to match subject name"></b-form-input>
            <small class="text-muted">For example, <b>^100</b> will make this rule to only process subjects that starts with 100.</small>
        </b-form-group>
    </div>
    <br>
    <br>
    <br>
    <div class="page-footer with-menu">
        <b-button type="button" @click="cancel">Cancel</b-button>
        <b-button type="submit" variant="primary">Submit</b-button>
    </div>
</b-form>
</template>

<script>
import Vue from 'vue'

import vSelect from 'vue-select'
import datatypetag from '@/components/datatypetag'
import app from '@/components/app'
import tageditor from '@/components/tageditor'
import projectselecter from '@/components/projectselecter'
import configform from '@/components/configform'

let debounce = null;

export default {
    props: {
        value: { type: Object },
    },

    components: { 
        projectselecter, vSelect, datatypetag,
        app, tageditor, configform,
    },

    watch: {
        value: function() {
            this.load_value();
        },

        "rule.app": {
            handler: function(newv) {
                if(!newv) return;
                this.ensure_ids_exists();
                this.ensure_config_exists();
                this.load_dataset_tags();
            },
            deep: true,
        },
    },

    data() {
        return {
            rule: {},
            apps: [],
            ready: false,
            dataset_tags: {},
        }
    },
    
    mounted() {
        this.load_value();
        this.ready = true;
    },
    
    methods: {
        load_value: function() {
            if(!this.value) return; //no value specified yet

            this.rule = Object.assign({
                //should be set to empty object by default
                input_tags: {},
                output_tags: {}, 
                input_project_override: {},
                input_selection: {},
                config: {},
            }, this.value);
            this.ensure_ids_exists();
        },

        ensure_ids_exists: function() {
            if(this.rule.app) {
                //ensure input.id exists on various objects (if not set)
                this.rule.app.inputs.forEach(input=>{
                    if(!this.rule.input_tags[input.id]) Vue.set(this.rule.input_tags, input.id, []);
                    if(!this.rule.input_project_override[input.id]) Vue.set(this.rule.input_project_override, input.id, null);
                });
                this.rule.app.outputs.forEach(output=>{
                    if(!this.rule.output_tags[output.id]) Vue.set(this.rule.output_tags, output.id, []);
                });
            }
        },

        ensure_config_exists: function() {
            if(this.rule.app) {
                for(var k in this.rule.app.config) {
                    if(this.rule.config[k] === undefined) {
                        Vue.set(this.rule.config, k ,this.rule.app.config[k].default);
                    }
                }
            }
        },

        cancel: function() {
            this.$emit("cancel");
        },

        submit: function(evt) {
            evt.preventDefault();

            /* let's not make this *required* yet
            //validate
            let valid = true;
            for(let id in this.rule.output_tags) {
                let tags = this.rule.output_tags[id];
                if(tags.length == 0) {
                    this.$notify({type: "error", text: "Please enter tags for each output dataset"});
                    valid = false;
                }
            }
            if(!valid) return;
            */

            //clean up _tags, and input_project_override that shouldn't exist
            var input_ids = this.rule.app.inputs.map(it=>it.id);
            var output_ids = this.rule.app.outputs.map(it=>it.id);
            var input_tags = {};
            var output_tags = {};
            var input_project_override = {};
            input_ids.forEach(id=>{
                if(this.rule.input_tags[id].length > 0) input_tags[id] = this.rule.input_tags[id];
                input_project_override[id] = this.rule.input_project_override[id];
            });

            //remove null values for project override
            for(var id in input_project_override) {
                if(!input_project_override[id]) delete input_project_override[id];
            }
            output_ids.forEach(id=>{
                if(this.rule.output_tags[id].length > 0) output_tags[id] = this.rule.output_tags[id];
            });

            //remove config that doesn't belong to specified app (or input)
            for(var k in this.rule.config) {
                var spec = this.rule.app.config[k];
                if(spec === undefined || spec.type == "input") delete this.rule.config[k];
            }

            //construct the final rule and submit
            var rule = Object.assign(this.rule, {
                input_tags,
                output_tags,
                input_project_override,
            });
            //console.log("submit-----------------------");
            //console.dir(rule);
            this.$emit("submit", rule);
        },

        search_app: function(search, loading) {
            loading(true);
            clearTimeout(debounce);
            debounce = setTimeout(()=>{
                this.$http.get('app', {params: {
                    find: JSON.stringify({
                        $or: [
                            { name: {$regex: search, $options: 'i' }},
                            { desc: {$regex: search, $options: 'i' }},
                            { service: {$regex: search, $options: 'i' }},

                            //$text index search can't do substring search, which is not very intuitive
                            //https://stackoverflow.com/questions/24343156/mongodb-prefix-wildcard-fulltext-search-text-find-part-with-search-string
                            //{ '$text': {'$search': search} },
                        ],
                        removed: false,
                    }),
                    populate: 'inputs.datatype outputs.datatype contributors', //to display app detail
                }})
                .then(res=>{
                    this.apps = res.body.apps;
                    console.log("search result:", search, this.apps);
                    loading(false);
                });
            }, 300);
        },

        load_dataset_tags: function() {
            this.rule.app.inputs.forEach(input=>{
                input.datatype_id = input.datatype._id || input.datatype; //parent component passes app.input without populating datatype sometimes?
                let project = this.rule.input_project_override[input.id] || this.rule.project;

                this.$http.get('dataset/distinct', {params: {
                    distinct: 'tags',
                    find: JSON.stringify({project, datatype: input.datatype_id}),
                }}).then(res=>{
                    Vue.set(this.dataset_tags, input.datatype_id, res.body);
                }); 

                /*
                this.$http.get('dataset/distinct', {params: {
                    distinct: 'datatype_tags',
                    find: JSON.stringify({project, datatype}),
                }}).then(res=>{
                    Vue.set(this.datatype_tags, input.id, res.body);
                }); 
                */
            });
        },
    }
}
</script>

<style scoped>
.card:not(:first-of-type) {
border-top: none;
}
</style>
