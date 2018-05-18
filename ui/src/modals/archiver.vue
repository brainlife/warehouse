<template>
<b-modal :no-close-on-backdrop='true' title="Archive Dataset" ref="archiver" size="lg" @ok="submit">
    <div v-if="output && task">
        <b-form-group label="Description">
            <b-form-textarea v-model="output.desc" placeholder="Dataset Desc" :rows="3" style="width: 100%;"></b-form-textarea>
        </b-form-group>

        <b-form-group label="Project">
            <projectselecter canwrite="true" v-model="project" placeholder="Project to archive this dataset to"/>
        </b-form-group>

        <b-form-group label="User Tags (optional)">
            <tageditor v-model="tags"/>
        </b-form-group>

        <b-form-group label="Metadata">
            <editor v-model="_meta" @init="editorInit" lang="json" height="100"></editor>
            <!--
            <b-input-group :prepend="k.toUpperCase()" v-for="(v,k) in output.meta" :key="k">
                <b-form-input type="text" v-model="output.meta[k]"/>
            </b-input-group>
            <small class="text-muted">Datatype specific key/value pairs to describes hierarchy for this dataset</small>
            -->
        </b-form-group>

        <!--
        <div style="float: right">
            <b-button @click="cancel">Cancel</b-button>
            <b-button variant="primary" icon="check" @click="submit">Archive</b-button>
        </div>
        <br clear="both">
        -->
    </div>
</b-modal>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'
import projectselecter from '@/components/projectselecter'
import tageditor from '@/components/tageditor'

export default {
    /*
    props: {
        task: {required: true},
        output: {required: true},
    },
    */

    components: { 
        projectaccess, projectselecter, tageditor,
        editor: require('vue2-ace-editor'),
    },

    data() {
        return {
            project: null,
            task: null,
            output: null,
            tags: [],

            _meta: null,

            config: Vue.config,
        }
    },
    
    created: function() {
        this.$root.$on("archiver.show", (opt)=>{
            this.task = opt.task;
            this.output = Object.assign({}, opt.output);
            this.tags = [];
            if(this.task.product && this.task.product.tags) {
                this.tags = this.task.product.tags;
            }
            this._meta = JSON.stringify(this.output.meta, null, 4);
            this.$refs.archiver.show();
        });
    },

    methods: {
        submit: function(evt) {
            evt.preventDefault();

            //try parsing _meta
            var meta = null;
            try {   
                meta = JSON.parse(this._meta);
            } catch(err) {
                console.error(err);
                this.$notify({text: "Failed to parse meta", type: "error"});
                return;
            }

            console.log("submitting dataset");
            this.$http.post('dataset', {
                project: this.project,                 
                //app_id: this.task.config._app,
                task_id: this.task._id,
                output_id: this.output.id, 
                subdir: this.output.subdir, //subdir that contains the actual content under the task

                datatype: this.output.datatype,
                datatype_tags: this.output.datatype_tags,
                files: this.output.files,
                meta,
                desc: this.output.desc,
                tags: this.tags, 
            }).then(res=>{
                this.$root.$emit('archiver.submit', res.body);
                this.$refs.archiver.hide();
            }).catch(err=>{
                console.error(err);
            });
        },
        editorInit: function() {
            require('brace/mode/json')
            require('brace/theme/chrome')
        },
    },
}
</script>
<style scoped>
</style>
