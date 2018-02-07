<template>
<b-form @submit="submit" v-if="ready">
    {{rule._id||'new'}}
    <b-form-group horizontal>
        <b-form-checkbox v-model="rule.active">Active</b-form-checkbox>
    </b-form-group>
    <b-form-group label="Name *" horizontal>
        <b-form-input required v-model="rule.name" type="text" placeholder="Title of the paper"></b-form-input>
    </b-form-group>
    <b-form-group label="Subject Filtering" horizontal>
        <b-form-input v-model="rule.subject_match" type="text" placeholder="regex to match for subject"></b-form-input>
        <small class="text-muted">For example, ^100 would make this rule to only process subjects that starts with 100...</small>
    </b-form-group>
    <b-form-group label="Application *" horizontal>
        <v-select required v-model="rule.app" label="name" :options="apps" @search="search_app"></v-select>
    </b-form-group>
    <div v-if="rule.app">
        <b-form-group label="Inputs" horizontal>
            <div v-for="input in rule.app.inputs" :key="input._id">
                <datatypetag :datatype="input.datatype" :tags="input.datatype_tags"/>
            </div>
        </b-form-group>
    </div>
    <b-form-group label="Configuration" horizontal>
        <b-form-textarea v-model="_config" :rows="3" placeholder="Application configuration"></b-form-textarea>
        <small class="text-muted">Configuration to use to submit this application (in json)</small>
    </b-form-group>

    <!--
    <b-form-group label="Description *" horizontal>
        <b-form-textarea v-model="pub.desc" :rows="3" placeholder="A short summary of this dataset/app publication." required></b-form-textarea>
    </b-form-group>
    <b-form-group label="Tags" horizontal>
        <select2 :options="oldtags" v-model="pub.tags" :multiple="true" :tags="true"></select2>
    </b-form-group>
    <b-form-group label="Detail" horizontal>
        <b-form-textarea v-model="pub.readme" :rows="10" placeholder="Any detailed description for this publications. You can enter chars / tables / katex(math equations) etc.."></b-form-textarea>
        <small class="text-muted">in <a href="https://help.github.com/articles/basic-writing-and-formatting-syntax/" target="_blank">markdown format</a></small>
    </b-form-group>
    <b-form-group label="Authors *" horizontal>
        <contactlist v-model="pub.authors"/>
    </b-form-group>
    <b-form-group label="Contributors" horizontal>
        <contactlist v-model="pub.contributors"></contactlist>
    </b-form-group>
    -->

    <pre>{{rule}}</pre>
    <pre>{{_config}}</pre>

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
//import select2 from '@/components/select2'
import projectselecter from '@/components/projectselecter'
import datatypetag from '@/components/datatypetag'

export default {
    components: { 
        //select2, 
        projectselecter, vSelect, datatypetag,
    },

    props: {
        rule: { type: Object },
    },
    data() {
        return {
            _config: "",
            apps: [],
            ready: false,
        }
    },
    
    mounted() {
        //select2 needs option set to show existing tags.. so we copy my own tags and use it as options..
        //this.oldtags = Object.assign(this.pub.tags);

        this._config = JSON.stringify(this.rule.config, null, 4);
        this.load_app_info(()=>{
            this.ready = true;
        });
    },
    
    watch: {
        'rule.app': function() {
            //console.log("rule app updated", this.rule.app);
            this.load_app_inifo();
        },
    },

    methods: {
        cancel: function() {
            this.$emit("cancel");
        },

        submit: function(evt) {
            evt.preventDefault();
            this.$emit("submit", this.rule);
        },


        //populate datatype, and other things we need on the UI
        load_app_info(cb) {
            if(cb) cb();
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
                //populate: 'inputs.datatype outputs.datatype contributors',
            }})
            .then(res=>{
                //organize apps into various tags
                this.apps = res.body.apps;
            });
        } 
    }
}
</script>kkk
