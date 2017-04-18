<template>
<el-card>
    <img :src="app.avatar+'?'+Math.random()" class="image">
    <div style="padding: 14px;">
        <p>
            <h4>{{app.name}}</h4> <small>{{app.desc}}</small>
        </p>
        <div class="bottom clearfix">
            <el-button type="text" class="button" @click="go('/app/'+app._id)"><i class="info circle icon"></i> Detail</el-button>
            <el-button type="text" class="button" @click="go('/app/'+app._id+'/submit'+(dataset?'?dataset='+dataset._id:''))"><i class="play icon"></i> Submit</el-button>
        </div>
    </div>
</el-card>
</template>

<script>
import Vue from 'vue'

import contact from '@/components/contact'

export default {
    components: { contact },
    props: ['app', 'dataset'],
    data () {
        return {
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
  .time {
    font-size: 13px;
    color: #999;
  }
  
  .bottom {
    margin-top: 13px;
    line-height: 12px;
  }

  .button {
    padding: 0;
    float: right;
  }

  .image {
    width: 100%;
    display: block;
  }

  .clearfix:before,
  .clearfix:after {
      display: table;
      content: "";
  }
  
  .clearfix:after {
      clear: both
  }
</style>
