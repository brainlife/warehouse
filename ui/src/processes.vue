<template>
<div>
    <pageheader :user="config.user">
        <el-row :gutter="20">
            <el-col :span="14">
                <el-input icon="search" v-model="query" placeholder="Search ..."></el-input>
            </el-col>
            <el-col :span="10">
                <el-button @click="newprocess()" icon="plus">New Process</el-button>
            </el-col>
        </el-row>
    </pageheader>
    <sidemenu active="/processes"></sidemenu>
    <div class="page-content">
        <div v-if="!instances">
            <h2 style="margin: 50px;">Loading ...</h2>
        </div>
        <el-table v-if="instances" :data="instances" style="width: 100%;" 
            @row-click="click" row-class-name="clickable-row">
            <el-table-column label="Create Date" prop="create_date">
                <template scope="scope">
                    <time>{{scope.row.create_date|date}}</time>
                </template>
            </el-table-column> 
            <el-table-column label="Process Status" prop="status">
                <template scope="scope">
                    <statustag :status="scope.row.status"></statustag>
                </template>
            </el-table-column> 
            <!--
            <el-table-column label="Application">
                <template scope="scope">
                    <div v-if="scope.row.config.prov">
                        {{apps[scope.row.config.prov.app].name}}
                    </div>
                </template>
            </el-table-column> 
            -->
            <el-table-column label="Type">
                <template scope="scope">
                     {{scope.row.config.type}}
                    <small class="text-muted" v-if="scope.row.config.type == 'simple'">
                        {{apps[scope.row.config.prov.app].name}}
                    </small> 
                </template>
            </el-table-column> 
            <el-table-column label="Description" prop="desc"></el-table-column> 
            <el-table-column label="Archived Datasets">
                <template scope="scope">
                    <!-- normal process -->
                    <el-tag type="success" v-if="scope.row.config.dataset_ids">
                        <icon name="check"></icon> Archived 
                        <b v-if="scope.row.config.dataset_ids.length>1">
                            {{scope.row.config.dataset_ids.length}}
                        </b>
                    </el-tag>
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
import statustag from '@/components/statustag'

export default {
    components: { sidemenu, pageheader, statustag },
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
            find: JSON.stringify({ removed: false }),
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
                }),
                limit: 2000,
                sort: '-create_date',
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
            //TODO - really bad way of telling difference between process or workflow
            switch(instance.config.type) {
            case "simple": 
                this.$router.push("/simpleprocess/"+instance._id); break;
            case "v1": 
                this.$router.push("/process/"+instance._id); break;
            case "v2": 
                this.$router.push("/process2/"+instance._id); break;
            default:
                alert("unknown process type");
            }
        },

        newprocess: function() {
            this.$http.post(Vue.config.wf_api+'/instance', {
                //name: "brainlife.process",
                config: {
                    brainlife: true,
                    type: "v2",
                },
            }).then(res=>{
                var instance = res.body;
                this.$router.push("/process2/"+instance._id);
            });
        },
    },
}

</script>

<style scoped>
</style>

