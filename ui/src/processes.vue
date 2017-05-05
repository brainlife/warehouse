<template>
<div>
    <pageheader :user="config.user">
        <el-row :gutter="20">
            <el-col :span="14">
                <el-input icon="search" v-model="query" placeholder="Search ..."></el-input>
            </el-col>
            <el-col :span="10">
                <el-button @click="go('/apps')"><icon name="plus"/> New Process </el-button>
            </el-col>
        </el-row>
    </pageheader>
    <sidemenu active="/processes"></sidemenu>
    <div class="page-content">
        <h3 v-if="!instances"> <icon name="spinner"></icon> Loading..  </h3>
        <el-table v-if="instances" :data="instances" style="width: 100%;" @row-click="click" row-class-name="clickable-row">
            <el-table-column label="Create Date" prop="create_date" sortable>
                <template scope="scope">
                    <time>{{scope.row.create_date|date}}</time>
                </template>
            </el-table-column> 
            <el-table-column label="Application">
                <template scope="scope">
                    <div v-if="scope.row.config.prov">
                        {{apps[scope.row.config.prov.app].name}}
                    </div>
                </template>
            </el-table-column> 
            <el-table-column prop="desc" label="Description"/></el-table-column> 
            <el-table-column label="Status" prop="status" sortable>
                <template scope="scope">
                    <el-tag v-if="scope.row.status == 'removed'">
                        <icon name="remove"></icon> Removed</el-tag>
                    <el-tag type="success" v-if="scope.row.status == 'finished'">
                        <icon name="check"></icon> Finished</el-tag>
                    <el-tag type="primary" v-if="scope.row.status == 'running'">
                        <icon name="circle-o-notch" class="fa-spin"></icon> Running</el-tag>
                    <el-tag type="primary" v-if="scope.row.status == 'requested'">
                        <icon name="clock-o"></icon> Requested</el-tag>
                    <el-tag type="danger" v-if="scope.row.status == 'failed'">
                        <icon name="warning"></icon> Failed</el-tag>
                    <el-tag type="warning" v-if="scope.row.status == 'unknown'">
                        <icon name="help"></icon> Failed</el-tag>
                </template>
            </el-table-column> 
            <el-table-column label="Archived">
                <template scope="scope">
                      <el-tag v-if="scope.row.config.dataset_ids || scope.row.config.dataset_id">
                        <icon name="check"></icon> Archived</el-tag>
                </template>
            </el-table-column> 
        </el-table>

        <br>
        <el-card v-if="config.debug">
            <div slot="header">Debug</div>
            <pre v-if="instances" v-highlightjs="JSON.stringify(instances, null, 4)"><code class="json hljs"></code></pre>
        </el-card>
    </div>
</div>
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'

export default {
    components: { sidemenu, pageheader },
    data () {
        return {
            instances: null,

            query: "",
            
            //cache
            //projects: null, //keyed by _id
            apps: null, //keyed by _id

            config: Vue.config,
        }
    },
    mounted: function() {

        //load application details
        this.$http.get('app', {params: {
            /*
            find: JSON.stringify({
                _id: this.$route.params.id,
                "config.brainlife": true,
                status: {$ne: "removed"},
                "config.removing": {$exists: false},
            })
            */
        }})
        .then(res=>{
            this.apps = {};
            res.body.apps.forEach((a)=>{
                this.apps[a._id] = a;
            });

            //then load instances (processes)
            return this.$http.get(Vue.config.wf_api+'/instance', {params: {
                find: JSON.stringify({
                    _id: this.$route.params.id,
                    "config.brainlife": true,
                    status: {$ne: "removed"},
                    "config.removing": {$exists: false},
                })
            }});
        })
        .then(res=>{
            this.instances = res.body.instances;
        }).catch(err=>{
          console.error(err);
        });
    },

    methods: {
        click: function(instance) {
            console.dir(instance);
            //TODO - really bad way of telling difference between process or workflow
            if(instance.config.prov) this.$router.push("/simpleprocess/"+instance._id);
            else this.$router.push("/process/"+instance._id);
        },
        go: function(path) {
            this.$notify.info({
                title: 'Info',
                message: 'Please select application to submit'
            });
            this.$router.push(path);
        }
    },

}

</script>

<style scoped>
</style>

