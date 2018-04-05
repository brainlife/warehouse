<template>
<div class="projectmenu">
    <p class="header">Projects</p>
    <p class="group-header">
        <icon name="caret-down" scale="1"></icon>&nbsp;
        Private <icon name="lock"></icon> 
    </p>
    <div class="project" v-for="(project, project_id) in projects" :id="project_id" :key="project_id"
        v-if="project.access == 'private' && project.removed == false" @click="change(project)" :class="{active: project_id == active}">

        <p class="name">
            <projectavatar :project="project" :width="20" :height="20" class="projectavatar"/>
            {{project.name}}
        </p>
        <div class="desc">{{project.desc}}</div>
    </div>

    <p class="group-header">
        <icon name="caret-down" scale="1"></icon>&nbsp;
        Public
    </p>
    <div class="project" v-for="(project, project_id) in projects" :id="project_id" :key="project_id" 
        v-if="project.access == 'public' && project.removed == false" @click="change(project)" :class="{active: project_id == active}">
        <p class="name">
            <projectavatar :project="project" :width="20" :height="20" class="projectavatar"/>
            {{project.name}}</p>
        <div class="desc">{{project.desc}}</div>
    </div>

    <p class="group-header">
        <icon name="caret-down" scale="1"></icon>&nbsp;
        Protected
    </p>
    <div class="project" v-for="(project, project_id) in projects" :id="project_id" :key="project_id" 
        v-if="project.access == 'protected' && project.removed == false" @click="change(project)" :class="{active: project_id == active}">
        <p class="name">
            <projectavatar :project="project" :width="20" :height="20" class="projectavatar"/>
            {{project.name}}</p>
        <div class="desc">{{project.desc}}</div>
    </div>


    <!--raising bottom of the list -->
    <br>
    <br>
    <br>
    <br>
    <br>
    <br>

    <b-button class="button-fixed" @click="go('/project/_/edit')" title="New Project">
        <icon name="plus" scale="2"/>
    </b-button>
</div>
</template>

<script>

import Vue from 'vue'

import 'perfect-scrollbar/css/perfect-scrollbar.css'
import PerfectScrollbar from 'perfect-scrollbar'

import projectavatar from '@/components/projectavatar'

export default {
    components: { projectavatar },
	props: [ 'active', 'projects' ],
    data () {
        return {
            ps: null,
            config: Vue.config,
        }
    },

    watch: {
        active: function() {
            this.scroll_to_active();
        }
    },

    mounted () {
        this.ps = new PerfectScrollbar(this.$el);
        this.scroll_to_active();

        console.dir(this.projects);
    },

    destroyed() {
        this.ps.destroy();
    },

    methods: {
        scroll_to_active: function() {
            //scroll to selected project if it's out the scroll window
            var active_elem = document.getElementById(this.active);
            if(!active_elem) return;
            var area = this.$el;
            if(area.clientHeight + area.scrollTop < active_elem.offsetTop) {
                //this.$refs.scrollbar.scrollToY(active_elem.offsetTop - area.clientHeight/2);
                this.$el.scrollTop = active_elem.offsetTop - area.clientHeight/2;
            }

            //I also need to scroll back to top if area is above..
            if(active_elem.offsetTop < area.scrollTop) {
                this.$el.scrollTop = active_elem.offsetTop - 300;
            }
        },
        change: function(project) {
            this.$emit("change", project);
        },
        go(path) {
            this.$router.push(path);
        },
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
}
.header {
    font-size: 18px;
    padding: 10px 15px;
    color: #777;
    text-transform: uppercase;
    margin-bottom: 0px;
}
.group-header {
    font-size: 16px;
    padding: 10px 15px;
    opacity: 0.3;
    text-transform: uppercase;
    margin-bottom: 0px;
}
.name {
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
}
.button-fixed {
opacity: 0;
left: 260px;
}
.projectmenu:hover .button-fixed {
opacity: 0.8;
}
.projectmenu:hover .button-fixed:hover {
opacity: 1;
}
.projectavatar {
opacity: 1;
position: relative;
top: -3px;
left: -3px;
}
</style>

