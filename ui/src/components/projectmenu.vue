<template>
<div class="projectmenu" v-if="projects">
    <h3>Projects</h3>
    <h4>
        <icon name="caret-down" scale="1"></icon>&nbsp;
        Private <icon name="lock"></icon> 
    </h4>
    <div class="project" v-for="(project, project_id) in projects" :id="project_id" :key="project_id"
        v-if="project.access == 'private'" @click="go('/datasets/'+project_id)" :class="{active: project_id == active}">
        <h5>{{project.name}}</h5>
        <small>{{project.desc}}</small>
    </div>

    <h4>
        <icon name="caret-down" scale="1"></icon>&nbsp;
        Public</h4>
    <div class="project" v-for="(project, project_id) in projects" :id="project_id" :key="project_id" 
        v-if="project.access == 'public'" @click="go('/datasets/'+project_id)" :class="{active: project_id == active}">
        <h5>{{project.name}}</h5>
        <small>{{project.desc}}</small>
    </div>
</div>
</template>

<script>

import Vue from 'vue'

export default {
    components: { },
	props: [ 'active', 'projects' ],
    data () {
        return {
            config: Vue.config,
        }
    },

    watch: {
        active: function() {
            //scroll to selected project
            //active / projects are set about the same time by parent, but we first need to draw list of proejcts before
            //we can scroll to it..
            Vue.nextTick(()=>{
                var elem = document.getElementById(this.active);
                if(!elem) return;
                var area = document.getElementsByClassName("projectmenu")[0];
                if(area.clientHeight < elem.offsetTop) {
                    area.scrollTop = elem.offsetTop - area.clientHeight/2;
                }
            });
        }
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
    background-color: #444;
    color: white;
    left: 90px;
    overflow-y: auto;
}
h3 {
    font-size: 18px;
    padding: 10px 20px;
    color: #777;
    text-transform: uppercase;
    margin-bottom: 0px;
}
h4 {
    font-size: 16px;
    padding: 10px 20px;
    color: #777;
    text-transform: uppercase;
    margin-bottom: 0px;
}
h5 {
    font-size: 13px;
    margin-bottom: 3px;
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
/* this causes really odd rendering on header
.project:hover small {
    opacity: 0.9;
}
*/
</style>


