<template>
<div>
    <el-alert v-if="error" :title="error" type="error" :closable="false"></el-alert>
    <div class="ui list" v-if="files">
        <!--
        <div class="ui icon mini basic buttons" style="margin-bottom: 10px;">
            <button v-if="files.length != 0" class="ui button" @click="download()"><i class="download icon"></i></button>
            <button class="ui button" @click="load()"> <i class="refresh icon"></i></button>
        </div>
        -->

        <el-button-group style="margin-bottom: 5px;">
            <el-button size="small" @click="download()"><icon scale="0.8" name="download"></icon></el-button>
            <el-button size="small" @click="load()"><icon scale="0.8" name="refresh"></icon></el-button>
        </el-button-group>
        <div class="item" v-for="file in files" key="file.filename">
            <div class="fileitem" @click="click(file)">
                <i class="file outline icon" v-if="!file.directory"></i>
                <i class="folder icon" v-if="file.directory"></i>
                {{file.filename}}
            </div>
            <div class="content" style="margin-left: 20px;" v-if="file.open">
                <filebrowser :task="task" :path="fullpath+'/'+file.filename"></filebrowser>
            </div>
            <pre v-if="file.content" v-highlightjs="file.content" style="padding-left: 20px; margin: 0px"><code :class="file.type+' hljs'"></code></pre>
        </div>
        <!--<p v-if="loading" class="ui mini compact message">Loading ...</p>-->
        <p v-if="files.length == 0" class="text-muted">Empty Directory</p>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

export default {
    name: 'filebrowser',
    data() {
        return {
            fullpath: null,
            files: null,
            error: null,
        }
    },

    props: [ 'task', 'path' ],

    watch: {
        task: function(v) {
            alert('task update detected by filebroser - need to refresh content')
        }
    },

    mounted: function() {
        this.fullpath = this.path;
        if(!this.fullpath) this.fullpath = this.task.instance_id+'/'+this.task._id;
        console.log("loading", this.fullpath);
        this.load();
    },
    
    methods: {
        get_download_url: function(file) {
            var p = this.fullpath;
            if(file) p+='/'+file.filename;
            var url = Vue.config.wf_api+'/resource/download'+
                '?r='+this.task.resource_id+
                '&p='+encodeURIComponent(p)+
                '&at='+Vue.config.jwt;
            return url;
        },

        download: function() {
            console.log("downloading",url);
            var url = this.get_download_url();
            document.location = url;
        },

        load: function() {
            this.$http.get(Vue.config.wf_api+'/resource/ls/'+this.task.resource_id+'?path='+encodeURIComponent(this.fullpath)).then(res=>{
                this.files = res.body.files;
            }).catch(err=>{
                console.error(err);
                this.error = err.body.message || err.statusText;
            })
        },

        click: function(file){
            //console.dir(file);
            var url = this.get_download_url(file);

            if(file.directory) Vue.set(file, 'open', !file.open); //for directory, just open
            else if(file.attrs.size > 1024*1024) document.location = url; //for large file, download
            else {
                //for small files, download content and display
                this.$http.get(url).then(res=>{
                    console.dir(res);

                    //set file type (TODO - can't highlight.js do this?)
                    var mime = res.headers.get("Content-Type");
                    console.log(mime);
                    let type = null;
                    switch(mime) {
                        case "application/json": type = "json"; break;
                        case "application/x-sh": type = "bash"; break;
                        case "text/plain": type = "text"; break;
                    }
                    if(type) {
                        res.text().then(c=>{
                            if(c == "") c = "(empty)";
                            console.log("loading as text", c);
                            Vue.set(file, 'type', type);
                            Vue.set(file, 'content', c);
                        });
                    } else {
                        console.log("opening new window - unknown file type", mime);
                        document.location = url;
                    } 

                    /*
                    var reader = new FileReader();
                    reader.onload = function(evt) {
                        if(evt.type == "load") Vue.set(file, 'content', reader.result);
                    }
                    reader.readAsText(res.bodyBlob);
                    */
                });
            }
        }
    }
}
</script>

<style scoped>
.fileitem:hover {
    color: #2185D0;
    cursor: pointer;
}
.hljs {
    background: #f6f6f6;
}
</style>
