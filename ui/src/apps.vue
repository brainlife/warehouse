<template>
<div>
    <pageheader>
        <!--pageheader slot-->
        <!--
        <el-input icon="search" v-model="query" placeholder="Search ..."></el-input>
        -->
    </pageheader>
    <sidemenu active="/apps"></sidemenu>
    <div class="group-list">
        <h4>Apps</h4>
        <p v-for="(apps, tag) in app_groups" :key="tag" class="item" @click="jump(tag)">
            {{tag}}
        </p>
    </div>
    <div class="page-content">
        <div v-if="!app_groups" style="margin: 40px;"><h3>Loading ..</h3></div>
        <div v-for="(apps, tag) in app_groups" :key="tag" :id="tag">
            <h4 class="group-title">{{tag}}</h4> 
            <div v-for="app in apps" :key="app._id" class="app">
                <app :app="app" descheight="130px" devsheight="75px"></app>
            </div>
            <br clear="both">
        </div>
        <b-button v-if="config.user" class="button-fixed" @click="go('/app/_/edit')" title="Register App"><icon name="plus" scale="2"/></b-button>
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
            }),
            populate: 'inputs.datatype outputs.datatype contributors',
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
        },
        jump: function(tag) {
            document.location="#"+tag;
        },
    },
}
</script>

<style scoped>
.group-title {
color: #999;
text-transform: uppercase;
padding: 15px 20px;
border-bottom: solid 1px #eee;
margin-bottom: 10px;
background-color: white;
position: sticky;
top: 0px;
z-index: 1;
}
.app {
margin-right: 10px;
margin-bottom: 10px;
width: 350px;
float: left;
}
.page-content {
margin-left: 250px;
}
.group-list {
position: fixed;
top: 50px;
bottom: 0px;
left: 90px;
width: 250px;
background-color: #444;
}
.group-list h4 {
font-size: 18px;
padding: 20px 10px;
text-transform: uppercase;
margin-bottom: 0px;
color: #999;
}
.group-list .item {
text-transform: uppercase;
padding: 5px 10px;
margin-bottom: 0px;
font-size: 85%;
color: white;
transition: background-color 1s;
}
.group-list .item:hover {
cursor: pointer;
background-color: black;
}
</style>

