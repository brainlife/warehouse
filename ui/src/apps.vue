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
        <h4>Categories</h4>
        <p v-for="tag in sorted_tags" class="item" :class="{'active': active == tag}" @click="jump(tag)">
            {{tag}}
        </p>
        <br>
        <div style="position: fixed; bottom: 0px;">
            <div class="button" style="margin: 5px; color: gray;" @click="go('/appsgraph')">
                <icon name="code-branch"/>
            </div>
        </div>
    </div>
    <div class="page-content" v-on:scroll="update_active" ref="scrolled">
        <div v-if="!app_groups" style="margin: 40px;"><h3>Loading ..</h3></div>
        <div v-for="tag in sorted_tags" :id="tag">
            <h4 class="group-title">{{tag}}</h4> 
            <div v-for="app in app_groups[tag]" :key="app._id" class="app">
                <app :app="app" height="250px"></app>
            </div>
            <br clear="both">
        </div>

        <!--
        <div class="relationships" style="position: relative;">
            <h3 style="position: absolute; top: 10px; left: 10px; color: #ddd;">Relationships (experimental)</h3>
            <div ref="vis" style="height: 500px; background-color: #fff;"/>
        </div>
        -->

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
            active: null,
            sorted_tags: [], 
            app_groups: null,
            query: "",
            config: Vue.config,
        };
    },

    created: function() {
        this.$http.get('app', {params: {
            find: JSON.stringify({
                $or: [
                    { removed: false },
                    { removed: {$exists: false }},
                ]
            }),
            limit: 500, //TODO - paging?
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
                    if(!~this.sorted_tags.indexOf(tag)) this.sorted_tags.push(tag);
                    this.app_groups[tag].push(app);
                });
            });
            this.sorted_tags.sort();

            this.$nextTick(()=>{
                if(document.location.hash) {
                    this.jump(document.location.hash.substring(1));
                }
                this.update_active();
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
        update_active: function() {
            //this.active = "test";
            var scrolltop = this.$refs.scrolled.scrollTop;
            this.active = false;
            this.sorted_tags.forEach(tag=>{
                var e = document.getElementById(tag);
                if(e.offsetTop <= scrolltop) this.active = tag;
            });
        },
    },
}
</script>

<style scoped>
.group-title {
color: #999;
text-transform: uppercase;
padding: 15px 20px;
margin-bottom: 10px;
background-color: white;
position: sticky;
top: 0px;
z-index: 1;
}
.app {
margin-left: 10px;
margin-bottom: 10px;
width: 350px;
float: left;
}
.page-content {
margin-left: 200px;
}
.group-list {
position: fixed;
top: 50px;
bottom: 0px;
left: 90px;
width: 200px;
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
font-size: 80%;
color: white;
transition: background-color 0.5s;
}
.group-list .item:hover {
cursor: pointer;
background-color: black;
}
.group-list .item.active {
background-color: #007bff;
}
</style>

