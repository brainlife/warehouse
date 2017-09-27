<template>
<!-- this is going to take a while..
<b-form @submit="submit">
    <b-container>
        <b-row>
            <b-col><label>Dataset Description</label></b-col>
            <b-col>
                <b-form-textarea v-model="desc" placeholder="Enter Description"/>
            </b-col>
        </b-row>
    </b-container>
</b-form>
-->

<div class="archiveform">
    <el-form label-width="150px">
        <el-form-item label="Dataset Desc">
            <el-input type="textarea" v-model="desc" placeholder="Dataset Desc"></el-input>
        </el-form-item>
        <br>

        <el-form-item label="Project">
            <projectselecter v-model="project"/>
            <p class="text-muted" style="margin-bottom: 0px;">Project where you'd like to store this datasets</p>
        </el-form-item>
        <br>

        <el-form-item label="User Tags (optional)">
            <el-select v-model="tags" 
                style="width: 100%"
                multiple filterable allow-create placeholder="Enter tags">
                <el-option v-for="tag in tags" key="tag" :label="tag" :value="tag"></el-option>
            </el-select>
            <p class="text-muted" style="margin-bottom: 0px;">Any tags you'd like to add to this dataset to make it easier to search / organize</p>
        </el-form-item>
        <br>

        <el-form-item label="Metadata">
            <div v-for="(v,k) in output.meta">
                <el-input placeholder="Please Edit meta" v-model="output.meta[k]">
                    <template slot="prepend">{{k|uppercase}}</template>
                </el-input>
            </div>
            <p class="text-muted" style="margin-bottom: 0px;">Datatype specific Key/value pairs to describes hierarchy for this dataset</p>
        </el-form-item>
        <br>

        <el-form-item label=" ">
            <el-button @click="cancel()">Cancel</el-button>
            <el-button type="primary" icon="check" @click="submit()">Archive</el-button>
        </el-form-item>
        <br>
    </el-form>
</div>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'
import projectselecter from '@/components/projectselecter'

export default {
    props: {
        task: {required: true},
        output: {required: true},
    },

    components: { projectaccess, projectselecter },
    data() {
        return {
            desc: this.output.desc,
            project: null,
            tags: this.task.product.tags,
        }
    },
    
    mounted: function() {
    },

    methods: {
        submit: function() {
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
margin-bottom: 5px;
padding: 7px;
background-color: #f8f8f8;
}
</style>
