<template>
<div class="projectmenu">
    <h4>Projects</h4>
    <p @click="go('/datasets')"
        :class="{active: !active}">
        All<br>
        <small class="text-muted">Search datasets from all projects</small>
    </p>

    <h4>
        <icon name="caret-down" scale="1"></icon>&nbsp;
        Private <icon name="lock"></icon> </h4>
    <p v-for="(project, project_id) in projects" 
        v-if="project.access == 'private'"
        @click="go('/datasets/'+project_id)"
        :class="{active: project_id == active}">
        {{project.name}}<br>
        <small class="text-muted">{{project.desc}}</small>
    </p>
    <h4>
        <icon name="caret-down" scale="1"></icon>&nbsp;
        Public</h4>
    <p v-for="(project, project_id) in projects" 
        v-if="project.access == 'public'"
        @click="go('/datasets/'+project_id)"
        :class="{active: project_id == active}">
        {{project.name}}<br>
        <small class="text-muted">{{project.desc}}</small>
    </p>
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
            find: JSON.stringify({$or: [
                { members: Vue.config.user.sub}, 
                { access: "public" },
            ]})
        }})
        .then(res=>{
            this.projects = {};
            res.body.projects.forEach((p)=>{
                this.projects[p._id] = p;
            });
            console.dir(res.body.projects);
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
    width: 200px;
    /*background-color: #3b5f84;*/
    background-color: #444;
    color: white;
    left: 90px;
    overflow-y: auto;
}
.projectmenu h4 {
    padding: 10px 20px;
    color: #777;
    text-transform: uppercase;
    margin-bottom: 0px;
}
.projectmenu p {
    margin: 0px;
    padding: 10px 20px;
    transition: background-color 0.2s;
}
.projectmenu p:hover {
    cursor: pointer;
    background-color: black;
}
.projectmenu p.active {
    background-color: #2693ff;
}
</style>


