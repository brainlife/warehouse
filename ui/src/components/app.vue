<template>
<el-card :body-style="{padding: '0px'}" 
    v-if="app" 
    style="margin-bottom: 20px;" 
    :class="{'compact': compact, 'clickable': true}">
    <div @click="go('/app/'+app._id)">
        <appavatar :app="app" style="float: left;margin-right: 10px;"></appavatar>
        <h4 class="appname">{{app.name}}</h4>
        <div class="appdesc">{{app.desc}}</div>
        <div v-if="!compact">
            <el-button-group style="width: 100%;">
                <el-button size="small" style="width: 50%;" @click.stop="go('/app/'+app._id)"><icon name="info-circle"></icon> Detail</el-button>
                <el-button size="small" style="width: 50%;" type="primary" @click.stop="go('/app/'+app._id+'/submit'+(dataset?'?dataset='+dataset._id:''))">
                    <icon name="play"></icon> Submit</el-button>
            </el-button-group>
        </div>
    </div>
</el-card>
</template>

<script>
import Vue from 'vue'

import contact from '@/components/contact'
import appavatar from '@/components/appavatar'

export default {
    components: { contact, appavatar },
    props: ['app', 'dataset', 'compact', 'appid' ],
    data () {
        return {
        }
    },
    mounted: function() {
        if(this.appid) {
            this.$http.get('app', {params: {
                find: JSON.stringify({_id: this.appid}),
                //populate: "project datatype prov.app",
            }}).then(res=>{
                this.app = res.body.apps[0];
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
.appname {
color: #666;
padding: 10px;
margin-bottom: 0px;
}
.appdesc {
margin-bottom: 10px;
height: 150px;
overflow: auto;
font-size: 13px;
color: #333;
line-height: 150%;
}

.image {
width: 100%;
display: block;
}
/*
.compact {
overflow: hidden;
white-space: nowrap;
text-overflow: ellipsis;
}
*/
.compact .appname {
padding: 5px 0px;
}
/* styles for '...' */ 
.compact .appdesc {
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
}
/* create the ... */
.compact .appdesc :before {
  /* points in the end */
  content: '...';
  /* absolute position */
  position: absolute;
  /* set position to right bottom corner of block */
  right: 0;
  bottom: 0;
}
/* hide ... if we have text, which is less than or equal to max lines */
.compact .appdesc:after {
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
  background: white;
}
</style>
