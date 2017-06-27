<template>
<el-card :body-style="{padding: '0px'}" v-if="app_" 
    :class="{'compact': compact, 'clickable': clickable}">
    <div @click="click()">
        <appavatar :app="app_" style="float: left;margin-right: 15px;"></appavatar>
        <h4 class="appname">{{app_.name}}</h4>
        <el-rate v-if="!compact" class="rate" v-model="app_._rate"></el-rate>
        <div class="desc">{{app_.desc}}</div>
        <div class="devs" v-if="!compact">
            <contact v-for="c in app_.admins" key="c._id" :id="c"></contact>
        </div>
        <slot/>
    </div>
</el-card>
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
    },
    data () {
        return {
            app_: null
        }
    },
    mounted: function() {
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
.el-card.compact {
border: none;
box-shadow: none;
}
.appname {
color: #666;
padding: 10px;
padding-bottom: 0px;
}
.desc {
height: 150px;
overflow: auto;
font-size: 13px;
color: #666;
margin: 10px;
line-height: 140%;
}
.rate {
height: 20px;
overflow: auto;
font-size: 13px;
color: #666;
margin: 10px;
line-height: 140%;
}

.image {
width: 100%;
display: block;
}
.compact .appname {
padding: 5px 0px;
margin-bottom: 0px;
}
/* styles for '...' */ 
.compact .desc {
  /* hide text if it more than N lines  */
  overflow: hidden;
  /* for set '...' in absolute position */
  position: relative; 
  /* use this value to count block height */
  line-height: 1.3em;
  /* max-height = line-height (1.2) * lines max number (3) */
  max-height: 3.7em; 
  /* fix problem when last visible word doesn't adjoin right side  */
  text-align: justify;  
  /* place for '...' */
  margin-right: -1em;
  padding-right: 1em;
  margin-bottom: 0px;
    margin-top: 0px;
}
/* create the ... */
.compact .desc :before {
  /* points in the end */
  content: '...';
  /* absolute position */
  position: absolute;
  /* set position to right bottom corner of block */
  right: 0;
  bottom: 0;
}
/* hide ... if we have text, which is less than or equal to max lines */
.compact .desc:after {
  /* points in the end */
  content: '';
  /* absolute position */
  position: absolute;
  /* set position to right bottom corner of text */
  right: 0;
  /* set width and height */
  width: 1em;
  height: 1em;
  margin-top: 0.2em;
  /* bg color = bg color under block */
}
.devs {
    background-color: #eee;
    padding: 10px;
    height: 55px;
    overflow-y: auto;
    overflow-x: hidden;
}
</style>
