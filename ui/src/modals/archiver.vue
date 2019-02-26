<template>
<b-modal v-if="output" :no-close-on-backdrop='true' title="Archive Dataset" ref="archiver" size="lg" @ok="submit">
    <h5><datatypetag :datatype="output.datatype" :tags="output.datatype_tags"/></h5>

    <b-form-group>
        <b-form-textarea v-model="output.desc" placeholder="Enter Description" :rows="2" style="width: 100%;"></b-form-textarea>
    </b-form-group>

    <b-form-group label="Project">
        <projectselecter :required="true" :canwrite="true" v-model="project" placeholder="Project to archive this dataset to"/>
    </b-form-group>

    <b-form-group label="Dataset Tags">
        <tageditor placeholder="Optional" v-model="tags" :options="other_tags"/>
    </b-form-group>

    <b-form-group label="Metadata">
        <editor v-model="_meta" @init="editorInit" lang="json" height="100"></editor>
    </b-form-group>
</b-modal>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'
import projectselecter from '@/components/projectselecter'
import tageditor from '@/components/tageditor'
import datatypetag from '@/components/datatypetag'

export default {

    components: { 
        projectaccess, projectselecter, tageditor, datatypetag, 
        editor: require('vue2-ace-editor'),
    },

    data() {
        return {
            project: null,
            task: null,
            output: null,

            other_tags: [],
            tags: [],

            _meta: "",

            config: Vue.config,
        }
    },

    watch: {
        output() {
            this.load_tags();
        },
        project() {
            this.load_tags();
        },
    },
    
    created: function() {
        //{task, output}}
        this.$root.$on("archiver.show", opt=>{

            this.task = opt.task;
            this.output = Object.assign({}, opt.output);

            //add tags specified in task.product.tags to dataset tags
            this.tags = opt.output.tags||[];
            if(this.task.product && this.task.product.tags) {
                this.task.product.tags.forEach(tag=>{
                    if(!~this.tags.indexOf(tag)) this.tags.push(tag);
                });
            }
            this._meta = JSON.stringify(this.output.meta, null, 4);

            //wait for b-modal v-if flag to be triggered
            this.$nextTick(()=>{
                this.$refs.archiver.show();
            });
        });
    },

    destroyed() {
        //to prevent wierd things from happening during debugging?
        this.$root.$off("archiver.show");
    },

    methods: {
        submit(evt) {
            evt.preventDefault();

            //TODO - project should be a required field, but somehow form validation isn't fireing. 
            //maybe because it's modal?
            if(!this.project) {
                this.$notify({text: "Please select project", type: "error"});
                return;
            }

            //try parsing _meta
            var meta = null;
            try {   
                meta = JSON.parse(this._meta);
            } catch(err) {
                console.error(err);
                this.$notify({text: "Failed to parse meta", type: "error"});
                return;
            }

            this.$http.post('dataset', {
                project: this.project,                 
                task_id: this.task._id,
                output_id: this.output.id, 
                subdir: this.output.subdir, //subdir that contains the actual content under the task

                meta,
                desc: this.output.desc,
                tags: this.tags, 

                await: false, //request to not wait for dataset to be archived before returning
            }).then(res=>{
                this.$root.$emit('archiver.submit', res.data);
                this.$notify({text: "Archiving requested.."});
                this.$refs.archiver.hide();
            }).catch(err=>{
                console.error(err);
                this.$notify({text: err, type: "error"});
            });
        },
        editorInit() {
            require('brace/mode/json')
            //require('brace/theme/chrome')
        },

        load_tags() {
            if(!this.project || !this.output) return;

            //console.log("reloading tags", this.project, this.output.datatype);
            //load dataset tags used on other datasets on this project
            this.$http.get('dataset/distinct', {params: {
                find: JSON.stringify({
                    project: this.project,
                    datatype: this.output.datatype,
                }),
                distinct: 'tags',
            }}).then(res=>{
                this.other_tags = res.data;
            });
        }
    },
}
</script>
<style scoped>
</style>
