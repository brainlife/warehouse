<template>
<el-card :body-style="{padding: '0px'}" style="margin-bottom: 20px;">
    <el-row>
        <el-col :span="18">
            <h4 class="appname">{{app.name}}</h4>
            <div class="appdesc">{{app.desc}}</div>
        </el-col>
        <el-col :span="6">
            <img :src="app.avatar+'?'+Math.random()" class="image">
            <br>
        </el-col>
        <div style="padding: 10px;">
            <el-button-group style="width: 100%;">
                <el-button style="width: 50%;" @click="go('/app/'+app._id)"><icon name="info-circle"></icon> Detail</el-button>
                <el-button style="width: 50%;" type="primary" @click="go('/app/'+app._id+'/submit'+(dataset?'?dataset='+dataset._id:''))">
                    <icon name="play"></icon> Submit</el-button>
            </el-button-group>
        </div>
    </el-row>

    <!--
    <div style="padding: 10px;">
        <div>
            <br>
            <div style="height: 150px; overflow: auto" class="text-muted">
                {{app.desc}}
            </div>
        </div>
        <div class="bottom">
            <el-button-group style="width: 100%;">
                <el-button style="width: 50%;" @click="go('/app/'+app._id)"><icon name="info-circle"></icon> Detail</el-button>
                <el-button style="width: 50%;" type="primary" @click="go('/app/'+app._id+'/submit'+(dataset?'?dataset='+dataset._id:''))">
                    <icon name="play"></icon> Submit</el-button>
            </el-button-group>
        </div>
    </div>
    -->
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

.appname {
color: #666;
padding: 10px;
margin-bottom: 0px;
}
.appdesc {
margin: 10px;
height: 150px;
overflow: auto;
}

.image {
width: 100%;
display: block;
}
</style>
