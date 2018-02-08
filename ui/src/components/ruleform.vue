<template>
<b-form @submit="submit" v-if="ready">
    <!--{{rule._id||'New Rule'}}-->
    <b-form-group label="Name *" horizontal>
        <b-form-input required v-model="rule.name" type="text" placeholder="Title of the paper"></b-form-input>
    </b-form-group>
    <b-form-group horizontal>
        <b-form-checkbox v-model="rule.active">Active</b-form-checkbox>
    </b-form-group>
    <b-form-group label="App *" horizontal>
        <v-select required v-model="rule.app" label="name" :options="apps" @search="search_app">
            <template slot="option" slot-scope="app">
                <app :app="app" :compact="true" :clickable="false"/>
            </template>
        </v-select>
    </b-form-group>
    <div v-if="rule.app">
        <b-form-group label="Inputs" horizontal>
            <p class="text-muted">Look for subjects that has the following input datasets.</p>
            <b-card v-for="input in rule.app.inputs" :key="input._id" class="card">
                <div slot="header">
                    <small class="text-muted" style="float: right">{{input.id}}</small>
                    <datatypetag :datatype="input.datatype" :tags="input.datatype_tags"/>
                </div>
                <b-row>
                    <b-col>Tags</b-col>
                    <b-col :cols="9">
                        <tageditor v-model="rule.input_tags[input.id]" placeholder="(Any Tags)"/>
                        <small class="text-muted">Look for datasets with specific tags</small>
                    </b-col>
                </b-row> 
                <br>
                <b-row>
                    <b-col>Project</b-col>
                    <b-col :cols="9">
                        <projectselecter v-model="rule.input_project_override[input.id]" :allownull="true" placeholder="(From This Project)"/>
                        <small class="text-muted">Look for datasets in this project</small>
                    </b-col>
                </b-row> 
            </b-card>
        </b-form-group>

        <b-form-group label="Outputs" horizontal>
            <p class="text-muted">Submit app if following dataset <b>does not</b> exist.</p>
            <b-card v-for="output in rule.app.outputs" :key="output._id" class="card">
                <div slot="header">
                    <small class="text-muted" style="float: right">{{output.id}}</small>
                    <datatypetag :datatype="output.datatype" :tags="output.datatype_tags"/>
                </div>
                <b-row>
                    <b-col>Tags</b-col>
                    <b-col :cols="9"><tageditor v-model="rule.output_tags[output.id]" placeholder="(Any Tags)"/></b-col>
                </b-row>
            </b-card>
        </b-form-group>
    </div>
    <b-form-group label="Subject Filtering" horizontal>
        <p class="text-muted">Only process subjects that match following regex</p>
        <b-form-input v-model="rule.subject_match" type="text" placeholder="regex to match subject name"></b-form-input>
        <small class="text-muted">For example, "^100" will make this rule to only process subjects that starts with 100.</small>
    </b-form-group>
    <b-form-group label="Configuration" horizontal>
        <b-form-textarea id="needed" v-model="config" :rows="3" placeholder="Application configuration"></b-form-textarea>
        <small class="text-muted">Configuration to use to submit this application (in json)</small>
    </b-form-group>

    <hr>
    <div style="float: right">
        <slot/>
        <b-button type="button" @click="cancel">Cancel</b-button>
        <b-button type="submit" variant="primary">Submit</b-button>
    </div>
    <br>
    <br>
    <br>
</b-form>
</template>

<script>
import Vue from 'vue'

import vSelect from 'vue-select'
import datatypetag from '@/components/datatypetag'
import app from '@/components/app'
import tageditor from '@/components/tageditor'
import projectselecter from '@/components/projectselecter'

export default {
    props: {
        value: { type: Object },
    },

    components: { 
        projectselecter, vSelect, datatypetag,
        app, tageditor, 
    },

    watch: {
        value: function() {
            this.load_value();
        },

        "rule.app": function() {
            this.ensure_ids_exists();
        },
    },

    data() {
        return {
            config: null,
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
            this.config = JSON.stringify(this.rule.config, null, 4);
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

        cancel: function() {
            this.$emit("cancel");
        },

        submit: function(evt) {
            evt.preventDefault();

            try {
                this.rule.config = JSON.parse(this.config);
            } catch(err) {
                this.$notify({type: "error", text: "Failed to parse configuration: "+err.toString()});
                return;
            }

            //clean up _tags, and input_project_override that shouldn't exist
            var input_ids = this.rule.app.inputs.map(it=>it.id);
            var output_ids = this.rule.app.outputs.map(it=>it.id);
            var input_tags = {};
            var output_tags = {};
            var input_project_override = {};
            input_ids.forEach(id=>{
                input_tags[id] = this.rule.input_tags[id];
                input_project_override[id] = this.rule.input_project_override[id];
            });
            output_ids.forEach(id=>{
                output_tags[id] = this.rule.output_tags[id];
            });
            //override with cleaned up objects
            var rule = Object.assign(this.rule, {
                input_tags,
                output_tags,
                input_project_override,
            });

            this.$emit("submit", rule);
        },


        search_app: function(search, loading) {
            loading = true;
            this.$http.get('app', {params: {
                find: JSON.stringify({
                    $or: [
                        { name: {$regex: search, $options: 'i' }},
                        { service: {$regex: search, $options:  'i' }},
                    ],
                    removed: false,
                }),
                populate: 'inputs.datatype outputs.datatype contributors', //to display app detail
            }})
            .then(res=>{
                //organize apps into various tags
                this.apps = res.body.apps;
            });
        } 
    }
}
</script>

<style scoped>
.card:not(:first-of-type) {
border-top: none;
}
</style>
