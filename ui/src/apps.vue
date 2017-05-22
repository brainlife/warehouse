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
    <div class="ui pusher">
        <div class="page-content">
        <div v-if="!apps" style="margin: 40px;"><h3>Loading ..</h3></div>
        <div class="margin20" v-if="apps">
            <div v-for="app in apps" key="app._id" class="card">
                <app :app="app"></app><br>
            </div>
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
            apps: null,
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
.card {
    width: 325px; 
    float: left;
    margin-right: 10px;
}
</style>
