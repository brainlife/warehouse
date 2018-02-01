<template>
<div class="archiveform">
    <b-form>
        <b-form-group label="Dataset Desc">
            <b-form-textarea v-model="desc" placeholder="Dataset Desc" :rows="3" style="width: 100%;"></b-form-textarea>
        </b-form-group>

        <b-form-group label="Project">
            <projectselecter canwrite="true" v-model="project" placeholder="Project to archive this dataset to"/>
        </b-form-group>

        <b-form-group label="User Tags (optional)">
            <!--
            <el-select v-model="tags" 
                style="width: 100%"
                multiple filterable allow-create placeholder="Enter tags">
                <el-option v-for="tag in tags" key="tag" :label="tag" :value="tag"></el-option>
            </el-select>
            <p class="text-muted" style="margin-bottom: 0px;">Any tags you'd like to add to this dataset to make it easier to search / organize</p>
            -->
            <tageditor v-model="tags"/>
        </b-form-group>

        <b-form-group label="Metadata">
            <div v-for="(v,k) in output.meta">
                <el-input placeholder="Please Edit meta" v-model="output.meta[k]">
                    <template slot="prepend">{{k|uppercase}}</template>
                </el-input>
            </div>
            <p class="text-muted" style="margin-bottom: 0px;">Datatype specific Key/value pairs to describes hierarchy for this dataset</p>
        </b-form-group>

        <div style="float: right">
            <b-button variant="primary" icon="check" @click="submit">Archive</b-button>
            <b-button @click="cancel">Cancel</b-button>
        </div>
        <br clear="both">
    </b-form>
</div>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'
import projectselecter from '@/components/projectselecter'
import tageditor from '@/components/tageditor'

export default {
    props: {
        task: {required: true},
        output: {required: true},
    },

    components: { projectaccess, projectselecter, tageditor },

    data() {
        return {
            desc: this.output.desc,
            project: null,
            tags: [],
        }
    },
    
    mounted: function() {
        if(this.task.product && this.task.product.tags) {
            this.tags = this.task.product.tags;
        }
    },

    methods: {
        submit: function() {
            console.debug("sending archvie request ...");
            this.$http.post('dataset', {
                project: this.project,                 
                app_id: this.task.config._app,
                task_id: this.task._id,
                output_id: this.output.id,
                datatype: this.output.datatype,
                datatype_tags: this.output.datatype_tags,
                subdir: this.output.subdir, //subdir that contains the actual content under the task
                files: this.output.files,
                meta: this.output.meta,
                desc: this.desc,
                tags: this.tags, 
            }).then(res=>{
                this.$emit('done', res.body);
            }).catch(err=>{
                console.error(err);
            });
        },
        cancel: function() {
            this.$emit('done');
        }
    },
}
</script>
<style scoped>
.archiveform {
margin-top: 10px;
padding: 7px;
background-color: #fff;
}
</style>
