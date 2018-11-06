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

                <p>
                    <b-input-group prepend="Subject Filter" title="Only process subjects that matches this regex">
                        <b-form-input v-model="rule.subject_match" type="text" placeholder="regex to match subject name"></b-form-input>
                    </b-input-group>
                    <small class="text-muted">For example, <b>^100</b> will make this rule to only process subjects that starts with 100.</small>
                </p>

                <b-card v-for="input in rule.app.inputs" :key="input._id" class="card">
                    <div slot="header">
                        <small class="text-muted" style="float: right">{{input.id}}</small>
                        <datatypetag :datatype="input.datatype_id" :tags="input.datatype_tags"/>
                        <span class="text-muted" v-if="input.optional">(optional)</span>

                        <tageditor v-model="rule.extra_datatype_tags[input.id]" placeholder="(add extra datatype tags)" style="margin-top: 2px;"/>
                    </div>
                    <p v-if="input.optional">
                        <b-form-checkbox v-model="rule.input_selection[input.id]" value="ignore">Do not use this input</b-form-checkbox>
                        <small class="text-muted">This is an optional field. You can submit without this input</small>
                    </p>
                    <div v-if="rule.input_selection[input.id] != 'ignore'">
                        <b-row>
                            <b-col>Project</b-col>
                            <b-col :cols="9">
                                <p>
                                <projectselecter v-model="rule.input_project_override[input.id]" placeholder="(from this project)"/>
                                <small class="text-muted">Look for datasets in this project</small>
                                </p>
                            </b-col>
                        </b-row> 
                        <b-row>
                            <b-col>Dataset Tags</b-col>
                            <b-col :cols="9">
                                <p>
                                    <tageditor v-model="rule.input_tags[input.id]" placeholder="(any tags)" :options="input_dataset_tags[input.id]"/>
                                    <small class="text-muted">Look for datasets with specific dataset tags (<b>not datatype tag!</b>)</small>
                                </p>
                                <small v-if="rule.input_tags_count[input.id]">{{rule.input_tags_count[input.id]}} datasets matches this criteria</small>
                            </b-col>
                        </b-row> 
                        <b-alert :show="!rule.input_tags_count[input.id]" variant="warning">There are no input datasets that matches the specified criteria.</b-alert>
                    </div>
                </b-card>


                <!--
                <p v-if="rule.subject_match_count"><small>{{rule.subject_match_count}} subjects matches this filter</small></p>
                -->

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
                            <tageditor v-model="rule.output_tags[output.id]" placeholder="(any tags)" :options="output_dataset_tags[output.id]"/>
                            <small class="text-muted">Output tags allows you can easily query for specific set of datasets on subsequent rules.</small>
                            <!--
                            <small v-if="rule.output_tags_neg_count[output.id]">{{rule.output_tags_neg_count[output.id]}} datasets needs to be generated</small>
                            -->
                        </b-col>
                    </b-row>
                </b-card>
            </b-form-group>
        </div>
    </div>
    <br>
    <br>
    <br>

    <div v-if="config.debug">
        <pre>{{rule}}</pre>
    </div>

    <div class="page-footer with-menu">
        <b-button type="button" @click="cancel">Cancel</b-button>
        <b-button type="submit" variant="primary">Submit</b-button>
    </div>
</b-form>
</template>

<script>
import Vue from 'vue'

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
        projectselecter, datatypetag, app, tageditor, configform,
    },

    data() {
        return {
            rule: {},
            apps: [],
            ready: false,
            input_dataset_tags: {},
            output_dataset_tags: {},

            config: Vue.config,
        }
    },

    watch: {
        value: function() {
            this.load_value();
        },

        rule: {
            handler: function() {
                if(this.rule.app) {
                    this.ensure_ids_exists();
                    this.ensure_config_exists();
                    this.load_dataset_tags();
                }
                this.query_matching_datasets();
            },
            deep: true,
        },

        
    },
    
    mounted() {
        this.load_value();
        this.ready = true;
    },
    
    methods: {
        query_matching_datasets() {
            //querying matching datasets for each input
            for(let id in this.rule.input_tags) {
                let input = this.rule.app.inputs.find(i=>i.id == id);
                let find = {
                    project: this.rule.input_project_override[id] || this.rule.project._id,
                    datatype: input.datatype_id,
                    removed: false,
                }
                if(this.rule.subject_match != "") find["meta.subject"] = {$regex: this.rule.subject_match};
                if(this.rule.input_tags[id].length > 0) find.tags = {$all: this.rule.input_tags[id]};

                let datatype_tags = input.datatype_tags.concat(this.rule.extra_datatype_tags[id]);
                if(datatype_tags.length == 0) datatype_tags = null; //suppress setting it at all

                this.$http.get('dataset', {params: {
                    find: JSON.stringify(find),
                    datatype_tags,
                    limit: 0, //I just need count
                }}).then(res=>{
                    //console.log("query returned ", res.body.count);
                    Vue.set(this.rule.input_tags_count, id, res.body.count);
                }); 
            }

            /*
            let find = {
                project: this.rule.project,
                removed: false,
            }
            if(this.rule.subject_match != "") {
                find["meta.subject"] = {$regex: this.rule.subject_match};
            }
            console.dir(find);
            this.$http.get('dataset/distinct', {params: {
                distinct: "meta.subject",
                find: JSON.stringify(find),
            }}).then(res=>{
                console.log("found subjects", res.body.length);
                Vue.set(this.rule, 'subject_match_count', res.body.length);
            });
            */

            /* 
            //count number of subjects that doesn't have specified output dataset
            //TODO this is not trivial to do..
            //I think we need to..
            //first enumerate all subjects that will be created (union of matching subjects from all inputs)
            //then, count the number of datasets with matching criteria for each output
            //finally, subtract second from the first.
            for(let id in this.rule.output_tags) {
                let output = this.rule.app.outputs.find(i=>i.id == id);
                let find = {
                    project: this.rule.project,
                    storage: { $exists: true }, //might be removed on the rule_handler query..
                    removed: false,
                    datatype: {$not: output.datatype},
                }
                if(output.datatype_tags.length > 0) find.datatype_tags = {$not: {$all: output.datatype_tags}};
                if(this.rule.output_tags[id].length > 0) find.tags = {$not: {$all: this.rule.output_tags[id]}};
                console.dir(find);
                this.$http.get('dataset/distinct', {params: {
                    find: JSON.stringify(find),
                    distinct: "meta.subject", 
                }}).then(res=>{
                    console.dir(res.body);
                    Vue.set(this.rule.output_tags_neg_count, id, res.body.length);
                }); 
            }
            */
        },

        load_value() {
            if(!this.value) return; //no value specified yet

            this.rule = Object.assign({
                //should be set to empty object by default
                input_tags: {},
                input_tags_count: {}, //number of matching input datasets for each input

                subject_match: "", 
                //subject_match_count: null,  //number of matching subjects for subject_match filter

                output_tags: {}, 
                //output_tags_neg_count: {}, //number of subjects that has no dataset that mathces output criteria

                input_project_override: {},
                input_selection: {},
                extra_datatype_tags: {},
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
                    if(!this.rule.extra_datatype_tags[input.id]) Vue.set(this.rule.extra_datatype_tags, input.id, []);
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
            console.log("project", this.rule.project);
            this.rule.app.inputs.forEach(input=>{
            console.log(this.rule.input_project_override[input.id]);
                input.datatype_id = input.datatype._id || input.datatype; //parent component passes app.input without populating datatype sometimes?
                this.$http.get('dataset/distinct', {params: {
                    distinct: 'tags',
                    find: JSON.stringify({
                        project: this.rule.input_project_override[input.id] || this.rule.project, 
                        datatype: input.datatype_id,
                        removed: false,
                    }),
                    datatype_tags: input.datatype_tags,
                }}).then(res=>{
                    Vue.set(this.input_dataset_tags, input.id, res.body);
                }); 
            });

            this.rule.app.outputs.forEach(output=>{
                this.$http.get('dataset/distinct', {params: {
                    distinct: 'tags',
                    find: JSON.stringify({
                        project: this.rule.project, 
                        datatype: output.datatype,
                        removed: false,
                    }),
                    datatype_tags: output.datatype_tags,
                }}).then(res=>{
                    Vue.set(this.output_dataset_tags, output.id, res.body);
                }); 
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
