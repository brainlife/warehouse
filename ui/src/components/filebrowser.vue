<template>
<div class="ui list" v-if="files">
    <div class="ui icon mini basic buttons" style="margin-bottom: 10px;">
        <button v-if="files.length != 0" class="ui button" @click="download()"><i class="download icon"></i></button>
        <button class="ui button" @click="load()"> <i class="refresh icon"></i></button>
    </div>
    <div class="item" v-for="file in files" key="file.filename">
    <!--<div class="ui right floated">something</div>-->
        <div class="fileitem" @click="click(file)">
            <i class="file outline icon" v-if="!file.directory"></i>
            <i class="folder icon" v-if="file.directory"></i>
            {{file.filename}}
        </div>
        <div class="content" style="margin-left: 20px;" v-if="file.open">
            <filebrowser :task="task" :path="fullpath+'/'+file.filename"></filebrowser>
        </div>
		<pre v-if="file.content" v-highlightjs="file.content" style="margin-left: 20px;"><code :class="file.type"></code></pre>
    </div>
    <!--<p v-if="loading" class="ui mini compact message">Loading ...</p>-->
    <p v-if="files.length == 0" class="ui mini compact message">Empty</p>
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
            })
        },

        click: function(file){
            console.dir(file);
            var url = this.get_download_url(file);

            //for directory, just open
            if(file.directory) Vue.set(file, 'open', !file.open);
            //for large file, download
            else if(file.attrs.size > 1024*1024) document.location = url;
            //for small files, download content and display
            else {
                this.$http.get(url).then(res=>{
                    console.dir(res);

                    //set file type (TODO - can't highlight.js do this?)
                    //Vue.set(file, 'type', res.bodyBlob.type);
                    let type;
                    switch(res.bodyBlob.type) {
                    case "application/json": type = "json"; break;
                    case "application/x-sh": type = "bash"; break;
                    case "text/plain": type = "basic"; break;
                    //case "application/octet-stream": type = "basic"; break;
                    //default: type = "basic";
                    }
                    if(!type) {
                        //for unknown file, just download
                        console.log("unknown file type", res.bodyBlob.type)
                        document.location = url;
                        return;
                    }

                    //load content
                    Vue.set(file, 'type', type);
                    var reader = new FileReader();
                    reader.onload = function(evt) {
                        if(evt.type == "load") Vue.set(file, 'content', reader.result);
                    }
                    reader.readAsText(res.bodyBlob);
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
</style>
