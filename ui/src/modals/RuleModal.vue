<template>
    <b-modal size="xl" id='modal-rule' :title="title" @hidden="hidden" @ok="ok">
        <b-form @submit.stop.prevent="submit">
            <b-tabs class="brainlife-tab" v-model="tab">
                <b-tab title="App">
                    <b-alert variant="secondary" :show="numJobsRunning > 0" style="border: none; margin-bottom: 0">
                        There are jobs submitted by this rule. Any update you make for this rule will only apply to newly submitted jobs. <br>
                        To ensure consistency, please consider deactivating this rule and removing all jobs currently running before editing this rule.
                    </b-alert>
                    <RuleModalAppTab
                        :rule-name="rule.name"
                        :rule-branch="rule.branch"
                        :rule-config="rule.config"
                        :rule-app="rule.app"
                        @update:rule-name="val => rule.name = val"
                        @update:rule-branch="val => rule.branch = val"
                        @update:rule-app="changeApp"
                    />
                </b-tab>
                <b-tab v-if="rule.app" title="Input">
                    <RuleModalInputTab
                        :project="rule.project"
                        :rule-app="rule.app"
                        :rule-subject-match="rule.subject_match"
                        :rule-session-match="rule.session_match"
                        :extra-datatype-tags="rule.extra_datatype_tags"
                        :input-selection="rule.input_selection"
                        :input-multicount="rule.input_multicount"
                        :input-project-override="rule.input_project_override"
                        :input-subject="rule.input_subject"
                        :input-session="rule.input_session"
                        :input-tags="rule.input_tags"
                        @update:rule-subject-match="val => rule.subject_match = val"
                        @update:rule-session-match="val => rule.session_match = val"
                    />
                </b-tab>
                <b-tab v-if="rule.app" title="Output">
                    <RuleModalOutputTab
                        :project="rule.project"
                        :rule-app="rule.app"
                        :archive="rule.archive"
                        :output-tags="rule.output_tags"
                    />
                </b-tab>
            </b-tabs>
        </b-form>
    </b-modal>
</template>

<script>

import Vue from 'vue'
import search_app_mixin from '@/mixins/searchapp'
import ReconnectingWebSocket from 'reconnectingwebsocket'
import {
    getEmptyIOConfigObj,
    removeUndefinedOrNullProperties,
    composeOutputTag,
    SUPPORTED_PIPELINES
} from '@/modals/RuleModal.helpers'

const lib = require('@/lib');

export default {
    mixins: [ search_app_mixin ],
    components: { 
        RuleModalAppTab: () => import('@/modals/RuleModalAppTab'),
        RuleModalInputTab: () => import('@/modals/RuleModalInputTab'),
        RuleModalOutputTab: () => import('@/modals/RuleModalOutputTab')
    },
    data () {
        return {
            tab: 0,
            rule: {
                _id: undefined,
                project: null, //must be set
                active: true,
                stats: {},

                // app tab
                name: "",
                app: null,
                config: {},
                branch: "",

                // input tab
                subject_match: "", 
                session_match: "", 
                extra_datatype_tags: {},
                input_selection: {},
                input_multicount: {},
                input_project_override: {},
                input_subject: {},
                input_session: {},
                input_tags: {},

                // output tab
                output_tags: {}, 
                archive: {},
            },

            cb: null, // cb function to call with (err, rule[updated])
            ws: null, // websocket
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
            this.cb = opt.cb;
            
            //overwrite with user provided default
            this.rule = Object.assign({}, 
                this.rule,
                getEmptyIOConfigObj(),
                this.initializeAppIdsInRuleObj(this.rule.app, this.rule),
                {
                    name: "",
                    app: null,
                    branch: this.rule.app ? this.rule.app.github_branch : null,
                    stats: {},
                    active: true,
                    _id: undefined,
                }, 
                { config: this.initializeAppConfigIdsInRuleConfigObj(this.rule.app ? this.rule.app.config : undefined, this.rule.config) },
                opt.rule, // any data passed in via opt.rule overrides other data
            );

            this.subscribe();
            this.$root.$emit('bv::show::modal', 'modal-rule')
        });

        // this trigger does not actually cause the ruleModal to open. It is simply
        // here to create rules for a given pipeline. We do that here so that we have 
        // access to all the methods for creating a rule
        this.$root.$on('create_pipeline', async ({ projectId, pipelineName }) => {
            // check if we support the given pipeline first
            const upperCasePipelineName = (pipelineName || '').toLocaleUpperCase();           
            const pipeline = SUPPORTED_PIPELINES[upperCasePipelineName];
            if (!pipeline || !projectId) return;

            const retrievedApps = await this.$http.get(`app`, {
                params: {
                    find: JSON.stringify({ _id: { $in: pipeline } }),
                    limit: Object.keys(pipeline).length
                }
            })

            const retrievedAppsData = retrievedApps.data.apps; // dont want all the HTTP info, just the data returned from server
            const newRules = [];
            retrievedAppsData.forEach(async (app) => {
                // 1. Create rule
                const newRule = {
                    // IO Config Properties
                    ...getEmptyIOConfigObj(),
                    name: `Automatically Generated DWI Pipeline Rule`,
                    app: app._id,
                    branch: app.github_branch,
                    config: {},

                    _id: undefined,
                    active: true,
                    project: projectId,
                    stats: {},
                };

                // 2. ensure IDs exist
                Object.assign(newRule, this.initializeAppIdsInRuleObj(app, newRule))
                // 3. ensure config exists, set to app default if undefined
                Object.assign(newRule, this.initializeAppConfigIdsInRuleConfigObj(app, newRule.config))
                // 4. submit 
                // no need to check and clean up tags as we have not received any input from the user
                // so everything is controlled and "sterile"
                app.inputs.forEach((input) => {
                    if (input.multi) newRule.input_multicount[input.id] = "1"; // sane default
                })

                removeUndefinedOrNullProperties(newRule.input_project_override);
                removeUndefinedOrNullProperties(newRule.input_subject);
                removeUndefinedOrNullProperties(newRule.input_multicount);
                removeUndefinedOrNullProperties(newRule.input_session);

                const finalRuleToCreate = newRule;
                newRules.push(finalRuleToCreate)
            });

            const _res = await Promise.all(newRules.map((newRule) => this.$http.post(`rule`, newRule)));
            this.$notify({ text: `Successfully created DWI Pipeline`, type: 'success' });
        })
    },

    destroyed() {
        this.$root.$off("rule.edit");
        this.$root.$off("create_pipeline")
    },
    methods: {
        changeApp(selectedApp){
            this.rule.app = selectedApp;
            this.rule.branch = (this.rule.app && this.rule.app.github_branch) ? this.rule.app.github_branch : null;
            this.rule = Object.assign(
                {},
                this.rule,
                getEmptyIOConfigObj(),
                { config: this.initializeAppConfigIdsInRuleConfigObj(this.rule.app.config, this.rule.config) }
            );
            this.rule = Object.assign({}, this.rule, this.initializeAppIdsInRuleObj(this.rule.app, this.rule))
        },
        initializeAppIdsInRuleObj(ruleApp, rule) {
            if(!ruleApp || !rule) return rule;

            ruleApp.inputs.forEach((input)=> {
                if(!rule.input_tags[input.id]) Vue.set(rule.input_tags, input.id, []);
                if(!rule.input_project_override[input.id]) Vue.set(rule.input_project_override, input.id, null);
                if(!rule.input_subject[input.id]) Vue.set(rule.input_subject, input.id, null);
                if(!rule.input_session[input.id]) Vue.set(rule.input_session, input.id, null);
                if(!rule.input_multicount[input.id]) Vue.set(rule.input_multicount, input.id, null);
                if(!rule.extra_datatype_tags[input.id]) Vue.set(rule.extra_datatype_tags, input.id, []);
                //make all optional field optional by default
                if(rule.input_selection[input.id] === undefined && input.optional) Vue.set(rule.input_selection, input.id, 'ignore');
            });
            ruleApp.outputs.forEach((output) => {
                if(!rule.output_tags[output.id]) Vue.set(rule.output_tags, output.id, [ composeOutputTag(rule.name) ]);
                if(!rule.archive[output.id]) Vue.set(rule.archive, output.id, { do: output.archive, desc: "" });
            });

            return rule;
        },
        initializeAppConfigIdsInRuleConfigObj(appConfig, ruleConfig) {
            if(!appConfig || !ruleConfig) return ruleConfig;
            for (var appConfigKey in appConfig) {
                if(ruleConfig[appConfigKey] === undefined) {
                    Vue.set(ruleConfig, appConfigKey, appConfig[appConfigKey].default);
                }
            }
            return ruleConfig;
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
        ok(modal) {
            modal.preventDefault();
            this.submit(); 
        },

        submit() {
            //clean up _tags, and input_project_override that shouldn't exist
            var input_ids = this.rule.app.inputs.map(it=>it.id);
            var output_ids = this.rule.app.outputs.map(it=>it.id);
            var input_tags = {};
            var output_tags = {};
            var input_subject = {};
            var input_multicount = {};
            var input_session = {};
            var input_project_override = {};

            ////////////////////////////////////////////////////////////////////////////////////////
            //
            // validate
            //
            let valid = true;
            input_ids.forEach(id=>{
                const input = this.rule.app.inputs.find(input=>input.id == id);
                if(input.multi && !this.rule.input_multicount[id]) {
                    this.$notify({text: "Please specify multi input count for "+id, type: 'error'});
                    valid = false;
                }
            });
            if(!valid) return;
            //
            ////////////////////////////////////////////////////////////////////////////////////////

            input_ids.forEach(id=>{
                //if(this.rule.input_tags[id].length > 0) input_tags[id] = this.rule.input_tags[id];
                input_tags[id] = this.rule.input_tags[id];

                input_subject[id] = this.rule.input_subject[id];
                input_multicount[id] = this.rule.input_multicount[id];
                input_session[id] = this.rule.input_session[id];
                input_project_override[id] = this.rule.input_project_override[id];
            });

            removeUndefinedOrNullProperties(input_project_override);
            removeUndefinedOrNullProperties(input_subject);
            removeUndefinedOrNullProperties(input_multicount);
            removeUndefinedOrNullProperties(input_session);

            output_ids.forEach(id=>{
                //if(this.rule.output_tags[id].length > 0) output_tags[id] = this.rule.output_tags[id];
                output_tags[id] = this.rule.output_tags[id];
            });

            //remove config that doesn't belong to specified app (or input)
            for(var k in this.rule.config) {
                var spec = this.rule.app.config[k];
                if(spec === undefined || spec.type == "input") delete this.rule.config[k];
            }

            //construct the final rule and submit
            var rule = Object.assign({}, this.rule, {
                input_tags,
                output_tags,
                input_project_override,
                input_subject,
                input_multicount,
                input_session,
                app: this.rule.app._id, //unpopulate
            });

            //now ready to submit!
            if(rule._id) {
                //update
                this.$http.put('rule/'+rule._id, rule).then(res=>{
                    this.$notify({text: "Successfully updated a rule", type: "success"});
                    this.$root.$emit('bv::hide::modal', 'modal-rule')
                    this.cb(null, res.data);
                }).catch(this.notify_error);
            } else {
                //create
                this.$http.post('rule', rule).then(res=>{
                    console.log({rule})
                    this.$notify({text: "Successfully created a new rule. You must activate it so that it will run", type: "success"});
                    this.$root.$emit('bv::hide::modal', 'modal-rule')
                    this.cb(null, res.data);
                }).catch(this.notify_error);
            }
        },
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

