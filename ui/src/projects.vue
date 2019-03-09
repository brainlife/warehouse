<template>
<div>
    <sidemenu active="/projects"/>
    <div class="page-header">
        <div class="search-box">
            <b-form-input v-model="query" type="text" placeholder="Filter Projects" @input="change_query_debounce" class="input"/>
            <icon name="search" class="search-icon" scale="1.5"/>
        </div>
    </div>
    <div class="page-content">
        <h4 class="group-title">My Projects</h4>
        <div style="padding: 10px;">
            <b-card-group columns>
                <projectcard v-for="project in my_projects" :project="project" :key="project._id">
                    <!--
                    <p class="name">
                        <projectavatar :project="project" :width="20" :height="20" class="projectavatar"/>
                        {{project.name}} <icon v-if="project.access == 'private'" name="lock" scale="0.8"></icon>
                    </p>
                    <div class="desc">{{project.desc}}</div>
                    -->
                </projectcard>
            </b-card-group>
        </div>

        <h4 class="group-title">Other Projects</h4>
        <div style="padding: 10px;">
            <b-card-group columns>
                <projectcard v-for="project in other_projects" :project="project" :key="project._id" class="projectcard">
                    <!--
                    <p class="name">
                        <projectavatar :project="project" :width="20" :height="20" class="projectavatar"/>
                        {{project.name}} <icon v-if="project.access == 'private'" name="lock" scale="0.8"></icon>
                    </p>
                    <div class="desc">{{project.desc}}</div>
                    -->
                </projectcard>
            </b-card-group>
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
            my_projects: [],
            other_projects: [],

            query: "",

            config: Vue.config,
        }
    },

    mounted() {

        this.query = sessionStorage.getItem("projects.query");
        this.load();
    },

    methods: {
        load() {
            let ands = [
                {removed: false},
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
            this.my_projects = [];
            this.other_projects = [];

            //load all projects that user has summary access (including removed ones so we can open it)
            this.$http.get('project', {params: {
                find: JSON.stringify({$and: ands}),
                limit: 500,
                select: '-readme'
            }}).then(res=>{
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
margin: 10px 5px;
}
</style>
