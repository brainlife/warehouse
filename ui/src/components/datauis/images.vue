<template>
<div>
    <b-card-group style-dis="padding-bottom: 10px" v-for="(row, rid) in images.chunk_inefficient(4)" :key="rid">
        <b-card 
            :id="rid+'-'+idx"
            v-for="(image, idx) in row" :key="idx"
            @click="click(image)"
            :img-alt="image.desc"
            img-bottom :img-src="image.src">
            <center>{{image.name}}</center>
            <b-tooltip :target="rid+'-'+idx" :title="image.desc" delay="300"></b-tooltip>
            <!--
            <p class="card-text" v-if="image.name != image.desc">{{image.desc}}</p>
            -->
        </b-card>
    </b-card-group>
</div>
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
