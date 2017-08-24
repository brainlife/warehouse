<template>
<div class="projectmenu">
    <h3>Projects</h3>
    <h4>
        <icon name="caret-down" scale="1"></icon>&nbsp;
        Private <icon name="lock"></icon> 
    </h4>
    <div class="project" v-for="(project, project_id) in projects" 
        v-if="project.access == 'private'"
        @click="go('/datasets/'+project_id)"
        :class="{active: project_id == active}">
        <h5>{{project.name}}</h5>
        <small>{{project.desc}}</small>
    </div>

    <h4>
        <icon name="caret-down" scale="1"></icon>&nbsp;
        Public</h4>
    <div class="project" v-for="(project, project_id) in projects" 
        v-if="project.access == 'public'"
        @click="go('/datasets/'+project_id)"
        :class="{active: project_id == active}">
        <h5>{{project.name}}</h5>
        <small>{{project.desc}}</small>
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
            find: JSON.stringify({
                $or: [
                    { members: Vue.config.user.sub}, 
                    { access: "public" },
                ],
                removed: false,
            })
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
    width: 230px;
    /*background-color: #3b5f84;*/
    background-color: #444;
    color: white;
    left: 90px;
    overflow-y: auto;
    display: block;
    z-index: 2;
}
h3 {
    padding: 10px 20px;
    color: #777;
    text-transform: uppercase;
    margin-bottom: 0px;
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
    transition: background-color 0.4s;
}
.project:hover {
    cursor: pointer;
    background-color: black;
}
.project.active {
    background-color: #2693ff;
}
.project small {
    transition: opacity 0.4s;
    opacity: 0.7;
}
.project:hover small {
    opacity: 0.9;
}
</style>


