<template>
<b-form @submit="submit" v-if="ready">
    <div class="margin20">
        <!--{{rule._id||'new rule'}}-->
        <b-form-group label="name *" horizontal>
            <b-form-input required v-model="rule.name" type="text" placeholder="title of the paper"></b-form-input>
        </b-form-group>
        <b-form-group label="app *" horizontal>
            <v-select required v-model="rule.app" label="name" :options="apps" @search="search_app">
                <span slot="no-options">please enter app name / desc to search</span>
                <template slot="option" slot-scope="app">
                    <app :app="app" :compact="true" :clickable="false"/>
                </template>
            </v-select>
        </b-form-group>
        <div v-if="rule.app">
            <b-form-group label="configuration" horizontal>
                <!--
                <b-form-textarea id="needed" v-model="config" :rows="3" placeholder="application configuration"></b-form-textarea>
                <small class="text-muted">configuration to use to submit this application (in json)</small>
                -->
                <!--<p class="text-muted">configuration used to submit the app</p>-->
                <b-card>
                    <configform :spec="rule.app.config" v-model="rule.config"/>
                </b-card>
            </b-form-group>
            <b-form-group label="inputs" horizontal>
                <p class="text-muted">look for subjects that has the following input datasets.</p>
                <b-card v-for="input in rule.app.inputs" :key="input._id" class="card">
                    <div slot="header">
                        <small class="text-muted" style="float: right">{{input.id}}</small>
                        <datatypetag :datatype="input.datatype" :tags="input.datatype_tags"/>
                    </div>
                    <b-row>
                        <b-col>tags</b-col>
                        <b-col :cols="9">
                            <tageditor v-model="rule.input_tags[input.id]" placeholder="(any tags)"/>
                            <small class="text-muted">look for datasets with specific tags</small>
                        </b-col>
                    </b-row> 
                    <br>
                    <b-row>
                        <b-col>project</b-col>
                        <b-col :cols="9">
                            <projectselecter v-model="rule.input_project_override[input.id]" :allownull="true" placeholder="(from this project)"/>
                            <small class="text-muted">look for datasets in this project</small>
                        </b-col>
                    </b-row> 
                </b-card>
            </b-form-group>

            <b-form-group label="outputs" horizontal>
                <p class="text-muted">submit app if following dataset <b>does not</b> exist.</p>
                <b-card v-for="output in rule.app.outputs" :key="output._id" class="card">
                    <div slot="header">
                        <small class="text-muted" style="float: right">{{output.id}}</small>
                        <datatypetag :datatype="output.datatype" :tags="output.datatype_tags"/>
                    </div>
                    <b-row>
                        <b-col>tags</b-col>
                        <b-col :cols="9"><tageditor v-model="rule.output_tags[output.id]" placeholder="(any tags)"/></b-col>
                    </b-row>
                </b-card>
            </b-form-group>
        </div>
        <b-form-group label="subject filtering" horizontal>
            <p class="text-muted">only process subjects that match following regex</p>
            <b-form-input v-model="rule.subject_match" type="text" placeholder="regex to match subject name"></b-form-input>
            <small class="text-muted">for example, "^100" will make this rule to only process subjects that starts with 100.</small>
        </b-form-group>
        <b-form-group horizontal>
            <b-form-checkbox v-model="rule.active">active</b-form-checkbox>
        </b-form-group>
    </div>
    <br>
    <br>
    <br>
    <div class="form-action">
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

        "rule.app": function() {
            this.ensure_ids_exists();
            this.ensure_config_exists();
        },
    },

    data() {
        return {
            rule: {},

            apps: [],
            ready: false,
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
            for(var k in this.rule.app.config) {
                if(this.rule.config[k] === undefined) {
                    Vue.set(this.rule.config, k ,this.rule.app.config[k].default);
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

            //remove config that doesn't belong to specified app
            for(var k in this.rule.config) {
                if(this.rule.app.config[k] === undefined) delete this.rule.config[k];
            }

            //construct the final rule and submit
            var rule = Object.assign(this.rule, {
                input_tags,
                output_tags,
                input_project_override,
            });
            console.dir(rule);
            this.$emit("submit", rule);
        },


        search_app: function(search, loading) {
            loading = true;
            this.apps = [];
            clearTimeout(debounce);
            debounce = setTimeout(()=>{
                this.$http.get('app', {params: {
                    find: JSON.stringify({
                        /*
                        $or: [
                            { name: {'$regex': search, '$options': 'i' }},
                            { desc: {'$regex': search, '$options': 'i' }},
                            { service: {'$regex': search, '$options':  'i' }},
                        ],
                        */
                        $text: {$search: search},
                        removed: false,
                    }),
                    populate: 'inputs.datatype outputs.datatype contributors', //to display app detail
                }})
                .then(res=>{
                    //organize apps into various tags
                    this.apps = res.body.apps;
                });
            }, 300);
        } 
    }
}
</script>

<style scoped>
.card:not(:first-of-type) {
border-top: none;
}
.form-action {
text-align: right; 
position: fixed; 
right: 0px; 
left: 350px; 
bottom: 0px; 
padding: 10px 30px;
background-color: rgba(100,100,100,0.4);
}
</style>
