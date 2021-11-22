<template>
<div v-if="app_" class="appcard" :class="{'compact': compact, 'clickable': clickable, 'deprecated': app_.deprecated_by}" @click="click">
    <div v-if="compact">
        <appavatar :app="app_" style="position: absolute; right: 0;" :width="80" :height="80"/>
        <span v-if="app_.deprecated_by" class="deprecated-label" style="top: inherit; bottom: 0;">Deprecated</span>
        <div style="max-height: 85px; margin-left: 10px; margin-right: 90px; overflow: hidden;">
            <h4 class="name serif">
                <icon v-if="app_.projects && app_.projects.length > 0" scale="0.9" name="lock" title="not working.." class="text-secondary"/>
                <!--<icon v-if="app_.deprecated_by" scale="0.9" name="regular/calendar-times" title="deprecated" class="text-secondary"/>-->
                {{app_.name}} <span class="github" style="font-weight: normal;">{{app_.github}}</span> 
                <b-badge variant="light">{{branch||app_.github_branch}}</b-badge>
            </h4>
            <div class="desc">{{app_.desc_override||app_.desc||'no desc..'}}</div>
        </div>
        <slot/>
    </div>
    <div v-else style="overflow: hidden; position: relative;" :style="{ height }">
        <span v-if="app_.deprecated_by" class="deprecated-label">Deprecated</span>
        <appavatar :app="app_" style="float: right; margin-left: 10px;" :width="80" :height="80"/>
        <div class="header">
            <h4 class="name serif">
                <span v-if="app_.projects && app_.projects.length > 0" title="Private App" class="text-secondary">
                    <icon name="lock"/>
                </span>
                {{app_.name}}
            </h4>
            <h5 class="github">{{app_.github}} <b-badge>{{branch||app_.github_branch}}</b-badge></h5>
            <div class="datatypes">
                In
                <div class="datatype" v-for="input in app_.inputs" :key="'input.'+input.id" :class="[input.optional?'input-optional':'']">
                    <datatypetag :datatype="input.datatype" :tags="input.datatype_tags" :clickable="false"/>
                    <b v-if="input.multi">multi</b>
                    <b v-if="input.optional">opt</b>
                </div>
                <br>
                <!--<icon scale="0.7" name="arrow-right"/>-->
                <!--<h5 class="github">{{app_.github}} <b-badge>{{branch||app_.github_branch}}</b-badge></h5>-->
                <!--<icon scale="0.7" name="arrow-right"/>-->
                Out
                <div class="datatype" v-for="output in app_.outputs" :key="'output.'+output.id">
                    <datatypetag :datatype="output.datatype" :tags="output.datatype_tags" :clickable="false"/>
                </div>
                <span style="opacity: 0.7" v-if="app_.outputs.length == 0">(no output)</span>
            </div>
        </div>
        <div class="desc">{{app_.desc_override||app_.desc||'no description..'}}</div>
        <slot/>
        <div class="stats" v-if="app_.stats">
            <span class="stat" title="Number of time this App was requested">
                <icon name="play" scale="0.8"/> {{app_.stats.requested}}
                &nbsp;
                &nbsp;
            </span>
            <span class="stat" title="Number of unique users who requested this App">
                <icon name="user" scale="0.8"/> {{app_.stats.users}}
                &nbsp;
                &nbsp;
            </span>
            <!-- who cares?-->
            <!--
            <span class="stat" title="github stars" v-if="app_.stats.gitinfo">
                <icon name="star" scale="0.8"/> {{app_.stats.gitinfo.stats.stars}}
                &nbsp;
                &nbsp;
            </span>
            -->
            <span class="stat" title="number of shared resources that this app is registered on" v-if="app_.stats.resources">
                <icon name="server" scale="0.8"/> {{app_.stats.resources.length}}
                &nbsp;
                &nbsp;
            </span>
            <span class="stat" style="float: right;" title="success rate = finished/(failed+finished)" v-if="app_.stats.success_rate">
                <icon name="check-circle" scale="0.8"/> {{app_.stats.success_rate.toFixed(1)}}%
            </span>
            <span v-if="showDoi && app_.doi">{{app_.doi}}</span>
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
import doibadge from '@/components/doibadge'

import appcache from '@/mixins/appcache'

export default {
    mixins: [appcache],
    components: { contact, appavatar, tags, datatypetag, doibadge },
    props: {
        app: Object,
        dataset: Object,
        compact: Boolean,
        appid: String,
        branch: String, //branch to show instead of current app github_branch
        clickable: {type: Boolean, default: true},
        height: String,
        showDoi: {type: Boolean, default: false},
    },

    watch: {
        appid() {
            if(this.appid) this.load_app();
        },
        app() {
            if(this.app) this.app_ = this.app;
        }
    },

    data() {
        return {
            app_: null
        }
    },

    mounted() {
        if(this.appid) this.load_app();
        if(this.app) this.app_ = this.app;
    },

    methods: {
        load_app() {
            this.appcache(this.appid, (err, app)=>{
                this.app_ = app;
            });
        },

        click() {
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
box-shadow: 1px 1px 4px rgba(0,0,0,0.05);
transition: box-shadow 0.5s;
position: relative;
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
/*background-color: inherit;*/
}
.header {
margin-right: 7px;
margin-left: 7px;
}
.name {
color: #444;
padding: 0px;
padding-top: 7px;
margin-bottom: 0px;
transition: color 0.5s;
}
.desc {
    opacity: 0.85;
    margin-top: 0px;
    padding: 7px;
    margin-bottom: 32px;
    font-size: 12.5px;
    color: #444;
}
.image {
width: 100%;
display: block;
}
h4 {
font-size: 13px;
font-weight: bold;
padding-bottom: 0px;
line-height: 150%;
}
h5 {
font-size: 12px;
line-height: 160%;
}
.compact .name {
padding-top: 5px;
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
font-size: 78%;
}
.datatype {
display: inline-block;
margin-right: 2px;
margin-top: 2px;
}
.input-optional {
opacity: 0.6;
}
.stats {
position:absolute;
bottom:0;
width:100%;
padding: 0px 10px;
padding-top: 9px;
color: #bbb;
height: 32px;
background-color: #f7f7f7;
line-height: 100%;
}
.deprecated h4 {
opacity: 0.7;
}
.deprecated-label {
position: absolute; 
right: 0; 
top: 0;
background-color: #666;
color: white; 
padding: 2px 4px;
opacity: 0.9;
text-transform: uppercase;
font-size: 80%;
font-weight: bold;
}
</style>
