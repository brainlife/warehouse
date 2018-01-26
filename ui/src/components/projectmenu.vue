<template>
<div class="projectmenu" v-if="projects">
    <h3>Projects</h3>
    <h4>
        <icon name="caret-down" scale="1"></icon>&nbsp;
        Private <icon name="lock"></icon> 
    </h4>
    <div class="project" v-for="(project, project_id) in projects" :id="project_id" :key="project_id"
        v-if="project.access == 'private' && project.removed == false" @click="change(project)" :class="{active: project_id == active}">
        <h5>{{project.name}}</h5>
        <div class="desc">{{project.desc}}</div>
    </div>

    <h4>
        <icon name="caret-down" scale="1"></icon>&nbsp;
        Public</h4>
    <div class="project" v-for="(project, project_id) in projects" :id="project_id" :key="project_id" 
        v-if="project.access == 'public' && project.removed == false" @click="change(project)" :class="{active: project_id == active}">
        <h5>{{project.name}}</h5>
        <div class="desc">{{project.desc}}</div>
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

    /*
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
    */
    watch: {
        active: function() {
            this.scroll_to_active();
        }
    },

    mounted () {
        this.scroll_to_active();
    },

    methods: {
        scroll_to_active: function() {
            //scroll to selected project
            var elem = document.getElementById(this.active);
            if(!elem) return;
            var area = document.getElementsByClassName("projectmenu")[0];
            if(area.clientHeight < elem.offsetTop) {
                area.scrollTop = elem.offsetTop - area.clientHeight/2;
            }

            //I also need to scroll back to top if area is above..
            if(elem.offsetTop < area.scrollTop) {
                area.scrollTop = elem.offsetTop - 300;
            }
        },
        change: function(project) {
            this.$emit("change", project);
        }
    },
}
</script>

<style scoped>
.projectmenu {
    position: fixed;
    top: 50px;
    bottom: 0px;
    width: 260px;
    background-color: #444;
    color: white;
    left: 90px;
    overflow: auto;
}
/*
::-webkit-scrollbar
{
    background-color: blue;
}
::-webkit-scrollbar-track-piece
{
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
}
*/
h3 {
    font-size: 18px;
    padding: 10px 15px;
    color: #777;
    text-transform: uppercase;
    margin-bottom: 0px;
}
h4 {
    font-size: 16px;
    padding: 10px 15px;
    opacity: 0.3;
    text-transform: uppercase;
    margin-bottom: 0px;
}
h5 {
    font-size: 13px;
    margin-bottom: 3px;
}
.project {
    margin: 0px;
    padding: 10px 15px;
    transition: background-color 0.4s;


}
.project:hover {
    cursor: pointer;
    background-color: black;
}
.project.active {
    background-color: #007bff;
}
.project .desc {
    opacity: 0.6;
    font-size: 80%;
    line-height: 140%;

    /*
    max-height: 50px;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis; 
    */
}
</style>


