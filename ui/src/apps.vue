<template>
<div>
    <pageheader :user="config.user">
        <!--pageheader slot-->
        <el-row :gutter="20">
            <el-col :span="14">
                <el-input icon="search" v-model="query" placeholder="Search ..."></el-input>
            </el-col>
            <el-col :span="10">
                <el-button @click="go('/app/_/edit')" icon="plus">Register App</el-button>
            </el-col>
        </el-row>
    </pageheader>
    <sidemenu active="/apps"></sidemenu>
    <div class="page-content">
        <div v-if="!app_groups" style="margin: 40px;"><h3>Loading ..</h3></div>
        <div v-for="(apps, tag) in app_groups" key="tag" class="margin20">
            <h2 class="group-title">{{tag}}</h2> 
            <div v-for="app in apps" key="app._id" class="app">
                <app :app="app" :descheight="130"></app>
            </div>
            <br clear="both">
        </div>
    </div><!--page-content-->
</div><!--root-->
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'
import pageheader from '@/components/pageheader'
import app from '@/components/app'

export default {
    components: { sidemenu, pageheader, app },
    data () {
        return {
            app_groups: null,
            query: "",

            config: Vue.config,
        }
    },

    created: function() {
        this.$http.get('app', {params: {
            find: JSON.stringify({
                $or: [
                    { removed: false },
                    { removed: {$exists: false }},
                ]
            })
        }})
        .then(res=>{
            //organize apps into various tags
            this.app_groups = {};
            res.body.apps.forEach(app=>{
                var tags = [ 'miscellaneous' ];
                if(app.tags && app.tags.length > 0) tags = app.tags;
                tags.forEach(tag=>{
                    if(!this.app_groups[tag]) this.app_groups[tag] = [];
                    this.app_groups[tag].push(app);
                });
            });
        }, res=>{
            console.error(res);
        });
    },

    methods: {
        go: function(path) {
            this.$router.push(path);
        }
    },
}
</script>

<style scoped>
.el-card {
    border: none;
    box-shadow: 0 0 3px #aaa;
}
.group-title {
    color: #999;
    text-transform: uppercase;
    padding-bottom: 10px;
    border-bottom: 1px solid #ddd;
}
.app {
margin-right: 10px;
margin-bottom: 10px;
width: 350px;
float: left;
}
</style>
