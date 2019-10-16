<template>
<div>
    <sidemenu active="/projects"/>
    <div class="page-header">
        <div class="search-box">
            <b-form-input v-model="query" type="text" placeholder="Search Projects" @input="change_query_debounce" class="input"/>
            <icon name="search" class="search-icon" scale="1.5"/>
        </div>
    </div>
    <div class="page-content" v-if="my_projects">
        <div class="mode-toggler">
            <b-form-group>
                <b-form-radio-group v-model="mode" buttons button-variant="outline-secondary">
                    <b-form-radio value="tile"><icon name="th"/></b-form-radio>
                    <b-form-radio value="list"><icon name="list"/></b-form-radio>
                </b-form-radio-group>
            </b-form-group>
        </div>
        <div v-if="config.user" class="position: relative">
            <h4 class="group-title">My Projects</h4>
            <div style="padding: 10px;" v-if="mode == 'tile'">
                <projectcard v-for="project in my_projects" :project="project" :key="project._id"/>
            </div>
            <div style="padding: 10px;" v-if="mode == 'list'">
                <project v-for="project in my_projects" :project="project" :key="project._id"/>
            </div>
            <p v-if="my_projects.length == 0 && query == ''" style="margin: 20px;">
                Please create your project by clicking on the button at the bottom left corner of this page.
            </p>
            <br v-if="my_projects.length > 0" clear="both">
        </div>

        <div v-if="other_projects && other_projects.length > 0" style="position: relative;">
            <h4 class="group-title">Public<small>/Protected</small> Projects</h4>
            <div style="padding: 10px;" v-if="mode == 'tile'">
                <projectcard v-for="project in other_projects" :project="project" :key="project._id" class="projectcard"/>
            </div>
            <div style="padding: 10px;" v-if="mode == 'list'">
                <project v-for="project in other_projects" :project="project" :key="project._id"/>
            </div>
            <br clear="both">
        </div>

        <div v-if="openneuro_projects && openneuro_projects.length > 0" style="position: relative;">
            <h4 class="group-title">OpenNeuro Datasets</h4>
            <p style="opacity: 0.8; margin: 20px;">
                Only the projects with large number of downloads are linked to Brainlife. Please contact Brainlife Administrator to add other Openneuro dataset.
            </p>
            <div style="padding: 10px;" v-if="mode == 'tile'">
                <projectcard v-for="project in openneuro_projects" :project="project" :key="project._id" class="projectcard"/>
            </div>
            <div style="padding: 10px;" v-if="mode == 'list'">
                <project v-for="project in openneuro_projects" :project="project" :key="project._id"/>
            </div>
            <br clear="both">
        </div>
    </div>

    <b-button class="button-fixed" @click="newproject" v-b-tooltip.hover title="New Project">
        <icon name="plus" scale="2"/>
    </b-button>
</div>
</template>

<script>
import Vue from 'vue'
import pageheader from '@/components/pageheader'
import sidemenu from '@/components/sidemenu'
import projectcard from '@/components/projectcard'
import project from '@/components/project'

let query_debounce;

export default {
    components: { sidemenu, projectcard, project },
    data () {
        return {   
            my_projects: null,
            other_projects: null,
            openneuro_projects: null,

            query: "",
            mode: localStorage.getItem("projects.mode")||"tile",
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

    watch: {
        mode() {
            localStorage.setItem("projects.mode", this.mode);
        }
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
            ];
            if(this.query) {
                //split query into each token and allow for regex search on each token
                //so that we can query against multiple fields simultanously
                this.query.split(" ").forEach(q=>{
                    if(q === "") return;
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
                limit: 500, //TODO implement paging eventually
                select: '-readme',
                sort: 'name',
            }}).then(res=>{
                this.my_projects = [];
                this.other_projects = [];
                res.data.projects.forEach(p=>{
                    if(Vue.config.user && (
                        p.admins.includes(Vue.config.user.sub) || 
                        p.members.includes(Vue.config.user.sub) || 
                        p.guests.includes(Vue.config.user.sub))
                    ) {
                        this.my_projects.push(p);
                    } else {
                        this.other_projects.push(p);
                    }
                });
            })
            .catch(res=>{
                console.error(res);
                this.$notify({type: 'error', text: res.toString()});
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

        newproject() {
            if(Vue.config.user) {
                this.$router.push('/project/_/edit');
            } else {
                alert('Please signup/login first to create a new project');
            }
        },
    }
}
</script>

<style scoped>
.page-content {
background-color: #eee;
}
.mode-toggler {
position: fixed;
top: 60px;
right: 25px;
z-index: 2;
opacity: 0.5;
transition: opacity 0.3s;
}
.mode-toggler:hover {
opacity: 1;
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
width: 325px;
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
