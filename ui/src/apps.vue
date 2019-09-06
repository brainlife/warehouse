<template>
<div>
    <sidemenu active="/apps"></sidemenu>
    <div class="page-header">
        <div class="search-box">
            <b-form-input v-model="query" type="text" placeholder="Search Apps" @focus.native="focus_search()" @input="change_query_debounce" class="input"/>
            <icon name="search" class="search-icon" scale="1.5"/>
        </div>
    </div>
    <div class="group-list" v-if="app_groups" ref="group-list">
        <h4 style="opacity: 0.7;">Categories</h4>

        <div v-if="app_groups['_new']">
            <p class="item" @click="jump('_new')" :class="{'active': active == '_new'}" title="Apps that are registered recently">
                <span>New Apps</span> 
            </p>
            <hr/>
        </div>

        <p v-for="tag in sorted_tags" class="item" :class="{'active': active == tag}" @click="jump(tag)" :key="tag">
            <span>{{tag}}</span> 
            <b-badge variant="dark" v-if="app_groups[tag]">{{app_groups[tag].length}}</b-badge>
        </p>

        <div v-if="my_apps && my_apps.length > 0">
            <hr/>
            <p class="item" @click="jump('_mine')" :class="{'active': active == '_mine'}" title="Apps that you administer">
                <span>My Apps</span> 
            </p>
        </div>
        <br>

        <div style="position: fixed; bottom: 0px;">
            <div class="button" style="margin: 5px; color: gray;" @click="go('/appsgraph')">
                <icon name="code-branch"/>
            </div>
        </div>

    </div>
    <div class="page-content" v-on:scroll="update_active" ref="scrolled">
        <div v-if="apps === null" style="margin: 40px; opacity: 0.5"><h3><icon name="cog" spin scale="2"/> Loading ..</h3></div>
        <div v-else>
            <h3 v-if="apps.length == 0" style="opacity: 0.8; margin: 40px;" variant="secondary">No matching Apps</h3>

            <div v-if="app_groups['_new']" class="newapps" id="_new" style="position: relative">
                <h4 class="group-title colored">New Apps</h4> 
                <div v-for="app in app_groups['_new']" :key="app._id" class="app">
                    <app :app="app" height="220px" class="app-card"/>
                </div>
                <!--
                <div v-if="tag == '_new'" style="clear: both; color: white; padding: 20px; padding-bottom: 0px;">
                    <p style="opacity: 0.7;">
                        You can register your App on Brainlife so that other users can run it online.
                    </p>
                    <b-button variant="primary" @click="go('/app/_/edit')" size="sm">Register New App</b-button> 
                </div>
                -->
                <br clear="both">
            </div>

            <div v-for="tag in sorted_tags" :id="tag" style="position: relative;" :key="tag">
                <h4 class="group-title">{{tag}} <!--<small style="float: right;">{{app_groups[tag].length}} Apps</small>--> </h4> 
                <div v-for="app in app_groups[tag]" :key="app._id" class="app">
                    <app :app="app" height="220px" class="app-card"/>
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

            <p style="padding: 20px 20px; opacity: 0.5;" v-if="apps.length > 0">
                <span style="float: right">
                    Showing {{apps.length}} Unique Apps 
                </span>
            </p>
            <br>

            <!-- mine -->
            <div style="position: relative;" id="_mine" class="bg-success" v-if="my_apps && my_apps.length > 0">
                <h4 class="group-title colored">My Apps <!--<small style="float: right">{{my_apps.length}} Apps</small>--> </h4> 
                <div v-for="app in my_apps" :key="app._id" class="app">
                    <app :app="app" height="220px" class="app-card"/>
                </div>
                <br clear="both">
                <!--
                <div style="color: white; padding: 20px;">
                    <p style="opacity: 0.7;">
                        You can register your App on Brainlife so that other users can run it online.
                    </p>
                    <b-button variant="primary" @click="go('/app/_/edit')">Register New App</b-button> 
                </div>
                -->

                <br clear="both">

                <br>
                <br>
                <br>
                <br>
            </div>

            <!--
            <div style="background-color: #159957; color: white;">
                <h4 class="group-title" style="color: inherit; background-color: inherit;">Register New App</h4>
                <div style="padding: 10px 20px; opacity: 0.8;">
                    <p>Do you have a code that you'd like to publish on Brainlife?</p>
                    <p>You can publish it so that other users can execute your code!</p>
                    <b-button variant="success" @click="go('/app/_/edit')">Register New App</b-button> 
                </div>

                <br>
                <br>
            </div>
            -->
        </div>

        <b-button v-if="config.user" class="button-fixed" @click="go('/app/_/edit')" title="Register App"><icon name="plus" scale="2"/></b-button>
    </div><!--page-content-->
</div><!--root-->
</template>

<script>
import Vue from 'vue'
import sidemenu from '@/components/sidemenu'
import app from '@/components/app'

import 'perfect-scrollbar/css/perfect-scrollbar.css'
import PerfectScrollbar from 'perfect-scrollbar'

let query_debounce;
var ps;

export default {
    components: { sidemenu, app },
    data () {
        return {
            active: null,
            sorted_tags: [], 
            app_groups: {},
            apps: null,  //number of total apps loaded
            query: "",
            config: Vue.config,

            datatypes: null, //only loaded if search box is focused
        };
    },

    created() {
        this.query = sessionStorage.getItem("apps.query");
        this.load();
    },

    computed: {
        my_apps() {
            if(!this.apps) return null;
            if(!Vue.config.user) return null; //not logged in
            return this.apps.filter(app=>app.admins.includes(Vue.config.user.sub));
        },
    },

    methods: {
        focus_search() {
            if(this.datatypes) return; //already loaded
            return this.$http.get('datatype')
            .then(res=>{
                this.datatypes = {};
                res.data.datatypes.forEach((d)=>{
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
            console.time("loading");
            this.app_groups = {};
            this.sorted_tags = [];
            this.apps = null;

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

            console.log("getting apps");
            this.$http.get('app', {params: {
                find: JSON.stringify({$and: ands}),
                limit: 500, //TODO - this is not sustailable
                populate: 'contributors', //'inputs.datatype outputs.datatype contributors',
            }})
            .then(res=>{
                this.apps = res.data.apps;
                console.log("organizing apps");

                //organize apps into various tags
                res.data.apps.forEach(app=>{
                    var tags = [ 'miscellaneous' ];
                    if(app.tags && app.tags.length > 0) tags = app.tags;
                    tags.forEach(tag=>{
                        if(!this.app_groups[tag]) Vue.set(this.app_groups, tag, []);
                        if(!~this.sorted_tags.indexOf(tag)) this.sorted_tags.push(tag);
                        this.app_groups[tag].push(app);
                    });
                });
                this.sorted_tags.sort();

                if(!this.query) {
                    //find most recently created apps as *new apps*
                    let apps = res.data.apps.filter(a=>{
                        //only find apps that has non-0 success rate
                        if(a.stats && a.stats.success_rate > 0) return true;
                        return false;
                    });
                    apps.sort((a,b)=>new Date(b.create_date) - new Date(a.create_date));
                    this.app_groups._new = apps.slice(0, 6);
                }

                console.log("waitng for nexttick");
                //console.timeLog("loading");
                this.$nextTick(()=>{
                    if(document.location.hash) {
                        this.jump(document.location.hash.substring(1));
                    }
                    console.log("updating active");
                    this.update_active();

                    let grouplist = this.$refs["group-list"];

                    console.log("setting scrollbar");
                    ps = new PerfectScrollbar(grouplist);
                    grouplist.scrollTop = 0;
                });
            }, res=>{
                console.error(res);
            });
        },

        go(path) {
            this.$router.push(path);
        },

        jump(tag) {
            document.location="#"+tag;
        },

        update_active() {
            if(!this.$refs.scrolled) return;
            var scrolltop = this.$refs.scrolled.scrollTop;
            var height = this.$refs.scrolled.clientHeight;
            this.active = false;

            //TODO - simplify this..

            //check for new apps
            var e = document.getElementById("_new");
            if(e && e.offsetTop-height/4 <= scrolltop) this.active = "_new";

            //check for category tags`
            this.sorted_tags.forEach(tag=>{
                e = document.getElementById(tag);
                if(e && e.offsetTop-height/4 <= scrolltop) this.active = tag;
            });

            //check for other things
            e = document.getElementById("_mine");
            if(e && e.offsetTop-height/4 <= scrolltop) this.active = "_mine";
        },

        change_query_debounce() {
            clearTimeout(query_debounce);
            query_debounce = setTimeout(this.change_query, 300);        
        },

        change_query() {
            if(!this.datatypes) return setTimeout(this.change_query, 300);
            //document.location="#"; //clear hash //TODO what is this?
            sessionStorage.setItem("apps.query", this.query);
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
opacity: 0.8;
}
.page-content {
top: 50px;
margin-right: 240px;
background-color: #eee;
}
.group-list {
position: fixed;
top: 50px;
bottom: 0px;
right: 0px;
width: 240px;
background-color: #ddd;
}
.group-list h4 {
font-size: 18px;
font-weight: bold;
padding: 20px 10px;
text-transform: uppercase;
margin-bottom: 0px;
color: #777;
}
.group-list .item {
text-transform: uppercase;
padding: 5px 10px;
margin-bottom: 0px;
font-size: 80%;
}
.group-list .item:hover {
cursor: pointer;
background-color: white;
}
.group-list .item.active {
background-color: #007bff;
color: white;
}
.newapps {
background-image: linear-gradient(#1966b3, #2693ff);
/*background-attachment: fixed; ... this causes flickering*/
padding-bottom: 30px;
}
.group-title.colored {
background-color: inherit;
color: white;
}
.app {
margin-left: 10px;
margin-bottom: 10px;
width: 325px;
float: left;
position: relative;
top: 0;
transition: box-shadow 0.3s ease;
}
.app:hover {
box-shadow: 2px 2px 6px rgba(0,0,0,0.2);
}
.button-fixed {
right: 280px;
}
</style>

