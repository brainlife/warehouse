<template>
<el-card :body-style="{padding: '0px'}" style="margin-bottom: 20px;">
        <appavatar :app="app" style="float: right;margin-left: 10px;"></appavatar>
        <h4 class="appname">{{app.name}}</h4>
        <div class="appdesc" :class="{'compact': compact}">{{app.desc}}</div>
        <div style="padding: 10px;" v-if="!compact">
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
import appavatar from '@/components/appavatar'

export default {
    components: { contact, appavatar },
    props: ['app', 'dataset', 'compact'],
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
.compact {
height: inherit;
}

</style>
