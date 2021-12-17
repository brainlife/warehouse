<template>
<b-modal size="xl" id='modal-rule' :title="title" @hidden="hidden" @ok="submit">
    <b-tabs class="brainlife-tab" v-model="tab">
        <b-tab title="App">
            <b-alert variant="secondary" :show="numJobsRunning > 0" style="border: none; margin-bottom: 0">
                There are jobs submitted by this rule. Any update you make for this rule will only apply to newly submitted jobs. <br>
                To ensure consistency, please consider deactivating this rule and removing all jobs currently running before editing this rule.
            </b-alert>
            <b-container>
                <br>
                <b-form-group label="Description" horizontal>
                    <b-form-textarea v-model="rule.name" placeholder="Please enter a description for this rule"/>
                </b-form-group>

                <b-form-group label="App *" horizontal>
                    <v-select required v-model="rule.app" label="name" :filterable="false" :options="search_apps" @search="search_app" @input="changeapp"
                        placeholder="Search App">
                        <template slot="no-options">please enter App name / desc to search</template>
                        <template slot="option" slot-scope="app">
                            <app :app="app" :compact="true" :clickable="false"/>
                        </template>
                        <template slot="selected-option" slot-scope="app">
                            {{app.name}}
                        </template>
                    </v-select>

                    <div v-if="!rule.app" style="height: 350px">
                        <!--give space below app selecter so dropdown menu won't be hidden-->
                        &nbsp;
                    </div>

                    <div v-if="rule.app">
                        <app :app="rule.app" :compact="true" :clickable="false" style="margin-top: 5px;"/>
                        <div v-if="rule.app.deprecated_by" style="margin-top: 10px">
                            <b-card v-if="rule.app.deprecated_by" no-body style="margin-bottom: 10px">
                                <span slot="header">
                                    <icon name="regular/calendar-times"/> This App has been deprecated by the following App
                                </span>
                                <app :appid="rule.app.deprecated_by"/>
                            </b-card>
                        </div>
                    </div>
                </b-form-group>

                <div v-if="rule.app">
                    <b-form-group label="Branch" horizontal>
                        <branchselecter v-model="rule.branch" :service="this.rule.app.github"/>
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
                </div>


            </b-container>
        </b-tab>

        <b-tab title="Input" v-if="rule.app">
            <b-container>
                <br> 
                <div v-if="rule.app">
                    <b-form-group label="Subject / Session Filtering" horizontal>
                        <p class="text-muted">Enter subject/session names to process. Leave it blank if you want to process all.</p>
                        <p>
                            <b-input-group prepend="Subject Filter" title="Only process subjects that matches this regex">
                                <b-form-input v-model="rule.subject_match" type="text" placeholder="(All subjects)"></b-form-input>
                                <b-input-group-prepend is-text>Session Filter</b-input-group-prepend>
                                <b-form-input v-model="rule.session_match" type="text" placeholder="(All sessions)"></b-form-input>
                            </b-input-group>
                            <small class="text-muted">For example, <b>^100</b> will make this rule to only submit Apps on subjects that starts with 100 (it could 1001, 1002, 1003, etc..).</small>
                        </p>
                    </b-form-group>

                    <p class="text-muted">The rule handler will look for subjects that <b>contain</b> the following inputs.</p>

                    <b-card v-for="input in rule.app.inputs" :key="input._id" class="card">
                        <div slot="header">
                            <small class="text-muted" style="float: right">{{input.id}}</small>
                            <datatypetag :datatype="input.datatype" :tags="input.datatype_tags"/>
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
                                <b-col>
                                    Selection Override
                                    <p>
                                        <small class="text-muted">Instead of using data from the same subject/session, you can look for data from different project, or different subject/session.</small>
                                    </p>
                                </b-col>
                                <b-col :cols="9">
                                    <p>
                                        <projectselecter v-model="rule.input_project_override[input.id]" placeholder="(From this project)"/>
                                    </p>
                                    <b-input-group prepend="Subject">
                                        <b-form-input v-model="rule.input_subject[input.id]" placeholder="(Use the matching subject)"/>
                                        <b-input-group-prepend is-text>Session</b-input-group-prepend>
                                        <b-form-input v-model="rule.input_session[input.id]" placeholder="(Use the matching session)"/>
                                    </b-input-group>

                                </b-col>
                            </b-row> 
                            <b-row>
                                <b-col>
                                    Object Tags
                                    <p>
                                        <small class="text-muted">Look for data with specific object tags (<b>not datatype tag!</b>)</small>
                                    </p>
                                </b-col>
                                <b-col :cols="9">
                                    <p>
                                        <tageditor v-model="rule.input_tags[input.id]" placeholder="(any tags)" :options="input_dataset_tags[input.id]"/>
                                    </p>
                                </b-col>
                            </b-row> 
                            <p v-if="rule.input_tags_count[input.id] === null"><icon name="cog" spin/> Counting matching data objects..</p>
                            <p v-else>
                                <small v-if="rule.input_tags_count[input.id]">{{rule.input_tags_count[input.id]}} data matches this criteria (may belong to the same subject)</small>
                                <b-alert :show="rule.input_tags_count[input.id] == 0" variant="secondary">There are no input data-objects that match the specified criteria.</b-alert>
                            </p>
                        </div>
                    </b-card>

                </div>
            </b-container>
        </b-tab>

        <b-tab title="Output" v-if="rule.app">
            <b-container>
                <br>
                <p class="text-muted">For each subject found, the rule handler will submit the App if the following output is <b>not yet generated</b></p>
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
                            <b-col>
                                Dataset Tags
                                <p>
                                    <small class="text-muted">Tags to add to the archived data. Tags allow you to specify which input data to use on subsequent rules if there are multiple.</small>
                                </p>
                            </b-col>
                            <b-col :cols="9">
                                <p>
                                    <tageditor v-model="rule.output_tags[output.id]" placeholder="(any tags)" :options="output_dataset_tags[output.id]"/>
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
            </b-container>
        </b-tab>
        <!--
        <b-tab v-if="rule.app">
            <template v-slot:title>
                Logs 
                &nbsp;
                <div style="width: 100px; display: inline-block;" v-if="numJobsRunning">
                    <stateprogress v-if="rule.stats" :states="rule.stats.tasks"/>
                </div>
            </template>
            <rulelog :id="rule._id"/>
        </b-tab>
        -->

        <!--
        <b-tab title="Debug">
            <pre>{{rule}}</pre>
        </b-tab>
        -->
    </b-tabs>
        
    <!--
    <template #modal-header>
        <h4 style="margin-bottom: 0;">{{form.fullname}} <small style="float: right">{{form.sub}}</small></h4>
        <div class="button" @click="closeModal()" style="float: right">
            <icon name="times" scale="1.5"/>
        </div>
    </template>
    -->

    <!--
    <template #modal-footer="{cancel}">
        <div class="float-left mr-auto">
            <b-button v-if="mode == 'ui'" @click="switchToJSON" variant="secondary">Show JSON</b-button>
            <b-button v-if="mode == 'json'" @click="switchToUI" variant="secondary">Show UI</b-button>
        </div>
        <b-button variant="secondary" @click="cancel()">Cancel</b-button>
        <b-button variant="primary" ref="okBTN" @click="submitUser">Submit</b-button>
    </template>
    -->
</b-modal>
</template>

<script>

import Vue from 'vue'
import search_app_mixin from '@/mixins/searchapp'
import ReconnectingWebSocket from 'reconnectingwebsocket'
import appcache from '@/mixins/appcache'

const lib = require('@/lib');

let debounce = null;

function remove_null(obj) {
    for(let key in obj) {
        if(!obj[key]) delete obj[key];
    }
    return obj;
}

export default {
    mixins: [ search_app_mixin, appcache ],
    components: { 
        projectselecter: ()=>import('@/components/projectselecter'),
        branchselecter: ()=>import('@/components/branchselecter'),
        datatypetag: ()=>import('@/components/datatypetag'),
        app: ()=>import('@/components/app'),
        tageditor: ()=>import('@/components/tageditor'),
        configform: ()=>import('@/components/configform'),
        //rulelog: ()=>import('@/components/rulelog'),
        stateprogress: ()=>import('@/components/stateprogress'),
    },

    data () {
        return {
            tab: 0,
            rule: {
                name: "",
                app: null,
                stats: {},
                project: null, //must be set

                //input_tags: {}, 
            },
            cb: null, //cb function to call with (err, rule[updated])

            ws: null,

            input_dataset_tags: {},
            output_dataset_tags: {},

            config: Vue.config,
        }
    },
    computed: {
        title() {
            if(!this.rule) return;
            if(this.rule.name) return this.rule.name;
            if(this.rule.app) return this.rule.app.name;
            return "New Rule";
        },

        numJobsRunning() {
            if(!this.rule.stats) return 0;
            if(!this.rule.stats.tasks) return 0;
            let count = 0;
            for(let state in this.rule.stats.tasks) {
                count += this.rule.stats.tasks[state];
            }
            return count;
        },
    },

    mounted() {
        this.$root.$on("rule.edit", opt=>{
            this.tab = 0;
            this.resetIOConfig();

            //overwrite with user provied default
            Object.assign(this.rule, {
                name: "",
                app: null,
                stats: {},
                active: true,
                _id: undefined,
            }, opt.rule);

            this.cb = opt.cb;

            if(this.rule.app) this.rule.branch = this.rule.app.github_branch;
            this.ensure_ids_exists(); 
            this.ensure_config_exists();
            this.load_dataset_tags();
            this.query_matching_datasets();

            this.subscribe();
            this.$root.$emit('bv::show::modal', 'modal-rule')
        });
    },

    destroyed() {
        this.$root.$off("rule.edit");
    },

    watch: {
        rule: {
            deep: true,
            handler() {
                if(debounce) clearTimeout(debounce);

                //reset counts before we start querying
                for(const key in this.rule.input_tags_count) {
                    this.rule.input_tags_count[key] = null;
                }

                debounce = setTimeout(()=>{
                    this.query_matching_datasets();
                }, 1000);
            } 
        },
    },

    methods: {
        changeapp(){
            this.resetIOConfig();
            this.rule.branch = this.rule.app.github_branch;

            this.ensure_ids_exists();
            this.ensure_config_exists();
            this.load_dataset_tags();
            this.query_matching_datasets();
        },

        subscribe() {
            var url = Vue.config.event_ws+"/subscribe?jwt="+Vue.config.jwt;
            if(this.ws) this.ws.close(); //for dev
            this.ws = new ReconnectingWebSocket(url, null, {reconnectInterval: 3000});
            this.ws.onopen = (e)=>{
                this.ws.send(JSON.stringify({
                    bind: {
                        ex: "warehouse", key: "rule.update.*."+this.rule.project+"."+this.rule._id,
                    }
                }));
            }
            this.ws.onmessage = (json)=>{
                const event = JSON.parse(json.data);
                if(!event.dinfo) return; //??

                //ignore everything except stats update
                this.rule.stats = event.msg.stats;
                /*
                for(let key in event.msg) {
                    console.log(key, event.msg[key]);
                    if(key == "app") {
                        this.appcache(event.msg[key], {populate_datatype: false}, (err, app)=>{
                            this.rule.app = app;
                        });
                    } else {
                        this.rule[key] = event.msg[key];
                    }
                }
                */
            }
        },

        hidden() {
            this.ws.close();
            if(this.rule._id) this.$router.replace("/project/"+this.rule.project+"/pipeline");
        },

        //deprecate?
        handleError(err) {
            console.error(err);
            if(err.response && err.response.data && err.response.data.message) {
                this.$notify({type: "error", text: err.response.data.message});
            }
        },

        //deprecate?
        editorInit(editor) {
            lib.editorInit(editor, ()=>{
                //nothing to add..
            });
        },

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

                    //app search mixin populates _id.. so unpopulate
                    //but we are just got it from the database, then it should be just string id
                    datatype: input.datatype._id || input.datatype,

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
                
                console.log("searching for inputs", id, find);
                this.$http.get('dataset', {params: {
                    find: JSON.stringify(find),
                    limit: 1, //I just need count (0 means all!)
                }}).then(res=>{
                    this.rule.input_tags_count[id] = res.data.count;
                    this.$forceUpdate();
                }); 
            }
        },

        resetIOConfig() {
            Object.assign(this.rule, {
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
            //WTF is this
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

        submit() {
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

            //now ready to submit!
            if(rule._id) {
                //update
                this.$http.put('rule/'+rule._id, rule).then(res=>{
                    this.$notify({text: "Successfully updated a rule", type: "success"});
                    this.$root.$emit('bv::hide::modal', 'modal-rule')
                    console.log("rule created .. received data from server", res.data);
                    this.cb(null, res.data);
                }).catch(this.notify_error);
            } else {
                //create
                this.$http.post('rule', rule).then(res=>{
                    this.$notify({text: "Successfully created a new rule. You must activate it so that it will run", type: "success"});
                    this.$root.$emit('bv::hide::modal', 'modal-rule')
                    this.cb(null, res.data);
                }).catch(this.notify_error);
            }
        },

        load_dataset_tags() {
            if(!this.rule.app) return null;

            this.rule.app.inputs.forEach(input=>{

                //WTF!?
                //input.datatype_id = input.datatype._id || input.datatype; //parent component passes app.input without populating datatype sometimes?

                this.$http.get('dataset/distinct', {
                    params: {
                        distinct: 'tags',

                        //TODO - I should apply filtering for datatype_tags and dataset tags
                        find: JSON.stringify({
                            project: this.rule.input_project_override[input.id] || this.rule.project, 
                            datatype: input.datatype,
                            removed: false,
                        }),
                        datatype_tags: input.datatype_tags,
                    },
                    json: true,
                }).then(res=>{
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
    },
}
</script>

<style scoped>
/deep/ .modal-body {
    padding: 0;
}
/deep/ .col-form-label {
    padding-bottom: 0;
}
</style>

