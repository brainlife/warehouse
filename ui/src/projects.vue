<template>
<div>
    <sidemenu active="/projects"/>
    <div class="page-header">
        <div class="search-box">
            <b-form-input v-model="query" type="text" placeholder="Filter Projects" @input="change_query_debounce" class="input"/>
            <icon name="search" class="search-icon" scale="1.5"/>
        </div>
    </div>
    <div class="page-content" v-if="my_projects">
        <h4 class="group-title">My Projects</h4>
        <div style="padding: 10px;">
            <projectcard v-for="project in my_projects" :project="project" :key="project._id"/>
        </div>
        <p v-if="my_projects.length == 0 && query == ''" style="margin: 20px;">
            Please create your project by clicking on the button at the bottom left corner of this page.
        </p>
        <br clear="both">

        <div v-if="other_projects && other_projects.length > 0">
            <h4 class="group-title">Other Projects</h4>
            <div style="padding: 10px;">
                <projectcard v-for="project in other_projects" :project="project" :key="project._id" class="projectcard"/>
            </div>
            <br clear="both">
        </div>

        <div v-if="openneuro_projects && openneuro_projects.length > 0">
            <h4 class="group-title">OpenNeuro Datasets</h4>
            <div style="padding: 10px;">
                <projectcard v-for="project in openneuro_projects" :project="project" :key="project._id" class="projectcard"/>
            </div>
            <br clear="both">
        </div>
    </div>

    <b-button class="button-fixed" @click="go('/project/_/edit')" title="New Project">
        <icon name="plus" scale="2"/>
    </b-button>
</div>
</template>

<script>
import Vue from 'vue'
import pageheader from '@/components/pageheader'
import sidemenu from '@/components/sidemenu'
import pubcard from '@/components/pubcard'
import projectcard from '@/components/projectcard'

let query_debounce;

export default {
    components: { sidemenu, pubcard, projectcard },
    data () {
        return {   
            my_projects: null,
            other_projects: null,
            openneuro_projects: null,

            query: "",
            reload_int: null,
            config: Vue.config,
        }
    },

    mounted() {
        this.query = sessionStorage.getItem("projects.query");
        this.load();
        this.reload_int = setInterval(()=>{
            this.load();
        }, 1000*60*5); //reload every 5 minutes (projectinfo is loaded every 5 minutes)
    },

    destroyed() {
        console.log("clearing reload_int");
        clearInterval(this.reload_int);
    },

    methods: {
        load() {
            console.log("loading projects");

            let ands = [
                {removed: false, "openneuro": {$exists: false}},
                /*
                {$or: [
                    { removed: false },
                    { removed: {$exists: false }},
                ]}
                */
            ];
            if(this.query) {
                //split query into each token and allow for regex search on each token
                //so that we can query against multiple fields simultanously
                this.query.split(" ").forEach(q=>{
                    if(q === "") return;

                    /*
                    //lookup datatype ids that matches the query
                    let datatype_ids = [];
                    for(var id in this.datatypes) {
                        if(this.datatypes[id].name.toLowerCase().includes(q.toLowerCase())) datatype_ids.push(id);
                    }
                    */
                    ands.push({$or: [
                        {"name": {$regex: q, $options: 'i'}},
                        {"desc": {$regex: q, $options: 'i'}},
                    ]});
                });
            }

            //load all projects that user has summary access (including removed ones so we can open it)
            this.my_projects = null;
            this.$http.get('project', {params: {
                find: JSON.stringify({$and: ands}),
                limit: 500,
                select: '-readme',
                sort: 'name',
            }}).then(res=>{
                this.my_projects = [];
                this.other_projects = [];
                res.data.projects.forEach(p=>{
                    if(p.admins.includes(Vue.config.user.sub) || p.members.includes(Vue.config.user.sub) || p.guests.includes(Vue.config.user.sub)) {
                        this.my_projects.push(p);
                    } else {
                        this.other_projects.push(p);
                    }
                });
            })
            .catch(res=>{
                console.error(res);
                this.$notify({type: 'error', text: res.data.message});
            });

            //load openneuro project separately..
            this.openneuro_projects = null;
            ands[0] = {removed: false, "openneuro": {$exists: true}};
            this.$http.get('project', {params: {
                find: JSON.stringify({$and: ands}),
                limit: 100,
                select: '-readme',
                sort: 'name',
            }}).then(res=>{
                this.openneuro_projects = res.data.projects;
            }).catch(res=>{
                console.error(res);
                this.$notify({type: 'error', text: res.data.message});               
            })
        },

        change_query_debounce() {
            clearTimeout(query_debounce);
            query_debounce = setTimeout(this.change_query, 300);        
        },

        change_query() {
            sessionStorage.setItem("projects.query", this.query);
            this.load();
        },
        
        go(path) {
            this.$router.push(path);
        },
    }
}
</script>

<style scoped>
.page-content {
background-color: #eee;
}
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
.projectcard {
width: 375px;
float: left;
margin-right: 10px;
margin-bottom: 10px;
box-shadow: 2px 2px 4px rgba(0,0,0,0.1);
transition: box-shadow 0.5s;
}
.projectcard:hover {
box-shadow: 2px 2px 8px rgba(0,0,0,0.3);
}
</style>
