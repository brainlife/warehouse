<template>
<b-card v-if="app_" no-body class="appcard" :class="{'compact': compact, 'clickable': clickable}">
    <div @click="click()">
        <appavatar :app="app_" style="float: left;margin-right: 15px;"></appavatar>
        <div>
            <h4 class="name">{{app_.name}}</h4>
            <h5 class="github">{{app_.github}}</h5>
            <el-rate v-if="!compact" class="rate" v-model="app_._rate"></el-rate>
            <div class="desc" :style="{height: descheight}">{{app_.desc||'no desc..'}}</div>
            <slot/>
        </div>
        <div class="devs" v-if="!compact">
            <contact v-for="c in app_.admins" key="c._id" :id="c"></contact>
        </div>
    </div>
</b-card>
</template>

<script>
import Vue from 'vue'

import contact from '@/components/contact'
import appavatar from '@/components/appavatar'
import tags from '@/components/tags'

export default {
    components: { contact, appavatar, tags },
    props: {
        app: Object,
        dataset: Object,
        compact: Boolean,
        appid: String,
        clickable: {type: Boolean, default: true},
        descheight: Number,
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
                //populate: "project datatype prov.app",
            }}).then(res=>{
                this.app_ = res.body.apps[0];
            });
        }
        if(this.app) this.app_ = this.app;
    },
    methods: {
        click: function() {
            if(this.clickable) this.$router.push('/app/'+this.app_._id);
        },
    },
}
</script>

<style scoped>
.appcard {
transition: box-shadow 0.5s;
}
.appcard.clickable {
background-color: white;
}
.appcard.clickable:hover {
background-color: #f3f3f3;
}
.appcard.clickable:hover .github {
opacity: 0.7;
}
.appcard:hover {
box-shadow: 2px 2px 4px #999;
}
.appcard.compact {
border: none;
box-shadow: none;
}
.name {
color: #666;
padding: 0px;
padding-top: 10px;
}
.github {
opacity: 0.4;
font-family: monospace;
font-size: 80%;
}
.desc {
max-height: 130px;
font-size: 13px;
color: #333;
line-height: 140%;
overflow: hidden;
margin: 10px;
text-overflow:ellipsis;
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
}
h5 {
font-size: 13px;
font-weight: bold;
opacity: 0.7;
}
.compact h5 {
display: none;
}
.compact h4.name {
padding: 2px;
}
.compact .name {
padding: 5px 0px;
margin-bottom: 0px;
}
.compact .desc {
margin: 0px;
margin-top: 5px;
font-size: 90%;
}
.devs {
background-color: #eee;
padding: 10px;
height: 75px;
overflow-y: auto;
overflow-x: hidden;
}
</style>
