<template>
<div v-if="app_" no-body class="appcard" :class="{'compact': compact, 'clickable': clickable}">
    <div @click="click">
        <div v-if="compact">
            <appavatar :app="app_" style="float: left; margin-right: 10px;" :width="80" :height="80"/>
            <div style="max-height: 80px; overflow: hidden;">
                <h4 class="name">
                    <icon v-if="app_.projects && app_.projects.length > 0" scale="0.9" name="lock" title="not working.." class="text-danger"/>
                    {{app_.name}} <span class="github" style="font-weight: normal;">{{app_.github}}</span> 
                    <b-badge>{{branch||app_.github_branch}}</b-badge>
                </h4>
                <div class="desc">{{app_.desc_override||app_.desc||'no desc..'}}</div>
            </div>
            <slot/>
        </div>
        <div v-else style="overflow: hidden; position: relative;" :style="{ height }">
            <appavatar :app="app_" style="float: right; margin-left: 10px;" :width="80" :height="80"/>
            <div class="header">
                <h4 class="name">
                    <icon v-if="app_.projects && app_.projects.length > 0" name="lock" title="not working.." class="text-danger"/>
                    {{app_.name}}
                </h4>
                <h5 class="github">{{app_.github}} <b-badge>{{branch||app_.github_branch}}</b-badge></h5>
                <div class="datatypes">
                    <div class="datatype" v-for="input in app_.inputs" :key="'input.'+input.id">
                        <datatypetag :datatype="input.datatype" :tags="input.datatype_tags"/>
                    </div>
                    <icon scale="0.7" name="arrow-right"/>
                    <div class="datatype" v-for="output in app_.outputs" :key="'output.'+output.id">
                        <datatypetag :datatype="output.datatype" :tags="output.datatype_tags"/>
                    </div>
                    <span style="opacity: 0.7" v-if="app_.outputs.length == 0">(no output)</span>
                </div>
            </div>
            <div class="desc">{{app_.desc_override||app_.desc||'no description..'}}</div>
            <slot/>
            <div class="stats" v-if="app_.stats && app_.stats.service">
                <span class="stat" v-b-tooltip.hover title="number of time this App was requested">
                    <icon name="play" scale="0.8"/> {{app_.stats.service.counts.requested}}
                    &nbsp;
                    &nbsp;
                </span>
                <span class="stat" v-b-tooltip.hover title="number of unique users who requested this App">
                    <icon name="user" scale="0.8"/> {{app_.stats.service.users}}
                    &nbsp;
                    &nbsp;
                </span>
                <span class="stat" v-b-tooltip.hover title="github stars" v-if="app_.stats.stars">
                    <icon name="star" scale="0.8"/> {{app_.stats.stars}}
                    &nbsp;
                    &nbsp;
                </span>
                <span class="stat" style="float: right;" v-b-tooltip.hover title="success rate finished/(failed+finished)">
                    <icon name="check-circle" scale="0.8"/> {{app_.stats.success_rate.toFixed(1)}}%
                </span>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

import contact from '@/components/contact'
import appavatar from '@/components/appavatar'
import tags from '@/components/tags'
import datatypetag from '@/components/datatypetag'

export default {
    components: { contact, appavatar, tags, datatypetag },
    props: {
        app: Object,
        dataset: Object,
        compact: Boolean,
        appid: String,
        branch: String, //branch to show instead of current app github_branch
        clickable: {type: Boolean, default: true},
        height: String,
    },
    data() {
        return {
            app_: null
        }
    },
    created: function() {
        if(this.appid) {
            this.$http.get('app', {params: {
                find: JSON.stringify({_id: this.appid}),
                populate: 'inputs.datatype outputs.datatype',
            }}).then(res=>{
                this.app_ = res.body.apps[0];
            });
        }
        if(this.app) this.app_ = this.app;
    },
    methods: {
        click: function() {
            if(this.clickable) {
                this.$router.push('/app/'+this.app_._id);
                this.$emit("open", this.app_._id);
            }
        },
    },
}
</script>

<style scoped>
.appcard {
background-color: white;
min-height: 80px;
box-shadow: 1px 1px 2px rgba(0,0,0,0.10);
transition: box-shadow 0.3s;
}
.appcard:hover {
box-shadow: 3px 3px 6px rgba(0,0,0,0.25);
}

.appcard.clickable:hover {
cursor: pointer;
}

.appcard.clickable:hover .name,
.appcard.clickable:hover .github {
color: #007bff;
}
.appcard.compact {
box-shadow: none;
background-color: inherit;
}
.header {
margin-right: 10px;
margin-left: 10px;
/* min-height: 90px; */
/* overflow: hidden; */
}
.name {
color: #666;
padding: 0px;
padding-top: 10px;
margin-bottom: 0px;
transition: color 0.5s;
}
.github {
opacity: 0.7;
font-size: 85%;
transition: color 0.5s;
margin-bottom: 2px;
}
.desc {
opacity: 0.8;
margin-top: 0px;
padding: 10px;
margin-bottom: 32px;
transition: color 0.5s;
font-size: 90%;
/* border: solid 7px white; */
}

.image {
width: 100%;
display: block;
}
h4 {
font-size: 15px;
font-weight: bold;
padding-bottom: 0px;
}
h5 {
font-size: 13px;
}
.compact .name {
padding: 0px;
margin-bottom: 4px;
font-size: 14px;
}
.compact .desc {
margin: 0px;
height: inherit;
padding: inherit;
border: none;
}
.compact .github {
display: inline-block;
margin-bottom: 0px;
}
.devs {
padding: 4px 10px;
overflow: hidden;
position: relative;
}
.devs .devs-fade {
position: absolute;
width: 100%;
height: 100%;
box-shadow: inset -5px -10px 10px white;
}
.datatypes {
font-size: 80%;
margin: 3px 0px;
}
.datatype {
display: inline-block;
margin-right: 2px;
margin-top: 2px;
}
.stats {
position:absolute;
bottom:0;
width:100%;
padding: 0px 10px;
padding-top: 9px;
color: #bbb;
height: 32px;
/*border-top: 1px solid #f0f0f0;*/
background-color: #f7f7f7;
line-height: 100%;
}
.stat {
}
</style>
