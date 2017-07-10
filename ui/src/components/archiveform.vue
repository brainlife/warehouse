<template>
<el-form label-width="180px">
    <!--
    <el-form-item label="Dataset Name">
        <el-input type="text" v-model="form.name" placeholder="Dataset Name"></el-input>
    </el-form-item>
    -->
    <el-form-item label="Dataset Desc">
        <el-input type="textarea" v-model="form.desc" placeholder="Dataset Desc"></el-input>
    </el-form-item>
    <el-form-item label="Project">
        <projectselecter v-model="form.project"/>
        <p class="text-muted" style="margin-bottom: 0px;">Project where you'd like to store this datasets</p>
    </el-form-item>
    <el-form-item label="User Tags (optional)">
        <el-select v-model="form.tags" 
            style="width: 100%"
            multiple filterable allow-create placeholder="Enter tags">
            <el-option v-for="tag in form.tags" key="tag" :label="tag" :value="tag"></el-option>
        </el-select>
        <p class="text-muted" style="margin-bottom: 0px;">Any tags you'd like to add to this dataset to make it easier to search / organize</p>
    </el-form-item>
    <el-form-item label="DataType Tags">
        <el-select v-model="form.datatype_tags" 
            style="width: 100%"
            multiple filterable allow-create disabled placeholder="No datatype tags">
            <el-option v-for="tag in form.datatype_tags" key="tag" :label="tag" :value="tag"></el-option>
        </el-select>
        <p class="text-muted" style="margin-bottom: 0px;"><b>Read-only</b> Datatype tags specified by the application configuration.</p>
    </el-form-item>
    <el-form-item label="Metadata">
        <div v-for="(v,k) in form.meta">
            <el-input placeholder="Please input" v-model="form.meta[k]">
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

    data() {
        return {
            form: {
                instance_id: null,
                task_id: null,
                dirname: null,

                prov: {},
                project: null,
                tags: [],
                meta: {},

                name: null,
                desc: null,
                datatype: null,
                datatype_tags: [],
            }, 
        }
    },

    props: {
        dataset: {required: true}, 
        instance: {required: true}, 
        output_task: {required: true}, 
        app_id: {required: true},
        dataset_id: {required: true},
    },
    
    mounted: function() {
        //needed to pull data
        this.form.instance_id = this.instance._id;
        this.form.task_id = this.output_task._id;

        //deprecated.. (now set app_id and subdir instead)
        this.form.prov = {
            app: this.app_id,
            task_id: this.output_task._id,
            dirname: this.dataset_id,
        }

        this.form.app_id = this.app_id;
        this.form.subdir = this.dataset_id; //output task should create subdir for each dataset_id

        this.form.name = this.dataset.name;
        this.form.desc = this.dataset.desc;
        this.form.datatype = this.dataset.datatype;
        this.form.datatype_tags = this.dataset.datatype_tags;

        for(var k in this.dataset.meta) {
            Vue.set(this.form.meta, k, this.dataset.meta[k]);
        }
    },

    methods: {
        submit: function() {
            this.$http.post('dataset', this.form).then(res=>{
                //update instance to store dataset_ids
                if(!this.instance.config.dataset_ids) this.instance.config.dataset_ids = []; 
                this.instance.config.dataset_ids.push(res.body._id);
                this.$http.put(Vue.config.wf_api+'/instance/'+this.instance._id, {
                    config: this.instance.config,
                }).then(res=>{
                    this.$notify.success({
                        title: 'Success',
                        message: 'Successfully archived datasets ',
                    });
                    this.$emit('submitted', this.dataset);
                    //this.$router.push("/process/"+this.instance._id);
                }).catch(console.error);

                //TODO - Maybe I should store this somewhere else?
                //update task to store 
                this.dataset.dataset_id = res.body._id;
                delete this.dataset.archiving;
                console.log("updating", this.dataset_id, this.dataset);
                this.output_task.config._prov.output_datasets[this.dataset_id] = this.dataset;
                this.$http.put(Vue.config.wf_api+'/task/'+this.output_task._id, {
                    config: this.output_task.config,
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
