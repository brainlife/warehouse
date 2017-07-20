<template>
<div class="projectmenu">
    <div class="header">
        <h4>Projects</h4>
    </div>
    <!--
    <div class="project" @click="go('/datasets')"
        :class="{active: !active}">
        <h5>All</h5>
        <small class="text-muted">Search datasets from all projects</small>
    </div>
    -->

    <h4>
        <icon name="caret-down" scale="1"></icon>&nbsp;
        Private <icon name="lock"></icon> 
    </h4>
    <div class="project" v-for="(project, project_id) in projects" 
        v-if="project.access == 'private'"
        @click="go('/datasets/'+project_id)"
        :class="{active: project_id == active}">
        <h5>{{project.name}}</h5>
        <small class="text-muted">{{project.desc}}</small>
    </div>

    <h4>
        <icon name="caret-down" scale="1"></icon>&nbsp;
        Public</h4>
    <div class="project" v-for="(project, project_id) in projects" 
        v-if="project.access == 'public'"
        @click="go('/datasets/'+project_id)"
        :class="{active: project_id == active}">
        <h5>{{project.name}}</h5>
        <small class="text-muted">{{project.desc}}</small>
    </div>
</div>
</template>

<script>

import Vue from 'vue'

export default {
    components: { },
	props: { active: String },
    data () {
        return {

            //cache
            projects: null, 

            config: Vue.config,
        }
    },

    computed: {
    },

    mounted: function() {
        this.$http.get('project', {params: {
            find: JSON.stringify({$and: [
                {$or: [
                    { members: Vue.config.user.sub}, 
                    { access: "public" },
                ]},
                {$or: [
                    { removed: false },
                    { removed: {$exists: false }},
                ]}
            ]})
        }})
        .then(res=>{
            this.projects = {};
            res.body.projects.forEach((p)=>{
                this.projects[p._id] = p;
            });
        }).catch(err=>{
            console.error(err);
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
.projectmenu {
    position: fixed;
    top: 50px;
    bottom: 0px;
    width: 225px;
    /*background-color: #3b5f84;*/
    background-color: #444;
    color: white;
    left: 90px;
    overflow-y: auto;
    z-index: 2;
}
h4 {
    padding: 10px 20px;
    color: #777;
    text-transform: uppercase;
    margin-bottom: 0px;
}
h5 {
    margin-bottom: 4px;
}
.project {
    margin: 0px;
    padding: 10px 20px;
    transition: background-color 0.2s;
}
.project:hover {
    cursor: pointer;
    background-color: black;
}
.project.active {
    background-color: #2693ff;
}
</style>


