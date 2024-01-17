<template>
<!--deprecated by modal/rule-->
<b-form @submit="submit" v-if="ready">
    <div style="margin: 20px;">
        <h5 v-if="!rule._id">New Pipeline Rule</h5>
        <h5 v-if="rule._id">Edit Pipeline Rule</h5>

        <b-form-group label="Name" horizontal>
            <b-form-input v-model="rule.name" type="text" placeholder="Please enter a name for this rule (optional)"></b-form-input>
        </b-form-group>

        <b-form-group label="App*" horizontal>
            <v-select required v-model="rule.app" label="name" :filterable="false" :options="search_apps" @search="search_app" 
                placeholder="Search App">
                <template slot="no-options">please enter App name / desc to search</template>
                <template slot="option" slot-scope="app">
                    <app :app="app" :compact="true" :clickable="false"/>
                </template>
                <template slot="selected-option" slot-scope="app">
                    {{app.name}}
                </template>
            </v-select>
            <div v-if="rule.app">
                <app :app="rule.app" :compact="true" :clickable="false" style="margin-top: 5px;"/>
                <div v-if="rule.app.deprecated_by" style="margin-top: 10px">
                    <b-card v-if="rule.app.deprecated_by" no-body style="margin-bottom: 10px">
                        <span slot="header">
                            <icon name="regular/calendar-times"/> This App has been deprecated by the following App
                            <small>(Please consider using this App instead)</small>
                        </span>
                        <app :appid="rule.app.deprecated_by"/>
                    </b-card>
                </div>
            </div>
        </b-form-group>

        <div v-if="rule.app">
            <b-form-group label="Branch" horizontal>
                <branchselector v-model="rule.branch" :service="this.rule.app.github"/>
            </b-form-group>

            <b-form-group label="Configuration" horizontal>
                <b-card>
                    <configform :spec="rule.app.config" v-model="rule.config"/>
                    <div v-if="hasAdvancedOptions()">
                        <hr>
                        <p><b>Advanced Options</b></p>
                        <configform :spec="rule.app.config" v-model="rule.config" :advanced="true"/>
                    </div>
                </b-card>
            </b-form-group>

            <b-form-group label="Subject / Session Filtering" horizontal>
                <p class="text-muted">Enter subject/session names to submit the above App. Leave them black if you want to process all.</p>
                <p>
                    <b-input-group prepend="Subject Filter" title="Only process subjects that matches this regex">
                        <b-form-input v-model="rule.subject_match" type="text" placeholder="(All subjects)"></b-form-input>
                        <b-input-group-prepend is-text>Session Filter</b-input-group-prepend>
                        <b-form-input v-model="rule.session_match" type="text" placeholder="(All sessions)"></b-form-input>
                    </b-input-group>
                    <small class="text-muted">For example, <b>^100</b> will make this rule to only submit Apps on subjects that starts with 100 (it could 1001, 1002, 1003, etc..).</small>
                </p>
            </b-form-group>

            <b-form-group label="Inputs" horizontal>
                <p class="text-muted">The rule handler will look for subjects that <b>contain</b> the following inputs.</p>

                <div style="border-left: 4px solid rgb(0, 123, 355); padding-left: 10px;">
                    <b-card v-for="input in rule.app.inputs" :key="input._id" class="card">
                        <div slot="header">
                            <small class="text-muted" style="float: right">{{input.id}}</small>
                            <datatypetag :datatype="input.datatype_id" :tags="input.datatype_tags"/>
                            <span class="text-muted" v-if="input.optional">(optional)</span>
                            <div class="button" v-if="!input.edit_extra_tags" @click="edit_etag(input)" style="position: absolute; top: 7px;"><icon name="plus" scale="0.8"/></div>
                            <tageditor v-if="input.edit_extra_tags" v-model="rule.extra_datatype_tags[input.id]" placeholder="(enter extra datatype tags)" style="margin-top: 2px;"/>
                            <p v-if="input.desc" style="margin-bottom: 0px;"><small>{{input.desc}}</small></p>
                        </div>
                        <p v-if="input.optional">
                            <b-form-checkbox v-model="rule.input_selection[input.id]" value="ignore">Do not use this input</b-form-checkbox>
                            <small class="text-muted">This is an optional field. Apps will be submitted without this input</small>
                        </p>
                        <div v-if="rule.input_selection[input.id] != 'ignore'">
                            <b-row>
                                <b-col>Selection Override</b-col>
                                <b-col :cols="9">
                                    <p>
                                        <projectselector v-model="rule.input_project_override[input.id]" placeholder="(From this project)"/>
                                    </p>
                                    <b-input-group prepend="Subject">
                                        <b-form-input v-model="rule.input_subject[input.id]" placeholder="(Use the matching subject)"/>
                                        <b-input-group-prepend is-text>Session</b-input-group-prepend>
                                        <b-form-input v-model="rule.input_session[input.id]" placeholder="(Use the matching session)"/>
                                    </b-input-group>

                                    <p>
                                        <small class="text-muted">Instead of using data from the same subject/session, you can look for data from different project, or different subject/session.</small>
                                    </p>
                                </b-col>
                            </b-row> 
                            <b-row>
                                <b-col>Dataset Tags</b-col>
                                <b-col :cols="9">
                                    <p>
                                        <tageditor v-model="rule.input_tags[input.id]" placeholder="(any tags)" :options="input_dataset_tags[input.id]"/>
                                        <small class="text-muted">Look for data with specific object tags (<b>not datatype tag!</b>)</small>
                                    </p>
                                    <small v-if="rule.input_tags_count[input.id]">{{rule.input_tags_count[input.id]}} data matches this criteria (may belong to the same subject)</small>
                                </b-col>
                            </b-row> 
                            <p v-if="rule.input_tags_count[input.id] === null">Counting matching data objects..</p>
                            <b-alert v-else :show="rule.input_tags_count[input.id] == 0" variant="warning">There are no input data-objects that match the specified criteria.</b-alert>
                        </div>
                    </b-card>
                </div><!--border-->
            </b-form-group>

            <b-form-group label="Outputs" horizontal>
                <p class="text-muted">For each subject found, the rule handler will submit the App if the following output is <b>not yet generated</b></p>
                <div style="border-left: 4px solid rgb(40, 167, 69); padding-left: 10px;">
                    <b-card v-for="output in rule.app.outputs" :key="output._id" class="card">
                        <div slot="header">
                            <small class="text-muted" style="float: right">{{output.id}}</small>
                            <datatypetag :datatype="output.datatype" :tags="output.datatype_tags"/>
                            <p v-if="output.desc" style="margin-bottom: 0px;"><small>{{output.desc}}</small></p>
                        </div>
                        <p>
                            <b-form-checkbox v-model="rule.archive[output.id].do">Submit the App if this output data does not exist (and archive the output).</b-form-checkbox>
                        </p>
                        <div v-if="rule.archive[output.id].do">
                            <b-row v-if="rule.archive[output.id].do">
                                <b-col>Dataset Tags</b-col>
                                <b-col :cols="9">
                                    <p>
                                        <tageditor v-model="rule.output_tags[output.id]" placeholder="(any tags)" :options="output_dataset_tags[output.id]"/>
                                        <small class="text-muted">Tags to add to the archived data. Tags are important as they allow you to specify input data on subsequent rules.</small>
                                    </p>
                                </b-col>
                            </b-row>
                            <b-row>
                                <b-col>Description</b-col>
                                <b-col :cols="9">
                                    <b-form-textarea :rows="2" v-model="rule.archive[output.id].desc" placeholder="Description for archived data object"/>
                                </b-col>
                            </b-row>
                        </div>
                    </b-card>
                </div><!--border-->
            </b-form-group>
        </div>
    </div>
    <br>
    <br>
    <br>

    <!--
    <div v-if="config.debug">
        <pre>{{rule}}</pre>
    </div>
    -->

    <div class="page-footer">
        <b-button type="button" @click="cancel">Cancel</b-button>
        <b-button type="submit" variant="primary" :disabled="!rule.app">Submit</b-button>
    </div>
</b-form>
</template>

<script>
import Vue from 'vue'

import datatypetag from '@/components/datatypetag'
import app from '@/components/app'
import tageditor from '@/components/tageditor'
import projectselector from '@/components/projectselector'
import branchselector from '@/components/branchselector'
import configform from '@/components/configform'

import search_app_mixin from '@/mixins/searchapp'

let debounce = null;

function remove_null(obj) {
    for(let key in obj) {
        if(!obj[key]) delete obj[key];
    }
    return obj;
}

export default {
    mixins: [ search_app_mixin ],
    props: {
        value: { type: Object },
    },

    components: { 
        projectselector, branchselector, datatypetag, app, tageditor, configform,
    },

    data() {
        return {
            rule: {
                app: null, 
                input_tags: {},
                output_tags: {},
                archive: {},

                input_tags_count: {}, //number of matching input datasets for each input

                subject_match: "", 
                session_match: "", 

                input_project_override: {},
                input_subject: {},
                input_session: {},

                input_selection: {},
                extra_datatype_tags: {},
                config: {},

                branch: null,
            },
            ready: false,
            input_dataset_tags: {},
            output_dataset_tags: {},

            //github_branches: [],
            //github_tags: [],

            config: Vue.config,
        }
    },

    watch: {
        value: function() {
            this.load_rule();
        },

        "rule.app": function(newv, oldv) {
            if(!newv) return;
            if(oldv && newv._id != oldv._id) {
                //switching to another app
                this.reset_rule();
                this.rule.branch = this.rule.app.github_branch || 'master';
            } else if(!this.rule.branch) {
                //first time?
                this.rule.branch = this.rule.app.github_branch || 'master';
            }
            //if(!this.rule.name) this.rule.name = this.rule.app.name;
            this.ensure_ids_exists();
            this.ensure_config_exists();
            this.load_dataset_tags();
        },


        //can't just watch rule with deep:true because there are so many fields that
        //has nothing to do with querying 
        "rule.inputs": function() {
            this.query_matching_datasets();
            this.load_dataset_tags();
        },
        "rule.input_tags": {
            handler: function() {
                clearTimeout(debounce);
                debounce = setTimeout(()=>{
                    this.query_matching_datasets();
                }, 300)
            }, deep: true,
        },
        "rule.input_subject": {
            handler: function() {
                clearTimeout(debounce);
                debounce = setTimeout(()=>{
                    this.query_matching_datasets();
                }, 300)
            }, deep: true,
        },
        "rule.input_session": {
            handler: function() {
                clearTimeout(debounce);
                debounce = setTimeout(()=>{
                    this.query_matching_datasets();
                }, 300)
            }, deep: true,
        },
        "rule.extra_datatype_tags": {
            handler: function(v) {
                this.query_matching_datasets();
                this.load_dataset_tags();
            }, deep: true,
        },
        "rule.input_project_override": {
            handler: function(v) {
                this.query_matching_datasets();
                this.load_dataset_tags();
            }, deep: true,
        },
        "rule.subject_match": function() {
            clearTimeout(debounce);
            debounce = setTimeout(()=>{
                this.query_matching_datasets();
                this.load_dataset_tags();
            }, 300)
        },
        "rule.session_match": function() {
            clearTimeout(debounce);
            debounce = setTimeout(()=>{
                this.query_matching_datasets();
                this.load_dataset_tags();
            }, 300)
        },
    },
    
    mounted() {
        this.load_rule();
        this.ready = true;
    },
    
    methods: {
        hasAdvancedOptions() {
            if(!this.rule.app) return;
            let has = false;
            for(let key in this.rule.app.config) {
                let c = this.rule.app.config[key];
                if(c.advanced) has = true;
            }
            return has;
        },

        query_matching_datasets() {
            if(!this.rule.app) return;
            for(let id in this.rule.input_tags) {
                let input = this.rule.app.inputs.find(i=>i.id == id);
                if(!input) {
                    //maybe obsolute key stored in input_tags? let's ignore this for now.
                    console.error("no input found for", id);
                    continue;
                }

                let find = {
                    project: this.rule.input_project_override[id] || this.rule.project,
                    datatype: input.datatype_id,
                    storage: { $exists: true }, //just to be consistent with rule_handler
                    removed: false,
                }
                if(this.rule.subject_match != "") find["meta.subject"] = {$regex: this.rule.subject_match};
                if(this.rule.session_match != "") find["meta.session"] = {$regex: this.rule.session_match};

                //override if subject name is specified
                if(this.rule.input_subject[id]) find["meta.subject"] = this.rule.input_subject[id];
                if(this.rule.input_session[id]) find["meta.session"] = this.rule.input_session[id];

                //handle dataset (negative)tags
                //TODO - I think I can simplify this by combining $in and $nin like.. "{tags: {$all: ["test", "dev"], $nin: ["xyz123"]}}"
                let tag_query = [];
                let pos_tags = [];
                let neg_tags = [];
                this.rule.input_tags[id].forEach(tag=>{
                    if(tag[0] != "!") pos_tags.push(tag);
                    else neg_tags.push(tag.substring(1));
                });
                if(pos_tags.length > 0) tag_query.push({tags: {$all:pos_tags}});
                if(neg_tags.length > 0) tag_query.push({tags: {$nin:neg_tags}});

                //handle datatype (negative) tags
                let datatype_tags = input.datatype_tags.concat(this.rule.extra_datatype_tags[id]);
                pos_tags = [];
                neg_tags = [];
                datatype_tags.forEach(tag=>{
                    if(tag[0] != "!") pos_tags.push(tag);
                    else neg_tags.push(tag.substring(1));
                });
                if(pos_tags.length > 0) tag_query.push({datatype_tags: {$all:pos_tags}});
                if(neg_tags.length > 0) tag_query.push({datatype_tags: {$nin:neg_tags}});
               
                if(tag_query.length > 0) find.$and = tag_query;

                //console.log("querying datasets", find);
                this.$http.get('dataset', {params: {
                    find: JSON.stringify(find),
                    limit: 1, //I just need count (0 means all!)
                }}).then(res=>{
                    //console.log(res.data.count);
                    this.rule.input_tags_count[id] = res.data.count;
                }); 
            }
        },

        //update with value from the parent component
        load_rule() {
            if(!this.value) return; //no value specified yet
            this.reset_rule();
            Object.assign(this.rule, this.value);
            this.ensure_ids_exists();
        },

        reset_rule() {
            Object.assign(this.rule, {
                //should be set to empty object by default
                input_tags: {},
                input_tags_count: {}, //number of matching input datasets for each input

                subject_match: "", 
                session_match: "", 
                output_tags: {}, 

                input_project_override: {},
                input_subject: {},
                input_session: {},

                input_selection: {},
                extra_datatype_tags: {},
                config: {},
                archive: {},

            });
        },

        ensure_ids_exists() {
            if(!this.rule.app) return;
            
            //ensure input.id exists on various objects (if not set)
            this.rule.app.inputs.forEach(input=>{
                if(!this.rule.input_tags[input.id]) Vue.set(this.rule.input_tags, input.id, []);
                if(!this.rule.input_project_override[input.id]) Vue.set(this.rule.input_project_override, input.id, null);
                if(!this.rule.input_subject[input.id]) Vue.set(this.rule.input_subject, input.id, null);
                if(!this.rule.input_session[input.id]) Vue.set(this.rule.input_session, input.id, null);
                if(!this.rule.extra_datatype_tags[input.id]) Vue.set(this.rule.extra_datatype_tags, input.id, []);

                if(!this.rule.input_tags_count[input.id]) Vue.set(this.rule.input_tags_count, input.id, null);

                //make all optional field optional by default
                if(this.rule.input_selection[input.id] === undefined && input.optional) Vue.set(this.rule.input_selection, input.id, 'ignore');

                input.edit_extra_tags = (this.rule.extra_datatype_tags[input.id].length > 0);
            });
            this.rule.app.outputs.forEach(output=>{
                if(!this.rule.output_tags[output.id]) Vue.set(this.rule.output_tags, output.id, [this.compose_output_tag()]);
                if(!this.rule.archive[output.id]) Vue.set(this.rule.archive, output.id, {do: output.archive, desc: ""}); 
            });
        },

        compose_output_tag() {
            let tag = this.rule.name||new Date().toLocaleDateString();
            tag = tag.toLowerCase().replace(/\W/g, '_');
            return tag;
        },

        ensure_config_exists() {
            if(!this.rule.app) return;

            for(var k in this.rule.app.config) {
                if(this.rule.config[k] === undefined) {
                    Vue.set(this.rule.config, k ,this.rule.app.config[k].default);
                }
            }
        },

        cancel() {
            this.$emit("cancel");
        },

        submit(evt) {
            evt.preventDefault();

            //clean up _tags, and input_project_override that shouldn't exist
            var input_ids = this.rule.app.inputs.map(it=>it.id);
            var output_ids = this.rule.app.outputs.map(it=>it.id);
            var input_tags = {};
            var output_tags = {};
            var input_subject = {};
            var input_session = {};
            var input_project_override = {};
            input_ids.forEach(id=>{
                if(this.rule.input_tags[id].length > 0) input_tags[id] = this.rule.input_tags[id];
                input_subject[id] = this.rule.input_subject[id];
                input_session[id] = this.rule.input_session[id];
                input_project_override[id] = this.rule.input_project_override[id];
            });

            remove_null(input_project_override);
            remove_null(input_subject);
            remove_null(input_session);

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
                input_subject,
                input_session,
            });
            this.$emit("submit", rule);
        },

        load_dataset_tags() {
            if(!this.rule.app) return null;
            this.rule.app.inputs.forEach(input=>{
                input.datatype_id = input.datatype._id || input.datatype; //parent component passes app.input without populating datatype sometimes?
                this.$http.get('dataset/distinct', {params: {
                    distinct: 'tags',
                    //TODO - I should apply filtering for datatype_tags and dataset tags
                    find: JSON.stringify({
                        project: this.rule.input_project_override[input.id] || this.rule.project, 
                        datatype: input.datatype_id,
                        removed: false,
                    }),
                    datatype_tags: input.datatype_tags,
                }}).then(res=>{
                    Vue.set(this.input_dataset_tags, input.id, res.data);
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
                    Vue.set(this.output_dataset_tags, output.id, res.data);
                }); 
            });
            
        },
       
        edit_etag(input) {
            input.edit_extra_tags = true;
            this.$forceUpdate();
        }
    }
}
</script>

<style scoped>
.card:not(:first-of-type) {
    border-top: none;
}
h5 {
    margin-bottom: 20px;
}
</style>
