<template>
<el-card :body-style="{padding: '0px'}" style="margin-bottom: 20px;" v-if="app">
        <appavatar :app="app" style="float: left;margin-right: 10px;"></appavatar>
        <h4 class="appname">{{app.name}}</h4>
        <div class="appdesc" :class="{'compact': compact}">{{app.desc}}</div>
        <div v-if="!compact">
            <el-button-group style="width: 100%;">
                <el-button size="small" style="width: 50%;" @click="go('/app/'+app._id)"><icon name="info-circle"></icon> Detail</el-button>
                <el-button size="small" style="width: 50%;" type="primary" @click="go('/app/'+app._id+'/submit'+(dataset?'?dataset='+dataset._id:''))">
                    <icon name="play"></icon> Submit</el-button>
            </el-button-group>
        </div>
    </el-row>
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
.compact {
height: inherit;
}

</style>
