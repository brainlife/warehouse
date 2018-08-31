<template>
<div class="projectmenu">
    <p class="group-header">
        <icon name="caret-down"></icon>&nbsp;
        Private <icon name="lock" scale="0.8"></icon> 
    </p>
    <div class="project" v-for="project in sorted_projects('private')" :id="project._id" :key="project._id"
        @click="change(project)" :class="{listonly: islistonly(project), active: project._id == active}">
        <p class="name">
            <projectavatar :project="project" :width="20" :height="20" class="projectavatar"/>
            {{project.name}}
        </p>
        <div class="desc">{{project.desc}}</div>
    </div>

    <p class="group-header">
        <icon name="caret-down"></icon>&nbsp;
        Public 
    </p>
    <div class="project" v-for="project in sorted_projects('public')" :id="project._id" :key="project._id"
        @click="change(project)" :class="{active: project._id == active}">
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
        sorted_projects: function(access) {
            //grab project we care about
            var ps = [];
            for(var id in this.projects) {
                var p = this.projects[id];
                if(!p.removed && p.access == access) ps.push(p);
            }

            //sort by name
            ps.sort((a,b)=>{
                if(a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                if(a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                return 0;
            }); 
            return ps;
        },
        
        islistonly(p) {
            if(~p.admins.indexOf(Vue.config.user.sub)) return false;
            if(~p.members.indexOf(Vue.config.user.sub)) return false;
            if(!p.listed) return false; //shouldn't need to check this... but just in case
            return true;
        },

    },
}
</script>

<style scoped>
.projectmenu {
    position: fixed;
    top: 50px;
    bottom: 0px;
    width: 280px;
    background-color: #444;
    color: white;
    left: 50px;
    transition: 0.2s width;
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
    margin-bottom: 5px;
}
.project {
    margin: 0px;
    padding: 7px 15px;
    transition: background-color 0.4s;
}
.project:hover {
    cursor: pointer;
    background-color: black;
}
.project.listonly {
    background-color: #111;
    opacity: 0.4;
}
.project.active {
    background-color: #007bff;
    opacity: 1;
}
.project .desc {
    opacity: 0.6;
    font-size: 80%;
    line-height: 140%;
}
.button-fixed {
opacity: 0;
left: 240px;
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
left: -3px;
}

@media screen and (max-width: 850px) {
    .projectmenu {
        width: 150px;
    }
    .desc {
        display: none;
    }
    .name {
        font-size: 11px;
    }
    .project {
        margin: 0px;
        padding: 5px 10px;
        transition: background-color 0.4s;
    }
    .group-header {
        padding: 5px 10px;
    }
}
</style>

