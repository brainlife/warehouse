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
            <v-select required v-model="rule.app" label="name" :filterable="false" :options="apps" @search="search_app" placeholder="Please enter App name to search">
                <template slot="no-options">please enter App name / desc to search</template>
                <template slot="option" slot-scope="app">
                    <app :app="app" :compact="true" :clickable="false"/>
                </template>
                <template slot="selected-option" slot-scope="app">
                    {{app.name}}
                </template>
            </v-select>
            <div v-if="rule.app">
                <!--
                <b-alert :show="!rule.app.github_branch" variant="danger">This App has no default branch specified. We can not gurantee code consistency.</b-alert>
                -->
                <app :app="rule.app" :compact="true" :clickable="false" style="margin-top: 5px;"/>
            </div>
        </b-form-group>

        <div v-if="rule.app">
            <b-form-group label="Branch" horizontal>
                <b-form-select :options="github_branches" v-model='rule.branch'></b-form-select>
            </b-form-group>
            <b-form-group label="Configuration" horizontal>
                <b-card>
                    <configform :spec="rule.app.config" v-model="rule.config"/>
                </b-card>
            </b-form-group>
            <b-form-group label="Inputs" horizontal>
                <p class="text-muted">Look for subjects that has the following input datasets.</p>

                <div style="border-left: 4px solid rgb(0, 123, 355); padding-left: 10px;">
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
                            <div class="button" v-if="!input.edit_extra_tags" @click="edit_etag(input)" style="position: absolute; top: 7px;"><icon name="plus" scale="0.8"/></div>
                            <tageditor v-if="input.edit_extra_tags" v-model="rule.extra_datatype_tags[input.id]" placeholder="(enter extra datatype tags)" style="margin-top: 2px;"/>
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
                                    <projectselecter v-model="rule.input_project_override[input.id]" placeholder="(From this project)"/>
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
                                    <small v-if="rule.input_tags_count[input.id]">{{rule.input_tags_count[input.id]}} datasets matches this criteria (may belong to the same subject)</small>
                                </b-col>
                            </b-row> 
                            <p v-if="rule.input_tags_count[input.id] === null">Counting matching datasets..</p>
                            <b-alert v-else :show="rule.input_tags_count[input.id] == 0" variant="warning">There are no input datasets that matches the specified criteria.</b-alert>
                        </div>
                    </b-card>
                </div><!--border-->
                <!--
                <p v-if="rule.subject_match_count"><small>{{rule.subject_match_count}} subjects matches this filter</small></p>
                -->
            </b-form-group>

            <b-form-group label="Outputs" horizontal>
                <p class="text-muted">Submit the App if the following dataset <b>does not</b> exist.</p>
                <div style="border-left: 4px solid rgb(40, 167, 69); padding-left: 10px;">
                    <b-card v-for="output in rule.app.outputs" :key="output._id" class="card">
                        <div slot="header">
                            <small class="text-muted" style="float: right">{{output.id}}</small>
                            <datatypetag :datatype="output.datatype" :tags="output.datatype_tags"/>
                        </div>
                        <b-row>
                            <b-col>Dataset Tags</b-col>
                            <b-col :cols="9">
                                <p>
                                    <tageditor v-model="rule.output_tags[output.id]" placeholder="(any tags)" :options="output_dataset_tags[output.id]"/>
                                    <small class="text-muted">Output tags allows you can easily query for specific set of datasets on subsequent rules.</small>
                                </p>
                            </b-col>
                        </b-row>
                        <p>
                            <b-form-checkbox v-model="rule.archive[output.id].do">Archive Output</b-form-checkbox>
                        </p>
                        <p v-if="rule.archive[output.id].do">
                            <b-form-textarea :rows="2" v-model="rule.archive[output.id].desc" placeholder="Description for archived dataset"/>
                        </p>
                    </b-card>
                </div><!--border-->
            </b-form-group>
        </div>
    </div>
    <br>
    <br>
    <br>

    <div v-if="config.debug">
        <pre>{{rule}}</pre>
    </div>

    <div class="page-footer">
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
        //new_output_tags: { type: Array }, //output_datasets tags for new output
    },

    components: { 
        projectselecter, datatypetag, app, tageditor, configform,
    },

    data() {
        return {
            rule: {
                app: {
                    inputs: [],
                    outputs: [],
                },
                input_tags: {},
                output_tags: {},
                archive: {},

                input_tags_count: {}, //number of matching input datasets for each input

                subject_match: "", 
                input_project_override: {},
                input_selection: {},
                extra_datatype_tags: {},
                config: {},

                branch: null,
            },
            apps: [],
            ready: false,
            input_dataset_tags: {},
            output_dataset_tags: {},
            github_branches: [],

            config: Vue.config,
        }
    },

    watch: {
        value: function() {
            this.load_value();
        },

        "rule.app": function(newv, oldv) {
            if(!newv) return;
            if(oldv && oldv._id && newv._id != oldv._id) {
                this.reset_rule();
            }
            this.ensure_ids_exists();
            this.ensure_config_exists();
            this.load_dataset_tags();
            this.load_branches();
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
    },
    
    mounted() {
        this.load_value();
        this.ready = true;
    },
    
    methods: {

        query_matching_datasets() {
            if(!this.rule.app) return;
            //console.dir(this.rule.input_tags);
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

                console.log("querying datasets", find);
                this.$http.get('dataset', {params: {
                    find: JSON.stringify(find),
                    limit: 1, //I just need count (0 means all!)
                }}).then(res=>{
                    console.log(res.data.count);
                    this.rule.input_tags_count[id] = res.data.count;
                }); 
            }
        },

        //update with value from the parent component
        load_value() {
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
                output_tags: {}, 
                input_project_override: {},
                input_selection: {},
                extra_datatype_tags: {},
                config: {},
                archive: {},

                branch: null,
            });
        },

        ensure_ids_exists() {
            if(!this.rule.app) return;

            //ensure input.id exists on various objects (if not set)
            this.rule.app.inputs.forEach(input=>{
                if(!this.rule.input_tags[input.id]) Vue.set(this.rule.input_tags, input.id, []);
                if(!this.rule.input_project_override[input.id]) Vue.set(this.rule.input_project_override, input.id, null);
                if(!this.rule.extra_datatype_tags[input.id]) Vue.set(this.rule.extra_datatype_tags, input.id, []);

                if(!this.rule.input_tags_count[input.id]) Vue.set(this.rule.input_tags_count, input.id, null);

                //make all optional field optional by default
                if(this.rule.input_selection[input.id] === undefined && input.optional) Vue.set(this.rule.input_selection, input.id, 'ignore');

                input.edit_extra_tags = (this.rule.extra_datatype_tags[input.id].length > 0);
            });
            this.rule.app.outputs.forEach(output=>{
                if(!this.rule.output_tags[output.id]) Vue.set(this.rule.output_tags, output.id, [this.compose_output_tag()]);
                if(!this.rule.archive[output.id]) Vue.set(this.rule.archive, output.id, {do: true, desc: ""}); //archive all by default
            });
        },

        compose_output_tag() {
            let tag = this.rule.name||"noname";
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

        search_app(search, loading) {
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
                    limit: 500, //TODO - this is not sustailable
                }})
                .then(res=>{
                    this.apps = res.data.apps;
                    //console.log("search result:", search, this.apps);
                    loading(false);
                });
            }, 300);
        },

        load_dataset_tags() {
            
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

        load_branches() {
            console.log("loading branches", this.rule.branch);
            this.$http.get('https://api.github.com/repos/' + this.rule.app.github + '/branches', 
                { headers: { Authorization: null } })
            .then(res=>{
                this.github_branches = res.data.map(b => {
                    return {
                        value: b.name,
                        text: b.name
                    };
                });
                
                //pick a default if rule.branch not set
                if(!this.rule.branch) this.rule.branch = this.rule.app.github_branch || 'master';
                
            }).catch(console.error);
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
</style>
