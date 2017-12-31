<template>
<div v-if="app_" no-body class="appcard" :class="{'compact': compact, 'clickable': clickable}">
    <div @click="click">
        <div v-if="compact">
            <appavatar :app="app_" style="float: left;margin-right: 15px;"/>
            <div style="max-height: 73px; overflow: hidden;">
                <h4 class="name">
                    <icon v-if="app_.projects && app_.projects.length > 0" scale="0.9" name="lock" title="not working.." class="text-danger"/>
                    {{app_.name}} <small>{{app_.github}}</small></h4>
                <div class="desc">{{app_.desc_override||app_.desc||'no desc..'}}</div>
            </div>
            <slot/>
        </div>
        <div v-else>
            <appavatar :app="app_" style="float: left;margin-right: 15px;"></appavatar>
            <div class="header">
                <h4 class="name">
                    <icon v-if="app_.projects && app_.projects.length > 0" name="lock" title="not working.." class="text-danger"/>
                    {{app_.name}}</h4>
                <h5 class="github">{{app_.github}}</h5>
                <div class="datatypes" v-if="!compact">
                    <div class="datatype" v-for="input in app_.inputs" :key="input.id">
                        <datatypetag :datatype="input.datatype" :tags="input.datatype_tags"/>
                    </div>
                    <icon scale="0.7" name="arrow-right"/>
                    <div class="datatype" v-for="output in app_.outputs" :key="output.id">
                        <datatypetag :datatype="output.datatype" :tags="output.datatype_tags"/>
                    </div>
                </div>
            </div>
            <div class="desc" :style="{height: descheight}">{{app_.desc_override||app_.desc||'no description..'}}</div>
            <slot/>
            <div class="devs">
                <contact v-for="c in app_.contributors" :key="c._id" :fullname="c.name" :email="c.email"></contact>
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
        clickable: {type: Boolean, default: true},
        descheight: String,
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
/*transform: scale(1.03, 1.03);*/
box-shadow: 3px 3px 6px rgba(0,0,0,0.3);
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
height: 90px;
overflow: hidden;
}
.name {
color: #666;
padding: 0px;
padding-top: 10px;
margin-bottom: 4px;
transition: color 0.5s;
}
.github {
opacity: 0.6;
font-size: 85%;
transition: color 0.5s;
margin-bottom: 0px;
}
.desc {
color: #555;
overflow: hidden;
margin: 10px;
margin-top: 0px;
transition: color 0.5s;
font-size: 90%;
}
.rate {
height: 20px;
overflow: auto;
font-size: 13px;
color: #666;
line-height: 140%;
margin-bottom: 20px;
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
font-weight: bold;
opacity: 0.7;
}
.compact .name {
padding: 0px;
margin-bottom: 4px;
font-size: 14px;
}
.compact .desc {
margin: 0px;
height: inherit;
}
.compact .github {
display: inline-block;
margin-bottom: 0px;
}
.devs {
background-color: #eee;
padding: 10px;
height: 75px;
overflow-y: auto;
overflow-x: hidden;
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
</style>
