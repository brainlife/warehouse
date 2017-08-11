<template>
<el-form label-width="180px">
    <el-form-item label="Dataset Desc">
        <el-input type="textarea" v-model="desc" placeholder="Dataset Desc"></el-input>
    </el-form-item>
    <el-form-item label="Project">
        <projectselecter v-model="project"/>
        <p class="text-muted" style="margin-bottom: 0px;">Project where you'd like to store this datasets</p>
    </el-form-item>
    <el-form-item label="User Tags (optional)">
        <el-select v-model="tags" 
            style="width: 100%"
            multiple filterable allow-create placeholder="Enter tags">
            <el-option v-for="tag in tags" key="tag" :label="tag" :value="tag"></el-option>
        </el-select>
        <p class="text-muted" style="margin-bottom: 0px;">Any tags you'd like to add to this dataset to make it easier to search / organize</p>
    </el-form-item>
    <!--
    <el-form-item label="DataType Tags">
        <el-select v-model="datatype_tags" 
            style="width: 100%"
            multiple filterable allow-create disabled placeholder="No datatype tags">
            <el-option v-for="tag in datatype_tags" key="tag" :label="tag" :value="tag"></el-option>
        </el-select>
        <p class="text-muted" style="margin-bottom: 0px;"><b>Read-only</b> Datatype tags specified by the application configuration.</p>
    </el-form-item>
    -->
    <el-form-item label="Metadata">
        <div v-for="(v,k) in meta">
            <el-input placeholder="Please input" v-model="meta[k]">
                <template slot="prepend">{{k|uppercase}}</template>
            </el-input>
        </div>
        <p class="text-muted" style="margin-bottom: 0px;">Datatype specific Key/value pairs to describes hierarchy for this dataset</p>
    </el-form-item>
    <el-form-item>
        <el-button @click="cancel()">Cancel</el-button>
        <el-button type="primary" icon="check" @click="submit()">Archive</el-button>
    </el-form-item>
</el-form>
</template>

<script>
import Vue from 'vue'

import projectaccess from '@/components/projectaccess'
import projectselecter from '@/components/projectselecter'

export default {
    components: { projectaccess, projectselecter },

    props: {
        instance: {required: true}, 
        task: {required: true},  //output task
        dataset: {required: true}, 
        app_id: {required: true},
        output_id: {required: true},
        datatype: {required: true},
    },

    data() {
        return {
            project: null,
            tags: [],
            meta: {},
            desc: this.instance.desc, //default
        }
    },
    
    mounted: function() {
        this.files = {};

        //I need to prefix file path with output_id
        this.datatype.files.forEach(file=>{
            this.files[file.id] = this.output_id+"/"+(file.filename||file.dirname);
        });

        for(var k in this.dataset.meta) {
            Vue.set(this.meta, k, this.dataset.meta[k]);
        }
    },

    methods: {
        submit: function() {
            this.$http.post('dataset', {
                project: this.project,
                instance_id: this.instance._id,
                task_id: this.task._id,

                app_id: this.app_id,
                datatype: this.dataset.datatype,
                datatype_tags: this.dataset.datatype.tags,
                files: this.files,

                meta: this.meta,
                desc: this.desc,
                tags: this.tags,
            }).then(res=>{
                //update instance to store dataset_ids
                if(!this.instance.config.dataset_ids) this.instance.config.dataset_ids = []; 
                this.instance.config.dataset_ids.push(res.body._id);
                this.$http.put(Vue.config.wf_api+'/instance/'+this.instance._id, {
                    config: this.instance.config,
                }).then(res=>{
                    this.$notify({ type: 'success', text: 'Successfully archived datasets ', });
                    this.$emit('submitted', this.dataset);
                }).catch(console.error);

                //TODO - Maybe I should store this somewhere else?
                //update task to store 
                this.dataset.dataset_id = res.body._id;
                delete this.dataset.archiving;
                this.task.config._prov.output_datasets[this.output_id] = this.dataset;
                this.$http.put(Vue.config.wf_api+'/task/'+this.task._id, {
                    config: this.task.config,
                }).then(res=>{
                    console.log("updated output task", res);
                });
            });
        },
        cancel: function() {
            this.$emit('submitted', this.dataset);
        }
    },
}
</script>
