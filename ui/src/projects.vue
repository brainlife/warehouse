<template>
<div>
    <div class="page-header">
        <div class="search-box onRight">
            <b-form-input v-model="query" type="text" placeholder="Search Projects" @input="change_query_debounce" class="input"/>
            <icon name="search" class="search-icon" scale="1.5"/>
            <icon name="times" class="clear-search" scale="1.5" @click="clearQuery()" v-if="query != ''"/>
        </div>
    </div>
    <div class="mode-toggler onRight" v-if="my_projects">
        <b-form-group>
        <b-form-radio-group v-model="mode" buttons button-variant="outline-secondary">
            <b-form-radio value="tile"><icon name="th"/></b-form-radio>
            <b-form-radio value="list"><icon name="list"/></b-form-radio>
        </b-form-radio-group>
        </b-form-group>
    </div>
    <div class="page-content" v-if="my_projects">
        <div v-if="query.length && !other_projects.length && !my_projects.length">
            <h3 style="opacity: 0.8; margin: 40px;" variant="secondary">No matching Projects</h3>
        </div>
        <div v-if="loading" style="margin: 40px; opacity: 0.5"><h3><icon name="cog" spin scale="2"/> Loading ..</h3></div>
        <div v-if="config.user" class="position: relative">
            <h4 class="group-title">My Projects</h4>
            <div style="padding: 10px;" v-if="mode == 'tile'">
                <div v-for="project in my_projects" :key="project._id" ref="project">
                    <projectcard :project="project"/>
                </div>
            </div>
            <div style="padding: 10px;" v-if="mode == 'list'">
                <div v-for="project in my_projects" :key="project._id" ref="project">
                    <project :project="project"/>
                </div>
            </div>
            <p v-if="my_projects.length == 0 && query == ''" style="margin: 20px;">
                Please create your project by clicking on the button at the bottom left corner of this page.
            </p>
            <br v-if="my_projects.length > 0" clear="both">
        </div>
        <div v-if="other_projects && other_projects.length > 0" style="position: relative;">
            <h4 class="group-title">Public<small>/Protected</small> Projects</h4>
            <div style="padding: 10px;" v-if="mode == 'tile'">
                <div v-for="project in other_projects" :key="project._id" ref="project">
                    <projectcard :project="project"/>
                </div>
            </div>
            <div style="padding: 10px;" v-if="mode == 'list'">
                <div v-for="project in other_projects" :key="project._id" ref="project">
                    <project :project="project"/>
                </div>
            </div>
            <br clear="both">
        </div>

    </div>
    <b-button class="button-fixed" @click="newproject">
        New Project
    </b-button>
</div>
</template>

<script>
import Vue from 'vue'
import pageheader from '@/components/pageheader'
import projectcard from '@/components/projectcard'
import project from '@/components/project'

let query_debounce;

export default {
    components: { projectcard, project },
    data () {
        return {   
            my_projects: null,
            other_projects: null,

            loading: false,

            query: "",
            mode: localStorage.getItem("projects.mode")||"tile",
            config: Vue.config,
        }
    },

    mounted() {
        this.query = sessionStorage.getItem("projects.query")||"";
        this.load();

    },

    watch: {
        mode() {
            localStorage.setItem("projects.mode", this.mode);
        }
    },

    methods: {
        clearQuery() {
            this.query = ''
            this.change_query();
        },

        load() {
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
            this.loading = true;
            this.$http.get('project', {params: {
                find: JSON.stringify({$and: ands}),
                limit: 500, //TODO implement paging eventually
                select: '-readme -meta -stats.resources',
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
                this.loading = false;
            }).catch(err=>{
                console.error(err);
                this.$notify({type: 'error', text: err.response.data.message()});
                this.loading = false;
            });
        },

        change_query_debounce() {
            clearTimeout(query_debounce);
            query_debounce = setTimeout(this.change_query, 300);        
        },

        change_query() {
            sessionStorage.setItem("projects.query", this.query);
            this.load();
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
.mode-toggler {
position: fixed;
top: 60px;
padding-right: 30px;
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
