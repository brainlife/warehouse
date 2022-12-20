<template>
<div style="height: 100%; overflow: auto;">
    <b-card-group style-dis="padding-bottom: 10px" v-for="(row, rid) in images.chunk_inefficient(4)" :key="rid">
        <b-card no-body :id="rid+'-'+idx" v-for="(image, idx) in row" :key="idx" @click="click(image)">
            <b-img :src="image.src" :alt="image.desc" center fluid-grow></b-img>
            <div style="font-size: 85%; margin: 8px; margin-bottom: 15px; text-align: center;">{{image.name}}</div>
            <b-tooltip :target="rid+'-'+idx" :title="image.desc" delay="300"></b-tooltip>
        </b-card>
    </b-card-group>
</div>
</template>

<script>
import Vue from 'vue'

if (![].chunk_inefficient) {
    Object.defineProperty(Array.prototype, 'chunk_inefficient', {
        value: function(chunkSize) {
            var array=this;
            return [].concat.apply([],
                array.map(function(elem,i) {
                    return i%chunkSize ? [] : [array.slice(i,i+chunkSize)];
                })
            );
        }
    });
}

export default {
    props: ['task', 'subdir'],
    data() {
        return {
            images: [],
        }
    },
    mounted() {
        // Load image.json
        var basepath = "";
        if(this.subdir) basepath+=this.subdir+"/";
        var url = Vue.config.amaretti_api+'/task/download/'+this.task._id+'/'+basepath+'images.json'+'?at='+Vue.config.jwt;
        this.$http.get(url).then(res=>{
            //console.dir(res.data);
            res.data.images.forEach(image=>{
                var src = Vue.config.amaretti_api+'/task/download/'+this.task._id+'/'+basepath+image.filename+'?at='+Vue.config.jwt;
                this.images.push({
                    name: image.name,     
                    desc: image.desc,     
                    src
                });
            });
        });
    },
    methods: {
        click: function(image) {
            document.location = image.src;
        },
        handler: function(it) {
            console.log("lazy", it);
        },
    }
}
</script>
