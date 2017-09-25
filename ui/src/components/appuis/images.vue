<template>
<el-row class="images">
    <el-col :span="6" v-for="image in images" :key="image.url">
        <el-card :body-style="{padding: '0px'}" class="clickable">
        <div @click="click(image)">
            <img v-lazy="image.src" class="image" width="100%">
            <div style="padding: 10px; height: 90px;">
                {{image.name}}
                <div class="bottom clearfix">
                    <p class="text-muted">{{image.desc}}</p>
                </div>
            </div>
        </div>
        </el-card>
    </el-col>
</el-row>
</template>

<script>
import Vue from 'vue'

export default {
    props: ['task', 'subdir'],
    data() {
        return {
            images: [],
        }
    },
    mounted() {
        //load image.json
        var basepath = this.task.instance_id+'/'+this.task._id;
        if(this.subdir) basepath +='/'+this.subdir;
        var url = Vue.config.wf_api+'/resource/download'+
            '?r='+this.task.resource_id+
            '&p='+encodeURIComponent(basepath+'/images.json')+
            '&at='+Vue.config.jwt;
        this.$http.get(url).then(res=>{
            console.dir(res.body);
            res.body.images.forEach(image=>{
                var src = Vue.config.wf_api+'/resource/download'+
                    '?r='+this.task.resource_id+
                    '&p='+encodeURIComponent(basepath+'/'+image.filename)+
                    '&at='+Vue.config.jwt;
                
                this.images.push({
                    name: image.name,     
                    desc: image.desc,     
                    src
                });
            });
            //console.dir(this.images);
        });
    },
    methods: {
        click: function(image) {
            //window.open(image.src, "_blank", "width=800,height=800,resizable=no,menubar=no");
            document.location = image.src;
        },
        handler: function(it) {
            console.log("lazy", it);
        },
    }
}
</script>
