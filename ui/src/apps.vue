<template>
<div>
    <pageheader :user="config.user"></pageheader>
    <sidemenu active="/apps"></sidemenu>
    <div class="ui pusher">
        <div class="page-content">
        <div class="margin20">
            <el-row :gutter="10">
                <el-col :span="6">
                    <el-input icon="search" v-model="query" placeholder="Search ..."></el-input>
                </el-col>
                <el-col :span="4">
                    <el-button @click="go('/app/_/edit')"> <i class="ui icon add"></i> Register </el-button>
                </el-col>
            </el-row>

            <br>

            <el-row>
                <el-col :span="8" v-for="app in apps" key="app._id">
                    <app :app="app"></app>
                </el-col>
            </el-row>
        </div><!--magin20-->
        </div><!--page-content-->
    </div><!--pusher-->
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
            apps: [],
            query: "",

            config: Vue.config,
        }
    },

    mounted: function() {
        this.$http.get('app', {params: {
            //service: "_upload",
        }})
        .then(res=>{
            this.apps = res.body.apps;
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
</style>
