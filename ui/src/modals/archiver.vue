<template>
<b-modal :no-close-on-backdrop='true' title="Archive Dataset" ref="archiver" size="lg" @ok="submit">
    <div v-if="output && task">
        <b-form-group label="Description">
            <b-form-textarea v-model="output.desc" placeholder="Dataset Desc" :rows="3" style="width: 100%;"></b-form-textarea>
        </b-form-group>

        <b-form-group label="Project">
            <projectselecter :required="true" :canwrite="true" v-model="project" placeholder="Project to archive this dataset to"/>
        </b-form-group>

        <b-form-group label="Dataset Tags">
            <tageditor placeholder="optional" v-model="tags" :options="other_tags"/>
        </b-form-group>

        <b-form-group label="Metadata">
            <editor v-model="_meta" @init="editorInit" lang="json" height="100"></editor>
        </b-form-group>
    </div>
</b-modal>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'
import projectselecter from '@/components/projectselecter'
import tageditor from '@/components/tageditor'

export default {

    components: { 
        projectaccess, projectselecter, tageditor,
        editor: require('vue2-ace-editor'),
    },

    data() {
        return {
            project: null,
            task: null,
            output: null,

            other_tags: [],
            tags: [],

            _meta: null,

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
        this.$root.$on("archiver.show", (opt)=>{
            this.task = opt.task;
            this.output = Object.assign({}, opt.output);

            //add tags specified in task.product.tags to dataset tags
            this.tags = opt.output.tags||[];
            if(this.task.product && this.task.product.tags) {
                this.task.product_tags.forEach(tag=>{
                    if(!~tags.indexOf(tag)) tags.push(tag);
                });
            }
            this._meta = JSON.stringify(this.output.meta, null, 4);

            if(!this.$refs.archiver) {
                console.error("archiver ref is missing!... happens after debug refresh?");
                return;
            }
            this.$refs.archiver.show();
        });
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

            let ds = {
                project: this.project,                 
                task_id: this.task._id,
                output_id: this.output.id, 
                subdir: this.output.subdir, //subdir that contains the actual content under the task

                datatype: this.output.datatype,
                datatype_tags: this.output.datatype_tags,
                files: this.output.files,
                meta,
                desc: this.output.desc,
                tags: this.tags, 

                //UI wants these.. temporarily
                /*
                //create_date: new Date(),
                //status: "storing",
                prov: {
                    task_id: this.task._id,
                    output_id: this.output.id,
                },
                */
                await: false, //request to not wait for dataset to be archived before returning
            };

            this.$http.post('dataset', ds).then(res=>{
                this.$root.$emit('archiver.submit', res.body);
                this.$notify({text: "Archiving requested.."});
                this.$refs.archiver.hide();
            }).catch(err=>{
                console.error(err);
                this.$notify({text: err, type: "error"});
            });
        },
        editorInit() {
            require('brace/mode/json')
            require('brace/theme/chrome')
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
                this.other_tags = res.body;
            });
        }
    },
}
</script>
<style scoped>
</style>
