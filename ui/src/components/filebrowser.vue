<template>
<div>
    <p class="text-muted" style="margin: 5px;" v-if="!files">
        <span :style="{marginLeft: offset}">
            <icon name="cog" spin></icon> Loading..
        </span>
    </p>
    <el-alert v-if="error" :title="error" type="error" :closable="false"></el-alert>
    <div v-if="files">
        <el-button-group :style="{marginBottom: '5px', marginLeft: offset}">
            <el-button size="mini" @click="download()" icon="document">Download</el-button>
            <el-button size="mini" @click="load()"><icon scale="0.6" name="refresh"></icon> Refresh</el-button>
        </el-button-group>

        <p v-if="files.length == 0" class="text-muted" :style="{marginLeft: offset}">Empty Directory</p>

        <div v-for="file in files" key="file.filename">
            <div class="fileitem" @click="click(file)">
                    <span class="text-muted" :style="{marginLeft: offset}">
                        <icon name="file-o" v-if="!file.directory"></icon>
                        <icon name="folder-open" v-if="file.directory && file.open"></icon>
                        <icon name="folder" v-if="file.directory && !file.open"></icon>
                    </span>
                    {{file.filename}}
                    <!--
                    <el-col :span="4"><pre>{{file.attrs.mode_string}}</pre></el-col>
                    <el-col :span="4">{{file.attrs.uid}}</el-col>
                    <el-col :span="4">{{file.attrs.gid}}</el-col>
                    -->
                    <span style="float: right; width: 150px;">{{file.attrs.mtime*1000|date}}</span>
                    <mute style="float: right; margin-right: 20px;">{{file.attrs.size|filesize}}</mute>
            </div>
            <div class="content" v-if="file.open">
                <filebrowser :task="task" :path="fullpath+'/'+file.filename" :depth="depth+1"></filebrowser>
            </div>
            <div v-if="file.content" style="position: relative;">
                <el-button v-if="file.content != '(empty)\n'"
                    style="position: absolute; top: 0px; right: 0px;" size="mini" @click="download_file(file)" icon="document">Download</el-button>
                <pre v-highlightjs="file.content" class="file-content"><code :class="file.type+' hljs'"></code></pre>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import Vue from 'vue'

import mute from '@/components/mute'

export default {
    name: 'filebrowser',
    components: { mute },
    data() {
        return {
            fullpath: null,
            files: null,
            error: null,
        }
    },

    computed: {
        offset: function() {
            return this.depth * 15 + 'px';
        }
    },

    props: {
        task: { type: Object },
        path: { type: String },
        depth: { type: Number, default: 0}
    },

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

        download_file: function(file) {
            document.location = this.get_download_url(file);
        },

        click: function(file){
            if(file.content) {
                //*close* file
                file.content = "";
                return;
            }

            var url = this.get_download_url(file);

            if(file.directory) Vue.set(file, 'open', !file.open); //for directory, just open
            else if(file.attrs.size > 1024*1024) document.location = url; //for large file, download
            else {
                //for small files, download content and display
                this.$http.get(url).then(res=>{
                    //set file type (TODO - can't highlight.js do this?)
                    var mime = res.headers.get("Content-Type");
                    let type = null;
                    switch(mime) {
                    case "application/json": type = "json"; break;
                    case "application/x-sh": type = "bash"; break;
                    case "text/plain": type = "text"; break;
                    case "application/octet-stream": 
                        //for all octet-stream, guess file type from extension
                        var tokens = file.filename.split(".");
                        var ext = tokens[tokens.length-1];
                        switch(ext) {
                        case "bvals": 
                        case "bvecs": 
                            type = "text"; break;
                        }
                    }
                    if(type) {
                        res.text().then(c=>{

                            //reformat json content
                            if(type == "json") {
                                var j = JSON.parse(c);
                                c = JSON.stringify(j, null, 4);
                            }

                            if(c == "") c = "(empty)";
                            console.log("loading as", type);
                            Vue.set(file, 'type', type);
                            //last ditch attempt to animte height
                            var lines = c.trim().split("\n");
                            Vue.set(file, 'content', "");
                            function addline() {
                                file.content += lines.shift()+"\n";
                                if(lines.length) setTimeout(addline, 10);
                            }
                            setTimeout(addline, 10);
                        });
                    } else {
                        console.log("opening new window - unknown file type", mime);
                        document.location = url;
                    } 
                });
            }
        }
    }
}
</script>

<style scoped>
.fileitem {
line-height: 150%;
margin: 0px;
padding: 2px 4px;
font-size: 13px;
}
.fileitem:hover {
color: #2185D0;
cursor: pointer;
background-color: #ddd;
}
.hljs {
background: #f0f0f0;
}
pre.file-content {
margin: 0px;
margin-left: 4px;
padding-left: 10px;
max-height: 400px;
background-color: #d7d7d7;
margin-bottom: 15px;
}
</style>
