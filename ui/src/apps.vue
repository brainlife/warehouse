<template>
<div>
    <pageheader>
        <div class="search-box">
            <b-form-input v-model="query" type="text" placeholder="Search" @focus.native="focus_search()" @input="change_query_debounce" class="input"/>
            <icon name="search" class="search-icon" scale="1.5"/>
        </div>
    </pageheader>
    <sidemenu active="/apps"></sidemenu>
    <div class="group-list">
        <h4>Categories</h4>
        <p v-for="tag in sorted_tags" class="item" :class="{'active': active == tag}" @click="jump(tag)">
            {{tag}} <b-badge variant="dark">{{app_groups[tag].length}}</b-badge>
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
        <div v-else>
            <h3 show v-if="count == 0" style="opacity: 0.8; margin: 40px;" variant="secondary">No matching Apps</h3>
            <div v-for="tag in sorted_tags" :id="tag">
                <h4 class="group-title">{{tag}}</h4> 
                <div v-for="app in app_groups[tag]" :key="app._id" class="app">
                    <app :app="app" height="246px"></app>
                </div>
                <br clear="both">
            </div>

            <!--
            <div class="relationships" style="position: relative;">
                <h3 style="position: absolute; top: 10px; left: 10px; color: #ddd;">Relationships (experimental)</h3>
                <div ref="vis" style="height: 500px; background-color: #fff;"/>
            </div>
            -->

            <br>

            <p style="padding: 20px 20px; opacity: 0.5; border-top: solid 1px #ddd;" v-if="count > 0">
                <span style="float: right">
                    Showing {{count}} Apps
                </span>
            </p>
            <br>

            <div style="background-color: #ddd; color: #666;">
                <h4 class="group-title" style="color: #ccc; background-color: #888;">Register New App</h4>
                <div style="padding: 10px 20px;">
                    <p>Do you have a code that you'd like to publish on Brainlife?</p>
                    <p>You can publish it so that other users can execute your code!</p>
                    <b-button variant="secondary" @click="go('/app/_/edit')">Register New App</b-button> 
                </div>

                <br>
                <br>
            </div>
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

let query_debounce = null;

export default {
    components: { sidemenu, pageheader, app },
    data () {
        return {
            active: null,
            sorted_tags: [], 
            app_groups: null,
            count: null,  //number of total apps loaded
            query: "",
            config: Vue.config,

            datatypes: null, //only loaded if search box is focused
        };
    },

    created: function() {
        this.load();


    },

    methods: {
        focus_search() {
            if(this.datatypes) return; //already loaded
            return this.$http.get('datatype')
            .then(res=>{
                this.datatypes = {};
                res.body.datatypes.forEach((d)=>{
                    this.datatypes[d._id] = d;
                });
            }).catch(err=>{
                console.error(err);
            });
        },

        get_mongo_query() {
			var finds = [
                {removed: false},
                {project: this.project._id},
            ] 

            return finds;
        },

        load() {
            this.app_groups = null;
            this.sorted_tags = [];

            let ands = [
                {$or: [
                    { removed: false },
                    { removed: {$exists: false }},
                ]}
            ];
            if(this.query) {
                //split query into each token and allow for regex search on each token
                //so that we can query against multiple fields simultanously
                this.query.split(" ").forEach(q=>{
                    if(q === "") return;

                    //lookup datatype ids that matches the query
                    let datatype_ids = [];
                    for(var id in this.datatypes) {
                        if(this.datatypes[id].name.toLowerCase().includes(q.toLowerCase())) datatype_ids.push(id);
                    }
                    ands.push({$or: [
                        {"name": {$regex: q, $options: 'i'}},
                        {"github": {$regex: q, $options: 'i'}},
                        {"github_branch": {$regex: q, $options: 'i'}},
                        {"desc": {$regex: q, $options: 'i'}},
                        {"desc_override": {$regex: q, $options: 'i'}},
                        {"tags": {$regex: q, $options: 'i'}},

                        {"inputs.datatype": {$in: datatype_ids}},
                        {"inputs.datatype_tags": {$regex: q, $options: 'i'}},
                        {"outputs.datatype": {$in: datatype_ids}},
                        {"outputs.datatype_tags": {$regex: q, $options: 'i'}},
                    ]});
                });
            }

            this.$http.get('app', {params: {
                find: JSON.stringify({$and: ands}),
                limit: 1000, //TODO - use paging?
                populate: 'inputs.datatype outputs.datatype contributors',
            }})
            .then(res=>{
                this.count = res.body.count;

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

        go: function(path) {
            this.$router.push(path);
        },
        jump: function(tag) {
            document.location="#"+tag;
        },
        update_active: function() {
            var scrolltop = this.$refs.scrolled.scrollTop;
            var height = this.$refs.scrolled.clientHeight;
            this.active = false;
            this.sorted_tags.forEach(tag=>{
                var e = document.getElementById(tag);
                if(e.offsetTop-height/2 <= scrolltop) this.active = tag;
            });
        },

        change_query_debounce() {
            clearTimeout(query_debounce);
            query_debounce = setTimeout(this.change_query, 300);        
        },

        change_query() {
            if(this.loading || !this.datatypes) return setTimeout(this.change_query, 300);

            document.location="#"; //clear hash
            this.load();
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
margin-left: 240px;
}
.group-list {
position: fixed;
top: 50px;
bottom: 0px;
left: 50px;
width: 240px;
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
.search-box {
padding-left: 130px;
position: fixed;
top: 6px;
width: 495px;
}
.search-box .input {
font-size: 140%;
padding-left: 50px;
background-color: #fff6;
border: none;
color: white;
transition: background-color 0.5s, color 0.5s;
}

.search-box .input:focus {
background-color: white;
color: gray;
}

.search-box .search-icon {
color: white;
opacity: 0.8;
position: absolute;
top: 7px;
left: 145px;
z-index: -1;
transition: color 0.5s;
}
.search-box .input::placeholder {
color: white;
font-weight: bold;
}
.input:focus ~ .search-icon {
color: gray;
z-index: 2;
}

</style>

